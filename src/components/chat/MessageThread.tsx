import type { JSX } from "react";

export type ThreadMessage = {
  id: string;
  content: string;
  createdAt: Date;
  mine: boolean;
  senderName: string;
};

function fmt(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

export function MessageThread({
  messages,
}: {
  messages: ThreadMessage[];
}): JSX.Element {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-8 text-center">
        Aucun message pour le moment.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3 py-4">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words overflow-hidden ${
              m.mine
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            }`}
          >
            <div className="text-[11px] opacity-70 mb-0.5">
              {m.mine ? "Moi" : m.senderName} · {fmt(m.createdAt)}
            </div>
            <div>{m.content}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
