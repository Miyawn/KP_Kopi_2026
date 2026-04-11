alter table public.orders
  add column if not exists manual_payment_proof_bucket text,
  add column if not exists manual_payment_proof_path text,
  add column if not exists payment_reviewed_at timestamptz,
  add column if not exists payment_reviewed_by uuid,
  add column if not exists payment_reviewed_by_email text,
  add column if not exists payment_rejection_reason text,
  add column if not exists cancel_reason text;

create index if not exists orders_status_idx
  on public.orders (status);

create index if not exists orders_payment_last_status_idx
  on public.orders (payment_last_status);

create table if not exists public.order_status_logs (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  previous_status text,
  next_status text,
  previous_payment_status text,
  next_payment_status text,
  reason text,
  actor_id uuid,
  actor_email text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_logs_order_id_idx
  on public.order_status_logs (order_id, created_at desc);

create or replace function public.log_order_status_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reason text;
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_logs (
      order_id,
      previous_status,
      next_status,
      previous_payment_status,
      next_payment_status,
      reason,
      actor_id,
      actor_email
    )
    values (
      new.id,
      null,
      new.status,
      null,
      new.payment_last_status,
      null,
      null,
      null
    );

    return new;
  end if;

  if coalesce(old.status, '') = coalesce(new.status, '')
    and coalesce(old.payment_last_status, '') = coalesce(new.payment_last_status, '')
    and coalesce(old.payment_rejection_reason, '') = coalesce(new.payment_rejection_reason, '')
    and coalesce(old.cancel_reason, '') = coalesce(new.cancel_reason, '') then
    return new;
  end if;

  v_reason := case
    when new.status = 'cancelled' then new.cancel_reason
    when new.payment_last_status = 'rejected' then new.payment_rejection_reason
    else null
  end;

  insert into public.order_status_logs (
    order_id,
    previous_status,
    next_status,
    previous_payment_status,
    next_payment_status,
    reason,
    actor_id,
    actor_email
  )
  values (
    new.id,
    old.status,
    new.status,
    old.payment_last_status,
    new.payment_last_status,
    v_reason,
    new.payment_reviewed_by,
    new.payment_reviewed_by_email
  );

  return new;
end;
$$;

drop trigger if exists orders_status_log_trigger on public.orders;

create trigger orders_status_log_trigger
after insert or update of status, payment_last_status, payment_rejection_reason, cancel_reason
on public.orders
for each row
execute function public.log_order_status_changes();

create or replace function public.create_order_with_items_secure(
  p_table text,
  p_customer_name text,
  p_customer_phone text,
  p_order_type text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_total numeric := 0;
  v_item record;
  v_product record;
begin
  if p_customer_name is null or btrim(p_customer_name) = '' then
    raise exception 'Nama pemesan wajib diisi.';
  end if;

  if p_customer_phone is null or btrim(p_customer_phone) = '' then
    raise exception 'Nomor customer wajib diisi.';
  end if;

  if p_order_type is null or btrim(p_order_type) = '' then
    raise exception 'Tipe order wajib diisi.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Item pesanan wajib diisi.';
  end if;

  for v_item in
    select
      (item->>'id')::uuid as product_id,
      sum((item->>'quantity')::int)::int as quantity
    from jsonb_array_elements(p_items) as item
    group by 1
  loop
    if v_item.product_id is null or v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'Ada item pesanan yang tidak valid.';
    end if;

    select id, name, price, stock, is_available
    into v_product
    from public.products
    where id = v_item.product_id
    for update;

    if not found then
      raise exception 'Produk tidak ditemukan.';
    end if;

    if coalesce(v_product.is_available, true) = false then
      raise exception 'Produk % sedang tidak tersedia.', v_product.name;
    end if;

    if coalesce(v_product.stock, 0) < v_item.quantity then
      raise exception 'Stok % tidak cukup.', v_product.name;
    end if;

    v_total := v_total + (coalesce(v_product.price, 0) * v_item.quantity);
  end loop;

  insert into public.orders (
    customer_name,
    customer_phone,
    table_number,
    order_type,
    total_amount,
    status
  )
  values (
    btrim(p_customer_name),
    btrim(p_customer_phone),
    nullif(btrim(coalesce(p_table, '')), ''),
    lower(btrim(p_order_type)),
    v_total,
    'pending'
  )
  returning id into v_order_id;

  for v_item in
    select
      (item->>'id')::uuid as product_id,
      sum((item->>'quantity')::int)::int as quantity
    from jsonb_array_elements(p_items) as item
    group by 1
  loop
    select id, price
    into v_product
    from public.products
    where id = v_item.product_id;

    insert into public.order_items (
      order_id,
      product_id,
      quantity,
      price
    )
    values (
      v_order_id,
      v_item.product_id,
      v_item.quantity,
      v_product.price
    );

    update public.products
    set stock = greatest(coalesce(stock, 0) - v_item.quantity, 0)
    where id = v_item.product_id;
  end loop;

  return v_order_id;
end;
$$;

grant execute on function public.create_order_with_items_secure(text, text, text, text, jsonb)
to anon, authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'manual-payment-proofs',
  'manual-payment-proofs',
  true,
  1048576,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
