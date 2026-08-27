"use server";

import { redirect } from "next/navigation";
import { createUser } from "@/lib/users";
import { setSessionCookie } from "@/lib/session";
import { recordEvent } from "@/lib/events";

// Mirrors the `{ error }` convention from the note actions: a thrown error
// would blank the form and lose the typed email.
export type AuthActionState = { error?: string };

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export async function signupAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  try {
    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    const user = await createUser({ email, password });

    await setSessionCookie({ userId: user.id, email: user.email });
    await recordEvent({ type: "user_signed_up", userId: user.id });
  } catch (err) {
    return { error: errorMessage(err, "Failed to create account") };
  }

  // `redirect` throws to unwind, so it must sit outside the try/catch or the
  // catch would swallow it and report a failed signup.
  redirect("/goals");
}
