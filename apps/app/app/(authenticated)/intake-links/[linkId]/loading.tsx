import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { PageWrapper } from '../../components/page-wrapper';

export default function IntakeLinkDetailLoading() {
  return (
    <PageWrapper title="Intake link">
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-32 w-full rounded-[1.125rem]" />
          <Skeleton className="h-32 w-full rounded-[1.125rem]" />
        </div>
        <Skeleton className="h-48 w-full rounded-[1.125rem]" />
        <Skeleton className="h-80 w-full rounded-[1.125rem]" />
      </div>
    </PageWrapper>
  );
}
