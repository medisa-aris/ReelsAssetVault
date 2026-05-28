FROM python:3.11-slim

# System deps: libpq for psycopg2, libgl/libglib for opencv-python-headless
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (layer-cached unless requirements change)
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY backend/ ./backend/
COPY database/ ./database/

# Storage directory (will be overridden by the named volume)
RUN mkdir -p /app/storage/uploads

EXPOSE 8000

# Entrypoint: run migrations then start uvicorn
COPY backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
