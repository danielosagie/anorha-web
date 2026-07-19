import { Badge } from '@repo/design-system/components/ui/badge';

const FAILED_STATUS = /refund|cancel|fail|void/;
const OPEN_STATUS = /pend|process|open|unfulfil/;

function getVariant(status: string): 'outline' | 'secondary' | 'destructive' {
  const normalized = status.toLowerCase();
  if (FAILED_STATUS.test(normalized)) {
    return 'destructive';
  }
  if (OPEN_STATUS.test(normalized)) {
    return 'secondary';
  }
  return 'outline';
}

export function OrderStatus({ status }: { status: string }) {
  return <Badge variant={getVariant(status)}>{status || 'Unknown'}</Badge>;
}
