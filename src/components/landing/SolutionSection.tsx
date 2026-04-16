export function SolutionSection() {
  const pillars = [
    {
      title: "Cours en petits groupes",
      body: "Max 10 élèves par classe, enseignants dédiés, progression suivie.",
    },
    {
      title: "Accompagnement mental",
      body: "Techniques anti-panique, respiration guidée, protocoles pré-examen.",
    },
    {
      title: "Organisation",
      body: "Planning personnalisé, rappels, méthodologie pas à pas.",
    },
  ];
  return (
    <section className="py-20 px-6 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-3xl font-semibold text-center mb-12">
          Notre solution
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm"
            >
              <h3 className="text-lg font-medium mb-2">{p.title}</h3>
              <p className="text-zinc-600 dark:text-zinc-400">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
