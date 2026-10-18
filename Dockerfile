# syntax=docker/dockerfile:1

# ---- Stage 1: build the React frontend ----
FROM node:22-alpine AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: FastAPI app serving the API and the built frontend ----
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py ./
COPY --from=frontend /frontend/dist ./static

# Run as a non-root user.
RUN useradd --create-home appuser
USER appuser

# Cloud platforms inject PORT; default to 8000 locally.
ENV PORT=8000
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD python -c "import os,urllib.request; urllib.request.urlopen(f'http://localhost:{os.environ[\"PORT\"]}/health')" || exit 1

# OPENAI_API_KEY must be provided as an environment variable at runtime.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
