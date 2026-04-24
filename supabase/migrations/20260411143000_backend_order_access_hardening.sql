alter table public.orders
  add column if not exists customer_access_token text;

update public.orders
set customer_access_token = coalesce(customer_access_token, replace(gen_random_uuid()::text, '-', ''))
where customer_access_token is null;

alter table public.orders
  alter column customer_access_token set default replace(gen_random_uuid()::text, '-', ''),
  alter column customer_access_token set not null;

create unique index if not exists orders_customer_access_token_idx
  on public.orders (customer_access_token);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_logs enable row level security;

drop policy if exists products_public_read on public.products;
create policy products_public_read
on public.products
for select
to anon, authenticated
using (coalesce(is_available, true) = true);
