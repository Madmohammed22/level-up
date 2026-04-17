import { after } from "next/server";
import { requireRole } from "@/server/auth/requireRole";
import { loadAdminDashboardData } from "@/server/domain/analytics/load";
import { sendExamReminders } from "@/server/domain/notifications/examReminders";
import { KpiCard } from "@/components/admin/analytics/KpiCard";
import { FillRateChart } from "@/components/admin/analytics/FillRateChart";
import { SessionsChart } from "@/components/admin/analytics/SessionsChart";
import { AttendanceChart } from "@/components/admin/analytics/AttendanceChart";
import { LevelSubjectHeatmap } from "@/components/admin/analytics/LevelSubjectHeatmap";

export default async function AdminHomePage() {
  const user = await requireRole("ADMIN");
  const data = await loadAdminDashboardData();

  // Fire-and-forget: send exam reminders after the response is sent.
  // Runs at most once per 24h thanks to idempotency check inside.
  after(async () => {
    try {
      await sendExamReminders();
    } catch (err) {
      console.error("[exam-reminders]", err);
    }
  });

  const fillAccent =
    data.kpis.fillRatePct >= 75
      ? "green"
      : data.kpis.fillRatePct >= 50
        ? "amber"
        : "red";

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bonjour {user.name ?? "Admin"}
        </h1>
        <p className="text-sm text-zinc-500">
          Vue d&apos;ensemble du centre.
        </p>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Élèves"
          value={data.kpis.students}
          hint="Total inscrit"
        />
        <KpiCard
          title="Professeurs"
          value={data.kpis.teachers}
          hint="Total actif"
        />
        <KpiCard
          title="Séances cette semaine"
          value={data.kpis.sessionsThisWeek}
          hint="Hors annulées"
        />
        <KpiCard
          title="Taux de remplissage"
          value={`${data.kpis.fillRatePct}%`}
          hint="Moyenne globale"
          accent={fillAccent}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Taux de remplissage par matière"
          subtitle="Capacité utilisée / capacité totale"
        >
          <FillRateChart data={data.fillRateBySubject} />
        </ChartCard>

        <ChartCard
          title="Séances par semaine"
          subtitle="Total et annulations"
        >
          <SessionsChart
            data={data.sessionsPerWeek.map((w) => ({
              label: w.label,
              total: w.total,
              cancelled: w.cancelled,
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Taux de présence"
          subtitle="14 derniers jours (% présent + retard)"
        >
          <AttendanceChart data={data.attendanceLast14Days} />
        </ChartCard>

        <ChartCard
          title="Effectifs par matière et niveau"
          subtitle="Nombre d'élèves inscrits dans au moins une séance"
        >
          <LevelSubjectHeatmap
            subjects={data.levelSubjectMatrix.subjects}
            levels={data.levelSubjectMatrix.levels}
            cells={data.levelSubjectMatrix.cells}
            max={data.levelSubjectMatrix.max}
          />
        </ChartCard>
      </div>
    </section>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
      <div className="mb-4">
        <h2 className="text-sm font-medium">{title}</h2>
        {subtitle ? (
          <p className="text-xs text-zinc-500">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
