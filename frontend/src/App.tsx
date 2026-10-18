import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ArrowUp, Copy, Square } from 'lucide-react'
import {
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from '@/components/ui/chat-bubble'
import { useChatStream } from '@/hooks/useChatStream'

const MODELS = ['gpt-4o-mini', 'gpt-4o']
const USER_AVATAR = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop'
const AI_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop'

export default function App() {
  const [model, setModel] = useState(MODELS[0])
  const [input, setInput] = useState('')
  const { messages, isStreaming, error, send, stop, reset } = useChatStream(model)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, error])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [input])

  const submit = () => {
    if (!input.trim() || isStreaming) return
    const text = input
    setInput('')
    void send(text)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">Chat</h1>
        <div className="flex items-center gap-2">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={isStreaming}
            aria-label="Model"
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          >
            {MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            New chat
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-4 px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
              <p className="text-xl font-medium text-foreground">How can I help you today?</p>
              <p className="mt-1 text-sm">Send a message to start the conversation.</p>
            </div>
          )}
          {messages.map((m, i) => {
            const isUser = m.role === 'user'
            const last = i === messages.length - 1
            const loading = !isUser && last && isStreaming && m.content === ''
            return (
              <ChatBubble key={i} variant={isUser ? 'sent' : 'received'}>
                <ChatBubbleAvatar
                  src={isUser ? USER_AVATAR : AI_AVATAR}
                  fallback={isUser ? 'US' : 'AI'}
                />
                <div className="flex min-w-0 flex-col">
                  <ChatBubbleMessage
                    variant={isUser ? 'sent' : 'received'}
                    isLoading={loading}
                    className="whitespace-pre-wrap break-words"
                  >
                    {m.content}
                  </ChatBubbleMessage>
                  {!isUser && m.content && !(last && isStreaming) && (
                    <ChatBubbleActionWrapper>
                      <ChatBubbleAction
                        icon={<Copy className="size-3" />}
                        onClick={() => void navigator.clipboard?.writeText(m.content)}
                      />
                    </ChatBubbleActionWrapper>
                  )}
                </div>
              </ChatBubble>
            )
          })}
          {error && (
            <div role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="border-t border-border px-4 py-3">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-border bg-background p-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Message..."
            className="max-h-[200px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={stop}
              aria-label="Stop"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <Square className="size-4" fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!input.trim()}
              aria-label="Send"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
            >
              <ArrowUp className="size-4" />
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
