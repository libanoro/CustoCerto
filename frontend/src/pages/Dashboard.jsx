import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import api from "../services/api.js";

const formatarMoeda = (valor) => {
  const numero = parseFloat(valor) || 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero);
};

const formatarData = (isoString) => {
  const data = new Date(isoString);
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function Dashboard() {
  const [dados, setDados] = useState(null);
  const [receitaSelecionada, setReceitaSelecionada] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const resposta = await api.get("/dashboard/resumo/");
        if (!ativo) return;
        setDados(resposta.data);
        setCarregando(false);
      } catch {
        if (!ativo) return;
        setErro("Não foi possível carregar os dados do dashboard.");
        setCarregando(false);
      }
    }
    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  if (carregando) {
    return (
      <section aria-labelledby="titulo-dashboard">
        <h1 id="titulo-dashboard">Dashboard</h1>
        <p role="status">Carregando dados...</p>
      </section>
    );
  }

  if (erro) {
    return (
      <section aria-labelledby="titulo-dashboard">
        <h1 id="titulo-dashboard">Dashboard</h1>
        <p role="alert" className="form-erro-geral">
          {erro}
        </p>
      </section>
    );
  }

  const { totais, receitas } = dados;

  if (totais.calculos_totais === 0) {
    return (
      <section aria-labelledby="titulo-dashboard">
        <h1 id="titulo-dashboard">Dashboard</h1>
        <p role="status" className="dashboard-vazio">
          Nenhum cálculo registrado ainda. Calcule o custo de uma receita para alimentar o dashboard.
        </p>
      </section>
    );
  }

  const receitaAtual = receitas.find((r) => r.id === receitaSelecionada) || receitas[0];

  const dadosGrafico = receitaAtual.serie.map((ponto) => ({
    data: formatarData(ponto.data_calculo),
    custo_total: parseFloat(ponto.custo_total),
    preco_sugerido: parseFloat(ponto.preco_sugerido),
  }));

  return (
    <section aria-labelledby="titulo-dashboard">
      <h1 id="titulo-dashboard">Dashboard</h1>
      <p aria-live="polite" role="status" className="sr-only">
        Dashboard carregado com {receitas.length} receitas.
      </p>

      <div className="dashboard-kpis">
        <div className="kpi-card">
          <h2>Total de Cálculos</h2>
          <p className="kpi-valor">{totais.calculos_totais}</p>
        </div>
        <div className="kpi-card">
          <h2>Receita Mais Calculada</h2>
          <p className="kpi-valor">{totais.receita_mais_calculada}</p>
        </div>
        <div className="kpi-card">
          <h2>Custo Médio</h2>
          <p className="kpi-valor">{formatarMoeda(totais.custo_medio)}</p>
        </div>
      </div>

      <div className="dashboard-grafico">
        <div className="dashboard-selector">
          <label htmlFor="receita-select">Receita:</label>
          <select
            id="receita-select"
            value={receitaAtual.id}
            onChange={(e) => setReceitaSelecionada(e.target.value)}
          >
            {receitas.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
        </div>

        <h3>{receitaAtual.nome}</h3>
        <p>
          <strong>Último custo total:</strong> {formatarMoeda(receitaAtual.ultimo_custo_total)} |{" "}
          <strong>Último preço sugerido:</strong> {formatarMoeda(receitaAtual.ultimo_preco_sugerido)} |{" "}
          <strong>Variação:</strong> {receitaAtual.variacao_percentual}%
        </p>

        <div role="img" aria-label={`Gráfico de evolução de custo da receita ${receitaAtual.nome}`} style={{ width: "100%", height: 400 }}>
          <ResponsiveContainer>
            <LineChart data={dadosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="custo_total" stroke="#0b5394" name="Custo Total" strokeWidth={2} />
              <Line type="monotone" dataKey="preco_sugerido" stroke="#b45309" name="Preço Sugerido" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <details className="dashboard-tabela-acessivel">
          <summary>Ver dados em tabela</summary>
          <table className="tabela">
            <caption className="sr-only">
              Dados históricos de custo e preço da receita {receitaAtual.nome}
            </caption>
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Custo Total</th>
                <th scope="col">Preço Sugerido</th>
              </tr>
            </thead>
            <tbody>
              {receitaAtual.serie.map((ponto, idx) => (
                <tr key={idx}>
                  <td>{formatarData(ponto.data_calculo)}</td>
                  <td>{formatarMoeda(ponto.custo_total)}</td>
                  <td>{formatarMoeda(ponto.preco_sugerido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </section>
  );
}

export default Dashboard;