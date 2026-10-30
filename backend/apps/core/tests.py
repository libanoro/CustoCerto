# backend/apps/core/tests.py
"""Testes unitários dos models de domínio (Marco 1)."""

from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

from apps.core.models import Insumo, ReceitaInsumo


@pytest.mark.django_db
def test_custo_por_unidade_farinha(insumo_farinha):
    """25,00 pagos por 5,000 kg resultam em 5,0000 por kg."""
    assert insumo_farinha.custo_por_unidade == Decimal("5.0000")


@pytest.mark.django_db
def test_custo_estimado_receita_insumo(insumo_farinha, receita_bolo):
    """0,250 kg de farinha a 5,0000/kg resultam em R$ 1,25 na receita."""
    item = ReceitaInsumo.objects.create(
        receita=receita_bolo,
        insumo=insumo_farinha,
        quantidade=Decimal("0.250"),
    )
    assert item.custo_estimado == Decimal("1.25")


@pytest.mark.django_db
def test_quantidade_compra_zero_levanta_validation_error():
    """Insumo com quantidade_compra <= 0 não pode passar pela validação."""
    insumo = Insumo(
        nome="Açúcar",
        unidade_medida=Insumo.UnidadeMedida.KG,
        quantidade_compra=Decimal("0.000"),
        preco_compra=Decimal("10.00"),
    )
    with pytest.raises(ValidationError) as exc:
        insumo.full_clean(exclude=["usuario"])
    assert "quantidade_compra" in exc.value.message_dict