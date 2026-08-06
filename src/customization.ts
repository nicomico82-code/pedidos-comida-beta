export type CustomizationGroup = "ingredient" | "extra";

export type CustomizationOption = {
  id: string;
  label: string;
  priceClp: number;
  group: CustomizationGroup;
  defaultSelected?: boolean;
};

/** Opciones de ejemplo para demostrar un completo configurable. */
export const COMPLETE_OPTIONS: readonly CustomizationOption[] = [
  { id: "tomate", label: "Tomate", priceClp: 0, group: "ingredient", defaultSelected: true },
  { id: "palta", label: "Palta", priceClp: 0, group: "ingredient", defaultSelected: true },
  { id: "mayo", label: "Mayo", priceClp: 0, group: "ingredient", defaultSelected: true },
  { id: "chucrut", label: "Chucrut", priceClp: 0, group: "ingredient" },
  { id: "queso-extra", label: "Queso extra", priceClp: 500, group: "extra" },
  { id: "vienesa-extra", label: "Vienesa extra", priceClp: 700, group: "extra" },
  { id: "tocino", label: "Tocino", priceClp: 800, group: "extra" },
];

const optionById = new Map(COMPLETE_OPTIONS.map((option) => [option.id, option]));

export const defaultCustomization = () =>
  COMPLETE_OPTIONS.filter((option) => option.defaultSelected).map((option) => option.id);

export function isCustomizableProduct(product: { id: string; name: string; category?: string }) {
  const searchable = `${product.id} ${product.name} ${product.category ?? ""}`.toLowerCase();
  return product.id === "prod-1" || /completo|hot\s*dog|italiano/.test(searchable);
}

export function displayProductName(product: { id: string; name: string }) {
  const demoNames: Record<string, string> = {
    "prod-1": "Completo italiano",
    "prod-2": "Churrasco italiano",
    "prod-3": "Combo completo",
    "prod-4": "Bebida lata",
    "prod-5": "Brownie con helado",
  };
  if (/^producto\s*\d+$/i.test(product.name.trim()) && demoNames[product.id]) return demoNames[product.id];
  return product.name;
}

export function normalizeCustomization(ids: unknown) {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.filter((id): id is string => typeof id === "string" && optionById.has(id)))];
}

export function customizationPrice(ids: string[]) {
  return normalizeCustomization(ids).reduce((sum, id) => sum + (optionById.get(id)?.priceClp ?? 0), 0);
}

export function customizationSummary(ids: string[]) {
  const selected = new Set(normalizeCustomization(ids));
  const ingredients = COMPLETE_OPTIONS.filter((option) => option.group === "ingredient")
    .map((option) => (selected.has(option.id) ? option.label : `Sin ${option.label.toLowerCase()}`));
  const extras = COMPLETE_OPTIONS.filter((option) => option.group === "extra" && selected.has(option.id))
    .map((option) => `${option.label}${option.priceClp ? ` (+$${option.priceClp.toLocaleString("es-CL")})` : ""}`);

  return `Ingredientes: ${ingredients.join(", ")}${extras.length ? ` · Extras: ${extras.join(", ")}` : " · Extras: ninguno"}`;
}

export function formatOrderItemName(product: { id: string; name: string }, options: string[]) {
  if (!isCustomizableProduct(product)) return displayProductName(product);
  return `${displayProductName(product)} · ${customizationSummary(options)}`;
}

export function optionDetails(ids: string[]) {
  return normalizeCustomization(ids)
    .map((id) => optionById.get(id))
    .filter((option): option is CustomizationOption => Boolean(option));
}
