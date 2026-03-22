import uuid
from django.db import models
from django.utils import timezone


class Clinic(models.Model):
    STATE_CHOICES = [
        ("AC", "Acre"),
        ("AL", "Alagoas"),
        ("AP", "Amapá"),
        ("AM", "Amazonas"),
        ("BA", "Bahia"),
        ("CE", "Ceará"),
        ("DF", "Distrito Federal"),
        ("ES", "Espírito Santo"),
        ("GO", "Goiás"),
        ("MA", "Maranhão"),
        ("MT", "Mato Grosso"),
        ("MS", "Mato Grosso do Sul"),
        ("MG", "Minas Gerais"),
        ("PA", "Pará"),
        ("PB", "Paraíba"),
        ("PR", "Paraná"),
        ("PE", "Pernambuco"),
        ("PI", "Piauí"),
        ("RJ", "Rio de Janeiro"),
        ("RN", "Rio Grande do Norte"),
        ("RS", "Rio Grande do Sul"),
        ("RO", "Rondônia"),
        ("RR", "Roraima"),
        ("SC", "Santa Catarina"),
        ("SP", "São Paulo"),
        ("SE", "Sergipe"),
        ("TO", "Tocantins"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    cnpj = models.CharField(max_length=18, unique=True, null=True, blank=True)
    email = models.EmailField(max_length=100, null=True, blank=True)
    phone = models.CharField(max_length=15, null=True, blank=True)
    address = models.CharField(max_length=200, null=True, blank=True)
    city = models.CharField(max_length=50, null=True, blank=True)
    state = models.CharField(max_length=2, choices=STATE_CHOICES, null=True, blank=True)
    zip_code = models.CharField(max_length=9, null=True, blank=True)
    # Horários de funcionamento
    opening_time = models.TimeField(default="08:00", help_text="Horário de abertura")
    closing_time = models.TimeField(default="20:00", help_text="Horário de fechamento")
    appointment_interval = models.IntegerField(
        default=30, help_text="Intervalo médio entre atendimentos (minutos)"
    )
    work_days = models.CharField(
        max_length=20, default="seg-sex", help_text="Dias de funcionamento (ex: seg-sex, seg-sab)"
    )
    created_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Tutor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name="tutors")
    name = models.CharField(max_length=100)
    cpf = models.CharField(max_length=14, unique=True, null=True, blank=True)
    email = models.EmailField(max_length=100, null=True, blank=True)
    phone = models.CharField(max_length=15)
    secondary_phone = models.CharField(max_length=15, null=True, blank=True)

    def __str__(self):
        return self.name


class Pet(models.Model):
    GENDER_CHOICES = [("M", "Macho"), ("F", "Fêmea")]

    SPECIES_CHOICES = [
        ("cachorro", "Cachorro"),
        ("gato", "Gato"),
        ("passaro", "Pássaro"),
        ("roedor", "Roedor"),
        ("outro", "Outro"),
    ]

    COLOR_CHOICES = [
        ("preto", "Preto"),
        ("branco", "Branco"),
        ("cinza", "Cinza"),
        ("marrom", "Marrom"),
        ("bege", "Bege"),
        ("dourado", "Dourado"),
        ("rajado", "Rajado"),
        ("malhado", "Malhado"),
        ("outro", "Outro"),
    ]

    BREED_CHOICES = [
        # Raças de cachorro
        ("labrador", "Labrador"),
        ("golden", "Golden Retriever"),
        ("poodle", "Poodle"),
        ("bulldog", "Bulldog"),
        ("pastor_alemao", "Pastor Alemão"),
        ("beagle", "Beagle"),
        ("chihuahua", "Chihuahua"),
        ("yorkshire", "Yorkshire"),
        ("shih_tzu", "Shih Tzu"),
        ("rottweiler", "Rottweiler"),
        ("pitbull", "Pitbull"),
        ("srd", "Sem Raça Definida (SRD)"),
        # Raças de gato
        ("siames", "Siamês"),
        ("persa", "Persa"),
        ("maine_coon", "Maine Coon"),
        ("angora", "Angorá"),
        ("sphynx", "Sphynx"),
        ("ragdoll", "Ragdoll"),
        ("bengal", "Bengal"),
        ("british_shorthair", "British Shorthair"),
        # Espécies de pássaro
        ("calopsita", "Calopsita"),
        ("periquito", "Periquito"),
        ("canario", "Canário"),
        ("papagaio", "Papagaio"),
        # Espécies de roedor
        ("hamster", "Hamster"),
        ("porquinho_da_india", "Porquinho-da-Índia"),
        ("chinchila", "Chinchila"),
        ("rato_twister", "Rato Twister"),
        # Outros
        ("outro", "Outro"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE, related_name="pets")
    name = models.CharField(max_length=50)
    species = models.CharField(max_length=30, choices=SPECIES_CHOICES, default="cachorro")
    breed = models.CharField(max_length=50, null=True, blank=True, help_text="Raça personalizada")
    standard_breed = models.CharField(
        max_length=50, choices=BREED_CHOICES, null=True, blank=True, help_text="Raça padronizada"
    )
    birth_date = models.DateField(null=True, blank=True)
    size = models.CharField(max_length=20, null=True, blank=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    color = models.CharField(max_length=30, choices=COLOR_CHOICES, null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.species})"


class Employee(models.Model):
    ROLE_CHOICES = [
        ("veterinario", "Veterinário"),
        ("atendente", "Atendente"),
        ("tosador", "Tosador"),
        ("auxiliar", "Auxiliar"),
        ("gerente", "Gerente"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name="employees")
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100, unique=True)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="atendente")
    phone = models.CharField(max_length=15, null=True, blank=True)
    admission_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"


class Service(models.Model):
    CATEGORY_CHOICES = [
        ("veterinaria", "Veterinária"),
        ("tosa", "Tosa"),
        ("banho", "Banho"),
        ("higiene", "Higiene"),
        ("exame", "Exame"),
        ("vacina", "Vacina"),
        ("cirurgia", "Cirurgia"),
        ("outro", "Outro"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_minutes = models.IntegerField(
        null=True, blank=True, help_text="Duração estimada em minutos"
    )
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default="outro")
    parent_category = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Categoria pai do serviço (ex: Higiene, Veterinária)",
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class Product(models.Model):
    CATEGORY_CHOICES = [
        ("medicamento", "Medicamento"),
        ("higiene", "Higiene"),
        ("acessorio", "Acessório"),
        ("racao", "Ração"),
        ("brinquedo", "Brinquedo"),
        ("outro", "Outro"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name="products")
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default="outro")
    brand = models.CharField(max_length=50, null=True, blank=True)
    quantity = models.IntegerField(default=0)
    min_stock = models.IntegerField(default=0)
    alert_threshold = models.IntegerField(
        default=10, help_text="Quantidade para alerta de estoque baixo"
    )
    price = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, help_text="Preço unitário do produto"
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.quantity} un)"

    @property
    def is_low_stock(self):
        """Verifica se o produto está com estoque baixo"""
        return self.quantity <= self.alert_threshold


