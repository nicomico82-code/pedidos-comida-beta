import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AdminApp from "./AdminApp";
import "./styles.css";

const hostLabel = location.hostname.split(".")[0];
const isAdmin =
  location.pathname.startsWith("/admin") ||
  hostLabel === "admin" ||
  hostLabel.startsWith("admin-") ||
  hostLabel.endsWith("-admin");
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isAdmin ? <AdminApp /> : <App />}
  </StrictMode>
);
