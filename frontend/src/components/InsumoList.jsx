// frontend/src/components/InsumoList.jsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api.js";

const formatarMoeda = (valor) => {
  const numero = parseFloat(valor) || 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero);
};

function InsumoList() {
  const location = useLocation();
  // Captura a mensagem de sucesso vinda do InsumoForm (criação ou edição)
  const mensagemSucesso = location.state?.mensagem || "";

  const [insumos, setInsumos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [anuncio, setAnuncio] = useState(mensagemSucesso);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const resposta = await api.get("/insumos/");
        if (!ativo) return;
        if (!Array.isArray(resposta.data)) {
          throw new Error("Resposta inesperada da API.");
        }
        setInsumos(resposta.data);
        setCarregando(false);
      } catch {
        if (!ativo) return;
        setErro("Não foi possível carregar a lista de insumos.");
        setCarregando(false);
      }
    }
    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  async function handleRemover(id, nome) {
    if (!confirm(`Remover o insumo "${nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/insumos/${id}/`);
      setInsumos((prev) => prev.filter((insumo) => insumo.id !== id));
      setAnuncio(`Insumo '${nome}' removido com sucesso.`);
    } catch {
      setErro("Não foi possível remover o insumo.");
    }
  }

  if (carregando) {
    return (
      <section aria-labelledby="titulo-lista">
        <h2 id="titulo-lista">Meus Insumos</h2>
        <p role="status">Carregando...</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="titulo-lista">
      <h2 id="titulo-lista">Meus Insumos</h2>

      <p aria-live="polite" role="status" className="lista-anuncio">
        {anuncio}
      </p>

      {erro && (
        <p role="alert" className="form-erro-geral">
          {erro}
        </p>
      )}

      <p>
        <Link to="/insumos/novo" className="botao">
          Cadastrar Novo Insumo
        </Link>
      </p>

      <table className="tabela">
        <caption className="sr-only">Lista de insumos cadastrados</caption>
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Unidade</th>
            <th scope="col">Qtd. Compra</th>
            <th scope="col">Preço Pago</th>
            <th scope="col">Custo/Unidade</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          {insumos.length === 0 ? (
            <tr>
              <td colSpan={6}>Nenhum insumo cadastrado ainda.</td>
            </tr>
          ) : (
            insumos.map((insumo) => (
              <tr key={insumo.id}>
                <td>{insumo.nome}</td>
                <td>{insumo.unidade_medida}</td>
                <td>{insumo.quantidade_compra}</td>
                <td>{formatarMoeda(insumo.preco_compra)}</td>
                <td>{formatarMoeda(insumo.custo_por_unidade)}</td>
                <td className="tabela-acoes">
                  <Link
                    to={`/insumos/${insumo.id}/editar`}
                    className="botao-acao"
                    aria-label={`Editar insumo ${insumo.nome}`}
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemover(insumo.id, insumo.nome)}
                    className="botao-acao botao-remover"
                    aria-label={`Remover insumo ${insumo.nome}`}
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}

export default InsumoList;