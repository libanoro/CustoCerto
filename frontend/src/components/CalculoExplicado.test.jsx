// frontend/src/components/CalculoExplicado.test.jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import CalculoExplicado from "./CalculoExplicado.jsx";

const payloadMock = {
  itens: [
    { nome_insumo: "Farinha de trigo", unidade: "KG", quantidade_usada: "0.500", custo_unitario: "5.0000", subtotal: "2.50" },
    { nome_insumo: "Ovos", unidade: "UN", quantidade_usada: "3.000", custo_unitario: "1.0000", subtotal: "3.00" },
    { nome_insumo: "Leite", unidade: "ML", quantidade_usada: "300.000", custo_unitario: "0.0060", subtotal: "1.80" },
  ],
  parametros: {
    tempo_preparo_minutos: 60,
    custo_hora_mao_obra: "20.00",
    rendimento_porcoes: "10.00",
    custo_embalagem_porcao: "0.50",
    percentual_custos_variaveis: "10.00",
    margem_desejada: "30.00",
  },
  custo_materia_prima: "7.30",
  custo_mao_obra: "20.00",
  custo_embalagem: "5.00",
  custos_variaveis: "3.23",
  custo_total: "35.53",
  preco_sugerido: "50.76",
};

describe("CalculoExplicado", () => {
  it("(e) com payload mockado, exibe preço sugerido R$ 50,76 e a fórmula da mão de obra", () => {
    render(<CalculoExplicado payload={payloadMock} />);

    // Busca o label "Preço sugerido:" e verifica o <li> pai para evitar colisão com o simulador
    const labelPreco = screen.getByText('Preço sugerido:');
    const liPreco = labelPreco.closest('li');
    expect(liPreco).toHaveTextContent(/R\$\s*50,76/);

    // Busca o label "Mão de obra:" e verifica o <li> pai
    const labelMaoDeObra = screen.getByText('Mão de obra:');
    const liMaoDeObra = labelMaoDeObra.closest('li');
    expect(liMaoDeObra).toHaveTextContent(/60\s*min/);
  });

  it("(f) alterar o simulador para 40% exibe novo preço simulado", async () => {
    const user = userEvent.setup();
    render(<CalculoExplicado payload={payloadMock} />);

    const inputNumero = screen.getByRole("spinbutton", { name: /Valor exato da margem simulada/i });
    await user.clear(inputNumero);
    await user.type(inputNumero, "40");

    // Cálculo: 35.53 / (1 - 0.40) = 59.2166... -> R$ 59,22
    expect(await screen.findByText(/R\$\s*59,22/i)).toBeInTheDocument();
  });

  it("(g) summary 'Como o CustoCerto calcula?' está presente", () => {
    render(<CalculoExplicado payload={payloadMock} />);
    expect(screen.getByText(/Como o CustoCerto calcula\?/i)).toBeInTheDocument();
  });
});