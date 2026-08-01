import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle-reservas",
  dialect: "sqlite",
  strict: true,
  verbose: true,
});
