// frontend/src/pages/Login.jsx
// Tela de login acessível (WCAG 2.1 AA).
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../services/api.js";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setSubmitting(true);

    try {
      // O SimpleJWT expõe o endpoint em /api/token/
      const resposta = await api.post("/token/", { username, password });
      // Guarda o token e o username digitado (para exibição no header).
      login(resposta.data.access, username);
      navigate("/");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setErro("Usuário ou senha inválidos.");
      } else {
        setErro("Não foi possível fazer login. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="titulo-login" className="login-container">
      <h2 id="titulo-login">Entrar no CustoCerto</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-campo">
          <label htmlFor="username">Usuário</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            aria-required="true"
            autoComplete="username"
          />
        </div>
        <div className="form-campo">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-required="true"
            autoComplete="current-password"
          />
        </div>
        {erro && (
          <p role="alert" className="form-erro-geral">
            {erro}
          </p>
        )}
        <button type="submit" disabled={submitting}>
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </section>
  );
}

export default Login;