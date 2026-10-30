# backend/apps/api/urls.py
"""Rotas da API REST do CustoCerto (Marcos 2 e 8)."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from .dashboard import DashboardResumoView
from .views import (
    HistoricoCustoViewSet,
    InsumoViewSet,
    ReceitaInsumoViewSet,
    ReceitaViewSet,
)

router = DefaultRouter()
# basename é obrigatório quando o ViewSet não tem atributo de classe `queryset`
# (nosso caso: get_queryset(self) filtra dinamicamente por usuario=request.user).
router.register("insumos", InsumoViewSet, basename="insumo")
router.register("receitas", ReceitaViewSet, basename="receita")
router.register("receitas-insumos", ReceitaInsumoViewSet, basename="receita-insumo")
router.register("historicos", HistoricoCustoViewSet, basename="historico")

urlpatterns = [
    path(
        "dashboard/resumo/",
        DashboardResumoView.as_view(),
        name="dashboard-resumo",
    ),
    *router.urls,
]