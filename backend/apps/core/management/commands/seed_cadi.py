# backend/apps/core/management/commands/seed_cadi.py
"""Management command para popular a conta do usuário 'cadi' com dados realistas do Cadi Bar."""

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.core.models import Insumo, Receita, ReceitaInsumo
from apps.costing.services import calcular_custo_receita

User = get_user_model()

USERNAME = "cadi"

# Preços de mercado de referência (Centro de SP, 2026).
# (nome, unidade, quantidade_compra, preco_compra, perecivel)
INSUMOS = [
    ("Farinha de trigo", "KG", "5.000", "32.50", False),
    ("Arroz branco", "KG", "5.000", "36.00", False),
    ("Feijão preto", "KG", "2.000", "19.00", False),
    ("Carne bovina (filé)", "KG", "1.000", "49.90", True),
    ("Peito de frango", "KG", "1.000", "24.90", True),
    ("Carne suína mista", "KG", "1.000", "19.90", True),
    ("Queijo muçarela", "KG", "1.000", "42.90", True),
    ("Molho de tomate", "KG", "1.000", "9.80", False),
    ("Óleo de soja", "L", "1.000", "10.90", False),
    ("Batata", "KG", "2.000", "13.80", True),
    ("Ovos", "UN", "12.000", "13.20", True),
    ("Cebola", "KG", "1.000", "7.50", True),
    ("Alho", "KG", "0.500", "14.95", True),
    ("Sal", "KG", "1.000", "4.20", False),
    ("Tomate", "KG", "1.000", "9.90", True),
    ("Creme de leite", "G", "200.000", "8.90", True),
]

# Cada receita: parâmetros operacionais + ficha técnica (insumo -> quantidade
# na unidade-base do insumo).
RECEITAS = [
    {
        "nome": "Filé parmegiana com arroz e fritas",
        "rendimento_porcoes": "2.00",
        "tempo_preparo_minutos": 40,
        "custo_hora_mao_obra": "16.00",
        "custo_embalagem_porcao": "1.20",
        "percentual_custos_variaveis": "15.00",
        "margem_desejada": "40.00",
        "itens": [
            ("Carne bovina (filé)", "0.250"),
            ("Queijo muçarela", "0.080"),
            ("Molho de tomate", "0.100"),
            ("Farinha de trigo", "0.050"),
            ("Ovos", "1.000"),
            ("Óleo de soja", "0.100"),
            ("Arroz branco", "0.150"),
            ("Batata", "0.200"),
        ],
    },
    {
        "nome": "Prato feito executivo",
        "rendimento_porcoes": "1.00",
        "tempo_preparo_minutos": 25,
        "custo_hora_mao_obra": "16.00",
        "custo_embalagem_porcao": "1.00",
        "percentual_custos_variaveis": "15.00",
        "margem_desejada": "30.00",
        "itens": [
            ("Arroz branco", "0.200"),
            ("Feijão preto", "0.150"),
            ("Carne bovina (filé)", "0.120"),
            ("Batata", "0.150"),
            ("Tomate", "0.080"),
            ("Cebola", "0.030"),
            ("Alho", "0.010"),
            ("Óleo de soja", "0.050"),
            ("Sal", "0.005"),
        ],
    },
    {
        "nome": "Strogonoff de frango com arroz",
        "rendimento_porcoes": "2.00",
        "tempo_preparo_minutos": 35,
        "custo_hora_mao_obra": "16.00",
        "custo_embalagem_porcao": "1.00",
        "percentual_custos_variaveis": "15.00",
        "margem_desejada": "35.00",
        "itens": [
            ("Peito de frango", "0.400"),
            ("Creme de leite", "200.000"),
            ("Arroz branco", "0.300"),
            ("Cebola", "0.050"),
            ("Alho", "0.008"),
            ("Óleo de soja", "0.030"),
            ("Sal", "0.004"),
            ("Batata", "0.300"),
        ],
    },
    {
        "nome": "Feijoada completa",
        "rendimento_porcoes": "4.00",
        "tempo_preparo_minutos": 120,
        "custo_hora_mao_obra": "16.00",
        "custo_embalagem_porcao": "0.80",
        "percentual_custos_variaveis": "15.00",
        "margem_desejada": "35.00",
        "itens": [
            ("Feijão preto", "1.000"),
            ("Carne suína mista", "0.800"),
            ("Carne bovina (filé)", "0.300"),
            ("Arroz branco", "0.600"),
            ("Cebola", "0.100"),
            ("Alho", "0.030"),
            ("Óleo de soja", "0.080"),
            ("Sal", "0.010"),
        ],
    },
]


