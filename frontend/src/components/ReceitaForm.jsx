// frontend/src/components/ReceitaForm.jsx
// Formulário acessível (WCAG 2.1 AA) de receita, em modo duplo: criação e edição.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api.js";

const FORM_VAZIO = {
  nome: "",
  rendimento_porcoes: "",
  tempo_preparo_minutos: "",
  custo_hora_mao_obra: "",
  custo_embalagem_porcao: "",
  percentual_custos_variaveis: "",
  margem_desejada: "",
};

function ReceitaForm() {
  const { id } = useParams();
  const modoEdicao = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(FORM_VAZIO);
  const [errors, setErrors] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [carregando, setCarregando] = useState(modoEdicao);
  const [submitting, setSubmitting] = useState(false);

  const tituloRef = useRef(null);
  useEffect(() => {
    if (tituloRef.current) {
      tituloRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (!modoEdicao) return undefined;
    let ativo = true;
    async function carregar() {
      try {
        const resposta = await api.get(`/receitas/${id}/`);
        if (!ativo) return;
        setForm({
          nome: resposta.data.nome,
          rendimento_porcoes: resposta.data.rendimento_porcoes,
          tempo_preparo_minutos: resposta.data.tempo_preparo_minutos,
          custo_hora_mao_obra: resposta.data.custo_hora_mao_obra,
          custo_embalagem_porcao: resposta.data.custo_embalagem_porcao,
          percentual_custos_variaveis: resposta.data.percentual_custos_variaveis,
          margem_desejada: resposta.data.margem_desejada,
        });
      } catch (erro) {
        if (!ativo) return;
        if (erro.response && erro.response.status === 404) {
          setErroCarregamento("Receita não encontrada ou não pertence a você.");
        } else {
          setErroCarregamento("Não foi possível carregar a receita para edição.");
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

    const payload = { ...form };

    try {
      if (modoEdicao) {
        await api.patch(`/receitas/${id}/`, payload);
      } else {
        await api.post("/receitas/", payload);
      }
      navigate("/receitas", {
        state: {
          mensagem: modoEdicao
            ? "Receita atualizada com sucesso."
            : "Receita cadastrada com sucesso.",
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
        setErroGeral("Receita não encontrada ou não pertence a você.");
      } else {
        setErroGeral("Não foi possível salvar a receita. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const titulo = modoEdicao ? "Editar Receita" : "Nova Receita";

  if (erroCarregamento) {
    return (
      <section aria-labelledby="titulo-form">
        <h2 id="titulo-form" ref={tituloRef} tabIndex={-1}>{titulo}</h2>
        <p role="alert" className="form-erro-geral">{erroCarregamento}</p>
        <p><Link to="/receitas" className="botao">Voltar para a lista</Link></p>
      </section>
    );
  }

  return (
    <section aria-labelledby="titulo-form">
      <h2 id="titulo-form" ref={tituloRef} tabIndex={-1}>{titulo}</h2>

      <p aria-live="polite" role="status" className="form-erro-geral">{erroGeral}</p>

      {carregando ? (
        <p role="status">Carregando receita...</p>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-campo">
            <label htmlFor="nome-receita">Nome da receita</label>
            <input id="nome-receita" name="nome" type="text" value={form.nome} onChange={handleChange} required aria-required="true" aria-invalid={errors.nome ? "true" : "false"} aria-describedby={errors.nome ? "erro-nome-receita" : undefined} />
            <span id="erro-nome-receita" className="form-erro" role="alert">{errors.nome || ""}</span>
          </div>

          <div className="form-campo">
            <label htmlFor="rendimento">Rendimento (porções)</label>
            <input id="rendimento" name="rendimento_porcoes" type="number" step="0.01" min="0.01" value={form.rendimento_porcoes} onChange={handleChange} required aria-required="true" aria-invalid={errors.rendimento_porcoes ? "true" : "false"} aria-describedby={errors.rendimento_porcoes ? "erro-rendimento" : undefined} />
            <span id="erro-rendimento" className="form-erro" role="alert">{errors.rendimento_porcoes || ""}</span>
          </div>

          <div className="form-campo">
            <label htmlFor="tempo-preparo">Tempo de preparo (minutos)</label>
            <input id="tempo-preparo" name="tempo_preparo_minutos" type="number" step="1" min="0" value={form.tempo_preparo_minutos} onChange={handleChange} required aria-required="true" aria-invalid={errors.tempo_preparo_minutos ? "true" : "false"} aria-describedby={errors.tempo_preparo_minutos ? "erro-tempo" : undefined} />
            <span id="erro-tempo" className="form-erro" role="alert">{errors.tempo_preparo_minutos || ""}</span>
          </div>

          <div className="form-campo">
            <label htmlFor="custo-hora">Custo hora mão de obra (R$)</label>
            <input id="custo-hora" name="custo_hora_mao_obra" type="number" step="0.01" min="0" value={form.custo_hora_mao_obra} onChange={handleChange} required aria-required="true" aria-invalid={errors.custo_hora_mao_obra ? "true" : "false"} aria-describedby={errors.custo_hora_mao_obra ? "erro-custo-hora" : undefined} />
            <span id="erro-custo-hora" className="form-erro" role="alert">{errors.custo_hora_mao_obra || ""}</span>
          </div>

          <div className="form-campo">
            <label htmlFor="custo-embalagem">Custo embalagem por porção (R$)</label>
            <input id="custo-embalagem" name="custo_embalagem_porcao" type="number" step="0.01" min="0" value={form.custo_embalagem_porcao} onChange={handleChange} required aria-required="true" aria-invalid={errors.custo_embalagem_porcao ? "true" : "false"} aria-describedby={errors.custo_embalagem_porcao ? "erro-embalagem" : undefined} />
            <span id="erro-embalagem" className="form-erro" role="alert">{errors.custo_embalagem_porcao || ""}</span>
          </div>

          <div className="form-campo">
            <label htmlFor="custos-variaveis">Custos variáveis (%)</label>
            <input id="custos-variaveis" name="percentual_custos_variaveis" type="number" step="0.01" min="0" value={form.percentual_custos_variaveis} onChange={handleChange} required aria-required="true" aria-invalid={errors.percentual_custos_variaveis ? "true" : "false"} aria-describedby={errors.percentual_custos_variaveis ? "erro-variaveis" : undefined} />
            <span id="erro-variaveis" className="form-erro" role="alert">{errors.percentual_custos_variaveis || ""}</span>
          </div>

          <div className="form-campo">
            <label htmlFor="margem">Margem desejada (%)</label>
            <input id="margem" name="margem_desejada" type="number" step="0.01" min="0" max="99.99" value={form.margem_desejada} onChange={handleChange} required aria-required="true" aria-invalid={errors.margem_desejada ? "true" : "false"} aria-describedby={errors.margem_desejada ? "erro-margem" : undefined} />
            <span id="erro-margem" className="form-erro" role="alert">{errors.margem_desejada || ""}</span>
          </div>

          <div className="form-acoes">
            <button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : modoEdicao ? "Salvar alterações" : "Salvar receita"}
            </button>
            <Link to="/receitas" className="botao botao-cancelar">Cancelar</Link>
          </div>
        </form>
      )}
    </section>
  );
}

export default ReceitaForm;