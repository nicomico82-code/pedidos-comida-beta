import type { Catalog, Order } from "./types";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...init.headers } });
  if (!response.ok) throw new Error(((await response.json().catch(() => ({}))) as { message?: string }).message || "No pudimos completar la solicitud.");
  return response.json() as Promise<T>;
}

export const api = {
  catalog: () => request<Catalog>("/api/catalog"),
  createOrder: (data: unknown) => request<Order>("/api/orders", { method: "POST", body: JSON.stringify(data) }),
  adminOrders: () => request<{ data: Order[] }>("/api/admin/orders"),
  adminStatus: (id: string, status: string) => request<{ ok: true }>(`/api/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};