class ServiceProduct(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="service_products")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="product_services")
    quantity = models.IntegerField()
    notes = models.TextField(null=True, blank=True)


class Scheduling(models.Model):
    STATUS_CHOICES = [
        ("agendado", "Agendado"),
        ("confirmado", "Confirmado"),
        ("em_andamento", "Em Andamento"),
        ("concluido", "Concluído"),
        ("cancelado", "Cancelado"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name="schedulings")
    tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE, related_name="schedulings")
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name="schedulings")
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="schedulings")
    date_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    total_value = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ["-date_time"]

    def __str__(self):
        return f"{self.pet} - {self.date_time} ({self.status})"


class ScheduledService(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scheduling = models.ForeignKey(
        Scheduling, on_delete=models.CASCADE, related_name="scheduled_services"
    )
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    service_value = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(null=True, blank=True)


class FinancialTransaction(models.Model):
    STATUS_CHOICES = [("pendente", "Pendente"), ("pago", "Pago"), ("cancelado", "Cancelado")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scheduling = models.OneToOneField(
        Scheduling, on_delete=models.CASCADE, related_name="financial_transaction"
    )
    category = models.CharField(max_length=50)
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField(null=True, blank=True)
    payment_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    payment_method = models.CharField(max_length=20, null=True, blank=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)


class StockMovement(models.Model):
    MOVEMENT_TYPE = [
        ("entrada", "Entrada"),
        ("saida", "Saída"),
        ("ajuste", "Ajuste"),
        ("devolucao", "Devolução"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name="stock_movements")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="movements")
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPE)
    quantity = models.IntegerField()
    description = models.CharField(max_length=200)
    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    notes = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.product.name} - {self.movement_type} ({self.quantity})"


class FinancialRecord(models.Model):
    RECORD_TYPE = [
        ("receita", "Receita"),
        ("despesa", "Despesa"),
    ]

    STATUS_CHOICES = [
        ("pendente", "Pendente"),
        ("realizado", "Realizado"),
        ("cancelado", "Cancelado"),
    ]

    PAYMENT_METHOD_CHOICES = [
        ("boleto", "Boleto"),
        ("cartao", "Cartão"),
        ("dinheiro", "Dinheiro"),
    ]

    # Categorias específicas por tipo
    RECEITA_CATEGORIES = [
        ("servico", "Serviço"),
        ("produto", "Produto"),
        ("outro", "Outro"),
    ]

    DESPESA_CATEGORIES = [
        ("salario", "Salário"),
        ("aluguel", "Aluguel"),
        ("energia", "Energia"),
        ("agua", "Água"),
        ("telefone", "Telefone"),
        ("manutencao", "Manutenção"),
        ("marketing", "Marketing"),
        ("outro", "Outro"),
    ]

    CATEGORY_CHOICES = RECEITA_CATEGORIES + DESPESA_CATEGORIES

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name="financial_records")
    record_type = models.CharField(max_length=20, choices=RECORD_TYPE)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pendente")
    due_date = models.DateField()
    payment_date = models.DateField(null=True, blank=True)
    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True)
    payment_method = models.CharField(
        max_length=20, choices=PAYMENT_METHOD_CHOICES, null=True, blank=True
    )
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-due_date"]

    def __str__(self):
        return f"{self.record_type} - {self.category}: R${self.amount}"
