import { defineConfig } from "@playwright/test";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env from the tests/ directory
dotenv.config({ path: path.join(__dirname, ".env") });

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.spec.ts",
  timeout: 30_000,
  retries: 0,
  workers: 1, // Serial by default — API tests share a DB

  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:8000",
    // No browser needed — all tests use the `request` API fixture
  },

  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
});
