import Link from "next/link";
import { createProjectAction } from "./actions";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProjectsPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, goal, audience, duration_sec, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Keep every pitch rehearsal organized in one place.
          </p>
        </div>
        <CreateProjectDialog action={createProjectAction} />
      </div>

      {resolvedSearchParams?.error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {resolvedSearchParams.error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {projects?.length ? (
          projects.map((project) => (
            <Card key={project.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{project.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {project.goal}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {Math.round(project.duration_sec / 60)} min
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>{project.audience}</span>
                <Link
                  className="font-medium text-foreground hover:underline"
                  href={`/dashboard/projects/${project.id}`}
                >
                  View project
                </Link>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-6 text-sm text-muted-foreground">
            No projects yet. Create one to start rehearsing.
          </Card>
        )}
      </div>
    </div>
  );
}
