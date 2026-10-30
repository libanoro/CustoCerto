# backend/tests/factories.py
"""Factories para os testes do backend (factory-boy)."""

import factory
from django.contrib.auth import get_user_model


class UserFactory(factory.django.DjangoModelFactory):
    """Cria usuários de teste sem depender de fixtures de banco."""

    class Meta:
        model = get_user_model()

    username = factory.Sequence(lambda n: f"usuario-{n}")
    email = factory.LazyAttribute(lambda o: f"{o.username}@custocerto.local")
    password = factory.PostGenerationMethodCall("set_password", "senha-forte-123")