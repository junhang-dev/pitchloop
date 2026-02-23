import Link from "next/link";
import { authAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string; redirectTo?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          PitchLoop
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Sign in to continue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use your email and password. Create an account if you are new.
        </p>
      </div>

      <Card className="p-6">
        <form action={authAction} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="????????"
              required
            />
          </div>

          {error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <Button name="intent" value="signin" type="submit">
              Sign in
            </Button>
            <Button name="intent" value="signup" type="submit" variant="outline">
              Create account
            </Button>
          </div>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to PitchLoop?{" "}
        <Link className="font-semibold text-foreground" href="/">
          Learn more
        </Link>
      </p>
    </main>
  );
}
