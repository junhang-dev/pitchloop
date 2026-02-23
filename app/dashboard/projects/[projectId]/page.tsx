import Link from "next/link";
import { notFound } from "next/navigation";
import { createSessionAction } from "./actions";
import { CreateSessionDialog } from "@/components/dashboard/create-session-dialog";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams?: Promise<{ error?: string }>;
};

export default async function ProjectDetailPage({
  params,
  searchParams,
}: ProjectDetailPageProps) {
  const { projectId } = await params;
  const resolvedSearchParams = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, goal, audience, duration_sec, created_at")
    .eq("id", projectId)
    .single();

  if (!project) {
    notFound();
  }

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  const sessionIds = (sessions ?? []).map((session) => session.id);
  const { data: analyses } = sessionIds.length
    ? await supabase
        .from("analyses")
        .select("session_id, speaking_rate_wpm, created_at")
        .in("session_id", sessionIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const analysisBySession = new Map<string, { speaking_rate_wpm: number | null }>();
  for (const analysis of analyses ?? []) {
    if (!analysisBySession.has(analysis.session_id)) {
      analysisBySession.set(analysis.session_id, {
        speaking_rate_wpm: analysis.speaking_rate_wpm,
      });
    }
  }

  const trendPoints = (sessions ?? [])
    .map((session, index) => {
      const speakingRate = analysisBySession.get(session.id)?.speaking_rate_wpm ?? null;
      return speakingRate
        ? {
            index,
            title: session.title,
            speakingRate,
            createdAt: session.created_at,
          }
        : null;
    })
    .filter((point): point is NonNullable<typeof point> => point !== null);

  const sessionCount = sessions?.length ?? 0;

  const createSessionForProject = createSessionAction.bind(
    null,
    projectId,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            className="text-sm text-muted-foreground hover:text-foreground"
            href="/dashboard/projects"
          >
            ← Back to projects
          </Link>
          <h1 className="text-2xl font-semibold">{project.title}</h1>
          <p className="text-sm text-muted-foreground">{project.goal}</p>
        </div>
        <CreateSessionDialog action={createSessionForProject} />
      </div>

      {resolvedSearchParams?.error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {resolvedSearchParams.error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Audience</p>
          <p className="mt-2 text-lg font-semibold">{project.audience}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Target duration</p>
          <p className="mt-2 text-lg font-semibold">
            {Math.round(project.duration_sec / 60)} min
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total sessions</p>
          <p className="mt-2 text-lg font-semibold">{sessionCount}</p>
        </Card>
      </div>

      <section className="space-y-4">
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Speaking Rate Trend</h2>
          {!sessions?.length ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No sessions yet. Create your first rehearsal session.
            </p>
          ) : !trendPoints.length ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No analysis yet. Run analysis on a session to view trend data.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              <svg
                aria-label="Speaking rate trend chart"
                className="h-36 w-full"
                role="img"
                viewBox="0 0 320 120"
              >
                <rect fill="hsl(var(--muted))" height="120" rx="8" width="320" x="0" y="0" />
                <polyline
                  fill="none"
                  points={trendPoints
                    .map((point, idx) => {
                      const x =
                        trendPoints.length === 1
                          ? 160
                          : 20 + (idx * 280) / (trendPoints.length - 1);
                      const minWpm = Math.min(...trendPoints.map((p) => p.speakingRate));
                      const maxWpm = Math.max(...trendPoints.map((p) => p.speakingRate));
                      const range = Math.max(1, maxWpm - minWpm);
                      const y = 95 - ((point.speakingRate - minWpm) / range) * 70;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                  stroke="hsl(var(--foreground))"
                  strokeWidth="2"
                />
                {trendPoints.map((point, idx) => {
                  const x =
                    trendPoints.length === 1
                      ? 160
                      : 20 + (idx * 280) / (trendPoints.length - 1);
                  const minWpm = Math.min(...trendPoints.map((p) => p.speakingRate));
                  const maxWpm = Math.max(...trendPoints.map((p) => p.speakingRate));
                  const range = Math.max(1, maxWpm - minWpm);
                  const y = 95 - ((point.speakingRate - minWpm) / range) * 70;
                  return (
                    <g key={point.createdAt}>
                      <circle cx={x} cy={y} fill="hsl(var(--foreground))" r="3" />
                      <text
                        fill="hsl(var(--foreground))"
                        fontSize="9"
                        textAnchor="middle"
                        x={x}
                        y={110}
                      >
                        {point.speakingRate}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <p className="text-xs text-muted-foreground">
                Values shown as WPM by session order.
              </p>
            </div>
          )}
        </Card>
        <h2 className="text-lg font-semibold">Sessions</h2>
        <div className="grid gap-4">
          {sessions?.length ? (
            sessions.map((session) => (
              <Card key={session.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold">{session.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Speaking rate:{" "}
                      {analysisBySession.get(session.id)?.speaking_rate_wpm ?? "N/A"} WPM
                    </p>
                  </div>
                  <Link
                    className="text-sm font-medium text-foreground hover:underline"
                    href={`/dashboard/projects/${project.id}/sessions/${session.id}`}
                  >
                    Open session
                  </Link>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-5 text-sm text-muted-foreground">
              No sessions yet. Create your first rehearsal session.
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
