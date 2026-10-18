import { Copy, RefreshCcw } from "lucide-react";

import {
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble";

const USER_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop";
const AI_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop";

export function ChatBubbleVariants() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <ChatBubble variant="sent">
        <ChatBubbleAvatar src={USER_AVATAR} fallback="US" />
        <ChatBubbleMessage variant="sent">
          Hello, how has your day been?
        </ChatBubbleMessage>
      </ChatBubble>
      <ChatBubble variant="received">
        <ChatBubbleAvatar src={AI_AVATAR} fallback="AI" />
        <ChatBubbleMessage variant="received">
          Hi, I hope you are doing well. How can I help?
        </ChatBubbleMessage>
      </ChatBubble>
    </div>
  );
}

const messages = [
  { id: 1, role: "user", content: "Hello, how are you?" },
  {
    id: 2,
    role: "bot",
    content: "I am doing well, thanks for asking. What can I do for you?",
  },
  { id: 3, role: "user", content: "Can you explain what a vector database is?" },
  {
    id: 4,
    role: "bot",
    content:
      "A vector database stores embeddings and lets you search them by similarity.",
  },
];

export function ChatBubbleAiLayout() {
  return (
    <div className="flex flex-col gap-2 p-4">
      {messages.map((m) =>
        m.role === "user" ? (
          <ChatBubble key={m.id} variant="sent">
            <ChatBubbleAvatar src={USER_AVATAR} fallback="US" />
            <ChatBubbleMessage variant="sent">{m.content}</ChatBubbleMessage>
          </ChatBubble>
        ) : (
          <ChatBubble key={m.id} variant="received" layout="ai">
            <ChatBubbleAvatar src={AI_AVATAR} fallback="AI" />
            <div>
              <ChatBubbleMessage>{m.content}</ChatBubbleMessage>
              <ChatBubbleActionWrapper>
                <ChatBubbleAction
                  icon={<Copy className="h-3 w-3" />}
                  onClick={() => navigator.clipboard?.writeText(m.content)}
                />
                <ChatBubbleAction icon={<RefreshCcw className="h-3 w-3" />} />
              </ChatBubbleActionWrapper>
            </div>
          </ChatBubble>
        ),
      )}
    </div>
  );
}

export function ChatBubbleStates() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <ChatBubble variant="received">
        <ChatBubbleAvatar fallback="AI" />
        <ChatBubbleMessage isLoading />
      </ChatBubble>
      <ChatBubble variant="received">
        <ChatBubbleAvatar fallback="AI" />
        <ChatBubbleMessage className="bg-destructive/10 text-destructive">
          Something went wrong. Please try again.
        </ChatBubbleMessage>
      </ChatBubble>
    </div>
  );
}
