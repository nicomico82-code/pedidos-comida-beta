export type Product = { id: string; name: string; description: string; category: string; priceClp: number; active: boolean; customizable?: boolean };
export type Catalog = { business: { businessName: string; location: string; whatsapp: string }; products: Product[] };
export type CartItem = { lineId: string; product: Product; quantity: number; options: string[]; unitPriceClp: number };
export type Order = { id: string; orderCode: string; status: string; totalClp: number; customerName: string; phone?: string; address?: string; notes?: string; fulfillment: string; createdAt: number; items: Array<{ name: string; quantity: number; priceClp: number; options?: string[] }> };
