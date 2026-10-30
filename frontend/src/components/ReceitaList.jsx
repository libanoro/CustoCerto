// frontend/src/components/ReceitaList.jsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api.js";

function ReceitaList() {
  const location = useLocation();
  const mensagemSucesso = location.state?.mensagem || "";

  const [receitas, setReceitas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [anuncio, setAnuncio] = useState(mensagemSucesso);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const resposta = await api.get("/receitas/");
        if (!ativo) return;
        if (!Array.isArray(resposta.data)) throw new Error("Resposta inesperada.");
        setReceitas(resposta.data);
        setCarregando(false);
      } catch {
        if (!ativo) return;
        setErro("Não foi possível carregar a lista de receitas.");
        setCarregando(false);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, []);

  async function handleRemover(id, nome) {
    if (!confirm(`Remover a receita "${nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/receitas/${id}/`);
      setReceitas((prev) => prev.filter((r) => r.id !== id));
      setAnuncio(`Receita '${nome}' removida com sucesso.`);
    } catch {
      setErro("Não foi possível remover a receita.");
    }
  }

  if (carregando) {
    return (
      <section aria-labelledby="titulo-lista-receitas">
        <h2 id="titulo-lista-receitas">Minhas Receitas</h2>
        <p role="status">Carregando...</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="titulo-lista-receitas">
      <h2 id="titulo-lista-receitas">Minhas Receitas</h2>
      <p aria-live="polite" role="status" className="lista-anuncio">{anuncio}</p>
      {erro && <p role="alert" className="form-erro-geral">{erro}</p>}

      <p>
        <Link to="/receitas/novo" className="botao">Cadastrar Nova Receita</Link>
      </p>

      <table className="tabela">
        <caption className="sr-only">Lista de receitas cadastradas</caption>
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Porções</th>
            <th scope="col">Tempo (min)</th>
            <th scope="col">Margem</th>
            <th scope="col">Custo Atual</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          {receitas.length === 0 ? (
            <tr><td colSpan={6}>Nenhuma receita cadastrada ainda.</td></tr>
          ) : (
            receitas.map((receita) => (
              <tr key={receita.id}>
                <td>{receita.nome}</td>
                <td>{receita.rendimento_porcoes}</td>
                <td>{receita.tempo_preparo_minutos}</td>
                <td>{receita.margem_desejada}%</td>
                <td>{receita.custo_total_atual ? `R$ ${receita.custo_total_atual}` : "—"}</td>
                <td className="tabela-acoes">
                  <Link to={`/receitas/${receita.id}`} className="botao-acao" aria-label={`Ver detalhes da receita ${receita.nome}`}>Ver</Link>
                  <Link to={`/receitas/${receita.id}/editar`} className="botao-acao" aria-label={`Editar receita ${receita.nome}`}>Editar</Link>
                  <button type="button" onClick={() => handleRemover(receita.id, receita.nome)} className="botao-acao botao-remover" aria-label={`Remover receita ${receita.nome}`}>Remover</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}

export default ReceitaList;