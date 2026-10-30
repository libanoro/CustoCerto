// frontend/src/components/InsumoList.test.jsx
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import InsumoList from "./InsumoList.jsx";
import api from "../services/api.js";

vi.mock("../services/api.js", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("InsumoList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("(i) renderiza um link 'Editar' por linha na tabela", async () => {
    api.get.mockResolvedValueOnce({
      data: [
        { id: "1", nome: "Farinha", unidade_medida: "KG", quantidade_compra: "5.000", preco_compra: "25.00", custo_por_unidade: "5.0000" },
        { id: "2", nome: "Ovos", unidade_medida: "UN", quantidade_compra: "12.000", preco_compra: "12.00", custo_por_unidade: "1.0000" },
      ],
    });

    render(
      <MemoryRouter>
        <InsumoList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText("Editar")).toHaveLength(2);
    });

    const linksEditar = screen.getAllByText("Editar");
    expect(linksEditar[0]).toHaveAttribute("href", "/insumos/1/editar");
    expect(linksEditar[1]).toHaveAttribute("href", "/insumos/2/editar");
  });
});