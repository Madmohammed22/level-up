"use client";

import {
  useOptimistic,
  useRef,
  useActionState,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { MessageThread, type ThreadMessage } from "./MessageThread";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ChatState } from "@/server/actions/chat";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Props = {
  initialMessages: ThreadMessage[];
  currentUserId: string;
  senderName: string;
  serverAction: (
    prev: ChatState | undefined,
    formData: FormData,
  ) => Promise<ChatState>;
  conversationId?: string;
  placeholder?: string;
};

export function ChatThreadClient({
  initialMessages,
  currentUserId,
  senderName,
  serverAction,
  conversationId,
  placeholder = "Répondre\u2026",
}: Props) {
  const router = useRouter();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [optimisticMessages, addOptimistic] = useOptimistic(
    initialMessages,
    (state: ThreadMessage[], newMsg: ThreadMessage) => [...state, newMsg],
  );

  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ---- Supabase Realtime: subscribe to broadcast channel ----
  useEffect(() => {
    if (!conversationId) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on("broadcast", { event: "new_message" }, (payload) => {
        // Refresh when someone else sends a message
        if (payload.payload?.senderId !== currentUserId) {
          router.refresh();
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, router]);

  // ---- Form action with optimistic update + broadcast ----
  const wrappedAction = async (
    prev: ChatState | undefined,
    formData: FormData,
  ): Promise<ChatState> => {
    const content = formData.get("content") as string;
    if (content?.trim()) {
      addOptimistic({
        id: `optimistic-${Date.now()}`,
        content: content.trim(),
        createdAt: new Date(),
        mine: true,
        senderName,
      });
    }
    formRef.current?.reset();

    const result = await serverAction(prev, formData);

    // Broadcast to other participants after successful send
    if (!result.error && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "new_message",
        payload: { senderId: currentUserId },
      });
    }

    return result;
  };

  const [state, action, pending] = useActionState(wrappedAction, {});

  // Auto-scroll when new messages appear
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [optimisticMessages.length]);

  return (
    <>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 px-4"
      >
        <MessageThread messages={optimisticMessages} />
      </div>

      <div className="mt-3">
        <form ref={formRef} action={action} className="flex items-end gap-2">
          {conversationId ? (
            <input
              type="hidden"
              name="conversationId"
              value={conversationId}
            />
          ) : null}
          <textarea
            name="content"
            rows={2}
            required
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm resize-none"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {pending ? "\u2026" : "Envoyer"}
          </button>
          {state.error ? (
            <span className="text-xs text-red-600">{state.error}</span>
          ) : null}
        </form>
      </div>
    </>
  );
}
