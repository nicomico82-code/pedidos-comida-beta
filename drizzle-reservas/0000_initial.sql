CREATE TABLE business_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL DEFAULT 0);
INSERT INTO business_settings (key,value) VALUES ('business_name','Tu Negocio'),('location','Tu ciudad'),('whatsapp','');
CREATE TABLE products (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', category TEXT NOT NULL, price_clp INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1, display_order INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL DEFAULT 0);
INSERT INTO products (id,name,description,category,price_clp,display_order) VALUES
('prod-1','Producto 1','Descripción editable del producto.','Platos',5990,1),
('prod-2','Producto 2','Descripción editable del producto.','Platos',7990,2),
('prod-3','Producto 3','Descripción editable del producto.','Combos',9990,3),
('prod-4','Producto 4','Descripción editable del producto.','Bebidas',1990,4),
('prod-5','Producto 5','Descripción editable del producto.','Postres',2990,5);
CREATE TABLE orders (id TEXT PRIMARY KEY, order_code TEXT NOT NULL UNIQUE, status TEXT NOT NULL, customer_name TEXT NOT NULL, phone TEXT NOT NULL, fulfillment TEXT NOT NULL, address TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', total_clp INTEGER NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL DEFAULT 0);
CREATE TABLE order_items (id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id), product_id TEXT NOT NULL, product_name TEXT NOT NULL, quantity INTEGER NOT NULL, unit_price_clp INTEGER NOT NULL);
CREATE INDEX orders_created_idx ON orders(created_at DESC);
CREATE INDEX order_items_order_idx ON order_items(order_id);
