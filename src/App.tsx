import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import {
  COMPLETE_OPTIONS,
  customizationPrice,
  customizationSummary,
  defaultCustomization,
  displayProductName,
  isCustomizableProduct,
  normalizeCustomization,
} from "./customization";
import type { CartItem, Catalog, Order, Product } from "./types";

const money = (n: number) => `$${n.toLocaleString("es-CL")}`;

const lineId = (productId: string, options: string[]) =>
  `${productId}:${normalizeCustomization(options).sort().join("|")}`;

export default function App() {
  const [catalog, setCatalog] = useState<Catalog>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [fulfillment, setFulfillment] = useState("retiro");
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "", notes: "" });
  const [customizing, setCustomizing] = useState<Product>();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [order, setOrder] = useState<Order>();
  const [error, setError] = useState("");
  const [whatsappNotice, setWhatsappNotice] = useState(false);

  useEffect(() => {
    api.catalog().then(setCatalog).catch((e) => setError(e.message));
  }, []);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPriceClp * item.quantity, 0),
    [cart],
  );

  const addLine = (product: Product, options: string[]) => {
    const normalized = normalizeCustomization(options);
    const id = lineId(product.id, normalized);
    const unitPriceClp = product.priceClp + customizationPrice(normalized);

    setCart((items) => {
      const existing = items.find((item) => item.lineId === id);
      if (existing) {
        return items.map((item) =>
          item.lineId === id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...items, { lineId: id, product, quantity: 1, options: normalized, unitPriceClp }];
    });
  };

  const add = (product: Product) => {
    if (product.customizable ?? isCustomizableProduct(product)) {
      setCustomizing(product);
      setSelectedOptions(defaultCustomization());
      return;
    }
    addLine(product, []);
  };

  const change = (id: string, delta: number) => {
    setCart((items) =>
      items
        .map((item) => (item.lineId === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const confirmCustomization = () => {
    if (!customizing) return;
    addLine(customizing, selectedOptions);
    setCustomizing(undefined);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      const created = await api.createOrder({
        ...customer,
        fulfillment,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          options: item.options,
        })),
      });
      setOrder(created);
      setCart([]);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!catalog) return <main className="loading">{error || "Cargando menú…"}</main>;

  if (order) {
    const notify = () => setWhatsappNotice(true);

    return (
      <main className="success">
        <div className="check">✓</div>
        <p className="eyebrow">PEDIDO RECIBIDO</p>
        <h1>¡Gracias, {order.customerName}!</h1>
        <p>
          Tu pedido quedó registrado con el código <b>{order.orderCode}</b>.
        </p>
        <section className="order-card">
          <span>Estado</span>
          <b>Recibido</b>
          <span>Total</span>
          <b>{money(order.totalClp)}</b>
          <span>Modalidad</span>
          <b>{order.fulfillment === "retiro" ? "Retiro en local" : "Despacho"}</b>
        </section>
        <section className="success-items">
          <h2>Detalle del pedido</h2>
          {order.items.map((item, index) => (
            <div className="success-item" key={`${item.name}-${index}`}>
              <span>
                {item.quantity}× {item.name}
              </span>
              <b>{money(item.priceClp * item.quantity)}</b>
            </div>
          ))}
        </section>
        <div className="success-actions">
          <button className="primary whatsapp" onClick={notify}>
            Avisar pedido por WhatsApp
          </button>
          <button onClick={() => setOrder(undefined)}>Hacer otro pedido</button>
        </div>
        {whatsappNotice && (
          <div className="whatsapp-demo-notice" role="status">
            <strong>Así funciona esta demo</strong>
            <p>
              El cliente, al apretar este botón, avisa a la persona encargada de ver WhatsApp. Al mismo tiempo,
              el panel administrativo se actualiza de inmediato con el pedido, sus comentarios o ingredientes.
            </p>
            <button onClick={() => setWhatsappNotice(false)}>Entendido</button>
          </div>
        )}
      </main>
    );
  }

  return (
    <div className="app">
      <header>
        <div className="brand">{catalog.business.businessName.slice(0, 2).toUpperCase()}</div>
        <div>
          <h2>{catalog.business.businessName}</h2>
          <p>{catalog.business.location}</p>
        </div>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">PEDIDOS ONLINE</p>
          <h1>Tu comida, lista cuando quieras.</h1>
          <p>Elige tus productos, arma tu pedido y selecciona retiro o despacho.</p>
        </section>

        <div className="layout">
          <section>
            <h2>Menú</h2>
            <div className="products">
              {catalog.products
                .filter((product) => product.active)
                .map((product) => {
                  const customizable = product.customizable ?? isCustomizableProduct(product);
                  return (
                    <article className="product" key={product.id}>
                      <div>
                        <small>{product.category}</small>
                        <h3>{displayProductName(product)}</h3>
                        <p>{product.description}</p>
                        {customizable && (
                          <span className="customization-hint">
                            Ingredientes a elección · extras con costo adicional
                          </span>
                        )}
                      </div>
                      <div className="product-action">
                        <b>{money(product.priceClp)}</b>
                        <button onClick={() => add(product)}>
                          {customizable ? "Personaliza tu completo" : "Agregar"}
                        </button>
                      </div>
                    </article>
                  );
                })}
            </div>
          </section>

          <aside className="cart">
            <h2>Tu pedido</h2>
            {cart.length === 0 ? (
              <p className="muted">Todavía no agregas productos.</p>
            ) : (
              <>
                {cart.map((item) => (
                  <div className="cart-line" key={item.lineId}>
                    <span>
                      <strong>
                        {item.quantity}× {displayProductName(item.product)}
                      </strong>
                      <small>
                        {(item.product.customizable ?? isCustomizableProduct(item.product))
                          ? customizationSummary(item.options)
                          : money(item.unitPriceClp)}
                      </small>
                      {(item.product.customizable ?? isCustomizableProduct(item.product)) && (
                        <small>{money(item.unitPriceClp)} c/u</small>
                      )}
                    </span>
                    <div>
                      <button onClick={() => change(item.lineId, -1)} aria-label="Quitar uno">
                        −
                      </button>
                      <b>{item.quantity}</b>
                      <button onClick={() => change(item.lineId, 1)} aria-label="Agregar uno">
                        +
                      </button>
                    </div>
                  </div>
                ))}
                <div className="total">
                  <span>Total</span>
                  <b>{money(total)}</b>
                </div>
                <form onSubmit={submit}>
                  <label>
                    Nombre
                    <input
                      required
                      value={customer.name}
                      onChange={(event) => setCustomer({ ...customer, name: event.target.value })}
                    />
                  </label>
                  <label>
                    Teléfono
                    <input
                      required
                      value={customer.phone}
                      onChange={(event) => setCustomer({ ...customer, phone: event.target.value })}
                    />
                  </label>
                  <label>
                    Modalidad
                    <select value={fulfillment} onChange={(event) => setFulfillment(event.target.value)}>
                      <option value="retiro">Retiro en local</option>
                      <option value="despacho">Despacho</option>
                    </select>
                  </label>
                  {fulfillment === "despacho" && (
                    <label>
                      Dirección
                      <input
                        required
                        value={customer.address}
                        onChange={(event) => setCustomer({ ...customer, address: event.target.value })}
                      />
                    </label>
                  )}
                  <label>
                    Notas (opcional)
                    <textarea
                      value={customer.notes}
                      onChange={(event) => setCustomer({ ...customer, notes: event.target.value })}
                    />
                  </label>
                  {error && <p className="error">{error}</p>}
                  <button className="primary">Confirmar pedido · {money(total)}</button>
                </form>
              </>
            )}
          </aside>
        </div>
      </main>

      {customizing && (
        <div className="modal-backdrop" onMouseDown={() => setCustomizing(undefined)}>
          <section
            className="customization-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customization-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">PERSONALIZA TU PEDIDO</p>
                <h2 id="customization-title">Personaliza tu completo</h2>
                <p>Elige qué ingredientes quieres incluir. Puedes quitar los que no prefieras.</p>
              </div>
              <button className="close-button" onClick={() => setCustomizing(undefined)} aria-label="Cerrar">
                ×
              </button>
            </div>

            <fieldset>
              <legend>Ingredientes</legend>
              <div className="option-grid">
                {COMPLETE_OPTIONS.filter((option) => option.group === "ingredient").map((option) => (
                  <label className="option-card" key={option.id}>
                    <input
                      type="checkbox"
                      checked={selectedOptions.includes(option.id)}
                      onChange={() =>
                        setSelectedOptions((current) =>
                          current.includes(option.id)
                            ? current.filter((id) => id !== option.id)
                            : [...current, option.id],
                        )
                      }
                    />
                    <span>{option.label}</span>
                    <b>{option.priceClp ? `+${money(option.priceClp)}` : "Incluido"}</b>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Extras</legend>
              <div className="option-grid">
                {COMPLETE_OPTIONS.filter((option) => option.group === "extra").map((option) => (
                  <label className="option-card" key={option.id}>
                    <input
                      type="checkbox"
                      checked={selectedOptions.includes(option.id)}
                      onChange={() =>
                        setSelectedOptions((current) =>
                          current.includes(option.id)
                            ? current.filter((id) => id !== option.id)
                            : [...current, option.id],
                        )
                      }
                    />
                    <span>{option.label}</span>
                    <b>+{money(option.priceClp)}</b>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="customization-summary">
              <span>{customizationSummary(selectedOptions)}</span>
              <b>{money(customizing.priceClp + customizationPrice(selectedOptions))}</b>
            </div>
            <div className="modal-actions">
              <button onClick={() => setCustomizing(undefined)}>Cancelar</button>
              <button className="primary" onClick={confirmCustomization}>
                Agregar al pedido
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
