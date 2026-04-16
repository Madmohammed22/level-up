"use client";

import { useTransition, useState } from "react";
import { generateSessionsFromTemplate } from "@/server/actions/admin/templates";

export function GenerateButton({ templateId }: { templateId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  return (
    <form
      className="inline-flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await generateSessionsFromTemplate(fd);
          setResult(`${res.created} séance(s) créée(s)`);
          setTimeout(() => setResult(null), 3000);
        });
      }}
    >
      <input type="hidden" name="templateId" value={templateId} />
      <input
        name="startDate"
        type="date"
        required
        defaultValue={new Date().toISOString().slice(0, 10)}
        className="rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-xs w-32"
      />
      <input
        name="weeks"
        type="number"
        min={1}
        max={12}
        defaultValue={4}
        className="rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-xs w-16"
        title="Nombre de semaines"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-blue-600 hover:underline disabled:opacity-50"
      >
        {pending ? "..." : "Générer"}
      </button>
      {result && (
        <span className="text-xs text-green-600">{result}</span>
      )}
    </form>
  );
}
