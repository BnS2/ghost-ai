"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-canvas-bg text-foreground p-4">
      <div className="flex flex-col items-center max-w-md text-center space-y-6">
        <div className="p-4 rounded-full bg-accent/10">
          <Lock className="w-12 h-12 text-accent" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Access Denied</h1>
          <p className="text-muted-foreground">
            You don&apos;t have permission to access this project, or it may not exist.
          </p>
        </div>
        <Link href="/editor" className={buttonVariants({ variant: "outline" })}>
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
