export function ResultsSection() {
  const stats = [
    { label: "Élèves accompagnés", value: "200+" },
    { label: "Taux de remplissage des classes", value: "92%" },
    { label: "Progression moyenne", value: "+3 pts" },
  ];
  return (
    <section className="py-20 px-6 bg-indigo-50 dark:bg-indigo-950/30">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-3xl font-semibold mb-12">Des résultats concrets</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400">
                {s.value}
              </div>
              <div className="mt-2 text-zinc-600 dark:text-zinc-400">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
