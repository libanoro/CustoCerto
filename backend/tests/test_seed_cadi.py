# backend/tests/test_seed_cadi.py
"""Testes do management command seed_cadi (idempotência e isolamento por usuário)."""

from io import StringIO

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from apps.core.models import Insumo, Receita, ReceitaInsumo
from tests.factories import UserFactory


def _contagens():
    return (
        Insumo.objects.count(),
        Receita.objects.count(),
        ReceitaInsumo.objects.count(),
    )


@pytest.mark.django_db
def test_seed_cadi_idempotente_e_restrito_ao_usuario():
    with pytest.raises(CommandError):
        call_command("seed_cadi", username="inexistente", stdout=StringIO())

    usuario = UserFactory(username="cadi-teste")

    call_command("seed_cadi", username=usuario.username, stdout=StringIO())
    primeira = _contagens()

    call_command("seed_cadi", username=usuario.username, stdout=StringIO())
    segunda = _contagens()

    assert primeira == segunda == (16, 4, 33)
    assert not Insumo.objects.exclude(usuario=usuario).exists()
    assert not Receita.objects.exclude(usuario=usuario).exists()
    assert not ReceitaInsumo.objects.exclude(receita__usuario=usuario).exists()
    assert not ReceitaInsumo.objects.exclude(insumo__usuario=usuario).exists()
