# backend/apps/core/models.py

import uuid
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models


class Insumo(models.Model):
    """
    Representa uma matéria-prima ou item comprado pelo negócio.

    Exemplo:
        Farinha de trigo comprada em pacote de 5 kg por R$ 25,00.
        custo_por_unidade = 25,00 / 5 = R$ 5,00 por kg.
    """

    class UnidadeMedida(models.TextChoices):
        KG = "KG", "Quilograma"
        G = "G", "Grama"
        L = "L", "Litro"
        ML = "ML", "Mililitro"
        UN = "UN", "Unidade"
        DZ = "DZ", "Dúzia"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Identificador único do insumo.",
    )

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="insumos",
        help_text="Usuário responsável pelo insumo.",
    )

    nome = models.CharField(
        max_length=120,
        help_text="Nome do insumo. Ex.: Farinha de trigo.",
    )

    unidade_medida = models.CharField(
        max_length=2,
        choices=UnidadeMedida.choices,
        help_text="Unidade de medida usada na compra.",
    )

    quantidade_compra = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        validators=[MinValueValidator(Decimal("0.001"))],
        help_text="Quantidade comprada. Ex.: 5.000 para 5 kg.",
    )

    preco_compra = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Preço total pago pela quantidade comprada.",
    )

    data_compra = models.DateField(
        null=True,
        blank=True,
        help_text="Data opcional da compra do insumo.",
    )

    perecivel = models.BooleanField(
        default=False,
        help_text="Indica se o insumo é perecível.",
    )

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "insumo"
        ordering = ["nome"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(quantidade_compra__gt=Decimal("0.000")),
                name="insumo_quantidade_compra_positiva",
            ),
            models.CheckConstraint(
                check=models.Q(preco_compra__gte=Decimal("0.00")),
                name="insumo_preco_compra_nao_negativo",
            ),
            models.UniqueConstraint(
                fields=["usuario", "nome", "unidade_medida"],
                name="insumo_unique_usuario_nome_unidade",
            ),
        ]
        indexes = [
            models.Index(fields=["usuario", "nome"]),
        ]

    @property
    def custo_por_unidade(self) -> Decimal:
        """
        Calcula o custo por unidade de medida.

        Exemplo:
            preco_compra = 25.00
            quantidade_compra = 5.000
            custo_por_unidade = 5.0000 por kg
        """
        if not self.quantidade_compra:
            return Decimal("0.0000")

        return (self.preco_compra / self.quantidade_compra).quantize(
            Decimal("0.0001")
        )

    def clean(self):
        if self.quantidade_compra <= Decimal("0.000"):
            raise ValidationError(
                {"quantidade_compra": "A quantidade comprada deve ser maior que zero."}
            )

        if self.preco_compra < Decimal("0.00"):
            raise ValidationError(
                {"preco_compra": "O preço de compra não pode ser negativo."}
            )

    def __str__(self):
        return f"{self.nome} ({self.get_unidade_medida_display()})"


