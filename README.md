# Pedidos Comida Beta

MVP reusable para negocios de comida: menú, carrito, retiro o despacho y panel operativo de pedidos.

## Desarrollo local

Requiere Docker Desktop con el motor Linux activo.

```bash
docker compose up --build
```

- Cliente: http://localhost:5173
- Panel: http://localhost:5173/admin
- Worker público: http://localhost:8787
- Worker administrativo: http://localhost:8788

La base D1 local se migra con:

```bash
docker compose exec worker npm run db:local
```

## Flujo del MVP

El cliente agrega productos al carrito, elige retiro o despacho, ingresa sus datos y recibe un código de pedido. El panel permite revisar pedidos y cambiar su estado entre recibido, preparando, listo, entregado o cancelado.

Para publicar se debe crear una base D1 propia y configurar los identificadores en los archivos Wrangler. Este repositorio no comparte datos con otras aplicaciones.
