// frontend/src/components/InsumoForm.jsx
// Formulário acessível (WCAG 2.1 AA) de insumo, em modo duplo: criação e edição.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api.js";

const UNIDADES = [
  { valor: "KG", rotulo: "Quilograma" },
  { valor: "G", rotulo: "Grama" },
  { valor: "L", rotulo: "Litro" },
  { valor: "ML", rotulo: "Mililitro" },
  { valor: "UN", rotulo: "Unidade" },
  { valor: "DZ", rotulo: "Dúzia" },
];

const FORM_VAZIO = {
  nome: "",
  unidade_medida: "KG",
  quantidade_compra: "",
  preco_compra: "",
};

function InsumoForm() {
  const { id } = useParams();
  const modoEdicao = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(FORM_VAZIO);
  const [errors, setErrors] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [carregando, setCarregando] = useState(modoEdicao);
  const [submitting, setSubmitting] = useState(false);

  // Acessibilidade: ao montar a página, move o foco para o título (tabIndex -1).
  const tituloRef = useRef(null);
  useEffect(() => {
    if (tituloRef.current) {
      tituloRef.current.focus();
    }
  }, []);

  // Modo edição: pré-preenche o formulário com GET /api/insumos/{id}/.
  useEffect(() => {
    if (!modoEdicao) return undefined;
    let ativo = true;
    async function carregar() {
      try {
        const resposta = await api.get(`/insumos/${id}/`);
        if (!ativo) return;
        setForm({
          nome: resposta.data.nome,
          unidade_medida: resposta.data.unidade_medida,
          quantidade_compra: resposta.data.quantidade_compra,
          preco_compra: resposta.data.preco_compra,
        });
      } catch (erro) {
        if (!ativo) return;
        if (erro.response && erro.response.status === 404) {
          setErroCarregamento("Registro não encontrado ou não pertence a você.");
        } else {
          setErroCarregamento("Não foi possível carregar o insumo para edição.");
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    carregar();
    return () => {
      ativo = false;
    };
  }, [id, modoEdicao]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((atual) => ({ ...atual, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    setErroGeral("");
    setSubmitting(true);

    // O campo usuario NÃO é enviado: o backend injeta via perform_create.
    const payload = {
      nome: form.nome,
      unidade_medida: form.unidade_medida,
      quantidade_compra: form.quantidade_compra,
      preco_compra: form.preco_compra,
    };

    try {
      if (modoEdicao) {
        await api.patch(`/insumos/${id}/`, payload);
      } else {
        await api.post("/insumos/", payload);
      }
      navigate("/", {
        state: {
          mensagem: modoEdicao
            ? "Insumo atualizado com sucesso."
            : "Insumo cadastrado com sucesso.",
        },
      });
    } catch (erro) {
      if (erro.response && erro.response.status === 400) {
        const dados = erro.response.data;
        const mapeados = {};
        Object.keys(dados).forEach((campo) => {
          if (Array.isArray(dados[campo]) && dados[campo].length > 0) {
            mapeados[campo] = dados[campo][0];
          }
        });
        setErrors(mapeados);
      } else if (erro.response && erro.response.status === 404) {
        setErroGeral("Registro não encontrado ou não pertence a você.");
      } else {
        setErroGeral("Não foi possível salvar o insumo. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const titulo = modoEdicao ? "Editar Insumo" : "Novo Insumo";

  if (erroCarregamento) {
    return (
      <section aria-labelledby="titulo-form">
        <h2 id="titulo-form" ref={tituloRef} tabIndex={-1}>
          {titulo}
        </h2>
        <p role="alert" className="form-erro-geral">
          {erroCarregamento}
        </p>
        <p>
          <Link to="/" className="botao">
            Voltar para a lista
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="titulo-form">
      <h2 id="titulo-form" ref={tituloRef} tabIndex={-1}>
        {titulo}
      </h2>

      <p aria-live="polite" role="status" className="form-erro-geral">
        {erroGeral}
      </p>

      {carregando ? (
        <p role="status">Carregando insumo...</p>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-campo">
            <label htmlFor="nome-insumo">Nome do insumo</label>
            <input
              id="nome-insumo"
              name="nome"
              type="text"
              value={form.nome}
              onChange={handleChange}
              required
              aria-required="true"
              aria-invalid={errors.nome ? "true" : "false"}
              aria-describedby={errors.nome ? "erro-nome-insumo" : undefined}
            />
            <span id="erro-nome-insumo" className="form-erro" role="alert">
              {errors.nome || ""}
            </span>
          </div>

          <div className="form-campo">
            <label htmlFor="unidade-medida">Unidade de medida</label>
            <select
              id="unidade-medida"
              name="unidade_medida"
              value={form.unidade_medida}
              onChange={handleChange}
              required
              aria-required="true"
            >
              {UNIDADES.map((u) => (
                <option key={u.valor} value={u.valor}>
                  {u.rotulo}
                </option>
              ))}
            </select>
          </div>

          <div className="form-campo">
            <label htmlFor="quantidade-compra">Quantidade comprada</label>
            <input
              id="quantidade-compra"
              name="quantidade_compra"
              type="number"
              step="0.001"
              min="0"
              value={form.quantidade_compra}
              onChange={handleChange}
              required
              aria-required="true"
              aria-invalid={errors.quantidade_compra ? "true" : "false"}
              aria-describedby={
                errors.quantidade_compra ? "erro-quantidade-compra" : undefined
              }
            />
            <span id="erro-quantidade-compra" className="form-erro" role="alert">
              {errors.quantidade_compra || ""}
            </span>
          </div>

          <div className="form-campo">
            <label htmlFor="preco-compra">Preço de compra (R$)</label>
            <input
              id="preco-compra"
              name="preco_compra"
              type="number"
              step="0.01"
              min="0"
              value={form.preco_compra}
              onChange={handleChange}
              required
              aria-required="true"
              aria-invalid={errors.preco_compra ? "true" : "false"}
              aria-describedby={errors.preco_compra ? "erro-preco-compra" : undefined}
            />
            <span id="erro-preco-compra" className="form-erro" role="alert">
              {errors.preco_compra || ""}
            </span>
          </div>

          <div className="form-acoes">
            <button type="submit" disabled={submitting}>
              {submitting
                ? "Salvando..."
                : modoEdicao
                  ? "Salvar alterações"
                  : "Salvar insumo"}
            </button>
            <Link to="/" className="botao botao-cancelar">
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </section>
  );
}

export default InsumoForm;