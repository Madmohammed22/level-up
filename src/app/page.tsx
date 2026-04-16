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
      <section id="reserver" className="bg-zinc-50 py-20 dark:bg-zinc-900">
        <div className="mx-auto max-w-xl px-6">
          <h2 className="text-3xl font-semibold text-center mb-6">
            Réserver une séance
          </h2>
          <p className="text-center text-zinc-600 dark:text-zinc-400 mb-8">
            Laissez-nous vos coordonnées, nous revenons vers vous rapidement.
          </p>
          <CTAForm />
        </div>
      </section>
    </main>
  );
}
