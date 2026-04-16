export function ProblemSection() {
  const items = [
    { title: "Stress d'examen", body: "Blocages, panique, nuits blanches." },
    { title: "Manque de méthode", body: "Réviser sans plan, perdre du temps." },
    {
      title: "Gestion du temps",
      body: "Ne pas savoir par où commencer le jour J.",
    },
  ];
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-3xl font-semibold text-center mb-12">
          Le problème
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.title}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6"
            >
              <h3 className="text-lg font-medium mb-2">{it.title}</h3>
              <p className="text-zinc-600 dark:text-zinc-400">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
