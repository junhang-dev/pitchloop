"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { actionSchema } from "@/lib/validators/action";

export async function createActionItem(
  projectId: string,
  sessionId: string,
  formData: FormData,
) {
  const parsed = actionSchema.safeParse({
    text: formData.get("text"),
  });

  if (!parsed.success) {
    return redirect(
      `/dashboard/projects/${projectId}/sessions/${sessionId}?error=Invalid%20action.`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { error } = await supabase.from("actions").insert({
    session_id: sessionId,
    text: parsed.data.text,
  });

  if (error) {
    return redirect(
      `/dashboard/projects/${projectId}/sessions/${sessionId}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath(`/dashboard/projects/${projectId}/sessions/${sessionId}`);
}
