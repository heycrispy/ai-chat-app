import os

import requests
import streamlit as st

API_URL = os.getenv("API_URL", "http://localhost:8000")
MODELS = ["gpt-4o-mini", "gpt-4o"]

st.set_page_config(page_title="Chat", page_icon="💬")
st.title("Chat")

if "messages" not in st.session_state:
    st.session_state.messages = []

with st.sidebar:
    if st.button("New chat", use_container_width=True):
        st.session_state.messages = []
        st.rerun()
    model = st.selectbox("Model", MODELS)
    system_prompt = st.text_area("System prompt (optional)")


def stream_reply(messages, model):
    """Yield text deltas from the backend as they arrive."""
    with requests.post(
        f"{API_URL}/chat/stream",
        json={"messages": messages, "model": model},
        stream=True,
        timeout=(5, 120),
    ) as resp:
        resp.raise_for_status()
        resp.encoding = "utf-8"
        yield from resp.iter_content(chunk_size=None, decode_unicode=True)


def error_text(exc):
    resp = getattr(exc, "response", None)
    if resp is not None:
        try:
            return f"{exc} - {resp.json().get('detail', resp.text)}"
        except ValueError:
            return f"{exc} - {resp.text}"
    return str(exc)


for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

if prompt := st.chat_input("Message…"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    payload = list(st.session_state.messages)
    if system_prompt.strip():
        payload.insert(0, {"role": "system", "content": system_prompt.strip()})

    with st.chat_message("assistant"):
        try:
            reply = st.write_stream(stream_reply(payload, model))
        except requests.RequestException as exc:
            st.error(error_text(exc))
        else:
            st.session_state.messages.append({"role": "assistant", "content": reply})
