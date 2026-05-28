"""AI provider abstraction for PRD-003.

Supports four providers:
- claude   → anthropic SDK
- chatgpt  → openai SDK (official endpoint)
- ollama   → openai SDK with custom base_url (e.g. http://localhost:11434/v1)
- kimi     → openai SDK with base_url https://api.moonshot.cn/v1
"""
from __future__ import annotations

import json
import logging
import re
from datetime import date

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.script import AppAiConfig, AppIdeation

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Config helpers
# ---------------------------------------------------------------------------

def get_active_config(db: Session) -> AppAiConfig:
    config = db.execute(
        select(AppAiConfig).where(AppAiConfig.is_active.is_(True))
    ).scalars().first()
    if not config:
        raise HTTPException(
            status_code=400,
            detail="No AI provider is active. Please configure one in Admin → AI Config.",
        )
    return config


def get_all_configs(db: Session) -> list[AppAiConfig]:
    return list(db.execute(select(AppAiConfig).order_by(AppAiConfig.provider)).scalars().all())


# ---------------------------------------------------------------------------
# Core call
# ---------------------------------------------------------------------------

def _strip_json_fences(text: str) -> str:
    """Remove markdown code fences that some models wrap around JSON."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def call_ai(config: AppAiConfig, system_prompt: str, user_prompt: str) -> str:
    """Dispatch to the correct provider SDK and return the raw text response."""
    provider = config.provider

    if provider == "claude":
        import anthropic
        client = anthropic.Anthropic(api_key=config.api_key or "")
        response = client.messages.create(
            model=config.model or "claude-opus-4-5",
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return response.content[0].text

    else:
        # chatgpt, ollama, kimi — all OpenAI-compatible
        import openai
        api_key = config.api_key or "ollama"  # Ollama doesn't need a real key
        kwargs: dict = {"api_key": api_key}
        if config.base_url:
            kwargs["base_url"] = config.base_url
        client = openai.OpenAI(**kwargs)
        response = client.chat.completions.create(
            model=config.model or "gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=4096,
        )
        return response.choices[0].message.content or ""


# ---------------------------------------------------------------------------
# Ideation generation
# ---------------------------------------------------------------------------

IDEATION_SYSTEM = (
    "You are a social media content strategist. "
    "Generate exactly 7 daily content ideas as a JSON array. "
    "Each element must contain these exact keys: "
    "title (string), hook (string), content_summary (string), cta (string), "
    "upload_date (string, YYYY-MM-DD), upload_time (string, HH:MM), platform (string). "
    "Return ONLY the JSON array — no markdown fences, no extra text."
)


def generate_ideation_plan(
    config: AppAiConfig,
    niche: str,
    target_audience: str | None,
    platform: str,
    posting_frequency: str | None,
    tone_style: str | None,
    week_starting: date,
) -> list[dict]:
    user_prompt = (
        f"Niche/Topic: {niche}\n"
        f"Target Audience: {target_audience or 'General'}\n"
        f"Platform: {platform}\n"
        f"Posting Frequency: {posting_frequency or 'Daily'}\n"
        f"Tone/Style: {tone_style or 'Casual'}\n"
        f"Week Starting: {week_starting.isoformat()}\n\n"
        "Generate exactly 7 content ideas, one for each day starting from the week_starting date."
    )
    raw = call_ai(config, IDEATION_SYSTEM, user_prompt)
    try:
        items = json.loads(_strip_json_fences(raw))
        if not isinstance(items, list):
            raise ValueError("Expected a JSON array")
        return items
    except (json.JSONDecodeError, ValueError) as exc:
        logger.error("Failed to parse ideation AI response: %s\nRaw: %s", exc, raw[:500])
        raise HTTPException(
            status_code=502,
            detail=f"AI returned malformed response. Try again. ({exc})",
        )


# ---------------------------------------------------------------------------
# Script generation
# ---------------------------------------------------------------------------

_SCRIPT_LANGUAGE_INSTRUCTIONS = {
    "en": (
        "Write the entire script in English. "
        "Use natural, engaging English suited for the target platform."
    ),
    "id": (
        "Tulis seluruh skrip dalam Bahasa Indonesia. "
        "Gunakan bahasa Indonesia yang natural, santai, dan sesuai platform target. "
        "Pastikan caption menggunakan Bahasa Indonesia, sedangkan hashtag boleh menggunakan English atau Bahasa Indonesia."
    ),
}


def _build_script_system(language: str = "en") -> str:
    lang_instruction = _SCRIPT_LANGUAGE_INSTRUCTIONS.get(language, _SCRIPT_LANGUAGE_INSTRUCTIONS["en"])
    return (
        "You are a video scriptwriter specialising in short-form social media content. "
        "Given a content idea, generate a complete video script as a JSON object. "
        "The object must contain these exact keys: "
        "hook_opening (string), scenes (string — numbered scene descriptions with time, and narration script with correct punctuation), "
        "broll_suggestions (string), caption_suggestion (string), cta_ending (string), "
        "hashtags (string). "
        "Optionally include: version_15s (string), version_30s (string), version_long (string). "
        f"{lang_instruction} "
        "Return ONLY the JSON object — no markdown fences, no extra text."
    )


def generate_script_for_ideation(
    config: AppAiConfig,
    ideation: AppIdeation,
    language: str = "en",
) -> dict:
    system_prompt = _build_script_system(language)
    user_prompt = (
        f"Title: {ideation.title}\n"
        f"Platform: {ideation.platform or 'General'}\n"
        f"Hook: {ideation.hook or ''}\n"
        f"Content Summary: {ideation.content_summary or ''}\n"
        f"CTA: {ideation.cta or ''}\n"
        f"Tone/Style: {ideation.tone_style or 'Casual'}\n"
        f"Target Audience: {ideation.target_audience or 'General'}\n"
        f"Output Language: {'English' if language == 'en' else 'Bahasa Indonesia'}\n\n"
        "Generate a detailed video script following the JSON format."
    )
    raw = call_ai(config, system_prompt, user_prompt)
    try:
        data = json.loads(_strip_json_fences(raw))
        if not isinstance(data, dict):
            raise ValueError("Expected a JSON object")
        return data
    except (json.JSONDecodeError, ValueError) as exc:
        logger.error("Failed to parse script AI response: %s\nRaw: %s", exc, raw[:500])
        raise HTTPException(
            status_code=502,
            detail=f"AI returned malformed response. Try again. ({exc})",
        )


# ---------------------------------------------------------------------------
# Test connection
# ---------------------------------------------------------------------------

def test_connection(config: AppAiConfig) -> str:
    """Send a trivial prompt; return the response text or raise on error."""
    return call_ai(
        config,
        "You are a helpful assistant.",
        "Reply with exactly: 'Connection successful.'",
    )
