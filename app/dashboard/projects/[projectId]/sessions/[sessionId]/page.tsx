import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createActionItem,
  generateActionsFromAnalysis,
  runSessionAnalysis,
  uploadSessionMedia,
} from "./actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isPlayableMime } from "@/lib/storage/rehearsal";

type SessionDetailPageProps = {
  params: { projectId: string; sessionId: string };
  searchParams?: { error?: string };
};

export default async function SessionDetailPage({
  params,
  searchParams,
}: SessionDetailPageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, created_at, media_path, media_mime, media_size")
    .eq("id", params.sessionId)
    .eq("project_id", params.projectId)
    .single();

  if (!session) {
    notFound();
  }

  const { data: actions } = await supabase
    .from("actions")
    .select("id, text, is_done, created_at")
    .eq("session_id", params.sessionId)
    .order("created_at", { ascending: true });
  const { data: latestAnalysis } = await supabase
    .from("analyses")
    .select(
      "speaking_rate_wpm, filler_json, pauses_json, feedback_json, transcript_text, is_estimated, created_at",
    )
    .eq("session_id", params.sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const createActionForSession = createActionItem.bind(
    null,
    params.projectId,
    params.sessionId,
  );
  const uploadMediaForSession = uploadSessionMedia.bind(
    null,
    params.projectId,
    params.sessionId,
  );
  const runAnalysisForSession = runSessionAnalysis.bind(
    null,
    params.projectId,
    params.sessionId,
  );
  const generateActionsForSession = generateActionsFromAnalysis.bind(
    null,
    params.projectId,
    params.sessionId,
  );

  let signedMediaUrl: string | null = null;
  if (session.media_path) {
    const admin = createSupabaseAdminClient();
    const { data: signedData } = await admin.storage
      .from("rehearsals")
      .createSignedUrl(session.media_path, 60 * 60);
    signedMediaUrl = signedData?.signedUrl ?? null;
  }

  const feedback =
    latestAnalysis?.feedback_json && Array.isArray(latestAnalysis.feedback_json)
      ? latestAnalysis.feedback_json.filter(
          (item): item is string => typeof item === "string",
        )
      : [];
  const pauses =
    latestAnalysis?.pauses_json && Array.isArray(latestAnalysis.pauses_json)
      ? latestAnalysis.pauses_json.filter(
          (item): item is { second: number; label: string } =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as { second?: unknown }).second === "number" &&
            typeof (item as { label?: unknown }).label === "string",
        )
      : [];
  const fillerCounts =
    latestAnalysis?.filler_json &&
    typeof latestAnalysis.filler_json === "object" &&
    !Array.isArray(latestAnalysis.filler_json)
      ? (latestAnalysis.filler_json as Record<string, number>)
      : {};
  const maxPauseSecond = pauses.length ? Math.max(...pauses.map((p) => p.second), 100) : 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            className="text-sm text-muted-foreground hover:text-foreground"
            href={`/dashboard/projects/${params.projectId}`}
          >
            ← Back to project
          </Link>
          <h1 className="text-2xl font-semibold">{session.title}</h1>
          <p className="text-sm text-muted-foreground">
            Session on {new Date(session.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {searchParams?.error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {searchParams.error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-muted-foreground">Upload</h2>
          <form action={uploadMediaForSession} className="mt-3 space-y-3">
            <Input name="media" type="file" accept="audio/*,video/*" required />
            <Button type="submit">Upload media</Button>
          </form>
          {session.media_path && signedMediaUrl ? (
            <div className="mt-4 space-y-2 text-sm">
              <p className="text-muted-foreground">
                {((session.media_size ?? 0) / (1024 * 1024)).toFixed(2)} MB
              </p>
              {isPlayableMime(session.media_mime) ? (
                session.media_mime?.startsWith("audio/") ? (
                  <audio className="w-full" controls src={signedMediaUrl} />
                ) : (
                  <video className="w-full rounded-md" controls src={signedMediaUrl} />
                )
              ) : (
                <a
                  className="font-medium hover:underline"
                  href={signedMediaUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Download uploaded file
                </a>
              )}
            </div>
          ) : null}
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-muted-foreground">Analysis</h2>
          <form action={runAnalysisForSession} className="mt-3 space-y-3">
            <Textarea
              name="transcriptText"
              placeholder="Paste your transcript here..."
              defaultValue={latestAnalysis?.transcript_text ?? ""}
              required
            />
            <Button type="submit">Run Analysis</Button>
          </form>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Next actions
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create checklist items from the latest analysis feedback.
          </p>
          <form action={generateActionsForSession} className="mt-3">
            <Button disabled={!feedback.length} type="submit" variant="secondary">
              Generate Next Actions
            </Button>
          </form>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground">Speaking Rate</h3>
          <p className="mt-2 text-2xl font-semibold">
            {latestAnalysis?.speaking_rate_wpm ?? "-"} WPM
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Estimated</p>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Filler Summary</h3>
          {Object.keys(fillerCounts).length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(fillerCounts).map(([key, count]) => (
                <span
                  key={key}
                  className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                >
                  {key}: {count}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No analysis yet.</p>
          )}
        </Card>
      </div>

      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">Timeline</h3>
          <span className="text-xs text-muted-foreground">Estimated</span>
        </div>
        <div className="relative h-3 rounded-full bg-muted">
          {pauses.map((pause) => (
            <span
              key={`${pause.second}-${pause.label}`}
              className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-foreground/70"
              style={{ left: `${(pause.second / maxPauseSecond) * 100}%` }}
              title={pause.label}
            />
          ))}
        </div>
        {!pauses.length ? (
          <p className="text-sm text-muted-foreground">No timeline markers yet.</p>
        ) : null}
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-muted-foreground">Feedback</h3>
        {feedback.length ? (
          <ul className="mt-3 space-y-2">
            {feedback.map((tip) => (
              <li key={tip} className="text-sm">
                - {tip}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No feedback yet.</p>
        )}
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Action checklist</h2>
        <form action={createActionForSession} className="flex gap-2">
          <Input
            name="text"
            placeholder="Add a focus action (e.g. tighten opener)"
            required
          />
          <Button type="submit">Add</Button>
        </form>

        <div className="grid gap-3">
          {actions?.length ? (
            actions.map((action) => (
              <Card key={action.id} className="flex items-center gap-3 p-4">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                <div>
                  <p className="text-sm font-medium">{action.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {action.is_done ? "Done" : "Pending"}
                  </p>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-4 text-sm text-muted-foreground">
              No action items yet. Add your first improvement.
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
