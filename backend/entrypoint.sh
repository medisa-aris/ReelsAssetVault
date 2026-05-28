#!/bin/sh
set -e

echo "⏳  Waiting for database..."
until python -c "
import psycopg2, os, sys
try:
    psycopg2.connect(os.environ['DATABASE_URL'])
    sys.exit(0)
except Exception as e:
    sys.exit(1)
" 2>/dev/null; do
  sleep 1
done
echo "✅  Database ready."

echo "🔄  Running Alembic migrations..."
cd /app/backend
alembic upgrade head
echo "✅  Migrations done."

echo "🚀  Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
