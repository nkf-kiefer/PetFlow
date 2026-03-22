#!/usr/bin/env python
"""
Teste completo de CRUD da PetFlow API.
Cria, edita e deleta registros de todos os recursos.
Executa com: python test_crud.py
"""

import os
import sys
import django
import requests
from datetime import datetime, timedelta, timezone
from django.contrib.auth import get_user_model

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "petflowapi.settings")
django.setup()

User = get_user_model()

BASE = "http://localhost:8000/api"
TEST_USER = "test_petflow"
TEST_PASS = "TestPass123!"

PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"
INFO = "\033[94m→\033[0m"

errors = []
created_ids = {}  # resource -> id


# ─── helpers ────────────────────────────────────────────────────────────────


def check(label, response, expected=None):
    ok = response.ok if expected is None else response.status_code == expected
    symbol = PASS if ok else FAIL
    print(f"  {symbol} {label} [{response.status_code}]")
    if not ok:
        errors.append(f"{label}: HTTP {response.status_code} → {response.text[:200]}")
    return response


def section(title):
    print(f"\n{'─' * 55}")
    print(f"  {title}")
    print(f"{'─' * 55}")


# ─── setup / teardown ───────────────────────────────────────────────────────


def setup_user():
    User.objects.filter(username=TEST_USER).delete()
    User.objects.create_superuser(TEST_USER, f"{TEST_USER}@test.com", TEST_PASS)


def teardown_user():
    User.objects.filter(username=TEST_USER).delete()


def get_token():
    r = requests.post(f"{BASE}/token/", json={"username": TEST_USER, "password": TEST_PASS})
    assert r.ok, f"Login falhou: {r.text}"
    return r.json()["access"]


# ─── tests ──────────────────────────────────────────────────────────────────


def test_clinic(h):
    section("1. CLINICS")
    r = check(
        "POST criar clínica",
        requests.post(
            f"{BASE}/clinics/",
            headers=h,
            json={
                "name": "Clínica Teste CRUD",
                "cnpj": "99.888.777/0001-01",
                "email": "crud@test.com",
                "phone": "(31) 91111-2222",
                "address": "Rua do Teste, 1",
                "city": "Belo Horizonte",
                "state": "MG",
                "zip_code": "30000-000",
                "opening_time": "08:00",
                "closing_time": "18:00",
                "appointment_interval": 30,
            },
        ),
        201,
    )
    created_ids["clinic"] = r.json()["id"]
    cid = created_ids["clinic"]

    check("GET listar clínicas", requests.get(f"{BASE}/clinics/"))
    check("GET buscar por id", requests.get(f"{BASE}/clinics/{cid}/"))
    check(
        "PATCH atualizar telefone",
        requests.patch(f"{BASE}/clinics/{cid}/", headers=h, json={"phone": "(31) 93333-4444"}),
    )

    r2 = requests.get(f"{BASE}/clinics/{cid}/")
    phone_ok = r2.json().get("phone") == "(31) 93333-4444"
    print(f"  {'✓' if phone_ok else '✗'} Telefone atualizado corretamente")

    return cid


def test_tutor(h, clinic_id):
    section("2. TUTORS")
    r = check(
        "POST criar tutor",
        requests.post(
            f"{BASE}/tutors/",
            headers=h,
            json={
                "clinic": clinic_id,
                "name": "Ana Tutora Teste",
                "cpf": "000.111.222-33",
                "email": "ana@test.com",
                "phone": "(31) 95555-6666",
            },
        ),
        201,
    )
    created_ids["tutor"] = r.json()["id"]
    tid = created_ids["tutor"]

    check("GET listar tutores", requests.get(f"{BASE}/tutors/"))
    check(
        "PATCH atualizar email",
        requests.patch(f"{BASE}/tutors/{tid}/", headers=h, json={"email": "ana.novo@test.com"}),
    )
    return tid


