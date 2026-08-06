import { useEffect, useState } from "react";
import { api } from "./api";
import type { Order } from "./types";

const money = (n: number) => `$${n.toLocaleString("es-CL")}`;
const labels: Record<string, string> = {
  received: "Recibido",
  preparing: "Preparando",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const orderTime = (createdAt: number) =>
  new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(createdAt));

const orderItems = (order: Order) =>
  order.items.map((item) => `${item.quantity} ${item.name}`).join(", ");

const notificationText = (order: Order) => {
  const items = orderItems(order);
  const time = orderTime(order.createdAt);
  const deliveryMessage =
    order.fulfillment === "retiro"
      ? "está listo para retirar en el local"
      : "va en camino";

  return `Hola ${order.customerName}, tu pedido: ${items}, realizado a las ${time} hrs., ${deliveryMessage}.`;
};

export default function AdminApp() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [whatsappPreview, setWhatsappPreview] = useState<{ orderId: string; text: string }>();

  const load = () =>
    api
      .adminOrders()
      .then((r) => {
        setOrders(r.data);
        setError("");
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    void load();
    const refresh = window.setInterval(() => void load(), 3000);
    return () => window.clearInterval(refresh);
  }, []);

  const status = async (id: string, value: string) => {
    try {
      await api.adminStatus(id, value);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos actualizar el pedido.");
    }
  };

  const notifyCustomer = (order: Order) => {
    setWhatsappPreview({ orderId: order.id, text: notificationText(order) });
  };

  const summary = {
    received: orders.filter((order) => order.status === "received").length,
    preparing: orders.filter((order) => order.status === "preparing").length,
    ready: orders.filter((order) => order.status === "ready").length,
  };

  return (
    <main className="admin">
      <header>
        <div className="brand">TS</div>
        <div>
          <p className="eyebrow">PANEL DE PEDIDOS</p>
          <h1>Operación del día</h1>
        </div>
        <span className="admin-live"><i /> Actualización automática</span>
        <button onClick={load}>Actualizar</button>
      </header>

      <section className="admin-summary" aria-label="Resumen de pedidos">
        <article><span>Nuevos</span><strong>{summary.received}</strong></article>
        <article><span>En preparación</span><strong>{summary.preparing}</strong></article>
        <article><span>Listos</span><strong>{summary.ready}</strong></article>
        <article><span>Total del día</span><strong>{orders.length}</strong></article>
      </section>

      {error && <p className="error">{error}</p>}

      {orders.length === 0 ? (
        <section className="empty">
          <h2>No hay pedidos todavía</h2>
          <p>Cuando llegue un pedido aparecerá aquí.</p>
        </section>
      ) : (
        <section className="admin-list">
          {orders.map((order) => (
            <article className="admin-order" data-status={order.status} key={order.id}>
              <div className="admin-order-details">
                <b>{order.orderCode}</b>
                <h2>{order.customerName}</h2>
                <p>{orderItems(order)}</p>
                <small>
                  {order.fulfillment === "retiro" ? "Retiro en local" : "Despacho"} · {money(order.totalClp)}
                </small>
                {order.notes && <p className="admin-note">Comentario: {order.notes}</p>}
                {order.address && order.fulfillment === "despacho" && <p className="admin-note">Dirección: {order.address}</p>}
                {whatsappPreview?.orderId === order.id && (
                  <div className="admin-whatsapp-preview" role="status">
                    <strong>Mensaje que se enviaría por WhatsApp</strong>
                    <p>{whatsappPreview.text}</p>
                    <button onClick={() => setWhatsappPreview(undefined)}>Cerrar vista previa</button>
                  </div>
                )}
              </div>
              <div className="admin-order-actions">
                <select value={order.status} onChange={(e) => status(order.id, e.target.value)}>
                  {Object.entries(labels).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {order.status === "ready" && (
                  <button className="notify-button" onClick={() => notifyCustomer(order)}>
                    Ver mensaje de WhatsApp
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
