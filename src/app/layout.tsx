import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { logoutAction } from "@/app/logout/actions";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reading Curator",
  description: "Track learning goals and the reading material attached to them.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The session email comes from the signed cookie payload, so showing who is
  // logged in costs no database round-trip per page render.
  const session = await getSession();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <header className="site-header">
          <Link href="/" className="site-title">
            Reading Curator
          </Link>
          <nav className="site-nav">
            {session ? (
              <>
                <Link href="/goals">My goals</Link>
                <span className="site-nav-user">{session.email}</span>
                <form action={logoutAction}>
                  <button type="submit">Log out</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login">Log in</Link>
                <Link href="/signup">Sign up</Link>
              </>
            )}
          </nav>
        </header>
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
