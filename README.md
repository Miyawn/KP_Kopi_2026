# KP Kopi Web Ordering

Project ini adalah aplikasi pemesanan kopi berbasis React + Supabase dengan alur pembayaran manual.

## Stack

- React 19 + Vite
- Supabase Database
- Supabase Edge Functions
- Tailwind CSS

## Flow yang Dipakai

1. Customer checkout dari web.
2. Backend membuat order melalui Edge Function `create-order`.
3. Customer membuka `payment` page untuk QRIS manual, transfer manual, atau bayar di kasir.
4. Customer mengirim bukti pembayaran manual melalui Edge Function `submit-manual-payment`.
5. Admin memverifikasi pembayaran dari dashboard melalui Edge Function `review-manual-payment`.
6. Kitchen dan admin mengubah status order melalui backend admin function.

## Catatan Arsitektur

- Project ini tidak lagi memakai Midtrans sebagai flow utama.
- Data order customer diakses menggunakan `customer_access_token` yang disimpan lokal di browser customer.
- Operasi admin sensitif dipindahkan ke Edge Function dan divalidasi dengan allowlist email admin.

## Environment Frontend

Lihat [.env.example](./.env.example).

Variable penting:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_ALLOWED_EMAILS`
- `VITE_MANUAL_QRIS_MERCHANT_NAME`
- `VITE_MANUAL_QRIS_IMAGE_URL`
- `VITE_MANUAL_BANK_NAME`
- `VITE_MANUAL_BANK_ACCOUNT_NUMBER`
- `VITE_MANUAL_BANK_ACCOUNT_NAME`

## Environment Edge Functions

Lihat [supabase/functions/.env.example](./supabase/functions/.env.example).

Variable penting:

- `ADMIN_ALLOWED_EMAILS`

## Command

```bash
npm install
npm run dev
npm run build
npm run lint
```

Deploy function yang dipakai:

```bash
npm run supabase:functions:deploy:create-order
npm run supabase:functions:deploy:get-customer-orders
npm run supabase:functions:deploy:submit-manual-payment
npm run supabase:functions:deploy:review-manual-payment
npm run supabase:functions:deploy:get-admin-dashboard-data
npm run supabase:functions:deploy:admin-update-order-status
npm run supabase:functions:deploy:admin-upsert-product
npm run supabase:functions:deploy:admin-delete-product
```

Apply migration:

```bash
npm run supabase:db:push
```

## Minimum Setup Sebelum Demo

1. Isi `.env` frontend.
2. Isi `supabase/functions/.env` atau Supabase secrets untuk `ADMIN_ALLOWED_EMAILS`.
3. Deploy migration dan Edge Functions.
4. Pastikan ada akun Supabase Auth yang email-nya masuk allowlist admin.
