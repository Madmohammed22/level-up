import { requireRole } from "@/server/auth/requireRole";
import { getSrsSessionCards, getSrsAllSubjectCards } from "@/server/actions/student/srs";
import { ReviewSession } from "@/components/student/srs/ReviewSession";

export default async function SrsSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; all?: string }>;
}) {
  await requireRole("STUDENT");
  const params = await searchParams;
  const subjectId = params.subject || undefined;
  const reviewAll = params.all === "1";

  const cards = reviewAll && subjectId
    ? await getSrsAllSubjectCards(subjectId)
    : await getSrsSessionCards(subjectId);

  const sessionCards = cards.map((c) => ({
    id: c.id,
    text: c.text,
    tag: c.tag,
    interval: c.interval,
    stability: c.stability,
    state: c.state,
    subject: {
      id: c.subject.id,
      name: c.subject.name,
      code: c.subject.code,
      hue: c.subject.hue,
    },
  }));

  return (
    <section className="py-4">
      <ReviewSession cards={sessionCards} />
    </section>
  );
}
