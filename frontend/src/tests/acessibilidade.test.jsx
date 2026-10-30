// frontend/src/tests/acessibilidade.test.jsx
// Testes automatizados de acessibilidade (WCAG 2.1) usando jest-axe com Vitest.
// jest-axe valida ~57 regras automatizáveis do axe-core (roles, aria-*, labels, etc.).
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, it, expect, vi } from "vitest";
import InsumoForm from "../components/InsumoForm.jsx";
import CalculoExplicado from "../components/CalculoExplicado.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import api from "../services/api.js";
import { act } from "@testing-library/react";

expect.extend(toHaveNoViolations);

// Mock do axios para não fazer requisições reais durante os testes
vi.mock("../services/api.js", () => ({
  default: {
    post: vi.fn(),
    patch: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: vi.fn(() => ({})),
  };
});

// O Recharts é stubado: jsdom não implementa ResizeObserver nem layout SVG
vi.mock("recharts", () => {
  const Nulo = () => null;
  return {
    ResponsiveContainer: Nulo,
    LineChart: Nulo,
    Line: Nulo,
    XAxis: Nulo,
    YAxis: Nulo,
    CartesianGrid: Nulo,
    Tooltip: Nulo,
    Legend: Nulo,
  };
});

const payloadCalculoMock = {
  itens: [
    { nome_insumo: "Farinha", unidade: "KG", quantidade_usada: "0.500", custo_unitario: "5.0000", subtotal: "2.50" },
    { nome_insumo: "Ovos", unidade: "UN", quantidade_usada: "3.000", custo_unitario: "1.0000", subtotal: "3.00" },
  ],
  parametros: {
    tempo_preparo_minutos: 60,
    custo_hora_mao_obra: "20.00",
    rendimento_porcoes: "10.00",
    custo_embalagem_porcao: "0.50",
    percentual_custos_variaveis: "10.00",
    margem_desejada: "30.00",
  },
  custo_materia_prima: "5.50",
  custo_mao_obra: "20.00",
  custo_embalagem: "5.00",
  custos_variaveis: "3.05",
  custo_total: "33.55",
  preco_sugerido: "47.93",
};

const payloadDashboardMock = {
  totais: {
    calculos_totais: 2,
    receita_mais_calculada: "Bolo de Cenoura",
    custo_medio: "35.53",
  },
  receitas: [
    {
      id: "r1",
      nome: "Bolo de Cenoura",
      calculos: 2,
      ultimo_custo_total: "35.86",
      ultimo_preco_sugerido: "51.23",
      variacao_percentual: "0.93",
      serie: [
        { data_calculo: "2026-09-20T12:00:00Z", custo_total: "35.53", preco_sugerido: "50.76" },
        { data_calculo: "2026-09-27T12:00:00Z", custo_total: "35.86", preco_sugerido: "51.23" },
      ],
    },
  ],
};

// DECISÃO DOCUMENTADA: excluímos a regra 'color-contrast' porque o jsdom
// não computa estilos visuais (CSS colors, backgrounds), o que gera falsos
// positivos. O contraste real será validado no Passo 4 via Lighthouse e
// no checklist manual (Passo 5).
const opcoesAxe = {
  rules: {
    "color-contrast": { enabled: false },
  },
};

describe("Acessibilidade (jest-axe)", () => {
  it("(a) InsumoForm sem violações de acessibilidade", async () => {
    const { container } = render(
      <MemoryRouter>
        <InsumoForm />
      </MemoryRouter>
    );
    const resultados = await axe(container, opcoesAxe);
    expect(resultados).toHaveNoViolations();
  });

  it("(b) CalculoExplicado com payload mockado sem violações", async () => {
    const { container } = render(<CalculoExplicado payload={payloadCalculoMock} />);
    const resultados = await axe(container, opcoesAxe);
    expect(resultados).toHaveNoViolations();
  });

  it("(c) Dashboard com payload mockado sem violações", async () => {
    api.get.mockResolvedValueOnce({ data: payloadDashboardMock });
    const { container } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Aguarda o componente renderizar após o GET mockado, envolto em act()
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const resultados = await axe(container, opcoesAxe);
    expect(resultados).toHaveNoViolations();
  });
});