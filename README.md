# PetFlow API

API REST para clínica veterinária (cadastro, agenda, estoque e financeiro).

## O que este projeto já faz
- CRUD completo das entidades principais
- autenticação JWT
- leitura pública e escrita autenticada
- validações de agenda e controle de estoque por movimentação

Base local: `http://localhost:8000`  
API: `http://localhost:8000/api/`

## Stack
- Python 3.12
- Django 6
- Django REST Framework
- Simple JWT
- SQLite (local)

## Rodando localmente (Windows / PowerShell)

1. Ative o ambiente virtual

```powershell
& "venv\Scripts\Activate.ps1"
```

2. Instale as dependências

```bash
pip install -r requirements.txt
```

3. Migre o banco

```bash
python manage.py makemigrations api
python manage.py migrate
```

4. Crie um superusuário

```bash
python manage.py createsuperuser
```

5. Suba o servidor

```bash
python manage.py runserver
```

## Autenticação
- `POST /api/token/`
- `POST /api/token/refresh/`

Header para `POST`, `PUT`, `PATCH` e `DELETE`:

```http
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

## Ambiente e segurança
- use [.env.example](.env.example) como base
- em produção:
  - `DEBUG=False`
  - `SECRET_KEY` forte
  - `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS` e `CORS_ALLOWED_ORIGINS` configurados
  - banco conforme necessidade (SQLite para cenário simples; PostgreSQL recomendado em produção)

## Documentação útil
- Regras do sistema: [docs/logica-de-negocio.md](docs/logica-de-negocio.md)
- Rotas com exemplos de payload: [docs/api-rotas-e-bodies.md](docs/api-rotas-e-bodies.md)

## Estrutura

```text
PetFlow/
├─ api/                # models, serializers, views, signals
├─ docs/               # documentação funcional
├─ petflowapi/         # settings e urls do projeto Django
├─ frontend/           # interface web
├─ .env.example        # exemplo de variáveis
├─ requirements.txt
└─ README.md
```








