export default function HomePage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-4 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          AI-powered job search
        </p>

        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Find jobs worth applying to.
        </h1>

        <p className="mx-auto max-w-xl text-muted-foreground">
          Shortlist helps you discover relevant opportunities, understand your
          match, and prepare for the interview.
        </p>
      </div>
    </main>
  );
}