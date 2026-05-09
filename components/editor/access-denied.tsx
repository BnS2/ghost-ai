"use client";

import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base text-copy-primary p-4 antialiased">
      <div className="relative flex flex-col items-center max-w-md w-full text-center space-y-8 p-12 rounded-3xl bg-surface border border-surface-border shadow-2xl overflow-hidden">
        {/* Visual Decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-state-error/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative group">
          <div className="absolute inset-0 bg-state-error/20 blur-2xl rounded-full scale-150 opacity-50 group-hover:opacity-80 transition-opacity" />
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-state-error/10 border border-state-error/20">
            <Lock className="w-10 h-10 text-state-error" />
          </div>
        </div>

        <div className="space-y-3 relative">
          <h1 className="text-3xl font-bold tracking-tight text-copy-primary">Access Denied</h1>
          <p className="text-copy-muted leading-relaxed">
            You don&apos;t have permission to access this project, or it may not exist. Please check
            your credentials or contact the owner.
          </p>
        </div>

        <Link
          href="/editor"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "relative w-full sm:w-auto px-8 gap-2 group",
          )}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Return to Editor</span>
        </Link>
      </div>
    </div>
  );
}
