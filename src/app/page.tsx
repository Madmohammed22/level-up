import { Hero } from "@/components/landing/Hero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ResultsSection } from "@/components/landing/ResultsSection";
import { CTAForm } from "@/components/landing/CTAForm";

export default function LandingPage() {
  return (
    <main className="flex flex-col">
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <ResultsSection />
      <section id="reserver" className="py-24 px-6 bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-zinc-900 dark:text-zinc-50 mb-4">
            R&eacute;server une s&eacute;ance
          </h2>
          <p className="text-center text-lg text-zinc-500 dark:text-zinc-400 mb-10">
            Laissez-nous vos coordonn&eacute;es, nous revenons vers vous rapidement.
          </p>
          <CTAForm />
        </div>
      </section>
    </main>
  );
}
