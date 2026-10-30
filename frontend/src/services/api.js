// frontend/src/services/api.js
import axios from "axios";

// Fallback apenas para dev local: garante baseURL mesmo se o .env falhar.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de requisição: injeta o token JWT se existir no localStorage.
api.interceptors.request.use(
  (config) => {
    // TODO(security): migrar para httpOnly cookie em produção.
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de resposta: normaliza erros globais e trata 401 Unauthorized.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Se o token expirou ou é inválido (401), faz logout forçado.
      if (status === 401) {
        console.warn("Sessão expirada ou inválida. Redirecionando para o login.");
        localStorage.removeItem("accessToken");
        // Evita loop de redirecionamento se já estiver na tela de login
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      } else if (status >= 500) {
        console.error("Erro interno do servidor:", data);
      }
    } else if (error.request) {
      console.error(
        "Sem resposta do servidor. Verifique se o backend está rodando em http://127.0.0.1:8000."
      );
    } else {
      console.error("Erro ao montar a requisição:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;