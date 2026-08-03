import { Hono } from "hono";
import {
  customizationPrice,
  displayProductName,
  formatOrderItemName,
  isCustomizableProduct,
  normalizeCustomization,
} from "./customization";

export type Env = {
  Bindings: {
    DB: D1Database;
    ASSETS: Fetcher;
    APP_NAME?: string;
    BUSINESS_LOCATION?: string;
  };
};

const json = (c: any, body: unknown, status = 200) => c.json(body, status);
const code = () => `PED-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const assets = async (c: any) => c.env.ASSETS.fetch(c.req.raw);

async function settings(env: Env["Bindings"]) {
  const rows = await env.DB.prepare("SELECT key,value FROM business_settings").all<{
    key: string;
    value: string;
  }>();
  const values = Object.fromEntries(rows.results.map((row) => [row.key, row.value]));
  return {
    businessName: values.business_name || env.APP_NAME || "Tu Negocio",
    location: values.location || env.BUSINESS_LOCATION || "Tu ciudad",
    whatsapp: values.whatsapp || "",
  };
}

type IncomingItem = { productId: string; quantity: number; options?: unknown };

export function createPublicApp() {
  const app = new Hono<Env>();

  app.get("/api/catalog", async (c) => {
    const [business, products] = await Promise.all([
      settings(c.env),
      c.env.DB.prepare(
        "SELECT id,name,description,category,price_clp,active FROM products ORDER BY category,display_order",
      ).all(),
    ]);

    return json(c, {
      business,
      products: products.results.map((raw: any) => ({
        id: raw.id,
        name: displayProductName(raw),
        description: raw.description,
        category: raw.category,
        priceClp: raw.price_clp,
        active: Boolean(raw.active),
        customizable: isCustomizableProduct(raw),
      })),
    });
  });

  app.post("/api/orders", async (c) => {
    const input = await c.req.json<{
      name?: string;
      phone?: string;
      address?: string;
      notes?: string;
      fulfillment?: string;
      items?: IncomingItem[];
    }>();

    if (!input.name?.trim() || !input.phone?.trim() || !input.items?.length) {
      return json(c, { message: "Completa tus datos y agrega al menos un producto." }, 400);
    }
    if (input.fulfillment === "despacho" && !input.address?.trim()) {
      return json(c, { message: "Ingresa una dirección para el despacho." }, 400);
    }

    const ids = [...new Set(input.items.map((item) => item.productId).filter(Boolean))];
    if (!ids.length) return json(c, { message: "El pedido no contiene productos válidos." }, 400);

    const placeholders = ids.map(() => "?").join(",");
    const rows = await c.env.DB.prepare(
      `SELECT id,name,description,category,price_clp FROM products WHERE active = 1 AND id IN (${placeholders})`,
    )
      .bind(...ids)
      .all<any>();
    const byId = new Map(rows.results.map((row: any) => [row.id, row]));

    const items: Array<{
      product: any;
      quantity: number;
      options: string[];
      linePriceClp: number;
      name: string;
    }> = [];
    let total = 0;

    for (const incoming of input.items) {
      const product = byId.get(incoming.productId);
      const quantity = Number(incoming.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1) {
        return json(c, { message: "Uno de los productos del pedido no es válido." }, 400);
      }

      const safeQuantity = Math.min(quantity, 50);
      const options = isCustomizableProduct(product) ? normalizeCustomization(incoming.options) : [];
      const linePriceClp = product.price_clp + customizationPrice(options);
      const name = formatOrderItemName(product, options);
      total += linePriceClp * safeQuantity;
      items.push({ product, quantity: safeQuantity, options, linePriceClp, name });
    }

    const id = crypto.randomUUID();
    const orderCode = code();
    const now = Date.now();
    const fulfillment = input.fulfillment === "despacho" ? "despacho" : "retiro";

    await c.env.DB.prepare(
      "INSERT INTO orders (id,order_code,status,customer_name,phone,fulfillment,address,notes,total_clp,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
    )
      .bind(
        id,
        orderCode,
        "received",
        input.name.trim(),
        input.phone.trim(),
        fulfillment,
        input.address?.trim() || "",
        input.notes?.trim() || "",
        total,
        now,
      )
      .run();

    for (const item of items) {
      await c.env.DB.prepare(
        "INSERT INTO order_items (id,order_id,product_id,product_name,quantity,unit_price_clp) VALUES (?,?,?,?,?,?)",
      )
        .bind(
          crypto.randomUUID(),
          id,
          item.product.id,
          item.name,
          item.quantity,
          item.linePriceClp,
        )
        .run();
    }

    return json(
      c,
      {
        id,
        orderCode,
        status: "received",
        totalClp: total,
        customerName: input.name.trim(),
        fulfillment,
        createdAt: now,
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          priceClp: item.linePriceClp,
          options: item.options,
        })),
      },
      201,
    );
  });

  app.get("/api/health", (c) => json(c, { status: "ok", service: "pedidos-comida-beta" }));
  app.all("*", assets);
  return app;
}

export function createAdminApp() {
  const app = new Hono<Env>();

  app.get("/api/admin/orders", async (c) => {
    const orders = await c.env.DB.prepare(
      "SELECT id,order_code,status,total_clp,customer_name,phone,address,notes,fulfillment,created_at FROM orders ORDER BY created_at DESC LIMIT 100",
    ).all<any>();
    const data = [];

    for (const order of orders.results) {
      const items = await c.env.DB.prepare(
        "SELECT product_name name,quantity,unit_price_clp priceClp FROM order_items WHERE order_id = ?",
      )
        .bind(order.id)
        .all<any>();
      data.push({
        id: order.id,
        orderCode: order.order_code,
        status: order.status,
        totalClp: order.total_clp,
        customerName: order.customer_name,
        phone: order.phone,
        address: order.address,
        notes: order.notes,
        fulfillment: order.fulfillment,
        createdAt: order.created_at,
        items: items.results,
      });
    }

    return json(c, { data });
  });

  app.patch("/api/admin/orders/:id/status", async (c) => {
    const { status } = await c.req.json<{ status: string }>();
    if (!["received", "preparing", "ready", "delivered", "cancelled"].includes(status)) {
      return json(c, { message: "Estado inválido." }, 400);
    }
    await c.env.DB.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?")
      .bind(status, Date.now(), c.req.param("id"))
      .run();
    return json(c, { ok: true });
  });

  app.get("/api/health", (c) => json(c, { status: "ok", service: "pedidos-comida-admin-beta" }));
  app.all("*", assets);
  return app;
}
