import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-xl border border-border-subtle bg-bg-elevated/50 px-3 py-2 text-text-primary transition-all outline-none placeholder:text-text-faint focus-visible:border-accent-primary focus-visible:ring-3 focus-visible:ring-accent-primary/20 disabled:pointer-events-none disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
