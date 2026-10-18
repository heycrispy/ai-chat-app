# AI Chat App

ChatGPT-style streaming chat: FastAPI backend + OpenAI, React (Vite, Tailwind, shadcn) frontend.

## Local development
```
python -m venv .venv && .venv\Scripts\pip install -r requirements.txt
copy .env.example .env        # then set OPENAI_API_KEY
.venv\Scripts\uvicorn main:app --reload      # API on :8000
cd frontend && npm install && npm run dev    # UI on :5173
```
`app.py` is an alternative Streamlit UI (`pip install streamlit requests`, then `streamlit run app.py`). It is not included in the Docker image.

## Docker
One image serves the API and the built UI on a single port.
```
docker build -t ai-chat-app .
docker run -p 8000:8000 -e OPENAI_API_KEY=sk-... ai-chat-app
```
Open http://localhost:8000.

## Deploying to a cloud service
Any container host works (Render, Railway, Fly.io, Google Cloud Run, Azure Container Apps, AWS App Runner).
- Point it at this repo/Dockerfile.
- Set the `OPENAI_API_KEY` environment variable (as a secret).
- The container listens on `$PORT` (set by the platform; defaults to 8000). Health check path: `/health`.
