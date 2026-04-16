export function ResultsSection() {
  const stats = [
    { label: "\u00c9l\u00e8ves accompagn\u00e9s", value: "200+" },
    { label: "Taux de remplissage", value: "92%" },
    { label: "Progression moyenne", value: "+3 pts" },
  ];

  return (
    <section className="py-24 px-6 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-12">
          Des r&eacute;sultats concrets
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8"
            >
              <div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400">
                {s.value}
              </div>
              <div className="mt-3 text-zinc-500 dark:text-zinc-400">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
