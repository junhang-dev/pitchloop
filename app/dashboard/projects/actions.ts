"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { projectSchema } from "@/lib/validators/project";

export async function createProjectAction(formData: FormData) {
  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    goal: formData.get("goal"),
    audience: formData.get("audience"),
    durationSec: formData.get("durationSec"),
  });

  if (!parsed.success) {
    return redirect("/dashboard/projects?error=Invalid%20project%20data.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { error } = await supabase.from("projects").insert({
    user_id: user.id,
    title: parsed.data.title,
    goal: parsed.data.goal,
    audience: parsed.data.audience,
    duration_sec: parsed.data.durationSec,
  });

  if (error) {
    return redirect(`/dashboard/projects?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/projects");
}
