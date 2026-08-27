"use server";

import { redirect } from "next/navigation";
import { getUserByEmail } from "@/lib/users";
import { verifyPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { recordEvent } from "@/lib/events";
import type { AuthActionState } from "@/app/signup/actions";

export type { AuthActionState };

// Deliberately identical whether the email is unknown or the password is wrong,
// so the form can't be used to enumerate which emails have accounts.
const INVALID_CREDENTIALS = "Invalid email or password";

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    const user = await getUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return { error: INVALID_CREDENTIALS };
    }

    await setSessionCookie({ userId: user.id, email: user.email });
    await recordEvent({ type: "user_logged_in", userId: user.id });
  } catch {
    return { error: INVALID_CREDENTIALS };
  }

  redirect("/goals");
}
