"use client";

export default function ErrorView({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-[#103E2E] px-6 text-center">
      <h1 className="font-serif text-3xl text-[#F4F1E8]">Something went wrong</h1>
      <p className="max-w-md text-sm text-[#A8B8A9]">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-[#DDF285] px-4 py-2 text-sm font-medium text-black"
      >
        Try again
      </button>
    </div>
  );
}