def test_pet(h, tutor_id):
    section("3. PETS")
    r = check(
        "POST criar pet",
        requests.post(
            f"{BASE}/pets/",
            headers=h,
            json={
                "tutor": tutor_id,
                "name": "Bolinha",
                "species": "cachorro",
                "standard_breed": "poodle",
                "birth_date": "2022-04-15",
                "size": "Pequeno",
                "weight": 4.5,
                "color": "branco",
                "gender": "M",
            },
        ),
        201,
    )
    created_ids["pet"] = r.json()["id"]
    pid = created_ids["pet"]

    check("GET buscar pet", requests.get(f"{BASE}/pets/{pid}/"))
    check(
        "PATCH atualizar peso",
        requests.patch(f"{BASE}/pets/{pid}/", headers=h, json={"weight": 5.0}),
    )
    return pid


def test_employee(h, clinic_id):
    section("4. EMPLOYEES")
    r = check(
        "POST criar funcionário",
        requests.post(
            f"{BASE}/employees/",
            headers=h,
            json={
                "clinic": clinic_id,
                "name": "Dr. Carlos Vet",
                "email": "carlos.vet@test.com",
                "password": "Vet@Teste123",
                "role": "veterinario",
                "phone": "(31) 97777-8888",
                "admission_date": "2025-01-10",
            },
        ),
        201,
    )
    created_ids["employee"] = r.json()["id"]
    eid = created_ids["employee"]

    check("GET buscar funcionário", requests.get(f"{BASE}/employees/{eid}/"))
    check(
        "PATCH atualizar role",
        requests.patch(f"{BASE}/employees/{eid}/", headers=h, json={"role": "gerente"}),
    )

    r2 = requests.get(f"{BASE}/employees/{eid}/")
    role_ok = r2.json().get("role") == "gerente"
    print(f"  {'✓' if role_ok else '✗'} Role atualizado para 'gerente'")
    return eid


def test_service(h):
    section("5. SERVICES")
    r = check(
        "POST criar serviço",
        requests.post(
            f"{BASE}/services/",
            headers=h,
            json={
                "name": "Consulta Teste",
                "description": "Consulta de rotina",
                "price": 120.00,
                "duration_minutes": 45,
                "category": "veterinaria",
                "is_active": True,
            },
        ),
        201,
    )
    created_ids["service"] = r.json()["id"]
    sid = created_ids["service"]

    check("GET listar serviços", requests.get(f"{BASE}/services/"))
    check(
        "PATCH atualizar preço",
        requests.patch(f"{BASE}/services/{sid}/", headers=h, json={"price": 130.00}),
    )
    return sid


def test_product(h, clinic_id):
    section("6. PRODUCTS + STOCK SIGNAL")
    r = check(
        "POST criar produto (quantity=20 → signal cria StockMovement)",
        requests.post(
            f"{BASE}/products/",
            headers=h,
            json={
                "clinic": clinic_id,
                "name": "Shampoo Teste",
                "description": "Shampoo para testes",
                "category": "higiene",
                "brand": "TestBrand",
                "quantity": 20,
                "min_stock": 5,
                "alert_threshold": 8,
                "price": 35.00,
            },
        ),
        201,
    )
    pdata = r.json()
    created_ids["product"] = pdata["id"]
    prod_id = pdata["id"]

    # Após criar produto com quantity=20, o signal duplica (cria StockMovement de entrada=20)
    # então quantity fica 40 (20 inicial + 20 do signal). Vamos verificar.
    r2 = requests.get(f"{BASE}/products/{prod_id}/")
    qty = r2.json().get("quantity")
    print(f"  {INFO} Produto criado com quantity=20 → quantity atual no DB = {qty}")

    check("GET buscar produto", requests.get(f"{BASE}/products/{prod_id}/"))
    check(
        "PATCH atualizar preço",
        requests.patch(f"{BASE}/products/{prod_id}/", headers=h, json={"price": 40.00}),
    )
    return prod_id


