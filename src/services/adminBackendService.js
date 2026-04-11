import { invokeAdminFunction } from "./adminFunctionClient"

export const fetchAdminDashboardData = async () => invokeAdminFunction("get-admin-dashboard-data")

export const updateAdminOrderStatus = async ({ orderId, status, reason = "" }) =>
  invokeAdminFunction("admin-update-order-status", {
    orderId,
    status,
    reason,
  })

export const saveAdminProduct = async (payload) =>
  invokeAdminFunction("admin-upsert-product", payload)

export const deleteAdminProduct = async (id) =>
  invokeAdminFunction("admin-delete-product", { id })
