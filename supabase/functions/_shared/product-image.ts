export const PRODUCT_IMAGE_BUCKET = "product-images"

const PRODUCT_IMAGE_FOLDER = "products/"
const PUBLIC_URL_PREFIXES = [
  `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`,
  `/object/public/${PRODUCT_IMAGE_BUCKET}/`,
]

export const extractManagedProductImagePath = (value: string | null | undefined) => {
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

    if (!normalizedPath.startsWith(PRODUCT_IMAGE_FOLDER)) {
      return null
    }

    return normalizedPath
  } catch {
    return null
  }
}
