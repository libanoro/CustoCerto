# backend/apps/core/management/commands/demo_data.py
"""Management command para limpar o ambiente e criar dados de demonstração para o usuário 'cadi'."""

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.core.models import HistoricoCusto, Insumo, Receita, ReceitaInsumo

User = get_user_model()


class Command(BaseCommand):
    help = "Limpa dados antigos e cria dados de demonstração para o usuário 'cadi'."

    def handle(self, *args, **kwargs):
        # 1. Limpar dados antigos para garantir um ambiente limpo para o aceite visual
        self.stdout.write("Limpando dados antigos de demonstração...")
        HistoricoCusto.objects.all().delete()
        ReceitaInsumo.objects.all().delete()
        Receita.objects.all().delete()
        Insumo.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("Dados antigos removidos."))

        # 2. Criar ou buscar o usuário padrão 'cadi'
        user, created = User.objects.get_or_create(
            username="cadi",
            defaults={"email": "cadi@custocerto.local", "is_staff": False},
        )
        if created:
            user.set_password("Cadi@12345")
            user.save()
            self.stdout.write(self.style.SUCCESS("Usuário 'cadi' criado com sucesso."))
        else:
            # Garante que a senha esteja correta mesmo que o usuário já exista
            user.set_password("Cadi@12345")
            user.save()
            self.stdout.write("Usuário 'cadi' já existia. Senha redefinida.")

        # 3. Criar insumos de exemplo
        insumos_data = [
            {
                "nome": "Farinha de trigo",
                "unidade_medida": "KG",
                "quantidade_compra": Decimal("5.000"),
                "preco_compra": Decimal("25.00"),
            },
            {
                "nome": "Ovos",
                "unidade_medida": "UN",
                "quantidade_compra": Decimal("12.000"),
                "preco_compra": Decimal("12.00"),
            },
            {
                "nome": "Leite",
                "unidade_medida": "ML",
                "quantidade_compra": Decimal("1000.000"),
                "preco_compra": Decimal("6.00"),
            },
            {
                "nome": "Açúcar",
                "unidade_medida": "KG",
                "quantidade_compra": Decimal("1.000"),
                "preco_compra": Decimal("5.00"),
            },
        ]

        insumos = {}
        for data in insumos_data:
            insumo = Insumo.objects.create(
                usuario=user,
                nome=data["nome"],
                unidade_medida=data["unidade_medida"],
                quantidade_compra=data["quantidade_compra"],
                preco_compra=data["preco_compra"],
            )
            insumos[data["nome"]] = insumo
            self.stdout.write(f"Insumo '{insumo.nome}' criado.")

        # 4. Criar receita "Bolo de Cenoura"
        receita = Receita.objects.create(
            usuario=user,
            nome="Bolo de Cenoura",
            rendimento_porcoes=Decimal("10.00"),
            tempo_preparo_minutos=60,
            custo_hora_mao_obra=Decimal("20.00"),
            custo_embalagem_porcao=Decimal("0.50"),
            percentual_custos_variaveis=Decimal("10.00"),
            margem_desejada=Decimal("30.00"),
        )
        self.stdout.write(f"Receita '{receita.nome}' criada.")

        # 5. Associar insumos à receita
        associacoes = [
            {"insumo": insumos["Farinha de trigo"], "quantidade": Decimal("0.500")},
            {"insumo": insumos["Ovos"], "quantidade": Decimal("3.000")},
            {"insumo": insumos["Leite"], "quantidade": Decimal("300.000")},
        ]

        for assoc in associacoes:
            ReceitaInsumo.objects.create(
                receita=receita,
                insumo=assoc["insumo"],
                quantidade=assoc["quantidade"],
            )
            self.stdout.write(
                f"Associado '{assoc['insumo'].nome}' à receita '{receita.nome}'."
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Dados de demonstração configurados com sucesso para o usuário 'cadi'!"
            )
        )