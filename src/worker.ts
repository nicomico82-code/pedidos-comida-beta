import { createPublicApp } from "./server";

const app = createPublicApp();

export default {
  fetch: app.fetch.bind(app),
};
