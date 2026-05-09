"use client";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  void error;
  return (
    <html lang="en">
      <body>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h2>Something went wrong!</h2>
          <button type="button" onClick={() => unstable_retry()}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
