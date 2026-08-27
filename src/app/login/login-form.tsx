"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/app/submit-button";
import { loginAction, type AuthActionState } from "./actions";

const INITIAL: AuthActionState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, INITIAL);

  return (
    <form action={formAction}>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />
      </div>
      <SubmitButton className="primary" pendingLabel="Logging in…">
        Log in
      </SubmitButton>
    </form>
  );
}
