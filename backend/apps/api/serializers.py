# backend/apps/api/serializers.py
"""Serializers da API REST do CustoCerto (Marcos 2, 4 e 5)."""

from decimal import Decimal

from rest_framework import serializers

from apps.core.models import HistoricoCusto, Insumo, Receita, ReceitaInsumo


class InsumoSerializer(serializers.ModelSerializer):
    """Serializer de Insumo com a property custo_por_unidade exposta como somente-leitura."""

    custo_por_unidade = serializers.DecimalField(
        max_digits=12,
        decimal_places=4,
        read_only=True,
        help_text="Custo proporcional por unidade de medida.",
    )

    class Meta:
        model = Insumo
        fields = [
            "id",
            "usuario",
            "nome",
            "unidade_medida",
            "quantidade_compra",
            "preco_compra",
            "data_compra",
            "perecivel",
            "criado_em",
            "atualizado_em",
            "custo_por_unidade",
        ]
        # 'usuario' é read_only pois é injetado via perform_create no ViewSet.
        read_only_fields = [
            "id",
            "criado_em",
            "atualizado_em",
            "custo_por_unidade",
            "usuario",
        ]


class ReceitaInsumoSerializer(serializers.ModelSerializer):
    """Serializer do relacionamento N:N com custo fracionado calculado."""

    custo_estimado = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
        help_text="Custo estimado do insumo dentro desta receita.",
    )
    nome_insumo = serializers.CharField(source="insumo.nome", read_only=True)

    class Meta:
        model = ReceitaInsumo
        fields = [
            "id",
            "receita",
            "insumo",
            "quantidade",
            "observacao",
            "criado_em",
            "custo_estimado",
            "nome_insumo",
        ]
        read_only_fields = ["id", "criado_em", "custo_estimado", "nome_insumo"]


class ReceitaSerializer(serializers.ModelSerializer):
    """Serializer de Receita com custo total atual e itens associados expostos."""

    custo_total_atual = serializers.SerializerMethodField(
        help_text="Soma dos custos estimados de todos os itens da receita.",
    )
    itens = ReceitaInsumoSerializer(many=True, read_only=True)

    class Meta:
        model = Receita
        fields = [
            "id",
            "usuario",
            "nome",
            "rendimento_porcoes",
            "tempo_preparo_minutos",
            "custo_hora_mao_obra",
            "custo_embalagem_porcao",
            "percentual_custos_variaveis",
            "margem_desejada",
            "ativo",
            "criado_em",
            "atualizado_em",
            "custo_total_atual",
            "itens",
        ]
        # 'usuario' é read_only pois é injetado via perform_create no ViewSet.
        read_only_fields = [
            "id",
            "criado_em",
            "atualizado_em",
            "custo_total_atual",
            "usuario",
        ]

    def get_custo_total_atual(self, obj: Receita) -> Decimal:
        """Soma o custo_estimado de todos os ReceitaInsumo associados à receita."""
        return sum(
            (item.custo_estimado for item in obj.itens.all()),
            start=Decimal("0.00"),
        )


class HistoricoCustoSerializer(serializers.ModelSerializer):
    """Serializer imutável do histórico com nomes derivados da receita e do usuário."""

    nome_receita = serializers.CharField(source="receita.nome", read_only=True)
    nome_usuario = serializers.CharField(source="usuario.username", read_only=True)

    class Meta:
        model = HistoricoCusto
        fields = [
            "id",
            "receita",
            "usuario",
            "data_calculo",
            "custo_materia_prima",
            "custo_mao_obra",
            "custo_embalagem",
            "custos_variaveis",
            "custo_total",
            "preco_sugerido",
            "parametros",
            "nome_receita",
            "nome_usuario",
        ]
        read_only_fields = fields