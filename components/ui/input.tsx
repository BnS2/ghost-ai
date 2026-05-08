import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({
  className,
  type,
  ...props
}: Omit<InputPrimitive.Props, "className"> & { className?: string }) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-border-subtle bg-bg-elevated/50 px-3 py-2 text-text-primary transition-all outline-none placeholder:text-text-faint focus-visible:border-accent-primary focus-visible:ring-3 focus-visible:ring-accent-primary/20 disabled:pointer-events-none disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
