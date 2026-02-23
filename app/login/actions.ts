"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  intent: z.enum(["signin", "signup"]),
});

export async function authAction(formData: FormData) {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    intent: formData.get("intent"),
  });

  if (!parsed.success) {
    return redirect("/login?error=Please%20enter%20valid%20credentials.");
  }

  const supabase = await createSupabaseServerClient();
  const { email, password, intent } = parsed.data;

  const { error } =
    intent === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  return redirect("/dashboard/projects");
}
