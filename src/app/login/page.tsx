import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div>
      <h1>Log in</h1>
      <LoginForm />
      <p>
        No account yet? <Link href="/signup">Create one</Link>
      </p>
    </div>
  );
}
