# backend/apps/api/dashboard.py
"""Endpoint de agregação para o dashboard analítico (Marco 8)."""

from decimal import Decimal

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.models import HistoricoCusto

DOIS_DIGITOS = Decimal("0.01")


class DashboardResumoView(APIView):
    """
    GET /api/dashboard/resumo/

    Retorna KPIs globais e séries históricas por receita do usuário autenticado.
    Somente leitura: o HistoricoCusto é a fonte da verdade; nenhum cálculo novo
    é executado aqui, apenas agregação e formatação.
    Multi-tenancy: filtra por usuario=request.user.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Única query, sem N+1: select_related + ordenação cronológica.
        historicos = list(
            HistoricoCusto.objects.filter(usuario=request.user)
            .select_related("receita")
            .order_by("data_calculo", "id")
        )

        # Agrupa por receita preservando a ordem cronológica dos pontos.
        grupos = {}
        for h in historicos:
            grupo = grupos.setdefault(h.receita_id, {"receita": h.receita, "pontos": []})
            grupo["pontos"].append(h)

        receitas = []
        for grupo in grupos.values():
            receita = grupo["receita"]
            pontos = grupo["pontos"]  # já ordenados por data_calculo crescente
            primeiro = pontos[0].custo_total
            ultimo = pontos[-1].custo_total

            variacao = None
            if len(pontos) >= 2 and primeiro > 0:
                variacao = str(
                    ((ultimo - primeiro) / primeiro * Decimal("100")).quantize(
                        DOIS_DIGITOS
                    )
                )

            receitas.append(
                {
                    "id": str(receita.id),
                    "nome": receita.nome,
                    "calculos": len(pontos),
                    "ultimo_custo_total": str(ultimo),
                    "ultimo_preco_sugerido": (
                        str(pontos[-1].preco_sugerido)
                        if pontos[-1].preco_sugerido is not None
                        else None
                    ),
                    "variacao_percentual": variacao,
                    "serie": [
                        {
                            "data_calculo": p.data_calculo.isoformat(),
                            "custo_total": str(p.custo_total),
                            "preco_sugerido": (
                                str(p.preco_sugerido)
                                if p.preco_sugerido is not None
                                else None
                            ),
                        }
                        for p in pontos
                    ],
                }
            )

        calculos_totais = len(historicos)
        custo_medio = None
        if calculos_totais > 0:
            soma = sum((h.custo_total for h in historicos), start=Decimal("0.00"))
            custo_medio = str((soma / calculos_totais).quantize(DOIS_DIGITOS))

        receita_mais_calculada = None
        if receitas:
            receita_mais_calculada = max(receitas, key=lambda r: r["calculos"])["nome"]

        return Response(
            {
                "totais": {
                    "calculos_totais": calculos_totais,
                    "receita_mais_calculada": receita_mais_calculada,
                    "custo_medio": custo_medio,
                },
                "receitas": receitas,
            }
        )