class Receita(models.Model):
    """
    Representa uma receita ou produto alimentício.

    A receita possui rendimento, tempo de preparo, custos de mão de obra,
    embalagem, custos variáveis e margem desejada.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Identificador único da receita.",
    )

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="receitas",
        help_text="Usuário responsável pela receita.",
    )

    nome = models.CharField(
        max_length=150,
        help_text="Nome da receita. Ex.: Bolo de cenoura.",
    )

    rendimento_porcoes = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal("1.00"),
        validators=[MinValueValidator(Decimal("0.01"))],
        help_text="Quantidade de porções produzidas pela receita.",
    )

    tempo_preparo_minutos = models.PositiveIntegerField(
        default=0,
        help_text="Tempo total de preparo em minutos.",
    )

    custo_hora_mao_obra = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Valor da hora de trabalho usada no cálculo.",
    )

    custo_embalagem_porcao = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Custo de embalagem por porção.",
    )

    percentual_custos_variaveis = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Percentual para custos variáveis, como gás e energia.",
    )

    margem_desejada = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("30.00"),
        help_text="Margem desejada em percentual. Ex.: 30.00 equivale a 30%.",
    )

    ativo = models.BooleanField(
        default=True,
        help_text="Indica se a receita está ativa para cálculo.",
    )

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "receita"
        ordering = ["nome"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(rendimento_porcoes__gt=Decimal("0.00")),
                name="receita_rendimento_positivo",
            ),
            models.CheckConstraint(
                check=(
                    models.Q(percentual_custos_variaveis__gte=Decimal("0.00"))
                    & models.Q(percentual_custos_variaveis__lte=Decimal("100.00"))
                ),
                name="receita_percentual_custos_variaveis_entre_0_e_100",
            ),
            models.CheckConstraint(
                check=(
                    models.Q(margem_desejada__gte=Decimal("0.00"))
                    & models.Q(margem_desejada__lte=Decimal("500.00"))
                ),
                name="receita_margem_desejada_entre_0_e_500",
            ),
        ]
        indexes = [
            models.Index(fields=["usuario", "nome"]),
        ]

    def clean(self):
        if self.rendimento_porcoes <= Decimal("0.00"):
            raise ValidationError(
                {"rendimento_porcoes": "O rendimento deve ser maior que zero."}
            )

        if self.percentual_custos_variaveis < Decimal("0.00") or self.percentual_custos_variaveis > Decimal("100.00"):
            raise ValidationError(
                {
                    "percentual_custos_variaveis": "O percentual deve estar entre 0 e 100."
                }
            )

    def __str__(self):
        return self.nome


class ReceitaInsumo(models.Model):
    """
    Tabela de relacionamento N:N entre Receita e Insumo.

    Armazena a quantidade utilizada de cada insumo em cada receita.
    Essa entidade é essencial para o cálculo fracionado.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    receita = models.ForeignKey(
        Receita,
        on_delete=models.CASCADE,
        related_name="itens",
        help_text="Receita que utiliza o insumo.",
    )

    insumo = models.ForeignKey(
        Insumo,
        on_delete=models.CASCADE,
        related_name="usos_em_receitas",
        help_text="Insumo utilizado na receita.",
    )

    quantidade = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        validators=[MinValueValidator(Decimal("0.001"))],
        help_text="Quantidade do insumo utilizada na receita.",
    )

    observacao = models.CharField(
        max_length=255,
        blank=True,
        help_text="Observação opcional. Ex.: picado, sem casca, cozido.",
    )

    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "receita_insumo"
        ordering = ["receita", "insumo"]
        constraints = [
            models.UniqueConstraint(
                fields=["receita", "insumo"],
                name="receita_insumo_unique_receita_insumo",
            ),
            models.CheckConstraint(
                check=models.Q(quantidade__gt=Decimal("0.000")),
                name="receita_insumo_quantidade_positiva",
            ),
        ]
        indexes = [
            models.Index(fields=["receita"]),
            models.Index(fields=["insumo"]),
        ]

    @property
    def custo_estimado(self) -> Decimal:
        """
        Calcula o custo estimado do insumo na receita.

        Exemplo:
            quantidade = 0.250 kg
            custo_por_unidade = 5.0000
            custo_estimado = 1.25
        """
        return (self.quantidade * self.insumo.custo_por_unidade).quantize(
            Decimal("0.01")
        )

    def clean(self):
        if self.quantidade <= Decimal("0.000"):
            raise ValidationError(
                {"quantidade": "A quantidade deve ser maior que zero."}
            )

        if self.receita_id and self.insumo_id:
            if self.receita.usuario_id != self.insumo.usuario_id:
                raise ValidationError(
                    "Insumo e receita devem pertencer ao mesmo usuário."
                )

    def __str__(self):
        return f"{self.receita.nome} usa {self.insumo.nome}"


class HistoricoCusto(models.Model):
    """
    Registro imutável do cálculo de custo de uma receita.

    Permite acompanhar variações de preço ao longo do tempo
    sem alterar registros antigos quando um insumo muda de preço.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    receita = models.ForeignKey(
        Receita,
        on_delete=models.CASCADE,
        related_name="historicos",
    )

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="historicos_custo",
    )

    data_calculo = models.DateTimeField(auto_now_add=True)

    custo_materia_prima = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    custo_mao_obra = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    custo_embalagem = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    custos_variaveis = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    custo_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    preco_sugerido = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Preço sugerido com base na margem desejada.",
    )

    parametros = models.JSONField(
        default=dict,
        blank=True,
        help_text="Snapshot dos parâmetros usados no cálculo.",
    )

    class Meta:
        db_table = "historico_custo"
        ordering = ["-data_calculo"]
        indexes = [
            models.Index(fields=["receita", "data_calculo"]),
            models.Index(fields=["usuario", "data_calculo"]),
        ]

    def __str__(self):
        return f"Histórico de {self.receita.nome} em {self.data_calculo}"