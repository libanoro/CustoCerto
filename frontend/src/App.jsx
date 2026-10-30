// frontend/src/App.jsx
import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import InsumoList from "./components/InsumoList.jsx";
import InsumoForm from "./components/InsumoForm.jsx";
import ReceitaList from "./components/ReceitaList.jsx";
import ReceitaForm from "./components/ReceitaForm.jsx";
import ReceitaDetail from "./components/ReceitaDetail.jsx";

// Code-splitting: Dashboard é carregado apenas quando necessário (Marco 9).
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<InsumoList />} />
          <Route path="insumos" element={<InsumoList />} />
          <Route path="insumos/novo" element={<InsumoForm />} />
          <Route path="insumos/:id/editar" element={<InsumoForm />} />
          <Route path="receitas" element={<ReceitaList />} />
          <Route path="receitas/novo" element={<ReceitaForm />} />
          <Route path="receitas/:id" element={<ReceitaDetail />} />
          <Route path="receitas/:id/editar" element={<ReceitaForm />} />
          <Route
            path="dashboard"
            element={
              <Suspense
                fallback={
                  <div aria-live="polite" role="status">
                    Carregando dashboard...
                  </div>
                }
              >
                <Dashboard />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;