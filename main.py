from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from openai import OpenAI, OpenAIError
from pydantic import BaseModel

load_dotenv()

MODEL = "gpt-4o-mini"

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite dev server
    allow_methods=["*"],
    allow_headers=["*"],
)
client = OpenAI()  # reads OPENAI_API_KEY from the environment


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str
    model: str


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    model: str = MODEL


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": req.question}],
        )
    except OpenAIError as e:
        raise HTTPException(status_code=502, detail=f"OpenAI request failed: {e}")
    return AskResponse(answer=completion.choices[0].message.content or "", model=MODEL)


@app.post("/chat/stream")
def chat_stream(req: ChatRequest):
    # Create the stream before returning so setup errors become a 502.
    try:
        stream = client.chat.completions.create(
            model=req.model,
            messages=[m.model_dump() for m in req.messages],
            stream=True,
        )
    except OpenAIError as e:
        raise HTTPException(status_code=502, detail=f"OpenAI request failed: {e}")

    def generate():
        try:
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except OpenAIError as e:
            yield f"\n\n[error: {e}]"

    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")


# In the Docker image the built React app is served from the same origin as the API.
# Mounted last so it never shadows the API routes above.
STATIC_DIR = Path(__file__).parent / "static"
if STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
