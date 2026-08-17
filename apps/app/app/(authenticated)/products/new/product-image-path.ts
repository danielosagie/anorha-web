const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_EXTENSION = /^[a-z0-9]+$/;

type ProductImagePathOptions = {
  extension: string;
  index: number;
  internalUserId: string;
  now?: number;
  objectId?: string;
};

export function buildProductImagePath({
  extension,
  index,
  internalUserId,
  now = Date.now(),
  objectId = crypto.randomUUID(),
}: ProductImagePathOptions): string {
  if (!UUID.test(internalUserId)) {
    throw new Error('Invalid upload owner');
  }
  if (!SAFE_EXTENSION.test(extension)) {
    throw new Error('Invalid image extension');
  }

  return `${internalUserId}/web-${now}-${index}-${objectId}.${extension}`;
}
