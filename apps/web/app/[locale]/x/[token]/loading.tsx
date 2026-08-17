import { Skeleton } from '@repo/design-system/components/ui/skeleton';

export default function IntakeLoading() {
  return (
    <div className="anorha-intake-page anorha-intake-theme min-h-svh bg-background font-sans text-foreground">
      <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10">
        <div className="font-semibold text-sm tracking-tight">anorha</div>
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[34rem] w-full rounded-[1.125rem]" />
      </main>
    </div>
  );
}
