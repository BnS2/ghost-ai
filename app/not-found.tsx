import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background text-foreground">
      <h2 className="text-4xl font-bold tracking-tight">404</h2>
      <p className="text-lg text-muted-foreground">This page could not be found.</p>
      <Link href="/" className="mt-4 text-accent-primary underline">
        Return Home
      </Link>
    </div>
  );
}