def test_stock_movement(h, clinic_id, prod_id, emp_id):
    section("7. STOCK MOVEMENTS")
    r_before = requests.get(f"{BASE}/products/{prod_id}/")
    qty_before = r_before.json().get("quantity")
    print(f"  {INFO} Quantity antes da movimentação: {qty_before}")
    if qty_before != 20:
        errors.append(f"Signal duplicou quantity: esperado 20, obtido {qty_before}")

    r = check(
        "POST entrada de estoque (+50)",
        requests.post(
            f"{BASE}/stock-movements/",
            headers=h,
            json={
                "clinic": clinic_id,
                "product": prod_id,
                "movement_type": "entrada",
                "quantity": 50,
                "description": "Reposição de estoque CRUD test",
                "employee": emp_id,
                "notes": "Teste automatizado",
            },
        ),
        201,
    )
    created_ids["stock_movement"] = r.json()["id"]

    r_after = requests.get(f"{BASE}/products/{prod_id}/")
    qty_after = r_after.json().get("quantity")
    print(f"  {INFO} Quantity depois da entrada: {qty_after}")
    signal_ok = qty_after == qty_before + 50
    print(f"  {'✓' if signal_ok else '✗'} Signal atualizou quantity corretamente (+50)")

    r2 = check(
        "POST saída de estoque (-10)",
        requests.post(
            f"{BASE}/stock-movements/",
            headers=h,
            json={
                "clinic": clinic_id,
                "product": prod_id,
                "movement_type": "saida",
                "quantity": 10,
                "description": "Saída CRUD test",
                "employee": emp_id,
            },
        ),
        201,
    )
    created_ids["stock_movement2"] = r2.json()["id"]

    r_final = requests.get(f"{BASE}/products/{prod_id}/")
    qty_final = r_final.json().get("quantity")
    print(f"  {INFO} Quantity depois da saída: {qty_final}")
    signal_ok2 = qty_final == qty_after - 10
    print(f"  {'✓' if signal_ok2 else '✗'} Signal atualizou quantity corretamente (-10)")

    return r.json()["id"]


def test_service_product(h, service_id, prod_id):
    section("8. SERVICE PRODUCTS")
    r = check(
        "POST vincular produto ao serviço",
        requests.post(
            f"{BASE}/service-products/",
            headers=h,
            json={
                "service": service_id,
                "product": prod_id,
                "quantity": 1,
                "notes": "Usar no banho",
            },
        ),
        201,
    )
    created_ids["service_product"] = r.json()["id"]

    check("GET listar service-products", requests.get(f"{BASE}/service-products/"))
    return r.json()["id"]


def test_scheduling(h, clinic_id, tutor_id, pet_id, emp_id, service_id):
    section("9. SCHEDULINGS")
    future = (datetime.now(timezone.utc) + timedelta(days=5)).strftime("%Y-%m-%dT%H:%M:%SZ")
    r = check(
        "POST criar agendamento",
        requests.post(
            f"{BASE}/schedulings/",
            headers=h,
            json={
                "clinic": clinic_id,
                "tutor": tutor_id,
                "pet": pet_id,
                "employee": emp_id,
                "date_time": future,
                "status": "agendado",
                "total_value": 130.00,
                "notes": "Agendamento de teste CRUD",
                "scheduled_services": [
                    {"service": service_id, "service_value": 130.00, "notes": "Consulta teste"}
                ],
            },
        ),
        201,
    )
    created_ids["scheduling"] = r.json()["id"]
    sched_id = created_ids["scheduling"]

    check("GET buscar agendamento", requests.get(f"{BASE}/schedulings/{sched_id}/"))
    check(
        "PATCH atualizar status → confirmado",
        requests.patch(f"{BASE}/schedulings/{sched_id}/", headers=h, json={"status": "confirmado"}),
    )

    r2 = requests.get(f"{BASE}/schedulings/{sched_id}/")
    status_ok = r2.json().get("status") == "confirmado"
    print(f"  {'✓' if status_ok else '✗'} Status atualizado para 'confirmado'")
    return sched_id, future


