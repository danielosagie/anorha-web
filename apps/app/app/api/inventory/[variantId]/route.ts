import { getServerSupabaseClient } from '@/lib/supabase/server';
import { currentUser } from '@repo/auth/server';

type InventoryUpdate = {
  title?: unknown;
  sku?: unknown;
  price?: unknown;
};

type UpdatedVariant = {
  Id: string;
  Title: string | null;
  Sku: string | null;
  Price: number | null;
};

type InventoryQuery = {
  eq: (column: string, value: string) => InventoryQuery;
  select: (columns: string) => {
    maybeSingle: () => Promise<{
      data: UpdatedVariant | null;
      error: unknown;
    }>;
  };
};

type InventoryTable = {
  update: (values: Record<string, string | number | null>) => InventoryQuery;
};

function buildUpdate(body: InventoryUpdate) {
  const update: Record<string, string | number | null> = {};

  if ('title' in body) {
    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      throw new Error('Product name cannot be empty');
    }
    update.Title = body.title.trim().slice(0, 300);
  }

  if ('sku' in body) {
    if (typeof body.sku !== 'string') {
      throw new Error('SKU must be text');
    }
    update.Sku = body.sku.trim().slice(0, 120) || null;
  }

  if ('price' in body) {
    if (
      typeof body.price !== 'number' ||
      !Number.isFinite(body.price) ||
      body.price < 0
    ) {
      throw new Error('Price must be zero or greater');
    }
    update.Price = Math.round(body.price * 100) / 100;
  }

  if (Object.keys(update).length === 0) {
    throw new Error('No editable fields supplied');
  }

  return update;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ variantId: string }> }
) {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { variantId } = await params;
  let body: InventoryUpdate;
  try {
    body = (await request.json()) as InventoryUpdate;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  let update: Record<string, string | number | null>;
  try {
    update = buildUpdate(body);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Invalid update' },
      { status: 400 }
    );
  }

  const supabase = await getServerSupabaseClient();
  const inventoryTable = supabase.from(
    'ProductVariants'
  ) as unknown as InventoryTable;
  const { data, error } = await inventoryTable
    .update(update)
    .eq('Id', variantId)
    .eq('UserId', user.id)
    .select('Id, Title, Sku, Price')
    .maybeSingle();

  if (error) {
    return Response.json({ error: 'Could not save product' }, { status: 500 });
  }

  if (!data) {
    return Response.json({ error: 'Product not found' }, { status: 404 });
  }

  return Response.json({
    item: {
      id: data.Id,
      title: data.Title,
      sku: data.Sku,
      price: data.Price,
    },
  });
}
