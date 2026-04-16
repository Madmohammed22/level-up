import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-zinc-950">
      {/* Navbar */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            LEVEL UP
          </span>
          <span className="ml-2 text-sm text-zinc-500">
            Centre de soutien scolaire
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            Se connecter
          </Link>
        </div>
      </nav>

      {/* Hero content */}
      <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-16 text-center">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-20 -top-10 h-72 w-72 rounded-full bg-green-100/60 dark:bg-green-900/20 blur-3xl" />
          <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-yellow-100/60 dark:bg-yellow-900/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-blue-100/60 dark:bg-blue-900/20 blur-3xl" />
        </div>

        {/* Badge */}
        <span className="mb-6 inline-block rounded-full border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 px-5 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 backdrop-blur">
          LEVEL UP &mdash; Centre de soutien scolaire
        </span>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
          Am&eacute;liore tes notes{" "}
          <br className="hidden md:block" />
          et ma&icirc;trise{" "}
          <span className="text-indigo-600 dark:text-indigo-400">ton stress</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-500 dark:text-zinc-400">
          Cours, m&eacute;thodologie et accompagnement mental &mdash; tout ce
          qu&apos;il faut pour r&eacute;ussir tes examens sereinement.
        </p>

        {/* Dual CTA */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="#reserver"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-50 px-8 py-3.5 text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-lg shadow-zinc-900/10"
          >
            R&eacute;server une s&eacute;ance
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 px-8 py-3.5 font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Se connecter
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "200+", label: "\u00c9l\u00e8ves accompagn\u00e9s" },
            { value: "15+", label: "Professeurs qualifi\u00e9s" },
            { value: "95%", label: "Taux de r\u00e9ussite" },
            { value: "3+", label: "Ann\u00e9es d\u2019exp\u00e9rience" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur p-5 text-center shadow-sm"
            >
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
