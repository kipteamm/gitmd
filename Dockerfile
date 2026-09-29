# Stage 1: Build Frontend Assets
FROM node:24-alpine AS frontend-builder
WORKDIR /app
COPY package*.json tsconfig.json vite.config.ts ./
RUN npm ci
COPY frontend ./frontend
COPY templates ./templates
RUN npm run build

# Stage 2: Python Runtime
FROM python:3.14-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    GITMD_DATA_DIR=/data

# Install dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir .

# Copy backend source and compiled static assets
COPY app ./app
COPY templates ./templates
COPY wsgi.py .
COPY --from=frontend-builder /app/static/dist ./static/dist

# Expose container port
EXPOSE 5000

# Mount points: /docs for markdown files, /data for sqlite DB
VOLUME ["/docs", "/data"]

ENTRYPOINT ["python", "wsgi.py", "/docs", "--host", "0.0.0.0"]
