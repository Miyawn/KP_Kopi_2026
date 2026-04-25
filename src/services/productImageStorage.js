import { supabase } from "../lib/supabase"

export const PRODUCT_IMAGE_BUCKET = "product-images"
export const MAX_PRODUCT_IMAGE_SIZE = 2 * 1024 * 1024
export const ACCEPTED_PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
export const PRODUCT_IMAGE_ACCEPT = ACCEPTED_PRODUCT_IMAGE_TYPES.join(",")

const PUBLIC_URL_PREFIXES = [
  `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`,
  `/object/public/${PRODUCT_IMAGE_BUCKET}/`,
]

export const isAllowedProductImageType = (file) =>
  ACCEPTED_PRODUCT_IMAGE_TYPES.includes(file?.type || "")

export const extractProductImagePath = (value) => {
  const normalizedValue = value?.trim()

  if (!normalizedValue) {
    return null
  }

  try {
    const pathname = decodeURIComponent(new URL(normalizedValue).pathname)
    const matchedPrefix = PUBLIC_URL_PREFIXES.find((prefix) => pathname.includes(prefix))

    if (!matchedPrefix) {
      return null
    }

    const [, rawPath = ""] = pathname.split(matchedPrefix)
    const normalizedPath = rawPath.replace(/^\/+/, "")

    return normalizedPath.startsWith("products/") ? normalizedPath : null
  } catch {
    return null
  }
}

export const uploadProductImage = async (file) => {
  const rawExtension = file.name?.split(".").pop()?.toLowerCase()
  const extension = rawExtension || (file.type?.split("/")?.[1] ?? "jpg")
  const uniqueFileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`
  const filePath = `products/${uniqueFileName}`

  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  })

  if (error) {
    throw new Error(error.message || "Gagal upload gambar produk.")
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(filePath)
  return data.publicUrl || ""
}

export const deleteProductImageByUrl = async (value) => {
  const filePath = extractProductImagePath(value)

  if (!filePath) {
    return
  }

  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([filePath])

  if (error) {
    throw new Error(error.message || "Gagal menghapus gambar produk.")
  }
}
