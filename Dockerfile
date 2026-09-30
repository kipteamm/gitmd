# Stage 1: Build Frontend Assets
FROM node:24-alpine AS frontend-builder
WORKDIR /app
COPY package*.json tsconfig.json vite.config.ts ./
RUN npm ci
COPY frontend ./frontend
RUN npm run build

# Stage 2: Python Runtime
FROM python:3.14-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    GITMD_DATA_DIR=/data

# Install third-party dependencies first to maximize caching
COPY pyproject.toml .
RUN pip install --no-cache-dir --no-deps -e . || pip install --no-cache-dir \
    flask \
    flask-login \
    flask-migrate \
    flask-sqlalchemy \
    python-dotenv \
    alembic \
    werkzeug \
    wtforms \
    gunicorn

# Copy application source and frontend build
COPY app ./app
COPY gitmd.py .
COPY migrations ./migrations
COPY --from=frontend-builder /app/static/dist ./app/static/dist

RUN pip install --no-cache-dir --no-deps .

EXPOSE 5000

# Mount points, /docs for markdown files, /data for sqlite DB
VOLUME ["/docs", "/data"]

ENTRYPOINT ["gunicorn", "-w", "2", "-b", "0.0.0.0:5000", "wsgi:app"]