class Command(BaseCommand):
    help = (
        "Popula (de forma idempotente) a conta do usuário 'cadi' com insumos, "
        "receitas e fichas técnicas realistas de um restaurante popular."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            default=USERNAME,
            help=f"Usuário que receberá os dados (padrão: '{USERNAME}').",
        )

    def handle(self, *args, **kwargs):
        username = kwargs["username"]
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(
                f"Usuário '{username}' não encontrado. "
                "Crie-o antes (ex.: python manage.py demo_data) e rode novamente."
            )

        with transaction.atomic():
            insumos = self._seed_insumos(user)
            receitas = self._seed_receitas(user, insumos)

        self._imprimir_resumo(user, receitas)

    def _seed_insumos(self, user):
        insumos = {}
        for nome, unidade, quantidade, preco, perecivel in INSUMOS:
            insumo, _ = Insumo.objects.update_or_create(
                usuario=user,
                nome=nome,
                unidade_medida=unidade,
                defaults={
                    "quantidade_compra": Decimal(quantidade),
                    "preco_compra": Decimal(preco),
                    "perecivel": perecivel,
                },
            )
            insumos[nome] = insumo
        return insumos

    def _seed_receitas(self, user, insumos):
        receitas = []
        for data in RECEITAS:
            receita, _ = Receita.objects.update_or_create(
                usuario=user,
                nome=data["nome"],
                defaults={
                    "rendimento_porcoes": Decimal(data["rendimento_porcoes"]),
                    "tempo_preparo_minutos": data["tempo_preparo_minutos"],
                    "custo_hora_mao_obra": Decimal(data["custo_hora_mao_obra"]),
                    "custo_embalagem_porcao": Decimal(data["custo_embalagem_porcao"]),
                    "percentual_custos_variaveis": Decimal(
                        data["percentual_custos_variaveis"]
                    ),
                    "margem_desejada": Decimal(data["margem_desejada"]),
                    "ativo": True,
                },
            )
            for nome_insumo, quantidade in data["itens"]:
                ReceitaInsumo.objects.update_or_create(
                    receita=receita,
                    insumo=insumos[nome_insumo],
                    defaults={"quantidade": Decimal(quantidade)},
                )
            receitas.append(receita)
        return receitas

    def _imprimir_resumo(self, user, receitas):
        total_insumos = Insumo.objects.filter(usuario=user).count()
        total_receitas = Receita.objects.filter(usuario=user).count()
        total_associacoes = ReceitaInsumo.objects.filter(
            receita__usuario=user
        ).count()

        self.stdout.write(self.style.SUCCESS(f"Seed do Cadi Bar aplicado para '{user.username}'."))
        self.stdout.write(
            f"Insumos: {total_insumos} | Receitas: {total_receitas} | "
            f"Associações: {total_associacoes}"
        )
        self.stdout.write("")
        self.stdout.write(f"{'Receita':<38} {'Porções':>7} {'Custo total':>12} {'Preço/porção':>13}")
        self.stdout.write("-" * 73)
        for receita in receitas:
            resultado = calcular_custo_receita(receita)
            preco = resultado["preco_sugerido"]
            if preco is not None:
                preco_porcao = (preco / receita.rendimento_porcoes).quantize(
                    Decimal("0.01")
                )
                preco_txt = f"R$ {preco_porcao}"
            else:
                preco_txt = "n/a"
            custo_txt = f"R$ {resultado['custo_total']}"
            self.stdout.write(
                f"{receita.nome:<38} {receita.rendimento_porcoes:>7} "
                f"{custo_txt:>12} {preco_txt:>13}"
            )
