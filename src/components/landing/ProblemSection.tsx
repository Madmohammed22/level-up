export function ProblemSection() {
  const items = [
    {
      title: "Stress avant les examens",
      body: "Panique, trous de m\u00e9moire, perte de moyens \u2014 m\u00eame les bons \u00e9l\u00e8ves sont touch\u00e9s.",
      color: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l.348-.35a3.535 3.535 0 014.95 0l.348.35M12 21a9 9 0 110-18 9 9 0 010 18zm-3-7.5h.008v.008H9V13.5zm6 0h.008v.008H15V13.5z" />
        </svg>
      ),
    },
    {
      title: "M\u00e9thodes inefficaces",
      body: "Relire ses cours n\u2019est pas r\u00e9viser. Sans structure, les heures passent sans r\u00e9sultat.",
      color: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      ),
    },
    {
      title: "Mauvaise gestion du temps",
      body: "Pas de planification = r\u00e9visions \u00e0 la derni\u00e8re minute = r\u00e9sultats d\u00e9cevants.",
      color: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
        </svg>
      ),
    },
    {
      title: "Un cercle vicieux",
      body: "Surcharge de travail et d\u00e9motivation face \u00e0 des progr\u00e8s trop lents.",
      color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898M2.25 6l3 3m-3-3h3m15.75 12L18 15.75l-4.286 4.286a11.948 11.948 0 01-4.306-6.43l-.776-2.898" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-24 px-6 bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-zinc-900 dark:text-zinc-50">
          Le probl&egrave;me
        </h2>
        <p className="mt-4 text-center text-lg text-zinc-500 dark:text-zinc-400">
          Beaucoup d&apos;&eacute;l&egrave;ves travaillent dur,
          <br className="hidden md:block" />
          mais pas efficacement.
        </p>

        {/* Wave path layout */}
        <div className="relative mt-16">
          <svg
            className="absolute inset-0 hidden md:block"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            viewBox="0 0 1000 300"
          >
            <path
              d="M125,100 C250,100 250,200 375,200 C500,200 500,100 625,100 C750,100 750,200 875,200"
              fill="none"
              stroke="currentColor"
              className="text-zinc-300 dark:text-zinc-700"
              strokeWidth="2"
              strokeDasharray="8 8"
            />
          </svg>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {items.map((item, i) => (
              <div
                key={item.title}
                className={`relative text-center ${
                  i % 2 === 0 ? "md:mt-0" : "md:mt-16"
                }`}
              >
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${item.color}`}
                >
                  {item.icon}
                </div>
                <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-[220px] mx-auto">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
