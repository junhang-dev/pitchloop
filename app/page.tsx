import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_55%)]" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-16 px-6 py-16 sm:px-10">
        <header className="flex flex-col gap-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            PitchLoop MVP
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Rehearse your pitch. Capture feedback. Improve every iteration.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            PitchLoop is the fastest way to practice solo: create a project,
            upload a rehearsal, and get structured next actions ready for the
            next run.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard/projects">Open dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Create a project",
              copy: "Define your goal, audience, and target duration.",
            },
            {
              title: "Run a session",
              copy: "Upload rehearsal media and snapshot the takeaways.",
            },
            {
              title: "Ship next actions",
              copy: "Turn feedback into a checklist you can follow.",
            },
          ].map((item) => (
            <Card key={item.title} className="p-6">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{item.copy}</p>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
