import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/brand/logo";
import { Sparkles, ShieldCheck, Workflow } from "lucide-react";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/pipeline");

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Layered ambient + grid background */}
      <div className="pointer-events-none absolute inset-0 ambient-glow" aria-hidden />
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-4 md:px-10">
          <Logo size="md" />
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--brand))] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(var(--brand))]" />
            </span>
            os.runcogrowth.com
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 pb-6">
          <div className="grid w-full max-w-[1080px] grid-cols-1 gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            {/* Left — hero copy */}
            <div className="hidden flex-col justify-center lg:flex">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
                <Sparkles className="h-3 w-3 text-[hsl(var(--brand))]" />
                Runco Operations
              </div>

              <h1 className="mt-5 font-display text-[52px] font-bold leading-[0.95] tracking-[-0.04em]">
                <span className="block text-foreground">Run your</span>
                <span className="block">
                  <span className="shimmer">growth engine</span>
                </span>
                <span className="block text-foreground">in one place.</span>
              </h1>

              <p className="mt-5 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                The internal operating system for RunCoGrowth — pipeline, tasks, contacts and
                handoffs, all in one premium workspace built for your team.
              </p>

              <ul className="mt-7 space-y-3">
                {[
                  { icon: Workflow, label: "Drag-and-drop pipeline with realtime sync" },
                  { icon: ShieldCheck, label: "Role-based access for admins and operators" },
                  { icon: Sparkles, label: "Designed to feel like a premium SaaS dashboard" },
                ].map((f) => (
                  <li key={f.label} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-[hsl(var(--brand))]">
                      <f.icon className="h-4 w-4" />
                    </span>
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — sign-in card */}
            <div className="flex flex-col justify-center">
              <div className="relative">
                <div
                  className="absolute -inset-x-6 -top-10 -bottom-10 rounded-[32px] bg-gradient-to-b from-[hsl(var(--brand)/0.18)] via-transparent to-transparent blur-2xl"
                  aria-hidden
                />
                <div className="border-gradient relative rounded-2xl bg-surface/70 p-1 shadow-2xl backdrop-blur">
                  <div className="relative rounded-[15px] bg-surface/80 p-6 md:p-7">
                    <div className="mb-5">
                      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-canvas/50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        <span className="h-1 w-1 rounded-full bg-[hsl(var(--brand))]" />
                        Sign in
                      </span>
                      <h2 className="mt-3 font-display text-[26px] font-bold leading-[1.05] tracking-[-0.03em] text-foreground">
                        Welcome back to Runco.
                      </h2>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        Use your work email and password to access the workspace.
                      </p>
                    </div>

                    <LoginForm />
                  </div>
                </div>

                <p className="mt-5 text-center text-xs text-muted-foreground">
                  Trouble signing in? Contact{" "}
                  <a
                    href="mailto:abhaykalera1@gmail.com"
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    abhaykalera1@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </main>

        <footer className="px-6 py-4 text-center text-xs text-muted-foreground md:px-12">
          © {new Date().getFullYear()} RunCoGrowth — All rights reserved.
        </footer>
      </div>
    </div>
  );
}
