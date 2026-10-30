# backend/conftest.py
"""Configurações e fixtures compartilhadas dos testes do backend."""

import os
from decimal import Decimal

import pytest

# Se o settings ainda não foi carregado, ele já nasce em modo de teste.
os.environ["TESTING"] = "True"


def pytest_configure(config):
    """
    Garante que os testes automatizados usem SQLite em memória,
    honrando a flag TESTING. O MySQL local nunca é tocado pelos testes.
    """
    from django.conf import settings

    settings.TESTING = True
    settings.DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }


@pytest.fixture
def usuario(db):
    from django.contrib.auth import get_user_model

    return get_user_model().objects.create_user(
        username="confeiteira",
        email="confeiteira@custocerto.local",
        password="senha-forte-123",
    )


@pytest.fixture
def insumo_farinha(db, usuario):
    from apps.core.models import Insumo

    return Insumo.objects.create(
        usuario=usuario,
        nome="Farinha de trigo",
        unidade_medida=Insumo.UnidadeMedida.KG,
        quantidade_compra=Decimal("5.000"),
        preco_compra=Decimal("25.00"),
    )


@pytest.fixture
def receita_bolo(db, usuario):
    from apps.core.models import Receita

    return Receita.objects.create(
        usuario=usuario,
        nome="Bolo de cenoura",
        rendimento_porcoes=Decimal("10.00"),
        tempo_preparo_minutos=60,
        custo_hora_mao_obra=Decimal("20.00"),
        custo_embalagem_porcao=Decimal("0.50"),
        percentual_custos_variaveis=Decimal("10.00"),
        margem_desejada=Decimal("30.00"),
    )