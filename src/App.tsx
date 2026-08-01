import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import type { CartItem, Catalog, Order, Product } from "./types";

const money = (n: number) => `$${n.toLocaleString("es-CL")}`;

export default function App() {
  const [catalog, setCatalog] = useState<Catalog>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [fulfillment, setFulfillment] = useState("retiro");
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "", notes: "" });
  const [order, setOrder] = useState<Order>();
  const [error, setError] = useState("");
  useEffect(() => { api.catalog().then(setCatalog).catch((e) => setError(e.message)); }, []);
  const total = useMemo(() => cart.reduce((sum, x) => sum + x.product.priceClp * x.quantity, 0), [cart]);
  const add = (product: Product) => setCart((items) => items.some((x) => x.product.id === product.id) ? items.map((x) => x.product.id === product.id ? { ...x, quantity: x.quantity + 1 } : x) : [...items, { product, quantity: 1 }]);
  const change = (id: string, delta: number) => setCart((items) => items.map((x) => x.product.id === id ? { ...x, quantity: x.quantity + delta } : x).filter((x) => x.quantity > 0));
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(""); try { setOrder(await api.createOrder({ ...customer, fulfillment, items: cart.map((x) => ({ productId: x.product.id, quantity: x.quantity })) })); setCart([]); } catch (e) { setError((e as Error).message); } };
  if (!catalog) return <main className="loading">{error || "Cargando menú…"}</main>;
  if (order) return <main className="success"><div className="check">✓</div><p className="eyebrow">PEDIDO RECIBIDO</p><h1>¡Gracias, {order.customerName}!</h1><p>Tu pedido quedó registrado con el código <b>{order.orderCode}</b>.</p><div className="order-card"><span>Estado</span><b>Recibido</b><span>Total</span><b>{money(order.totalClp)}</b><span>Modalidad</span><b>{order.fulfillment === "retiro" ? "Retiro en local" : "Despacho"}</b></div><button onClick={() => setOrder(undefined)}>Hacer otro pedido</button></main>;
  return <div className="app"><header><div className="brand">{catalog.business.businessName.slice(0, 2).toUpperCase()}</div><div><h2>{catalog.business.businessName}</h2><p>{catalog.business.location}</p></div></header><main><section className="hero"><p className="eyebrow">PEDIDOS ONLINE</p><h1>Tu comida, lista cuando quieras.</h1><p>Elige tus productos, arma tu pedido y selecciona retiro o despacho.</p></section><div className="layout"><section><h2>Menú</h2><div className="products">{catalog.products.filter((p) => p.active).map((p) => <article className="product" key={p.id}><div><small>{p.category}</small><h3>{p.name}</h3><p>{p.description}</p></div><div className="product-action"><b>{money(p.priceClp)}</b><button onClick={() => add(p)}>Agregar</button></div></article>)}</div></section><aside className="cart"><h2>Tu pedido</h2>{cart.length === 0 ? <p className="muted">Todavía no agregas productos.</p> : <>{cart.map((x) => <div className="cart-line" key={x.product.id}><span>{x.product.name}<small>{money(x.product.priceClp)}</small></span><div><button onClick={() => change(x.product.id, -1)}>−</button><b>{x.quantity}</b><button onClick={() => change(x.product.id, 1)}>+</button></div></div>)}<div className="total"><span>Total</span><b>{money(total)}</b></div><form onSubmit={submit}><label>Nombre<input required value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })}/></label><label>Teléfono<input required value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}/></label><label>Modalidad<select value={fulfillment} onChange={(e) => setFulfillment(e.target.value)}><option value="retiro">Retiro en local</option><option value="despacho">Despacho</option></select></label>{fulfillment === "despacho" && <label>Dirección<input required value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })}/></label>}<label>Notas (opcional)<textarea value={customer.notes} onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}/></label>{error && <p className="error">{error}</p>}<button className="primary">Confirmar pedido · {money(total)}</button></form></>}</aside></div></main></div>;
}
