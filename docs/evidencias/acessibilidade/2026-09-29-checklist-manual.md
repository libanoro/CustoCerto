# Checklist Manual de Acessibilidade — CustoCerto (WCAG 2.1 AA)

- **Data:** 29/09/2026
- **Avaliador:** Thiago (líder técnico)
- **Escopo:** rotas `/insumos`, `/receitas/{id}` (com cálculo exibido) e `/dashboard`, sessão logada como `cadi`
- **Ferramentas:** teclado físico, Windows Narrator (Win+Ctrl+Enter), Chrome DevTools
- **Evidências automatizadas complementares:** eslint-plugin-jsx-a11y (0 errors), jest-axe (3 componentes sem violações), Lighthouse Acessibilidade 100/100/100 em 28/09/2026

| # | Item | Como testar | Resultado |
|---|------|-------------|-----------|
| 1 | Navegação só por teclado | Sem mouse: Tab/Shift+Tab percorrem todos os interativos; Enter/Space ativam botões e links. Fluxo completo: login → lista de insumos → abrir formulário → salvar. Nenhum ponto inalcançável ou foco preso. | ✅ Aprovado |
| 2 | Foco visível | A cada Tab, o contorno laranja de 3px (`--cor-foco`) aparece no elemento focado (links, botões, inputs, select, summary). | ✅ Aprovado |
| 3 | Skip link | Com a página recém-carregada, pressione Tab uma vez: o link "Pular para o conteúdo principal" torna-se visível no topo; Enter move o foco para o `<main>`. | ✅ Aprovado |
| 4 | Labels de todos os campos | Com Narrator ligado, Tab até cada campo dos formulários de insumo e receita: o leitor anuncia o rótulo completo (ex.: "Preço de compra (R$)"); visualmente, todo input tem label visível. | ✅ Aprovado |
| 5 | Erros anunciados | Submeta o formulário de insumo vazio: as mensagens aparecem nos campos e o Narrator anuncia automaticamente (`role="alert"`); o anúncio geral usa `aria-live="polite"`. | ✅ Aprovado |
| 6 | Resultado do cálculo legível por leitor de tela | Com Narrator ligado, após "Calcular Custo da Receita": o anúncio "Cálculo de custo concluído." é falado; navegando com as setas, a tabela de itemização, as fórmulas e os totais são lidos em ordem lógica; o `<details>` "Como o CustoCerto calcula?" abre com Enter. | ✅ Aprovado |
| 7 | Contraste mínimo | Validado automaticamente pelo Lighthouse (audit `color-contrast` em PASSED AUDITS, score 100 nas 3 rotas em 28/09/2026). Confirmação visual: texto `#1f2328` sobre `#ffffff`; cabeçalhos brancos sobre `#0b5394`. | ✅ Validado por Lighthouse (28/09/2026) |

## Procedimento de preenchimento
1. Execute os testes na ordem acima com sessão logada.
2. Marque cada Resultado como Aprovado ou Reprovado + observação.
3. Em caso de reprovação, registre o incidente e acione o desenvolvedor antes do commit do Marco 9.