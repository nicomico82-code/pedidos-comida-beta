export type Product = { id: string; name: string; description: string; category: string; priceClp: number; active: boolean };
export type Catalog = { business: { businessName: string; location: string; whatsapp: string }; products: Product[] };
export type CartItem = { product: Product; quantity: number };
export type Order = { id: string; orderCode: string; status: string; totalClp: number; customerName: string; fulfillment: string; createdAt: number; items: Array<{ name: string; quantity: number; priceClp: number }> };
