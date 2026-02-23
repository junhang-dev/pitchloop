import Link from "next/link";
import { notFound } from "next/navigation";
import { createSessionAction } from "./actions";
import { CreateSessionDialog } from "@/components/dashboard/create-session-dialog";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProjectDetailPageProps = {
  params: { projectId: string };
  searchParams?: { error?: string };
};

export default async function ProjectDetailPage({
  params,
  searchParams,
}: ProjectDetailPageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, goal, audience, duration_sec, created_at")
    .eq("id", params.projectId)
    .single();

  if (!project) {
    notFound();
  }

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, created_at")
    .eq("project_id", params.projectId)
    .order("created_at", { ascending: false });

  const sessionCount = sessions?.length ?? 0;

  const createSessionForProject = createSessionAction.bind(
    null,
    params.projectId,
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

      {searchParams?.error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {searchParams.error}
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
