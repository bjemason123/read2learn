"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/app/submit-button";
import { signupAction, type AuthActionState } from "./actions";

const INITIAL: AuthActionState = {};

export function SignupForm() {
  const [state, formAction] = useActionState(signupAction, INITIAL);

  return (
    <form action={formAction}>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          minLength={8}
          required
        />
      </div>
      <SubmitButton className="primary" pendingLabel="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
