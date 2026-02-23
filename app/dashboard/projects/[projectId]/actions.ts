"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sessionSchema } from "@/lib/validators/session";

export async function createSessionAction(
  projectId: string,
  formData: FormData,
) {
  const parsed = sessionSchema.safeParse({
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return redirect(`/dashboard/projects/${projectId}?error=Invalid%20session.`);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { error } = await supabase.from("sessions").insert({
    project_id: projectId,
    title: parsed.data.title,
  });

  if (error) {
    return redirect(
      `/dashboard/projects/${projectId}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
}
