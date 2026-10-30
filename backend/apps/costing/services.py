# backend/apps/costing/services.py

from decimal import Decimal


def calcular_custo_receita(receita):
    """
    Calcula o custo total e o preço sugerido de uma receita.

    Fórmula:
        custo_materia_prima = soma(quantidade * custo_por_unidade)
        custo_mao_obra = (tempo_preparo_minutos / 60) * custo_hora_mao_obra
        custo_embalagem = rendimento_porcoes * custo_embalagem_porcao
        custos_variaveis = subtotal * percentual_custos_variaveis / 100
        custo_total = materia_prima + mao_obra + embalagem + custos_variaveis
        preco_sugerido = custo_total / (1 - margem_desejada / 100)
    """

    itens = receita.itens.select_related("insumo").all()

    custo_materia_prima = Decimal("0.00")

    for item in itens:
        custo_item = item.quantidade * item.insumo.custo_por_unidade
        custo_materia_prima += custo_item

    custo_materia_prima = custo_materia_prima.quantize(Decimal("0.01"))

    custo_mao_obra = (
        Decimal(receita.tempo_preparo_minutos) / Decimal("60")
    ) * receita.custo_hora_mao_obra
    custo_mao_obra = custo_mao_obra.quantize(Decimal("0.01"))

    custo_embalagem = (
        receita.rendimento_porcoes * receita.custo_embalagem_porcao
    ).quantize(Decimal("0.01"))

    subtotal = custo_materia_prima + custo_mao_obra + custo_embalagem

    custos_variaveis = (
        subtotal * receita.percentual_custos_variaveis / Decimal("100.00")
    ).quantize(Decimal("0.01"))

    custo_total = (subtotal + custos_variaveis).quantize(Decimal("0.01"))

    preco_sugerido = None

    if receita.margem_desejada < Decimal("100.00"):
        preco_sugerido = custo_total / (
            Decimal("1.00") - receita.margem_desejada / Decimal("100.00")
        )
        preco_sugerido = preco_sugerido.quantize(Decimal("0.01"))

    return {
        "custo_materia_prima": custo_materia_prima,
        "custo_mao_obra": custo_mao_obra,
        "custo_embalagem": custo_embalagem,
        "custos_variaveis": custos_variaveis,
        "custo_total": custo_total,
        "preco_sugerido": preco_sugerido,
    }