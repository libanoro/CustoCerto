// frontend/src/contexts/AuthContext.jsx
// Contexto global de autenticação. Gerencia o token JWT e o estado do usuário.
import { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // TODO(security): migrar para httpOnly cookie em produção.
  // localStorage é aceito apenas para simplificar o MVP em dev local.
  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  // O username é persistido apenas para exibição no header.
  // TODO(security): em produção, obter via endpoint /api/me/ com token válido.
  const [user, setUser] = useState(() => {
    const nome = localStorage.getItem("username");
    return nome ? { username: nome } : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
  }, [token]);

  const login = (newToken, username) => {
    setToken(newToken);
    setUser({ username });
    localStorage.setItem("username", username);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("username");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Exceção documentada à regra react-refresh/only-export-components:
// o hook de consumo é inseparável do contexto que ele lê. Padrão canônico
// de Contexts no React (provider + hook co-localizados).
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}