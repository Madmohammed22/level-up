import Link from "next/link";

export function Hero() {
  return (
    <section className="bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950/40 dark:to-black py-24 px-6">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          LEVEL UP — Centre de soutien scolaire
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Améliore tes notes et maîtrise ton stress
        </h1>
        <p className="mt-6 text-lg md:text-xl text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto">
          Cours, méthodologie et accompagnement mental — tout ce qu&apos;il faut
          pour réussir tes examens sereinement.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="#reserver"
            className="inline-flex items-center rounded-full bg-indigo-600 px-8 py-3 text-white font-medium hover:bg-indigo-700 transition"
          >
            Réserver une séance
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-full border border-zinc-300 dark:border-zinc-700 px-8 py-3 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </section>
  );
}