def test_business_rules(h, emp_id, clinic_id, tutor_id, pet_id, service_id, existing_datetime):
    section("10. REGRAS DE NEGÓCIO")

    # Regra 1: data no passado
    past = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
    r = requests.post(
        f"{BASE}/schedulings/",
        headers=h,
        json={
            "clinic": clinic_id,
            "tutor": tutor_id,
            "pet": pet_id,
            "employee": emp_id,
            "date_time": past,
            "status": "agendado",
            "total_value": 50.0,
        },
    )
    past_rejected = r.status_code == 400
    print(
        f"  {'✓' if past_rejected else '✗'} Regra 1: data passada rejeitada [HTTP {r.status_code}]"
    )
    if not past_rejected:
        errors.append(f"Regra 1: agendamento com data passada foi aceito [HTTP {r.status_code}]")

    # Regra 2: conflito de horário — usa EXATAMENTE o mesmo datetime já agendado
    r2 = requests.post(
        f"{BASE}/schedulings/",
        headers=h,
        json={
            "clinic": clinic_id,
            "tutor": tutor_id,
            "pet": pet_id,
            "employee": emp_id,
            "date_time": existing_datetime,
            "status": "agendado",
            "total_value": 50.0,
        },
    )
    conflict_rejected = r2.status_code == 400
    print(
        f"  {'✓' if conflict_rejected else '✗'} Regra 2: conflito de horário exato rejeitado [HTTP {r2.status_code}]"
    )
    if not conflict_rejected:
        errors.append(
            f"Regra 2: conflito de horário aceito [HTTP {r2.status_code}] → {r2.text[:100]}"
        )

    # Regra 3: horário diferente → aceito
    future2 = (datetime.now(timezone.utc) + timedelta(days=6)).strftime("%Y-%m-%dT%H:%M:%SZ")
    r3 = requests.post(
        f"{BASE}/schedulings/",
        headers=h,
        json={
            "clinic": clinic_id,
            "tutor": tutor_id,
            "pet": pet_id,
            "employee": emp_id,
            "date_time": future2,
            "status": "agendado",
            "total_value": 50.0,
        },
    )
    diff_time_ok = r3.status_code == 201
    print(
        f"  {'✓' if diff_time_ok else '✗'} Regra 3: horário diferente aceito [HTTP {r3.status_code}]"
    )
    if not diff_time_ok:
        errors.append(f"Regra 3: horário diferente rejeitado [HTTP {r3.status_code}]")
    if diff_time_ok:
        created_ids["scheduling2"] = r3.json()["id"]


def test_financial_transaction(h, sched_id, emp_id):
    section("11. FINANCIAL TRANSACTIONS")
    r = check(
        "POST criar transação financeira",
        requests.post(
            f"{BASE}/financial-transactions/",
            headers=h,
            json={
                "scheduling": sched_id,
                "category": "servico",
                "description": "Consulta veterinária - pagamento",
                "amount": 130.00,
                "due_date": "2026-04-01",
                "status": "pendente",
                "payment_method": "cartao",
                "employee": emp_id,
            },
        ),
        201,
    )
    created_ids["financial_transaction"] = r.json()["id"]
    ft_id = created_ids["financial_transaction"]

    check("GET buscar transação", requests.get(f"{BASE}/financial-transactions/{ft_id}/"))
    check(
        "PATCH marcar como pago",
        requests.patch(
            f"{BASE}/financial-transactions/{ft_id}/",
            headers=h,
            json={"status": "pago", "payment_date": "2026-03-22"},
        ),
    )

    r2 = requests.get(f"{BASE}/financial-transactions/{ft_id}/")
    paid_ok = r2.json().get("status") == "pago"
    print(f"  {'✓' if paid_ok else '✗'} Status atualizado para 'pago'")


