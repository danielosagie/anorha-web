import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { PageWrapper } from '../components/page-wrapper';

export default function IntakeLinksLoading() {
  return (
    <PageWrapper title="Intake links">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-32 w-full rounded-[1.125rem]" />
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-56 w-full rounded-[1.125rem]" />
          <Skeleton className="h-56 w-full rounded-[1.125rem]" />
        </div>
        <Skeleton className="h-80 w-full rounded-[1.125rem]" />
      </div>
    </PageWrapper>
  );
}
