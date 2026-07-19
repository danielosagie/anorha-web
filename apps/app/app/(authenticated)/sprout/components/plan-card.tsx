import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import type { SproutPlan } from '../types';

type PlanCardProps = {
  plan: SproutPlan;
  pendingAction: 'accept' | 'revise' | null;
  onAction: (action: 'accept' | 'revise') => void;
};

export function PlanCard({
  onAction,
  pendingAction,
  plan,
}: PlanCardProps) {
  return (
    <Card className="gap-4 border-primary/25 bg-card py-5 shadow-none">
      <CardHeader className="gap-2 px-5">
        <p className="font-bold text-[0.6875rem] text-accent-foreground uppercase tracking-[0.1em]">
          Plan
        </p>
        <CardTitle className="text-base leading-6">{plan.title}</CardTitle>
        {plan.summary ? (
          <CardDescription className="leading-5">{plan.summary}</CardDescription>
        ) : null}
      </CardHeader>
      {plan.steps.length ? (
        <CardContent className="px-5">
          <ol className="flex flex-col gap-3">
            {plan.steps.map((step, index) => (
              <li className="flex gap-3" key={`${step.title}-${index}`}>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-accent-foreground text-xs">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-sm">
                    {step.title}
                  </span>
                  {step.detail ? (
                    <span className="mt-0.5 block text-muted-foreground text-sm leading-5">
                      {step.detail}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      ) : null}
      <CardFooter className="gap-2 px-5">
        <Button
          type="button"
          disabled={pendingAction !== null}
          onClick={() => onAction('accept')}
        >
          {pendingAction === 'accept' ? 'Accepting' : 'Accept'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pendingAction !== null}
          onClick={() => onAction('revise')}
        >
          {pendingAction === 'revise' ? 'Revising' : 'Revise'}
        </Button>
      </CardFooter>
    </Card>
  );
}
