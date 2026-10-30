// frontend/src/components/ReceitaDetail.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api.js";
import CalculoExplicado from "./CalculoExplicado.jsx";

const formatarMoeda = (valor) => {
  const numero = parseFloat(valor) || 0;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numero);
};

function ReceitaDetail() {
  const { id } = useParams();
  const [receita, setReceita] = useState(null);
  const [insumosAssociados, setInsumosAssociados] = useState([]);
  const [insumosDisponiveis, setInsumosDisponiveis] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [anuncio, setAnuncio] = useState("");
  const [formAssociacao, setFormAssociacao] = useState({ insumo_id: "", quantidade: "" });
  const [erroAssociacao, setErroAssociacao] = useState("");
  const [resultadoCalculo, setResultadoCalculo] = useState(null);
  const [erroCalculo, setErroCalculo] = useState("");
  const [calculando, setCalculando] = useState(false);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const [respostaReceita, respostaInsumos] = await Promise.all([
          api.get(`/receitas/${id}/`),
          api.get("/insumos/"),
        ]);
        if (!ativo) return;
        if (!Array.isArray(respostaInsumos.data)) throw new Error("Resposta inesperada da API de insumos.");
        setReceita(respostaReceita.data);
        setInsumosAssociados(respostaReceita.data.itens || []);
        setInsumosDisponiveis(respostaInsumos.data);
        setCarregando(false);
      } catch {
        if (!ativo) return;
        setErro("Não foi possível carregar os detalhes da receita.");
        setCarregando(false);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, [id]);

  async function handleAdicionarInsumo(event) {
    event.preventDefault();
    setErroAssociacao("");
    setAnuncio("");
    if (!formAssociacao.insumo_id || !formAssociacao.quantidade) {
      setErroAssociacao("Selecione um insumo e informe a quantidade.");
      return;
    }
    try {
      const payload = { receita: id, insumo: formAssociacao.insumo_id, quantidade: formAssociacao.quantidade };
      const resposta = await api.post("/receitas-insumos/", payload);
      setInsumosAssociados((prev) => [...prev, resposta.data]);
      setFormAssociacao({ insumo_id: "", quantidade: "" });
      setAnuncio(`Insumo '${resposta.data.nome_insumo}' adicionado à receita.`);
    } catch (erro) {
      if (erro.response && erro.response.status === 400) {
        const dados = erro.response.data;
        const mensagens = Object.values(dados).flat().join(" ");
        setErroAssociacao(mensagens || "Erro ao adicionar insumo.");
      } else {
        setErroAssociacao("Não foi possível adicionar o insumo.");
      }
    }
  }

  async function handleRemoverInsumo(riId, nomeInsumo) {
    if (!confirm(`Remover ${nomeInsumo} da receita?`)) return;
    try {
      await api.delete(`/receitas-insumos/${riId}/`);
      setInsumosAssociados((prev) => prev.filter((item) => item.id !== riId));
      setAnuncio(`Insumo '${nomeInsumo}' removido da receita.`);
    } catch {
      setErro("Não foi possível remover o insumo.");
    }
  }

  async function handleCalcularCusto() {
    setCalculando(true);
    setErroCalculo("");
    setResultadoCalculo(null);
    try {
      const resposta = await api.post(`/receitas/${id}/calcular-custo/`);
      setResultadoCalculo(resposta.data);
      setAnuncio("Cálculo de custo concluído.");
    } catch {
      setErroCalculo("Não foi possível calcular o custo da receita.");
    } finally {
      setCalculando(false);
    }
  }

  if (carregando) return (<section aria-labelledby="titulo-detalhe"><h2 id="titulo-detalhe">Detalhes da Receita</h2><p role="status">Carregando...</p></section>);
  if (erro) return (<section aria-labelledby="titulo-detalhe"><h2 id="titulo-detalhe">Detalhes da Receita</h2><p role="alert" className="form-erro-geral">{erro}</p></section>);

  return (
    <section aria-labelledby="titulo-detalhe">
      <div className="detalhe-header">
        <h2 id="titulo-detalhe">{receita.nome}</h2>
        <Link to={`/receitas/${receita.id}/editar`} className="botao-acao">Editar receita</Link>
      </div>
      <p aria-live="polite" role="status" className="lista-anuncio">{anuncio}</p>

      <div className="receita-info">
        <p><strong>Rendimento:</strong> {receita.rendimento_porcoes} porções</p>
        <p><strong>Tempo de preparo:</strong> {receita.tempo_preparo_minutos} minutos</p>
        <p><strong>Custo hora mão de obra:</strong> {formatarMoeda(receita.custo_hora_mao_obra)}</p>
        <p><strong>Custo embalagem por porção:</strong> {formatarMoeda(receita.custo_embalagem_porcao)}</p>
        <p><strong>Custos variáveis:</strong> {receita.percentual_custos_variaveis}%</p>
        <p><strong>Margem desejada:</strong> {receita.margem_desejada}%</p>
      </div>

      <h3 id="titulo-insumos">Insumos Associados</h3>
      <table className="tabela" aria-labelledby="titulo-insumos">
        <caption className="sr-only">Insumos associados à receita</caption>
        <thead>
          <tr><th scope="col">Nome do Insumo</th><th scope="col">Quantidade Usada</th><th scope="col">Custo Estimado</th><th scope="col">Ações</th></tr>
        </thead>
        <tbody>
          {insumosAssociados.length === 0 ? (
            <tr><td colSpan={4}>Nenhum insumo associado ainda.</td></tr>
          ) : (
            insumosAssociados.map((item) => (
              <tr key={item.id}>
                <td>{item.nome_insumo}</td>
                <td>{item.quantidade}</td>
                <td>{formatarMoeda(item.custo_estimado)}</td>
                <td><button type="button" onClick={() => handleRemoverInsumo(item.id, item.nome_insumo)} className="botao-acao botao-remover">Remover</button></td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h3 id="titulo-adicionar">Adicionar Insumo</h3>
      <form onSubmit={handleAdicionarInsumo} aria-labelledby="titulo-adicionar">
        <div className="form-campo">
          <label htmlFor="insumo-select">Insumo</label>
          <select id="insumo-select" value={formAssociacao.insumo_id} onChange={(e) => setFormAssociacao((prev) => ({ ...prev, insumo_id: e.target.value }))} required aria-required="true">
            <option value="">Selecione um insumo</option>
            {insumosDisponiveis.map((insumo) => (<option key={insumo.id} value={insumo.id}>{insumo.nome} ({insumo.unidade_medida})</option>))}
          </select>
        </div>
        <div className="form-campo">
          <label htmlFor="quantidade-insumo">Quantidade</label>
          <input id="quantidade-insumo" type="number" step="0.001" min="0.001" value={formAssociacao.quantidade} onChange={(e) => setFormAssociacao((prev) => ({ ...prev, quantidade: e.target.value }))} required aria-required="true" />
        </div>
        {erroAssociacao && <p role="alert" className="form-erro-geral">{erroAssociacao}</p>}
        <button type="submit">Adicionar Insumo</button>
      </form>

      <h3 id="titulo-calculo">Cálculo de Custo</h3>
      <button type="button" onClick={handleCalcularCusto} disabled={calculando}>
        {calculando ? "Calculando..." : "Calcular Custo da Receita"}
      </button>

      {erroCalculo && <p role="alert" className="form-erro-geral">{erroCalculo}</p>}

      {resultadoCalculo && <CalculoExplicado payload={resultadoCalculo} />}
    </section>
  );
}

export default ReceitaDetail;