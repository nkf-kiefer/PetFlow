from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from api.models import (
    Clinic,
    Employee,
    FinancialRecord,
    FinancialTransaction,
    Pet,
    Product,
    ScheduledService,
    Scheduling,
    Service,
    ServiceProduct,
    StockMovement,
    Tutor,
)


class Command(BaseCommand):
    help = "Cria 10 registros realistas por entidade (com opção de reset)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Apaga os dados existentes antes de criar os novos registros.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            self.stdout.write(self.style.WARNING("Limpando dados existentes..."))
            FinancialTransaction.objects.all().delete()
            ScheduledService.objects.all().delete()
            Scheduling.objects.all().delete()
            ServiceProduct.objects.all().delete()
            StockMovement.objects.all().delete()
            FinancialRecord.objects.all().delete()
            Product.objects.all().delete()
            Service.objects.all().delete()
            Pet.objects.all().delete()
            Tutor.objects.all().delete()
            Employee.objects.all().delete()
            Clinic.objects.all().delete()

        today = timezone.localdate()
        now = timezone.now()

        # 10 clínicas
        clinic_data = [
            ("Clínica PetVida Jardins", "11.111.111/0001-01", "São Paulo", "SP"),
            ("Hospital Vet Sul", "22.222.222/0001-02", "Porto Alegre", "RS"),
            ("Centro Animal Savassi", "33.333.333/0001-03", "Belo Horizonte", "MG"),
            ("VetCare Boa Viagem", "44.444.444/0001-04", "Recife", "PE"),
            ("Clínica Patas de Ouro", "55.555.555/0001-05", "Curitiba", "PR"),
            ("Mundo Pet Aldeota", "66.666.666/0001-06", "Fortaleza", "CE"),
            ("PrimeVet Asa Sul", "77.777.777/0001-07", "Brasília", "DF"),
            ("Saúde Animal Barra", "88.888.888/0001-08", "Salvador", "BA"),
            ("Clínica Bicho Feliz", "99.999.999/0001-09", "Florianópolis", "SC"),
            ("VetMais Centro", "10.101.101/0001-10", "Goiânia", "GO"),
        ]

        clinics = []
        for idx, (name, cnpj, city, state) in enumerate(clinic_data, start=1):
            clinic, _ = Clinic.objects.get_or_create(
                cnpj=cnpj,
                defaults={
                    "name": name,
                    "email": f"contato{idx}@petflow.com.br",
                    "phone": f"(11) 9{idx:04d}-100{idx % 10}",
                    "address": f"Av. Principal, {100 + idx}",
                    "city": city,
                    "state": state,
                    "zip_code": f"0{idx:04d}-000",
                    "opening_time": "08:00",
                    "closing_time": "19:00",
                    "appointment_interval": 30,
                    "work_days": "seg-sab",
                    "is_active": True,
                },
            )
            clinics.append(clinic)

        # 10 funcionários
        employee_data = [
            ("Dra. Camila Nogueira", "veterinario"),
            ("Bruno Almeida", "atendente"),
            ("Dra. Fernanda Prado", "veterinario"),
            ("Paulo Henrique", "tosador"),
            ("Juliana Souza", "gerente"),
            ("Dra. Renata Lopes", "veterinario"),
            ("Thiago Martins", "auxiliar"),
            ("Dra. Patrícia Melo", "veterinario"),
            ("Vanessa Ribeiro", "atendente"),
            ("Marcos Vinícius", "gerente"),
        ]

        employees = []
        for idx, (name, role) in enumerate(employee_data, start=1):
            employee, _ = Employee.objects.get_or_create(
                email=f"func{idx}@petflow.com.br",
                defaults={
                    "clinic": clinics[idx - 1],
                    "name": name,
                    "password": "123456",
                    "role": role,
                    "phone": f"(11) 9{idx:04d}-200{idx % 10}",
                    "admission_date": today - timedelta(days=100 + idx * 20),
                    "is_active": True,
                },
            )
            employees.append(employee)

        # 10 tutores
        tutor_data = [
            ("Marina Costa", "123.456.789-01"),
            ("Carlos Lima", "234.567.890-12"),
            ("Fernanda Rocha", "345.678.901-23"),
            ("Gustavo Azevedo", "456.789.012-34"),
            ("Aline Ribeiro", "567.890.123-45"),
            ("Rafael Pinto", "678.901.234-56"),
            ("Patrícia Moreira", "789.012.345-67"),
            ("Leonardo Faria", "890.123.456-78"),
            ("Cláudia Mota", "901.234.567-89"),
            ("Bianca Duarte", "012.345.678-90"),
        ]

        tutors = []
        for idx, (name, cpf) in enumerate(tutor_data, start=1):
            tutor, _ = Tutor.objects.get_or_create(
                cpf=cpf,
                defaults={
                    "clinic": clinics[idx - 1],
                    "name": name,
                    "email": f"tutor{idx}@email.com",
                    "phone": f"(11) 9{idx:04d}-300{idx % 10}",
                    "secondary_phone": f"(11) 9{idx:04d}-399{idx % 10}",
                },
            )
            tutors.append(tutor)

        # 10 pets
        pet_data = [
            ("Mel", "cachorro", "golden", "F", "dourado", Decimal("28.5"), "Grande"),
            ("Mingau", "gato", "siames", "M", "branco", Decimal("4.2"), "Pequeno"),
            ("Thor", "cachorro", "labrador", "M", "preto", Decimal("32.0"), "Grande"),
            ("Luna", "gato", "persa", "F", "cinza", Decimal("3.8"), "Pequeno"),
            ("Pipoca", "roedor", "hamster", "F", "bege", Decimal("0.2"), "Pequeno"),
            ("Nina", "cachorro", "shih_tzu", "F", "branco", Decimal("6.1"), "Pequeno"),
            ("Simba", "gato", "maine_coon", "M", "rajado", Decimal("5.4"), "Médio"),
            ("Bob", "cachorro", "beagle", "M", "marrom", Decimal("14.3"), "Médio"),
            ("Kiwi", "passaro", "calopsita", "F", "cinza", Decimal("0.1"), "Pequeno"),
            ("Max", "cachorro", "yorkshire", "M", "dourado", Decimal("3.0"), "Pequeno"),
        ]

        pets = []
        for idx, (name, species, std_breed, gender, color, weight, size) in enumerate(
            pet_data, start=1
        ):
            pet, _ = Pet.objects.get_or_create(
                tutor=tutors[idx - 1],
                name=name,
                defaults={
                    "species": species,
                    "standard_breed": std_breed,
                    "breed": "",
                    "birth_date": today - timedelta(days=300 + idx * 40),
                    "size": size,
                    "weight": weight,
                    "color": color,
                    "gender": gender,
                    "notes": "Paciente sem intercorrências graves.",
                },
            )
            pets.append(pet)

        # 10 serviços
        service_data = [
            ("Consulta Clínica", "veterinaria", Decimal("180.00"), 40),
            ("Vacina V10", "vacina", Decimal("160.00"), 20),
            ("Banho e Tosa", "tosa", Decimal("120.00"), 60),
            ("Hemograma", "exame", Decimal("95.00"), 25),
            ("Aplicação de Antipulgas", "higiene", Decimal("70.00"), 15),
            ("Consulta Dermatológica", "veterinaria", Decimal("210.00"), 45),
            ("Ultrassom", "exame", Decimal("240.00"), 35),
            ("Vacina Antirrábica", "vacina", Decimal("90.00"), 15),
            ("Higienização Dental", "higiene", Decimal("250.00"), 50),
            ("Retorno Clínico", "veterinaria", Decimal("120.00"), 25),
        ]

        services = []
        for name, category, price, duration in service_data:
            service, _ = Service.objects.get_or_create(
                name=name,
                defaults={
                    "category": category,
                    "price": price,
                    "duration_minutes": duration,
                    "description": f"Serviço: {name}",
                    "is_active": True,
                },
            )
            services.append(service)

        # 10 produtos (quantity=0 para evitar movimento automático do signal)
        product_data = [
            ("Ração Premium 10kg", "racao", "Golden", Decimal("199.90"), 5, 6),
            ("Antipulgas Spot On", "medicamento", "Frontline", Decimal("89.90"), 4, 5),
            ("Shampoo Dermatológico", "higiene", "Virbac", Decimal("59.90"), 3, 4),
            ("Brinquedo Mordedor", "brinquedo", "Kong", Decimal("45.00"), 8, 10),
            ("Areia Higiênica", "higiene", "Pipicat", Decimal("34.90"), 10, 12),
            ("Coleira Antiparasitária", "acessorio", "Seresto", Decimal("149.90"), 3, 4),
            ("Ração Gatos Castrados", "racao", "Premier", Decimal("169.90"), 6, 7),
            ("Tapete Higiênico", "higiene", "Sanol", Decimal("42.50"), 9, 10),
            ("Suplemento Vitamínico", "medicamento", "Avert", Decimal("78.00"), 4, 5),
            ("Arranhador para Gatos", "acessorio", "PetGames", Decimal("119.00"), 2, 3),
        ]

        products = []
        for idx, (name, category, brand, price, min_stock, alert_threshold) in enumerate(
            product_data, start=1
        ):
            product, _ = Product.objects.get_or_create(
                clinic=clinics[(idx - 1) % len(clinics)],
                name=name,
                defaults={
                    "category": category,
                    "brand": brand,
                    "description": f"Produto: {name}",
                    "quantity": 0,
                    "min_stock": min_stock,
                    "alert_threshold": alert_threshold,
                    "price": price,
                    "is_active": True,
                },
            )
            products.append(product)

        # 10 service-products
        for idx in range(10):
            ServiceProduct.objects.get_or_create(
                service=services[idx],
                product=products[idx],
                defaults={"quantity": 1 + (idx % 3), "notes": "Consumo médio por atendimento."},
            )

        # 10 agendamentos + serviços agendados
        schedulings = []
        status_cycle = [
            "agendado",
            "confirmado",
            "concluido",
            "confirmado",
            "agendado",
            "concluido",
            "cancelado",
            "confirmado",
            "agendado",
            "concluido",
        ]

        for idx in range(10):
            dt = now + timedelta(days=idx + 1, hours=(idx % 4))
            scheduling, _ = Scheduling.objects.get_or_create(
                clinic=clinics[idx],
                tutor=tutors[idx],
                pet=pets[idx],
                employee=employees[idx],
                date_time=dt,
                defaults={
                    "status": status_cycle[idx],
                    "total_value": services[idx].price,
                    "notes": "Atendimento gerado por seed realista.",
                },
            )
            schedulings.append(scheduling)
            ScheduledService.objects.get_or_create(
                scheduling=scheduling,
                service=services[idx],
                defaults={"service_value": services[idx].price, "notes": "Serviço principal."},
            )

        # 10 movimentações de estoque (controladas manualmente)
        movement_cycle = [
            ("entrada", 12),
            ("entrada", 9),
            ("saida", 2),
            ("entrada", 7),
            ("saida", 3),
            ("entrada", 6),
            ("ajuste", 5),
            ("entrada", 11),
            ("saida", 4),
            ("devolucao", 2),
        ]

        for idx, (movement_type, quantity) in enumerate(movement_cycle):
            StockMovement.objects.get_or_create(
                clinic=products[idx].clinic,
                product=products[idx],
                movement_type=movement_type,
                quantity=quantity,
                description=f"Movimentação seed {idx + 1}",
                defaults={
                    "employee": employees[idx],
                    "notes": "Movimentação criada para ambiente de demonstração.",
                },
            )

        # 10 registros financeiros
        record_types = [
            "receita",
            "despesa",
            "receita",
            "despesa",
            "receita",
            "despesa",
            "receita",
            "despesa",
            "receita",
            "despesa",
        ]
        categories = [
            "servico",
            "aluguel",
            "produto",
            "energia",
            "servico",
            "marketing",
            "produto",
            "salario",
            "outro",
            "manutencao",
        ]
        amounts = [
            Decimal("320.00"),
            Decimal("600.00"),
            Decimal("210.00"),
            Decimal("180.00"),
            Decimal("450.00"),
            Decimal("220.00"),
            Decimal("170.00"),
            Decimal("950.00"),
            Decimal("130.00"),
            Decimal("300.00"),
        ]
        statuses = [
            "realizado",
            "realizado",
            "pendente",
            "realizado",
            "realizado",
            "pendente",
            "realizado",
            "realizado",
            "pendente",
            "realizado",
        ]

        for idx in range(10):
            due_date = today + timedelta(days=idx + 1)
            payment_date = due_date if statuses[idx] == "realizado" else None
            FinancialRecord.objects.get_or_create(
                clinic=clinics[idx],
                record_type=record_types[idx],
                category=categories[idx],
                description=f"Registro financeiro {idx + 1}",
                amount=amounts[idx],
                due_date=due_date,
                defaults={
                    "status": statuses[idx],
                    "payment_date": payment_date,
                    "employee": employees[idx],
                    "payment_method": "cartao" if record_types[idx] == "receita" else "boleto",
                    "notes": "Lançamento de demonstração",
                },
            )

        # 10 transações financeiras (uma por agendamento)
        ft_status = [
            "pago",
            "pendente",
            "pago",
            "pago",
            "pendente",
            "pago",
            "cancelado",
            "pago",
            "pendente",
            "pago",
        ]
        for idx in range(10):
            scheduling = schedulings[idx]
            status = ft_status[idx]
            due_date = (scheduling.date_time + timedelta(days=2)).date()
            payment_date = due_date if status == "pago" else None
            FinancialTransaction.objects.get_or_create(
                scheduling=scheduling,
                defaults={
                    "category": "servico",
                    "description": f"Transação do agendamento {idx + 1}",
                    "amount": scheduling.total_value,
                    "due_date": due_date,
                    "payment_date": payment_date,
                    "status": status,
                    "payment_method": "cartao" if status == "pago" else "boleto",
                    "employee": employees[idx],
                },
            )

        self.stdout.write(self.style.SUCCESS("✅ Seed realista concluído."))
        self.stdout.write(f"Clinics: {Clinic.objects.count()}")
        self.stdout.write(f"Tutors: {Tutor.objects.count()}")
        self.stdout.write(f"Pets: {Pet.objects.count()}")
        self.stdout.write(f"Employees: {Employee.objects.count()}")
        self.stdout.write(f"Services: {Service.objects.count()}")
        self.stdout.write(f"Products: {Product.objects.count()}")
        self.stdout.write(f"ServiceProducts: {ServiceProduct.objects.count()}")
        self.stdout.write(f"Schedulings: {Scheduling.objects.count()}")
        self.stdout.write(f"ScheduledServices: {ScheduledService.objects.count()}")
        self.stdout.write(f"StockMovements: {StockMovement.objects.count()}")
        self.stdout.write(f"FinancialRecords: {FinancialRecord.objects.count()}")
        self.stdout.write(f"FinancialTransactions: {FinancialTransaction.objects.count()}")
