export function SolutionSection() {
  const items = [
    {
      title: "Cours structur\u00e9s",
      body: "Maths, Physique, Fran\u00e7ais, Anglais \u2014 max 10 \u00e9l\u00e8ves par groupe.",
      color: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
    },
    {
      title: "Coaching mental",
      body: "Techniques anti-stress, visualisation, gestion des \u00e9motions en examen.",
      color: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
      ),
    },
    {
      title: "M\u00e9thodologie",
      body: "Feuilles de route personnalis\u00e9es, planification des r\u00e9visions, techniques d\u2019apprentissage.",
      color: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
        </svg>
      ),
    },
    {
      title: "Suivi continu",
      body: "Planning intelligent, progression mesur\u00e9e, communication parents\u2013centre.",
      color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-24 px-6 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-zinc-900 dark:text-zinc-50">
          La solution
        </h2>
        <p className="mt-4 text-center text-lg text-zinc-500 dark:text-zinc-400">
          Cours + Mental + Organisation
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
