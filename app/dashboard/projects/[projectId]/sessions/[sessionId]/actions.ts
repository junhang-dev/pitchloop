"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { analyzeTranscript } from "@/lib/analysis/analyze";
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

export async function runSessionAnalysis(
  projectId: string,
  sessionId: string,
  formData: FormData,
) {
  const transcriptText = String(formData.get("transcriptText") ?? "").trim();
  if (!transcriptText) {
    return redirect(
      `/dashboard/projects/${projectId}/sessions/${sessionId}?error=Transcript%20is%20required.`,
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
    .select("id, duration_sec")
    .eq("id", sessionId)
    .eq("project_id", projectId)
    .single();

  if (!session) {
    return redirect(
      `/dashboard/projects/${projectId}/sessions/${sessionId}?error=Session%20not%20found.`,
    );
  }

  const analysis = analyzeTranscript({
    transcriptText,
    durationSec: session.duration_sec ?? undefined,
  });

  const { data: existing } = await supabase
    .from("analyses")
    .select("id")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    session_id: sessionId,
    speaking_rate_wpm: analysis.speakingRateWpm,
    filler_json: analysis.fillerCounts,
    pauses_json: analysis.pauses,
    feedback_json: analysis.feedback,
    transcript_text: transcriptText,
    is_estimated: analysis.isEstimated,
  };

  const { error } = existing?.id
    ? await supabase.from("analyses").update(payload).eq("id", existing.id)
    : await supabase.from("analyses").insert(payload);

  if (error) {
    return redirect(
      `/dashboard/projects/${projectId}/sessions/${sessionId}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath(`/dashboard/projects/${projectId}/sessions/${sessionId}`);
}

export async function generateActionsFromAnalysis(
  projectId: string,
  sessionId: string,
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: analysis } = await supabase
    .from("analyses")
    .select("feedback_json")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const feedback =
    analysis?.feedback_json && Array.isArray(analysis.feedback_json)
      ? analysis.feedback_json.filter(
          (item): item is string => typeof item === "string",
        )
      : [];

  if (!feedback.length) {
    return redirect(
      `/dashboard/projects/${projectId}/sessions/${sessionId}?error=No%20analysis%20feedback%20to%20convert.`,
    );
  }

  const { data: existingActions } = await supabase
    .from("actions")
    .select("text")
    .eq("session_id", sessionId);

  const existingTexts = new Set(
    (existingActions ?? []).map((action) => action.text.trim().toLowerCase()),
  );
  const inserts = feedback
    .map((tip) => tip.trim())
    .filter((tip) => tip.length > 0)
    .filter((tip) => !existingTexts.has(tip.toLowerCase()))
    .map((tip) => ({ session_id: sessionId, text: tip }));

  if (inserts.length) {
    const { error } = await supabase.from("actions").insert(inserts);
    if (error) {
      return redirect(
        `/dashboard/projects/${projectId}/sessions/${sessionId}?error=${encodeURIComponent(
          error.message,
        )}`,
      );
    }
  }

  revalidatePath(`/dashboard/projects/${projectId}/sessions/${sessionId}`);
}
