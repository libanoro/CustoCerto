// frontend/src/components/ProtectedRoute.jsx
// Componente guardião: redireciona para /login se não houver token JWT.
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default ProtectedRoute;