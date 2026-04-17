import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-zinc-950">
      {/* Hand-drawn doodle illustrations — full-width layer behind all content */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Top-left: Alarm clock */}
        <svg className="absolute top-4 left-2 h-56 w-56 md:h-72 md:w-72 text-zinc-300/50 dark:text-zinc-700/35 rotate-[-5deg]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          {/* Bell tops */}
          <circle cx="65" cy="45" r="15" />
          <circle cx="135" cy="45" r="15" />
          {/* Clock body */}
          <circle cx="100" cy="105" r="55" />
          {/* Clock face */}
          <circle cx="100" cy="105" r="48" />
          {/* Hour marks */}
          <line x1="100" y1="60" x2="100" y2="65" />
          <line x1="100" y1="145" x2="100" y2="150" />
          <line x1="55" y1="105" x2="60" y2="105" />
          <line x1="140" y1="105" x2="145" y2="105" />
          {/* Clock hands */}
          <line x1="100" y1="105" x2="100" y2="75" />
          <line x1="100" y1="105" x2="122" y2="95" />
          {/* Center dot */}
          <circle cx="100" cy="105" r="3" />
          {/* Legs */}
          <line x1="70" y1="155" x2="60" y2="175" />
          <line x1="130" y1="155" x2="140" y2="175" />
          {/* Ringing lines */}
          <path d="M55 35 L45 25" />
          <path d="M145 35 L155 25" />
          <path d="M50 50 L38 50" />
          <path d="M150 50 L162 50" />
        </svg>

        {/* Top-right: Open book with stars */}
        <svg className="absolute top-2 right-0 h-52 w-52 md:h-64 md:w-64 text-zinc-300/50 dark:text-zinc-700/35 rotate-[10deg]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M100 50 Q60 55 30 80 L30 160 Q60 140 100 135" />
          <path d="M100 50 Q140 55 170 80 L170 160 Q140 140 100 135" />
          <line x1="100" y1="50" x2="100" y2="135" />
          <line x1="50" y1="95" x2="90" y2="90" />
          <line x1="50" y1="110" x2="90" y2="105" />
          <line x1="50" y1="125" x2="80" y2="120" />
          <line x1="110" y1="90" x2="150" y2="95" />
          <line x1="110" y1="105" x2="150" y2="110" />
        </svg>

        {/* Mid-left: Lightbulb with rays */}
        <svg className="absolute top-[38%] left-0 h-44 w-44 md:h-56 md:w-56 text-zinc-300/45 dark:text-zinc-700/35 rotate-[12deg]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M100 30 a45 45 0 0 1 30 78 c3 8 3 16 0 24 l-60 0 c-3-8 -3-16 0-24 a45 45 0 0 1 30-78z" />
          <line x1="80" y1="132" x2="120" y2="132" />
          <line x1="85" y1="145" x2="115" y2="145" />
          <line x1="90" y1="158" x2="110" y2="158" />
          <line x1="100" y1="10" x2="100" y2="22" />
          <line x1="55" y1="35" x2="63" y2="45" />
          <line x1="145" y1="35" x2="137" y2="45" />
          <line x1="35" y1="75" x2="48" y2="75" />
          <line x1="165" y1="75" x2="152" y2="75" />
        </svg>

        {/* Mid-right: Cloud thought bubble */}
        <svg className="absolute top-[32%] right-2 h-44 w-44 md:h-52 md:w-52 text-zinc-300/45 dark:text-zinc-700/35 rotate-[-6deg]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M50 120 a35 35 0 0 1 5-55 a40 40 0 0 1 75-10 a30 30 0 0 1 25 50 a25 25 0 0 1-15 40 z" />
          <circle cx="55" cy="145" r="10" />
          <circle cx="45" cy="165" r="6" />
        </svg>

        {/* Bottom-left: Plant */}
        <svg className="absolute bottom-4 left-4 h-48 w-48 md:h-60 md:w-60 text-zinc-300/45 dark:text-zinc-700/35 rotate-[5deg]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M100 180 L100 80" />
          <path d="M100 130 Q70 110 60 80 Q90 90 100 130" />
          <path d="M100 105 Q130 85 140 55 Q110 65 100 105" />
          <path d="M100 80 Q75 60 70 35 Q95 45 100 80" />
          <ellipse cx="100" cy="185" rx="40" ry="12" />
          <path d="M60 185 L60 195 Q100 210 140 195 L140 185" />
        </svg>

        {/* Bottom-center: Pencil */}
        <svg className="absolute bottom-[10%] left-[38%] h-36 w-36 md:h-44 md:w-44 text-zinc-300/40 dark:text-zinc-700/35 rotate-[35deg]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M50 150 L140 60 L155 75 L65 165 Z" />
          <path d="M140 60 L150 50 Q155 45 160 50 L165 55 Q170 60 165 65 L155 75" />
          <line x1="50" y1="150" x2="40" y2="170" />
          <line x1="65" y1="165" x2="40" y2="170" />
          <line x1="130" y1="70" x2="145" y2="85" />
        </svg>

        {/* Bottom-right: Graduation cap */}
        <svg className="absolute bottom-2 right-0 h-52 w-52 md:h-64 md:w-64 text-zinc-300/50 dark:text-zinc-700/35 rotate-[-8deg]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M100 60 L20 95 L100 130 L180 95 Z" />
          <path d="M50 110 L50 150 Q100 175 150 150 L150 110" />
          <line x1="170" y1="98" x2="170" y2="150" />
          <circle cx="170" cy="155" r="5" />
          <path d="M100 130 L100 155" strokeDasharray="4 4" />
        </svg>
      </div>

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
