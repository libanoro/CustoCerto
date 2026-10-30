# backend/tests/test_api.py
"""Testes de integração da API REST do CustoCerto (Marcos 2, 4, 5 e 6)."""

from decimal import Decimal

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import HistoricoCusto, Insumo, Receita, ReceitaInsumo
from tests.factories import UserFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
def test_get_insumos_retorna_200(api_client):
    usuario = UserFactory()
    api_client.force_authenticate(user=usuario)
    response = api_client.get("/api/insumos/")
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_post_insumo_cria_com_sucesso(api_client):
    usuario = UserFactory()
    api_client.force_authenticate(user=usuario)
    payload = {
        "nome": "Farinha de trigo",
        "unidade_medida": "KG",
        "quantidade_compra": "5.000",
        "preco_compra": "25.00",
    }
    response = api_client.post("/api/insumos/", payload, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["nome"] == "Farinha de trigo"
    assert data["custo_por_unidade"] == "5.0000"
    assert data["usuario"] == usuario.id


@pytest.mark.django_db
def test_post_insumo_rejeita_quantidade_zero(api_client):
    usuario = UserFactory()
    api_client.force_authenticate(user=usuario)
    payload = {
        "nome": "Açúcar",
        "unidade_medida": "KG",
        "quantidade_compra": "0.000",
        "preco_compra": "10.00",
    }
    response = api_client.post("/api/insumos/", payload, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_calcular_custo_bolo_cenoura(api_client):
    usuario = UserFactory()
    api_client.force_authenticate(user=usuario)

    farinha = Insumo.objects.create(usuario=usuario, nome="Farinha de trigo", unidade_medida=Insumo.UnidadeMedida.KG,
                                    quantidade_compra=Decimal("5.000"), preco_compra=Decimal("25.00"))
    ovos = Insumo.objects.create(usuario=usuario, nome="Ovos", unidade_medida=Insumo.UnidadeMedida.UN,
                                 quantidade_compra=Decimal("12.000"), preco_compra=Decimal("10.80"))
    leite = Insumo.objects.create(usuario=usuario, nome="Leite", unidade_medida=Insumo.UnidadeMedida.ML,
                                  quantidade_compra=Decimal("1000.000"), preco_compra=Decimal("5.00"))

    receita = Receita.objects.create(usuario=usuario, nome="Bolo de cenoura", rendimento_porcoes=Decimal("10.00"),
                                     tempo_preparo_minutos=60, custo_hora_mao_obra=Decimal("20.00"),
                                     custo_embalagem_porcao=Decimal("0.50"),
                                     percentual_custos_variaveis=Decimal("10.00"), margem_desejada=Decimal("30.00"))

    ReceitaInsumo.objects.create(receita=receita, insumo=farinha, quantidade=Decimal("0.250"))
    ReceitaInsumo.objects.create(receita=receita, insumo=ovos, quantidade=Decimal("3.000"))
    ReceitaInsumo.objects.create(receita=receita, insumo=leite, quantidade=Decimal("300.000"))

    response = api_client.post(f"/api/receitas/{receita.id}/calcular-custo/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["custo_materia_prima"] == "5.45"
    historico = HistoricoCusto.objects.get(receita=receita)
    assert data["historico_id"] == str(historico.id)


@pytest.mark.django_db
def test_calcular_custo_bolo_cenoura_completo(api_client):
    usuario = UserFactory()
    api_client.force_authenticate(user=usuario)

    farinha = Insumo.objects.create(usuario=usuario, nome="Farinha de trigo", unidade_medida=Insumo.UnidadeMedida.KG,
                                    quantidade_compra=Decimal("5.000"), preco_compra=Decimal("25.00"))
    ovos = Insumo.objects.create(usuario=usuario, nome="Ovos", unidade_medida=Insumo.UnidadeMedida.UN,
                                 quantidade_compra=Decimal("12.000"), preco_compra=Decimal("12.00"))
    leite = Insumo.objects.create(usuario=usuario, nome="Leite", unidade_medida=Insumo.UnidadeMedida.ML,
                                  quantidade_compra=Decimal("1000.000"), preco_compra=Decimal("6.00"))

    receita = Receita.objects.create(usuario=usuario, nome="Bolo de Cenoura", rendimento_porcoes=Decimal("10.00"),
                                     tempo_preparo_minutos=60, custo_hora_mao_obra=Decimal("20.00"),
                                     custo_embalagem_porcao=Decimal("0.50"),
                                     percentual_custos_variaveis=Decimal("10.00"), margem_desejada=Decimal("30.00"))

    ReceitaInsumo.objects.create(receita=receita, insumo=farinha, quantidade=Decimal("0.500"))
    ReceitaInsumo.objects.create(receita=receita, insumo=ovos, quantidade=Decimal("3.000"))
    ReceitaInsumo.objects.create(receita=receita, insumo=leite, quantidade=Decimal("300.000"))

    response = api_client.post(f"/api/receitas/{receita.id}/calcular-custo/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["custo_materia_prima"] == "7.30"


@pytest.mark.django_db
def test_isolamento_de_dados_entre_usuarios(api_client):
    user_a = UserFactory()
    user_b = UserFactory()

    client_a = APIClient()
    client_a.force_authenticate(user=user_a)
    response_create = client_a.post("/api/insumos/", {"nome": "Ingrediente Secreto", "unidade_medida": "KG",
                                                      "quantidade_compra": "1.000", "preco_compra": "10.00"},
                                    format="json")
    assert response_create.status_code == status.HTTP_201_CREATED
    insumo_id = response_create.json()["id"]

    api_client.force_authenticate(user=user_b)
    response_list = api_client.get("/api/insumos/")
    assert response_list.status_code == status.HTTP_200_OK
    assert response_list.json() == []

    response_detail = api_client.get(f"/api/insumos/{insumo_id}/")
    assert response_detail.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_calcular_custo_retorna_itens_detalhados(api_client):
    """Marco 6: Verifica se a action retorna a lista 'itens' e 'parametros' e se a soma bate."""
    usuario = UserFactory()
    api_client.force_authenticate(user=usuario)

    farinha = Insumo.objects.create(usuario=usuario, nome="Farinha", unidade_medida=Insumo.UnidadeMedida.KG,
                                    quantidade_compra=Decimal("5.000"), preco_compra=Decimal("25.00"))
    ovos = Insumo.objects.create(usuario=usuario, nome="Ovos", unidade_medida=Insumo.UnidadeMedida.UN,
                                 quantidade_compra=Decimal("12.000"), preco_compra=Decimal("12.00"))
    leite = Insumo.objects.create(usuario=usuario, nome="Leite", unidade_medida=Insumo.UnidadeMedida.ML,
                                  quantidade_compra=Decimal("1000.000"), preco_compra=Decimal("6.00"))

    receita = Receita.objects.create(
        usuario=usuario, nome="Bolo Teste", rendimento_porcoes=Decimal("10.00"),
        tempo_preparo_minutos=60, custo_hora_mao_obra=Decimal("20.00"),
        custo_embalagem_porcao=Decimal("0.50"), percentual_custos_variaveis=Decimal("10.00"),
        margem_desejada=Decimal("30.00"),
    )

    ReceitaInsumo.objects.create(receita=receita, insumo=farinha, quantidade=Decimal("0.500"))
    ReceitaInsumo.objects.create(receita=receita, insumo=ovos, quantidade=Decimal("3.000"))
    ReceitaInsumo.objects.create(receita=receita, insumo=leite, quantidade=Decimal("300.000"))

    response = api_client.post(f"/api/receitas/{receita.id}/calcular-custo/")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    # Validações aditivas do Marco 6
    assert "itens" in data
    assert len(data["itens"]) == 3

    soma_subtotais = sum(Decimal(item["subtotal"]) for item in data["itens"])
    assert soma_subtotais == Decimal(data["custo_materia_prima"])

    assert "parametros" in data
    assert data["parametros"]["tempo_preparo_minutos"] == 60
    assert data["parametros"]["rendimento_porcoes"] == "10.00"


@pytest.mark.django_db
def test_usuario_nao_consegue_editar_insumo_de_outro(api_client):
    """Marco 7: Multi-tenancy em PATCH. User B não pode editar insumo de User A."""
    user_a = UserFactory()
    user_b = UserFactory()

    # User A cria o insumo (via ORM para simplificar)
    insumo_a = Insumo.objects.create(
        usuario=user_a,
        nome="Segredo de A",
        unidade_medida=Insumo.UnidadeMedida.KG,
        quantidade_compra=Decimal("1.000"),
        preco_compra=Decimal("10.00"),
    )

    # User B autenticado tenta editar o insumo de A via PATCH
    api_client.force_authenticate(user=user_b)
    response = api_client.patch(
        f"/api/insumos/{insumo_a.id}/",
        {"nome": "Tentativa de B", "preco_compra": "99.99"},
        format="json",
    )

    # O get_queryset filtra por usuario=request.user, então o objeto "não existe" para User B
    assert response.status_code == status.HTTP_404_NOT_FOUND

    # Confirma no banco que o insumo NÃO foi alterado
    insumo_a.refresh_from_db()
    assert insumo_a.nome == "Segredo de A"
    assert insumo_a.preco_compra == Decimal("10.00")


@pytest.mark.django_db
def test_dashboard_exige_autenticacao(api_client):
    """Marco 8: GET /api/dashboard/resumo/ sem token deve retornar 401."""
    response = api_client.get("/api/dashboard/resumo/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_dashboard_isola_usuarios(api_client):
    """Marco 8: User B não vê séries de User A no dashboard."""
    user_a = UserFactory()
    user_b = UserFactory()

    receita_a = Receita.objects.create(
        usuario=user_a, nome="Bolo de A", rendimento_porcoes=Decimal("10.00"),
        tempo_preparo_minutos=60, custo_hora_mao_obra=Decimal("20.00"),
        custo_embalagem_porcao=Decimal("0.50"), percentual_custos_variaveis=Decimal("10.00"),
        margem_desejada=Decimal("30.00"),
    )
    HistoricoCusto.objects.create(
        receita=receita_a, usuario=user_a,
        custo_materia_prima=Decimal("10.00"), custo_mao_obra=Decimal("20.00"),
        custo_embalagem=Decimal("5.00"), custos_variaveis=Decimal("3.50"),
        custo_total=Decimal("38.50"), preco_sugerido=Decimal("55.00"),
    )

    api_client.force_authenticate(user=user_b)
    response = api_client.get("/api/dashboard/resumo/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["totais"]["calculos_totais"] == 0
    assert data["receitas"] == []


@pytest.mark.django_db
def test_dashboard_resumo_agrega_por_receita(api_client):
    """Marco 8: 2 cálculos da mesma receita geram série com 2 pontos e variação correta."""
    from django.utils import timezone
    from datetime import timedelta

    usuario = UserFactory()
    api_client.force_authenticate(user=usuario)

    receita = Receita.objects.create(
        usuario=usuario, nome="Bolo Teste Dashboard", rendimento_porcoes=Decimal("10.00"),
        tempo_preparo_minutos=60, custo_hora_mao_obra=Decimal("20.00"),
        custo_embalagem_porcao=Decimal("0.50"), percentual_custos_variaveis=Decimal("10.00"),
        margem_desejada=Decimal("30.00"),
    )

    # Cálculo 1: custo total 100.00
    h1 = HistoricoCusto.objects.create(
        receita=receita, usuario=usuario,
        custo_materia_prima=Decimal("50.00"), custo_mao_obra=Decimal("20.00"),
        custo_embalagem=Decimal("10.00"), custos_variaveis=Decimal("20.00"),
        custo_total=Decimal("100.00"), preco_sugerido=Decimal("142.86"),
    )

    # O campo data_calculo tem auto_now_add=True. Usamos update() para manipular a data
    # e garantir que o primeiro histórico seja mais antigo que o segundo.
    HistoricoCusto.objects.filter(id=h1.id).update(data_calculo=timezone.now() - timedelta(days=2))

    # Cálculo 2: custo total 120.00 (variação de +20% em relação ao primeiro)
    HistoricoCusto.objects.create(
        receita=receita, usuario=usuario,
        custo_materia_prima=Decimal("60.00"), custo_mao_obra=Decimal("25.00"),
        custo_embalagem=Decimal("10.00"), custos_variaveis=Decimal("25.00"),
        custo_total=Decimal("120.00"), preco_sugerido=Decimal("171.43"),
    )

    response = api_client.get("/api/dashboard/resumo/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # Validação dos KPIs globais
    assert data["totais"]["calculos_totais"] == 2
    assert data["totais"]["receita_mais_calculada"] == "Bolo Teste Dashboard"
    assert data["totais"]["custo_medio"] == "110.00"  # (100 + 120) / 2

    # Validação da série da receita
    assert len(data["receitas"]) == 1
    serie_receita = data["receitas"][0]
    assert serie_receita["nome"] == "Bolo Teste Dashboard"
    assert serie_receita["calculos"] == 2
    assert serie_receita["ultimo_custo_total"] == "120.00"

    # Variação: (120 - 100) / 100 * 100 = 20.00%
    assert serie_receita["variacao_percentual"] == "20.00"

    # A série deve ter 2 pontos ordenados por data crescente (o mais antigo primeiro)
    assert len(serie_receita["serie"]) == 2
    assert serie_receita["serie"][0]["custo_total"] == "100.00"
    assert serie_receita["serie"][1]["custo_total"] == "120.00"