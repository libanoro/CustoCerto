# backend/apps/core/admin.py

from django.contrib import admin

from .models import HistoricoCusto, Insumo, Receita, ReceitaInsumo


@admin.register(Insumo)
class InsumoAdmin(admin.ModelAdmin):
    list_display = (
        "nome",
        "unidade_medida",
        "quantidade_compra",
        "preco_compra",
        "custo_por_unidade",
        "perecivel",
        "atualizado_em",
    )
    list_filter = ("unidade_medida", "perecivel")
    search_fields = ("nome",)
    readonly_fields = ("id", "criado_em", "atualizado_em")
    ordering = ("nome",)


@admin.register(Receita)
class ReceitaAdmin(admin.ModelAdmin):
    list_display = (
        "nome",
        "rendimento_porcoes",
        "tempo_preparo_minutos",
        "percentual_custos_variaveis",
        "margem_desejada",
        "ativo",
    )
    list_filter = ("ativo",)
    search_fields = ("nome",)
    readonly_fields = ("id", "criado_em", "atualizado_em")
    ordering = ("nome",)


@admin.register(ReceitaInsumo)
class ReceitaInsumoAdmin(admin.ModelAdmin):
    list_display = ("receita", "insumo", "quantidade", "custo_estimado")
    list_select_related = ("receita", "insumo")
    search_fields = ("receita__nome", "insumo__nome")
    readonly_fields = ("id", "criado_em")


@admin.register(HistoricoCusto)
class HistoricoCustoAdmin(admin.ModelAdmin):
    # Histórico é imutável: somente leitura e sem criação manual pelo Admin.
    list_display = (
        "receita",
        "usuario",
        "data_calculo",
        "custo_total",
        "preco_sugerido",
    )
    list_select_related = ("receita", "usuario")
    search_fields = ("receita__nome",)
    readonly_fields = [field.name for field in HistoricoCusto._meta.fields]

    def has_add_permission(self, request):
        return False