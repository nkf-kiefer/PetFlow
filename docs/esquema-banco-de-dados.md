# Esquema do banco de dados

Este documento resume as entidades principais do PetFlow e como elas se relacionam no banco atual.

## Visão geral

- `Clinic` é a entidade central para operação da clínica.
- `Tutor` pertence a uma clínica e pode ter vários `Pet`.
- `Scheduling` conecta clínica, tutor, pet e funcionário.
- `Service` pode consumir produtos via `ServiceProduct`.
- `ScheduledService` registra os serviços executados em um agendamento.
- `FinancialTransaction` representa o financeiro derivado de um agendamento.
- `FinancialRecord` cobre lançamentos financeiros manuais da clínica.
- `StockMovement` registra entradas, saídas e ajustes de estoque.

## Diagrama ER

![Esquema do banco de dados do PetFlow](./esquema-banco-de-dados.png)

```mermaid
erDiagram
    Clinic {
        uuid id PK
        string name
        string cnpj
        string email
        string phone
        string address
        string city
        string state
        string zip_code
        time opening_time
        time closing_time
        int appointment_interval
        string work_days
        datetime created_at
        boolean is_active
    }

    Tutor {
        uuid id PK
        uuid clinic_id FK
        string name
        string cpf
        string email
        string phone
        string secondary_phone
    }

    Pet {
        uuid id PK
        uuid tutor_id FK
        string name
        string species
        string breed
        string standard_breed
        date birth_date
        string size
        decimal weight
        string color
        string gender
        text notes
    }

    Employee {
        uuid id PK
        uuid clinic_id FK
        string name
        string email
        string password
        string role
        string phone
        date admission_date
        boolean is_active
    }

    Service {
        uuid id PK
        string name
        text description
        decimal price
        int duration_minutes
        string category
        string parent_category
        boolean is_active
    }

    Product {
        uuid id PK
        uuid clinic_id FK
        string name
        text description
        string category
        string brand
        int quantity
        int min_stock
        int alert_threshold
        decimal price
        boolean is_active
    }

    ServiceProduct {
        uuid id PK
        uuid service_id FK
        uuid product_id FK
        int quantity
        text notes
    }

    Scheduling {
        uuid id PK
        uuid clinic_id FK
        uuid tutor_id FK
        uuid pet_id FK
        uuid employee_id FK
        datetime date_time
        string status
        decimal total_value
        text notes
    }

    ScheduledService {
        uuid id PK
        uuid scheduling_id FK
        uuid service_id FK
        decimal service_value
        text notes
    }

    FinancialTransaction {
        uuid id PK
        uuid scheduling_id FK
        string category
        string description
        decimal amount
        date due_date
        date payment_date
        string status
        string payment_method
        uuid employee_id FK
        datetime created_at
    }

    StockMovement {
        uuid id PK
        uuid clinic_id FK
        uuid product_id FK
        string movement_type
        int quantity
        string description
        uuid employee_id FK
        datetime created_at
        text notes
    }

    FinancialRecord {
        uuid id PK
        uuid clinic_id FK
        string record_type
        string category
        string description
        decimal amount
        string status
        date due_date
        date payment_date
        uuid employee_id FK
        string payment_method
        text notes
        datetime created_at
    }

    Clinic ||--o{ Tutor : possui
    Clinic ||--o{ Employee : possui
    Clinic ||--o{ Product : possui
    Clinic ||--o{ Scheduling : possui
    Clinic ||--o{ StockMovement : registra
    Clinic ||--o{ FinancialRecord : registra

    Tutor ||--o{ Pet : possui
    Tutor ||--o{ Scheduling : agenda

    Pet ||--o{ Scheduling : participa
    Employee ||--o{ Scheduling : atende
    Employee ||--o{ FinancialTransaction : registra
    Employee o|--o{ StockMovement : executa
    Employee o|--o{ FinancialRecord : registra

    Service ||--o{ ServiceProduct : consome
    Product ||--o{ ServiceProduct : compoe

    Scheduling ||--o{ ScheduledService : inclui
    Service ||--o{ ScheduledService : compoe

    Scheduling ||--|| FinancialTransaction : gera
    Product ||--o{ StockMovement : movimenta
```

## Observações

- `FinancialTransaction` está modelado como `OneToOne` com `Scheduling`, mas a regra de negócio documentada diz que o lançamento financeiro do agendamento hoje é manual. O esquema mostra a estrutura do modelo atual.
- `Service` não pertence diretamente a uma clínica no modelo atual.
- `Product`, `Employee`, `Tutor`, `Scheduling`, `StockMovement` e `FinancialRecord` têm vínculo direto com `Clinic`.
- O banco local em desenvolvimento continua sendo o arquivo `db.sqlite3`.
