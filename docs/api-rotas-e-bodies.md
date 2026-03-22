# Rotas e Bodies por Operação — PetFlow API

Base URL local: `http://localhost:8000/api`

## Autenticação

### Obter token
- `POST /token/`

Body:
```json
{
  "username": "seu_usuario",
  "password": "sua_senha"
}
```

### Refresh token
- `POST /token/refresh/`

Body:
```json
{
  "refresh": "<REFRESH_TOKEN>"
}
```

Header para escrita:
```http
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

---

## Padrão CRUD (todos os recursos)
- `GET /<resource>/`
- `POST /<resource>/`
- `GET /<resource>/<id>/`
- `PUT /<resource>/<id>/`
- `PATCH /<resource>/<id>/`
- `DELETE /<resource>/<id>/`

---

## 1) Clinics (`/clinics/`)

### POST body
```json
{
  "name": "Clínica Pet Feliz",
  "cnpj": "12.345.678/0001-99",
  "email": "contato@petfeliz.com",
  "phone": "(11) 99999-9999",
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "zip_code": "01234-567",
  "opening_time": "08:00",
  "closing_time": "20:00",
  "appointment_interval": 30,
  "work_days": "seg-sex",
  "is_active": true
}
```

### PATCH body (exemplo)
```json
{
  "phone": "(11) 98888-7777"
}
```

## 2) Tutors (`/tutors/`)

### POST body
```json
{
  "clinic": "<clinic_uuid>",
  "name": "Maria Silva",
  "cpf": "123.456.789-00",
  "email": "maria@email.com",
  "phone": "(11) 77777-7777",
  "secondary_phone": "(11) 66666-6666"
}
```

### PATCH body (exemplo)
```json
{
  "email": "maria.novo@email.com"
}
```

## 3) Pets (`/pets/`)

### POST body
```json
{
  "tutor": "<tutor_uuid>",
  "name": "Rex",
  "species": "cachorro",
  "breed": "Labrador",
  "standard_breed": "labrador",
  "birth_date": "2020-05-10",
  "size": "Grande",
  "weight": 25.5,
  "color": "preto",
  "gender": "M",
  "notes": "Muito brincalhão"
}
```

### PATCH body (exemplo)
```json
{
  "weight": 26.2
}
```

## 4) Employees (`/employees/`)

### POST body
```json
{
  "clinic": "<clinic_uuid>",
  "name": "João Santos",
  "email": "joao@petfeliz.com",
  "password": "senha123",
  "role": "veterinario",
  "phone": "(11) 88888-8888",
  "admission_date": "2025-01-15",
  "is_active": true
}
```

### PATCH body (exemplo)
```json
{
  "role": "gerente"
}
```

## 5) Services (`/services/`)

### POST body
```json
{
  "name": "Banho e Tosa",
  "description": "Banho completo com tosa higiênica",
  "price": 80.0,
  "duration_minutes": 60,
  "category": "banho",
  "parent_category": "Higiene",
  "is_active": true
}
```

### PATCH body (exemplo)
```json
{
  "price": 95.0
}
```

## 6) Products (`/products/`)

### POST body
```json
{
  "clinic": "<clinic_uuid>",
  "name": "Shampoo Pet",
  "description": "Shampoo neutro para cães",
  "category": "higiene",
  "brand": "PetClean",
  "quantity": 20,
  "min_stock": 10,
  "alert_threshold": 15,
  "price": 25.9,
  "is_active": true
}
```

### PATCH body (exemplo)
```json
{
  "price": 29.9
}
```

## 7) Service Products (`/service-products/`)

### POST body
```json
{
  "service": "<service_uuid>",
  "product": "<product_uuid>",
  "quantity": 1,
  "notes": "Usar no banho"
}
```

### PATCH body (exemplo)
```json
{
  "quantity": 2
}
```

## 8) Schedulings (`/schedulings/`)

### POST body
```json
{
  "clinic": "<clinic_uuid>",
  "tutor": "<tutor_uuid>",
  "pet": "<pet_uuid>",
  "employee": "<employee_uuid>",
  "date_time": "2026-03-25T14:00:00Z",
  "status": "agendado",
  "total_value": 130.0,
  "notes": "Agendamento de rotina",
  "scheduled_services": [
    {
      "service": "<service_uuid>",
      "service_value": 130.0,
      "notes": "Consulta"
    }
  ]
}
```

### PATCH body (exemplo)
```json
{
  "status": "confirmado"
}
```

## 9) Stock Movements (`/stock-movements/`)

### POST body
```json
{
  "clinic": "<clinic_uuid>",
  "product": "<product_uuid>",
  "movement_type": "entrada",
  "quantity": 50,
  "description": "Compra de lote",
  "employee": "<employee_uuid>",
  "notes": "Fornecedor X"
}
```

### PATCH body (exemplo)
```json
{
  "notes": "Ajuste de observação"
}
```

## 10) Financial Transactions (`/financial-transactions/`)

### POST body
```json
{
  "scheduling": "<scheduling_uuid>",
  "category": "servico",
  "description": "Consulta veterinária - pagamento",
  "amount": 130.0,
  "due_date": "2026-03-25",
  "payment_date": null,
  "status": "pendente",
  "payment_method": "cartao",
  "employee": "<employee_uuid>"
}
```

### PATCH body (exemplo)
```json
{
  "status": "pago",
  "payment_date": "2026-03-25"
}
```

## 11) Financial Records (`/financial-records/`)

### POST body (receita)
```json
{
  "clinic": "<clinic_uuid>",
  "record_type": "receita",
  "category": "servico",
  "description": "Receita diária",
  "amount": 350.0,
  "status": "pendente",
  "due_date": "2026-03-26",
  "payment_date": null,
  "employee": "<employee_uuid>",
  "payment_method": "cartao",
  "notes": "Movimento de caixa"
}
```

### POST body (despesa)
```json
{
  "clinic": "<clinic_uuid>",
  "record_type": "despesa",
  "category": "energia",
  "description": "Conta de energia",
  "amount": 210.0,
  "status": "pendente",
  "due_date": "2026-03-28",
  "employee": "<employee_uuid>",
  "payment_method": "boleto"
}
```

### PATCH body (exemplo)
```json
{
  "status": "realizado",
  "payment_date": "2026-03-27"
}
```
