# backend/apps/api/views.py
"""ViewSets da API REST do CustoCerto (Marcos 2, 4, 5 e 6)."""

from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.models import HistoricoCusto, Insumo, Receita, ReceitaInsumo
from apps.costing.services import calcular_custo_receita

from .serializers import (
    HistoricoCustoSerializer,
    InsumoSerializer,
    ReceitaInsumoSerializer,
    ReceitaSerializer,
)


class InsumoViewSet(viewsets.ModelViewSet):
    serializer_class = InsumoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Insumo.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class ReceitaViewSet(viewsets.ModelViewSet):
    serializer_class = ReceitaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Receita.objects.filter(usuario=self.request.user).prefetch_related(
            "itens__insumo"
        )

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    @action(detail=True, methods=["post"], url_path="calcular-custo")
    def calcular_custo(self, request, pk=None):
        receita = self.get_object()
        resultado = calcular_custo_receita(receita)

        itens = [
            {
                "nome_insumo": item.insumo.nome,
                "unidade": item.insumo.unidade_medida,
                "quantidade_usada": str(item.quantidade),
                "custo_unitario": str(item.insumo.custo_por_unidade),
                "subtotal": str(item.custo_estimado),
            }
            for item in receita.itens.all()
        ]

        parametros = {
            "tempo_preparo_minutos": receita.tempo_preparo_minutos,
            "custo_hora_mao_obra": str(receita.custo_hora_mao_obra),
            "rendimento_porcoes": str(receita.rendimento_porcoes),
            "custo_embalagem_porcao": str(receita.custo_embalagem_porcao),
            "percentual_custos_variaveis": str(receita.percentual_custos_variaveis),
            "margem_desejada": str(receita.margem_desejada),
        }

        snapshot = {
            "rendimento_porcoes": str(receita.rendimento_porcoes),
            "tempo_preparo_minutos": receita.tempo_preparo_minutos,
            "custo_hora_mao_obra": str(receita.custo_hora_mao_obra),
            "custo_embalagem_porcao": str(receita.custo_embalagem_porcao),
            "percentual_custos_variaveis": str(receita.percentual_custos_variaveis),
            "margem_desejada": str(receita.margem_desejada),
            "itens": [
                {
                    "insumo_nome": i["nome_insumo"],
                    "quantidade_utilizada": i["quantidade_usada"],
                    "custo_unitario_insumo": i["custo_unitario"],
                    "custo_estimado_item": i["subtotal"],
                }
                for i in itens
            ],
        }

        historico = HistoricoCusto.objects.create(
            receita=receita,
            usuario=request.user,
            custo_materia_prima=resultado["custo_materia_prima"],
            custo_mao_obra=resultado["custo_mao_obra"],
            custo_embalagem=resultado["custo_embalagem"],
            custos_variaveis=resultado["custos_variaveis"],
            custo_total=resultado["custo_total"],
            preco_sugerido=resultado["preco_sugerido"],
            parametros=snapshot,
        )

        preco_sugerido_retorno = (
            str(resultado["preco_sugerido"])
            if resultado["preco_sugerido"] is not None
            else None
        )

        return Response(
            {
                "historico_id": str(historico.id),
                "custo_materia_prima": str(resultado["custo_materia_prima"]),
                "custo_mao_obra": str(resultado["custo_mao_obra"]),
                "custo_embalagem": str(resultado["custo_embalagem"]),
                "custos_variaveis": str(resultado["custos_variaveis"]),
                "custo_total": str(resultado["custo_total"]),
                "preco_sugerido": preco_sugerido_retorno,
                "itens": itens,
                "parametros": parametros,
            },
            status=status.HTTP_200_OK,
        )


class ReceitaInsumoViewSet(viewsets.ModelViewSet):
    serializer_class = ReceitaInsumoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ReceitaInsumo.objects.filter(receita__usuario=self.request.user)

    def perform_create(self, serializer):
        receita = serializer.validated_data.get("receita")
        insumo = serializer.validated_data.get("insumo")
        if receita.usuario != self.request.user or insumo.usuario != self.request.user:
            raise serializers.ValidationError(
                "Você só pode associar seus próprios insumos às suas próprias receitas."
            )
        serializer.save()


class HistoricoCustoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = HistoricoCustoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return HistoricoCusto.objects.filter(usuario=self.request.user)