export function FeaturesSection() {
  const features = [
    "Planning hebdomadaire par élève",
    "Suivi de progression par matière",
    "Chat intégré avec l'administration",
    "Bibliothèque méthodologie et stress",
    "Check-in d'humeur avant chaque séance",
    "Protocoles d'examen personnalisés",
  ];
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-3xl font-semibold text-center mb-12">
          Ce que tu obtiens
        </h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {features.map((f) => (
            <li
              key={f}
              className="flex items-start gap-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4"
            >
              <span
                aria-hidden
                className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600"
              />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
