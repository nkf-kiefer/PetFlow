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

## Banco de dados e arquitetura de dados

### Como o banco funciona hoje
- Em desenvolvimento local, o projeto usa SQLite no arquivo `db.sqlite3`.
- Esse arquivo fica na máquina que está executando o backend.
- Se você abrir o frontend em outro computador, os dados só aparecem se ambos estiverem consumindo a mesma API remota.

### Decisão de arquitetura adotada
- Para simplificar operação e custo inicial, o backend foi pensado com banco centralizado no servidor de deploy.
- No plano atual, o servidor mantém um único SQLite para todos os usuários do sistema.
- O frontend (qualquer dispositivo) deve apontar para a mesma `API_BASE` publicada.

### Implicações práticas
- Dois ambientes diferentes (ex.: localhost e produção) terão bases diferentes.
- Backup pode ser feito copiando o arquivo SQLite do servidor.
- Migrations continuam sendo obrigatórias a cada mudança de schema.

### Evolução recomendada
- Enquanto o volume for pequeno e com baixa concorrência, SQLite centralizado atende bem.
- Para crescimento de uso concorrente, relatórios pesados ou múltiplas integrações, a migração para PostgreSQL é o próximo passo natural.
- A API já está organizada de forma que a troca de engine de banco seja majoritariamente de configuração e migração.

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








