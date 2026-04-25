drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = 'products'
);

drop policy if exists product_images_admin_upload on storage.objects;
create policy product_images_admin_upload
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = 'products'
);

drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = 'products'
)
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = 'products'
);

drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = 'products'
);
