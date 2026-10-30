// frontend/src/pages/Dashboard.test.jsx
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import Dashboard from "./Dashboard.jsx";
import api from "../services/api.js";

vi.mock("../services/api.js", () => ({
  default: {
    get: vi.fn(),
  },
}));

// O Recharts é stubado nos testes unitários: o jsdom não implementa
// ResizeObserver nem layout SVG. O gráfico real é validado no aceite visual.
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

const payloadMock = {
  totais: {
    calculos_totais: 3,
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
        {
          data_calculo: "2026-09-20T12:00:00Z",
          custo_total: "35.53",
          preco_sugerido: "50.76",
        },
        {
          data_calculo: "2026-09-27T12:00:00Z",
          custo_total: "35.86",
          preco_sugerido: "51.23",
        },
      ],
    },
  ],
};

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza KPIs a partir do payload mockado e anuncia carregamento via aria-live", async () => {
    api.get.mockResolvedValueOnce({ data: payloadMock });

    render(<Dashboard />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/dashboard/resumo/");
    });

    const cardCalculos = screen
      .getByRole("heading", { name: /Total de Cálculos/i })
      .closest(".kpi-card");
    expect(within(cardCalculos).getByText("3")).toBeInTheDocument();

    const cardReceita = screen
      .getByRole("heading", { name: /Receita Mais Calculada/i })
      .closest(".kpi-card");
    expect(within(cardReceita).getByText("Bolo de Cenoura")).toBeInTheDocument();

    const cardMedio = screen
      .getByRole("heading", { name: /Custo Médio/i })
      .closest(".kpi-card");
    expect(within(cardMedio).getByText("R$ 35,53")).toBeInTheDocument();

    // Anúncio acessível do carregamento
    expect(
      screen.getByText(/Dashboard carregado com 1 receitas/i)
    ).toBeInTheDocument();
  });

  it("exibe a tabela acessível com os pontos da série quando o details é aberto", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: payloadMock });

    render(<Dashboard />);

    const summary = await screen.findByText(/Ver dados em tabela/i);
    await user.click(summary);

    const tabela = screen.getByRole("table");
    // 1 linha de cabeçalho + 2 pontos da série
    expect(within(tabela).getAllByRole("row")).toHaveLength(3);
    expect(within(tabela).getByText("R$ 35,53")).toBeInTheDocument();
    expect(within(tabela).getByText("R$ 50,76")).toBeInTheDocument();
    expect(within(tabela).getByText("R$ 35,86")).toBeInTheDocument();
    expect(within(tabela).getByText("R$ 51,23")).toBeInTheDocument();
  });

  it("estado vazio exibe a mensagem orientadora", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        totais: { calculos_totais: 0, receita_mais_calculada: null, custo_medio: null },
        receitas: [],
      },
    });

    render(<Dashboard />);

    expect(
      await screen.findByText(/Nenhum cálculo registrado ainda/i)
    ).toBeInTheDocument();
  });
});