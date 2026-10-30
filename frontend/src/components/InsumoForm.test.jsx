// frontend/src/components/InsumoForm.test.jsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useParams } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import InsumoForm from "./InsumoForm.jsx";
import api from "../services/api.js";

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
    // Correção: useParams deve ser um vi.fn() para aceitar mockReturnValue
    useParams: vi.fn(() => ({})),
  };
});

describe("InsumoForm (Modo Criação)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useParams).mockReturnValue({});
  });

  it("(a) renderiza todos os labels obrigatórios", () => {
    render(<MemoryRouter><InsumoForm /></MemoryRouter>);
    expect(screen.getByLabelText(/Nome do insumo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Unidade de medida/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Quantidade comprada/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Preço de compra/i)).toBeInTheDocument();
  });

  it("(b) submit com campos vazios exibe erros obrigatórios via mock 400", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><InsumoForm /></MemoryRouter>);

    api.post.mockRejectedValueOnce({
      response: { status: 400, data: { nome: ["Este campo é obrigatório."] } },
    });

    await user.click(screen.getByRole("button", { name: /Salvar insumo/i }));
    await waitFor(() => {
      expect(screen.getByText(/Este campo é obrigatório/i)).toBeInTheDocument();
    });
  });

  it("(c) erro 400 mockado do axios exibe mensagem no campo quantidade", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><InsumoForm /></MemoryRouter>);

    await user.type(screen.getByLabelText(/Nome do insumo/i), "Açúcar");
    await user.type(screen.getByLabelText(/Quantidade comprada/i), "0");

    api.post.mockRejectedValueOnce({
      response: { status: 400, data: { quantidade_compra: ["Certifique-se de que este valor seja maior ou igual a 0.001."] } },
    });

    await user.click(screen.getByRole("button", { name: /Salvar insumo/i }));
    await waitFor(() => {
      expect(screen.getByText(/maior ou igual a 0.001/i)).toBeInTheDocument();
    });
  });

  it("(d) submit válido chama axios.post uma vez", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><InsumoForm /></MemoryRouter>);
    api.post.mockResolvedValueOnce({ data: { id: 1, nome: "Farinha" } });

    await user.type(screen.getByLabelText(/Nome do insumo/i), "Farinha");
    await user.type(screen.getByLabelText(/Quantidade comprada/i), "5");
    await user.type(screen.getByLabelText(/Preço de compra/i), "25");
    await user.click(screen.getByRole("button", { name: /Salvar insumo/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(1);
    });
  });
});

describe("InsumoForm (Modo Edição)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useParams).mockReturnValue({ id: "123" });
  });

  it("(e) pré-preenche campos a partir de GET mockado", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        id: "123",
        nome: "Farinha Editada",
        unidade_medida: "KG",
        quantidade_compra: "5.000",
        preco_compra: "28.00",
      },
    });

    render(<MemoryRouter><InsumoForm /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByLabelText(/Nome do insumo/i)).toHaveValue("Farinha Editada");
      expect(screen.getByLabelText(/Preço de compra/i)).toHaveValue(28);
    });
    expect(api.get).toHaveBeenCalledWith("/insumos/123/");
  });

  it("(f) submit chama axios.patch UMA vez com o payload alterado", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({
      data: { id: "123", nome: "Farinha", unidade_medida: "KG", quantidade_compra: "5.000", preco_compra: "25.00" },
    });
    api.patch.mockResolvedValueOnce({ data: { id: "123", nome: "Farinha Nova" } });

    render(<MemoryRouter><InsumoForm /></MemoryRouter>);

    await waitFor(() => expect(screen.getByLabelText(/Nome do insumo/i)).toHaveValue("Farinha"));

    await user.clear(screen.getByLabelText(/Nome do insumo/i));
    await user.type(screen.getByLabelText(/Nome do insumo/i), "Farinha Nova");

    await user.click(screen.getByRole("button", { name: /Salvar alterações/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledTimes(1);
      expect(api.patch).toHaveBeenCalledWith("/insumos/123/", expect.objectContaining({ nome: "Farinha Nova" }));
    });
  });

  it("(g) erro 400 mockado na edição exibe mensagem no campo", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({
      data: { id: "123", nome: "Farinha", unidade_medida: "KG", quantidade_compra: "5.000", preco_compra: "25.00" },
    });
    api.patch.mockRejectedValueOnce({
      response: { status: 400, data: { nome: ["Nome muito curto."] } },
    });

    render(<MemoryRouter><InsumoForm /></MemoryRouter>);
    await waitFor(() => expect(screen.getByLabelText(/Nome do insumo/i)).toHaveValue("Farinha"));

    await user.click(screen.getByRole("button", { name: /Salvar alterações/i }));

    await waitFor(() => {
      expect(screen.getByText(/Nome muito curto/i)).toBeInTheDocument();
    });
  });

  it("(h) 404 mockado na edição exibe mensagem amigável", async () => {
    api.get.mockRejectedValueOnce({ response: { status: 404 } });

    render(<MemoryRouter><InsumoForm /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText(/Registro não encontrado ou não pertence a você/i)).toBeInTheDocument();
    });
  });
});