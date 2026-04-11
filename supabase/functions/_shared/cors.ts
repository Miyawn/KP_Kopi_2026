import { ADMIN_ACCESS_TOKEN_HEADER } from "./auth.ts"

const allowedHeaders = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  ADMIN_ACCESS_TOKEN_HEADER,
].join(", ")

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": allowedHeaders,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}
