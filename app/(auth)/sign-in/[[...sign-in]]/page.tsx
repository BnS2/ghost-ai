import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { FileText, Users, Zap } from "lucide-react";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/editor");
  }

  return (
    <main className="flex min-h-screen w-full font-sans">
      {/* Left Panel - Branding & Features */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-16 bg-bg-surface border-r border-border-subtle relative overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="h-8 w-8 rounded-xl bg-accent-primary flex items-center justify-center shadow-[0_0_20px_rgba(0,200,212,0.3)]">
            <div className="h-4 w-4 bg-bg-base rounded-md opacity-90" />
          </div>
          <span className="text-xl font-bold text-text-primary tracking-tight">Ghost AI</span>
        </div>

        {/* Content */}
        <div className="max-w-xl z-10">
          <h1 className="text-5xl font-bold text-text-primary mb-6 leading-[1.1] tracking-tight">
            Design systems at the <br />
            <span className="text-accent-primary">speed of thought.</span>
          </h1>
          <p className="text-text-secondary mb-12 text-lg leading-relaxed max-w-lg">
            Describe your architecture in plain English. Ghost AI maps it to a shared canvas your
            whole team can refine in real time.
          </p>

          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 border border-accent-primary/20">
                <Zap className="h-5 w-5 text-accent-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary mb-1">AI Architecture Generation</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Describe your system, AI maps it to nodes and edges on a live canvas.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 border border-accent-primary/20">
                <Users className="h-5 w-5 text-accent-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary mb-1">Real-time Collaboration</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Live cursors, presence indicators, and shared node editing across your team.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 border border-accent-primary/20">
                <FileText className="h-5 w-5 text-accent-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary mb-1">Instant Spec Generation</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Export a complete Markdown technical spec directly from the canvas graph.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="z-10">
          <p className="text-sm text-text-faint">&copy; 2026 Ghost AI. All rights reserved.</p>
        </div>

        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent-primary/5 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex flex-1 items-center justify-center p-8 bg-bg-base relative">
        <SignIn
          appearance={{
            variables: {
              borderRadius: "0.75rem", // Align with rounded-xl spec
            },
            elements: {
              rootBox: "w-full max-w-[440px]",
              card: "bg-transparent border-none shadow-none",
              headerTitle: "text-2xl font-bold text-text-primary tracking-tight",
              headerSubtitle: "text-text-secondary",
              socialButtonsBlockButton:
                "bg-bg-elevated border-border-subtle hover:bg-bg-subtle text-text-primary transition-colors rounded-xl",
              socialButtonsBlockButtonText: "font-medium",
              dividerLine: "bg-border-subtle",
              dividerText: "text-text-faint font-medium uppercase text-[10px] tracking-widest",
              formFieldLabel: "text-text-secondary text-sm font-medium mb-1.5",
              formFieldInput:
                "bg-bg-elevated border-border-subtle text-text-primary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 h-11 transition-all rounded-xl",
              formButtonPrimary:
                "bg-accent-primary hover:bg-accent-primary/90 text-bg-base font-bold h-11 shadow-[0_0_20px_rgba(0,200,212,0.25)] transition-all rounded-xl",
              footerActionText: "text-text-muted",
              footerActionLink:
                "text-accent-primary hover:text-accent-primary/80 font-semibold transition-colors",
              identityPreviewText: "text-text-primary",
              identityPreviewEditButton: "text-accent-primary",
              formFieldInputShowPasswordButton: "text-text-muted hover:text-text-primary",
            },
          }}
        />
      </div>
    </main>
  );
}
