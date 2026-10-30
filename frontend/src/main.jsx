// frontend/src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import React from "react";              // NOVO: necessário para @axe-core/react
import ReactDOM from "react-dom";       // NOVO: necessário para @axe-core/react
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

// Monitor de acessibilidade em tempo de desenvolvimento (Marco 9).
// Só carrega em DEV para não afetar o bundle de produção.
// O intervalo de 1000ms evita spam no console durante navegação rápida.
if (import.meta.env.DEV) {
  import("@axe-core/react").then(({ default: axe }) => {
    axe(React, ReactDOM, 1000);
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);