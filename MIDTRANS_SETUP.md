# Midtrans Setup

Project ini memakai Midtrans Snap di frontend dan Supabase Edge Functions di backend supaya `MIDTRANS_SERVER_KEY` tidak pernah masuk ke browser.

## 1. Frontend env

Tambahkan variabel berikut ke `.env` lokal:

```env
VITE_MIDTRANS_CLIENT_KEY=your-midtrans-client-key
VITE_MIDTRANS_IS_PRODUCTION=false
```

`VITE_MIDTRANS_IS_PRODUCTION=false` berarti sandbox.

## 2. Database migration

Jalankan migration di [supabase/migrations/20260410_add_midtrans_payment_columns.sql](/c:/KP%20KOPI/KP_Kopi_2026/supabase/migrations/20260410_add_midtrans_payment_columns.sql) untuk menambah kolom tracking pembayaran di tabel `orders`.

## 3. Supabase secrets

Set secret untuk Edge Function:

```bash
supabase secrets set MIDTRANS_SERVER_KEY=your-midtrans-server-key
supabase secrets set MIDTRANS_IS_PRODUCTION=false
```

Supabase menyediakan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` otomatis di Edge Functions.

Untuk local testing function, copy [supabase/functions/.env.example](/c:/KP%20KOPI/KP_Kopi_2026/supabase/functions/.env.example) menjadi `supabase/functions/.env`.

## 4. Deploy Edge Functions

```bash
npm run supabase:functions:deploy:create-midtrans
npm run supabase:functions:deploy:webhook
```

Sebelum itu, login dan link project:

```bash
npm run supabase:login
npm run supabase:link
```

Untuk apply migration ke remote database:

```bash
npm run supabase:db:push
```

## 5. Midtrans dashboard

Set webhook URL di Midtrans ke:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/midtrans-webhook
```

Gunakan URL publik, bukan localhost.

## 6. Flow aplikasi

1. User checkout.
2. Frontend membuka halaman payment.
3. `create-midtrans-transaction` membuat atau mengambil ulang Snap token dari order.
4. Frontend membuka `window.snap.pay(token)`.
5. Midtrans mengirim webhook ke `midtrans-webhook`.
6. Webhook mengubah `orders.status` menjadi `paid`, `pending`, `expired`, atau `cancelled`.
7. Halaman `Orders` membaca status terbaru dari Supabase realtime.

## 7. Catatan penting

- Jangan simpan `MIDTRANS_SERVER_KEY` di `.env` frontend.
- Untuk production, ubah `VITE_MIDTRANS_IS_PRODUCTION=true` dan `MIDTRANS_IS_PRODUCTION=true`.
- Jika ingin redirect setelah pembayaran tertentu, bisa memanfaatkan `redirect_url` dari respons transaksi atau atur callback di dashboard Midtrans.
- Untuk demo sementara tanpa Midtrans, gunakan `VITE_ENABLE_DUMMY_PAYMENT=true`. Tombol payment page akan menjalankan simulasi pembayaran dan mengubah status order menjadi `paid`.
