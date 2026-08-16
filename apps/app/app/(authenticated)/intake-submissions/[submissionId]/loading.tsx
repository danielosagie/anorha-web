import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { PageWrapper } from '../../components/page-wrapper';

export default function IntakeSubmissionLoading() {
  return (
    <PageWrapper title="Submission">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.6fr)]">
        <Skeleton className="aspect-[4/3] w-full rounded-[1.125rem]" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-64 w-full rounded-[1.125rem]" />
          <Skeleton className="h-48 w-full rounded-[1.125rem]" />
        </div>
      </div>
    </PageWrapper>
  );
}
