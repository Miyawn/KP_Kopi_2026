alter table public.orders
  add column if not exists payment_provider text,
  add column if not exists payment_reference text,
  add column if not exists payment_token text,
  add column if not exists payment_redirect_url text,
  add column if not exists payment_last_status text,
  add column if not exists payment_type text,
  add column if not exists payment_transaction_id text,
  add column if not exists payment_payload jsonb,
  add column if not exists paid_at timestamptz;

create index if not exists orders_payment_reference_idx
  on public.orders (payment_reference);