def test_financial_record(h, clinic_id, emp_id):
    section("12. FINANCIAL RECORDS")
    r = check(
        "POST criar receita",
        requests.post(
            f"{BASE}/financial-records/",
            headers=h,
            json={
                "clinic": clinic_id,
                "record_type": "receita",
                "category": "servico",
                "description": "Receita consulta CRUD test",
                "amount": 130.00,
                "status": "pendente",
                "due_date": "2026-04-01",
                "employee": emp_id,
                "payment_method": "cartao",
            },
        ),
        201,
    )
    created_ids["financial_record"] = r.json()["id"]
    fr_id = created_ids["financial_record"]

    r2 = check(
        "POST criar despesa",
        requests.post(
            f"{BASE}/financial-records/",
            headers=h,
            json={
                "clinic": clinic_id,
                "record_type": "despesa",
                "category": "aluguel",
                "description": "Aluguel março CRUD test",
                "amount": 2500.00,
                "status": "pendente",
                "due_date": "2026-04-05",
            },
        ),
        201,
    )
    created_ids["financial_record2"] = r2.json()["id"]

    check(
        "PATCH marcar receita como realizado",
        requests.patch(
            f"{BASE}/financial-records/{fr_id}/",
            headers=h,
            json={"status": "realizado", "payment_date": "2026-03-22"},
        ),
    )

    r3 = requests.get(f"{BASE}/financial-records/{fr_id}/")
    rec_ok = r3.json().get("status") == "realizado"
    print(f"  {'✓' if rec_ok else '✗'} Status da receita atualizado para 'realizado'")


def test_delete(h):
    section("13. DELETE — limpeza dos registros de teste")
    delete_order = [
        ("financial_transaction", "financial-transactions"),
        ("financial_record", "financial-records"),
        ("financial_record2", "financial-records"),
        ("scheduling2", "schedulings"),
        ("scheduling", "schedulings"),
        ("service_product", "service-products"),
        ("stock_movement2", "stock-movements"),
        ("stock_movement", "stock-movements"),
        ("pet", "pets"),
        ("tutor", "tutors"),
        ("employee", "employees"),
        ("product", "products"),
        ("service", "services"),
        ("clinic", "clinics"),
    ]
    for key, endpoint in delete_order:
        if key in created_ids:
            rid = created_ids[key]
            r = requests.delete(f"{BASE}/{endpoint}/{rid}/", headers=h)
            ok = r.status_code == 204
            print(f"  {'✓' if ok else '✗'} DELETE {endpoint}/{rid[:8]}… [{r.status_code}]")
            if not ok:
                errors.append(f"DELETE {endpoint} {rid}: {r.text[:100]}")


# ─── main ────────────────────────────────────────────────────────────────────


def main():
    print("\n" + "═" * 55)
    print("  PetFlow API — Teste Completo CRUD")
    print("═" * 55)

    setup_user()
    token = get_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    try:
        clinic_id = test_clinic(headers)
        tutor_id = test_tutor(headers, clinic_id)
        pet_id = test_pet(headers, tutor_id)
        emp_id = test_employee(headers, clinic_id)
        service_id = test_service(headers)
        prod_id = test_product(headers, clinic_id)
        test_stock_movement(headers, clinic_id, prod_id, emp_id)
        test_service_product(headers, service_id, prod_id)
        sched_id, sched_dt = test_scheduling(
            headers, clinic_id, tutor_id, pet_id, emp_id, service_id
        )
        test_business_rules(headers, emp_id, clinic_id, tutor_id, pet_id, service_id, sched_dt)
        test_financial_transaction(headers, sched_id, emp_id)
        test_financial_record(headers, clinic_id, emp_id)
        test_delete(headers)
    finally:
        teardown_user()

    print("\n" + "═" * 55)
    if errors:
        print(f"\033[91m  FALHAS ({len(errors)}):\033[0m")
        for e in errors:
            print(f"  • {e}")
    else:
        print("\033[92m  TODOS OS TESTES PASSARAM!\033[0m")
    print("═" * 55 + "\n")

    return len(errors)


if __name__ == "__main__":
    sys.exit(main())
