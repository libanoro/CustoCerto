import { Outlet, Link, useLocation } from "react-router-dom";

function Layout() {
  const location = useLocation();

  return (
    <>
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo principal
      </a>
      <header className="header">
        <h1 className="header-titulo">CustoCerto</h1>
        <nav aria-label="Navegação principal">
          <ul className="nav-lista">
            <li>
              <Link to="/insumos" className={location.pathname.startsWith("/insumos") ? "ativo" : ""}>
                Insumos
              </Link>
            </li>
            <li>
              <Link to="/receitas" className={location.pathname.startsWith("/receitas") ? "ativo" : ""}>
                Receitas
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className={location.pathname === "/dashboard" ? "ativo" : ""}>
                Dashboard
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}

export default Layout;