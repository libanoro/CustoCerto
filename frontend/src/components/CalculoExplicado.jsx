// frontend/src/components/CalculoExplicado.jsx
import { useMemo, useState } from "react";

const formatarMoeda = (valor) => {
  const numero = parseFloat(valor) || 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero);
};

function CalculoExplicado({ payload }) {
  const {
    itens = [],
    parametros = {},
    custo_materia_prima,
    custo_mao_obra,
    custo_embalagem,
    custos_variaveis,
    custo_total,
    preco_sugerido,
  } = payload || {};

  const {
    tempo_preparo_minutos = 0,
    custo_hora_mao_obra = "0",
    rendimento_porcoes = "1",
    custo_embalagem_porcao = "0",
    percentual_custos_variaveis = "0",
    margem_desejada = "30",
  } = parametros;

  const [margemSimulada, setMargemSimulada] = useState(parseFloat(margem_desejada) || 30);

  const precoPorPorcao = useMemo(() => {
    const preco = parseFloat(preco_sugerido) || 0;
    const porcoes = parseFloat(rendimento_porcoes) || 1;
    return preco / porcoes;
  }, [preco_sugerido, rendimento_porcoes]);

  const subtotalBase =
    (parseFloat(custo_materia_prima) || 0) +
    (parseFloat(custo_mao_obra) || 0) +
    (parseFloat(custo_embalagem) || 0);

  const precoSimulado = useMemo(() => {
    const custoTotalNum = parseFloat(custo_total) || 0;
    const margemDecimal = margemSimulada / 100;
    if (margemDecimal >= 1) return null;
    return custoTotalNum / (1 - margemDecimal);
  }, [custo_total, margemSimulada]);

  const precoPorPorcaoSimulado = useMemo(() => {
    if (precoSimulado === null) return null;
    const porcoes = parseFloat(rendimento_porcoes) || 1;
    return precoSimulado / porcoes;
  }, [precoSimulado, rendimento_porcoes]);

  return (
    <section aria-labelledby="titulo-calculo-explicado" className="calculo-explicado">
      <h3 id="titulo-calculo-explicado">Detalhamento do Cálculo</h3>

      <h4 id="titulo-materia-prima">1. Matéria-Prima (Itemização)</h4>
      <table className="tabela" aria-labelledby="titulo-materia-prima">
        <caption className="sr-only">Insumos utilizados e seus custos fracionados</caption>
        <thead>
          <tr>
            <th scope="col">Insumo</th>
            <th scope="col">Qtd</th>
            <th scope="col">Custo Unitário</th>
            <th scope="col">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {itens.length === 0 ? (
            <tr><td colSpan={4}>Nenhum insumo associado.</td></tr>
          ) : (
            itens.map((item, index) => (
              <tr key={index}>
                <td>{item.nome_insumo}</td>
                <td>{item.quantidade_usada} {item.unidade}</td>
                <td>{formatarMoeda(item.custo_unitario)} / {item.unidade}</td>
                <td>{formatarMoeda(item.subtotal)}</td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={3}>Total Matéria-Prima</th>
            <td><strong>{formatarMoeda(custo_materia_prima)}</strong></td>
          </tr>
        </tfoot>
      </table>

      <h4 id="titulo-formulas">2. Fórmulas dos Custos</h4>
      <ul className="lista-formulas" aria-labelledby="titulo-formulas">
        <li>
          <strong>Mão de obra:</strong> ({tempo_preparo_minutos} min ÷ 60) ×{" "}
          {formatarMoeda(custo_hora_mao_obra)}/h = <strong>{formatarMoeda(custo_mao_obra)}</strong>
        </li>
        <li>
          <strong>Embalagem:</strong> {rendimento_porcoes} porções ×{" "}
          {formatarMoeda(custo_embalagem_porcao)} = <strong>{formatarMoeda(custo_embalagem)}</strong>
        </li>
        <li>
          <strong>Custos variáveis:</strong> ({formatarMoeda(subtotalBase)}) ×{" "}
          {percentual_custos_variaveis}% = <strong>{formatarMoeda(custos_variaveis)}</strong>
        </li>
        <li>
          <strong>Custo total:</strong> {formatarMoeda(custo_materia_prima)} +{" "}
          {formatarMoeda(custo_mao_obra)} + {formatarMoeda(custo_embalagem)} +{" "}
          {formatarMoeda(custos_variaveis)} = <strong>{formatarMoeda(custo_total)}</strong>
        </li>
        <li>
          <strong>Preço sugerido:</strong> {formatarMoeda(custo_total)} ÷ (1 −{" "}
          {parseFloat(margem_desejada) / 100}) = <strong>{formatarMoeda(preco_sugerido)}</strong>
        </li>
        <li>
          <strong>Preço por porção:</strong> {formatarMoeda(preco_sugerido)} ÷{" "}
          {rendimento_porcoes} = <strong>{formatarMoeda(precoPorPorcao)}</strong>
        </li>
      </ul>

      <h4 id="titulo-simulador">3. Simulador de Margem de Lucro</h4>
      <div className="simulador-margem" aria-labelledby="titulo-simulador">
        <div className="form-campo">
          <label htmlFor="margem-simulada">
            Simular margem de lucro (%): <strong>{margemSimulada}%</strong>
          </label>
          <input
            id="margem-simulada"
            type="range"
            min="0"
            max="90"
            step="5"
            value={margemSimulada}
            onChange={(e) => setMargemSimulada(parseFloat(e.target.value))}
          />
          <input
            type="number"
            min="0"
            max="90"
            step="1"
            value={margemSimulada}
            onChange={(e) => setMargemSimulada(parseFloat(e.target.value) || 0)}
            aria-label="Valor exato da margem simulada"
            style={{ maxWidth: "80px", marginLeft: "1rem" }}
          />
        </div>

        {/* TODO: persistir simulações no histórico em marco futuro. */}
        <div aria-live="polite" className="simulador-resultado">
          {precoSimulado !== null ? (
            <>
              <p><strong>Preço Sugerido Simulado:</strong> {formatarMoeda(precoSimulado)}</p>
              <p><strong>Preço por Porção Simulado:</strong> {formatarMoeda(precoPorPorcaoSimulado)}</p>
            </>
          ) : (
            <p role="alert" className="form-erro-geral">Margem inválida (deve ser menor que 100%).</p>
          )}
        </div>
        <p className="simulador-aviso">
          <em>Simulação apenas visual. O valor oficial registrado é o do backend.</em>
        </p>
      </div>

      <details className="detalhes-como-calcula">
        <summary>Como o CustoCerto calcula?</summary>
        <div className="detalhes-conteudo">
          <p><strong>Matéria-prima fracionada:</strong> O sistema descobre quanto custa uma única unidade (ex: 1 kg, 1 ml) do insumo e multiplica pela quantidade exata que você usou na receita.</p>
          <p><strong>Mão de obra proporcional:</strong> O custo do seu tempo é calculado dividindo o tempo de preparo por 60 minutos e multiplicando pelo valor da sua hora de trabalho.</p>
          <p><strong>Embalagem por porção:</strong> O custo da embalagem é multiplicado pelo número total de porções que a receita rende.</p>
          <p><strong>Custos variáveis:</strong> Gastos como gás, água e detergente são estimados aplicando uma porcentagem sobre a soma da matéria-prima, mão de obra e embalagem.</p>
          <p><strong>Margem de lucro (divisor):</strong> Para garantir que a margem desejada seja atingida sobre o preço final de venda, o custo total é dividido por (1 - margem). Ex: para 30% de margem, divide-se por 0,70.</p>
        </div>
      </details>
    </section>
  );
}

export default CalculoExplicado;