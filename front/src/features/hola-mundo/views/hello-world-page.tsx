import { GreetingCard } from "@/shared/components/greeting-card/greeting-card";
import { ThemeToggle } from "@/shared/components/theme-toggle/theme-toggle";

export function HelloWorldPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">
        Hola Mundo
      </h1>
      <GreetingCard
        title="Arquitectura funcionando"
        message="app → features → shared: el entry point delega a la vista de la feature, que consume componentes compartidos."
      />
      <ThemeToggle />
    </main>
  );
}
