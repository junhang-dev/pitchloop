"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildRehearsalStoragePath,
  validateRehearsalFile,
} from "@/lib/storage/rehearsal";
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

export async function uploadSessionMedia(
  projectId: string,
  sessionId: string,
  formData: FormData,
) {
  const file = formData.get("media");

  if (!(file instanceof File)) {
    return redirect(
      `/dashboard/projects/${projectId}/sessions/${sessionId}?error=Invalid%20file%20upload.`,
    );
  }

  const validation = validateRehearsalFile(file);
  if (!validation.valid) {
    return redirect(
      `/dashboard/projects/${projectId}/sessions/${sessionId}?error=${encodeURIComponent(
        validation.error,
      )}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("id, project_id")
    .eq("id", sessionId)
    .eq("project_id", projectId)
    .single();

  if (!session) {
    return redirect(
      `/dashboard/projects/${projectId}/sessions/${sessionId}?error=Session%20not%20found.`,
    );
  }

  const storagePath = buildRehearsalStoragePath({
    userId: user.id,
    projectId,
    sessionId,
    timestampMs: Date.now(),
    filename: file.name,
  });

  const admin = createSupabaseAdminClient();
  const uploadResult = await admin.storage
    .from("rehearsals")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadResult.error) {
    return redirect(
      `/dashboard/projects/${projectId}/sessions/${sessionId}?error=${encodeURIComponent(
        uploadResult.error.message,
      )}`,
    );
  }

  const { error: updateError } = await supabase
    .from("sessions")
    .update({
      media_path: storagePath,
      media_mime: file.type,
      media_size: file.size,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("project_id", projectId);

  if (updateError) {
    return redirect(
      `/dashboard/projects/${projectId}/sessions/${sessionId}?error=${encodeURIComponent(
        updateError.message,
      )}`,
    );
  }

  revalidatePath(`/dashboard/projects/${projectId}/sessions/${sessionId}`);
}
