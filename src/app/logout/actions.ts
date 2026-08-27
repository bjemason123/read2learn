"use server";

import { redirect } from "next/navigation";
import { clearSessionCookie, getSession } from "@/lib/session";
import { recordEvent } from "@/lib/events";

export async function logoutAction() {
  const session = await getSession();

  if (session) {
    await recordEvent({ type: "user_logged_out", userId: session.userId });
  }

  await clearSessionCookie();

  redirect("/login");
}
