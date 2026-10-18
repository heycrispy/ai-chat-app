import { useCallback, useRef, useState } from 'react'
import type { ChatMessage } from '@/types'

// Dev: the API runs separately on :8000. Production builds call the same origin they're served from.
const API_URL: string =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:8000' : '')

export function useChatStream(model: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const messagesRef = useRef<ChatMessage[]>([])

  const update = useCallback((next: ChatMessage[]) => {
    messagesRef.current = next
    setMessages(next)
  }, [])

  const appendToLast = useCallback(
    (chunk: string) => {
      const cur = messagesRef.current
      const last = cur[cur.length - 1]
      if (!last) return
      update([...cur.slice(0, -1), { ...last, content: last.content + chunk }])
    },
    [update],
  )

  const send = useCallback(
    async (text: string) => {
      const content = text.trim()
      if (!content || abortRef.current) return
      setError(null)
      const history: ChatMessage[] = [...messagesRef.current, { role: 'user', content }]
      update([...history, { role: 'assistant', content: '' }])
      const controller = new AbortController()
      abortRef.current = controller
      setIsStreaming(true)
      try {
        const res = await fetch(`${API_URL}/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history, model }),
          signal: controller.signal,
        })
        if (!res.ok) {
          let detail = `Request failed (${res.status})`
          try {
            const body = await res.json()
            if (body?.detail) detail = String(body.detail)
          } catch {
            /* ignore */
          }
          throw new Error(detail)
        }
        if (!res.body) throw new Error('No response body')
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          if (chunk) appendToLast(chunk)
        }
        const tail = decoder.decode()
        if (tail) appendToLast(tail)
      } catch (e) {
        const aborted = e instanceof DOMException && e.name === 'AbortError'
        if (!aborted) setError(e instanceof Error ? e.message : 'Something went wrong')
        const cur = messagesRef.current
        const last = cur[cur.length - 1]
        if (last && last.role === 'assistant' && last.content === '') {
          update(cur.slice(0, -1))
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
          setIsStreaming(false)
        }
      }
    },
    [model, update, appendToLast],
  )

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    update([])
    setError(null)
    setIsStreaming(false)
  }, [update])

  return { messages, isStreaming, error, send, stop, reset }
}
