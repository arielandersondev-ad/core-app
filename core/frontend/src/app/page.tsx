import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-4 bg-background px-4">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Core App
      </h1>
      <Link
        href="/dashboard"
        className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-accent"
      >
        Ir al Dashboard
      </Link>
    </div>
  );
}
