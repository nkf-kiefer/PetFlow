# PetFlow API

API REST para gestão de clínica veterinária (cadastros, agenda, estoque e finanças).

## Sumário
- [Visão geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Como executar](#como-executar)
- [Autenticação e permissões](#autenticação-e-permissões)
- [Segurança e ambiente](#segurança-e-ambiente)
- [Documentação funcional](#documentação-funcional)
- [Deploy](#deploy)
- [Qualidade e testes](#qualidade-e-testes)
- [Estrutura do projeto](#estrutura-do-projeto)

## Visão geral
- Projeto backend em Django + DRF.
- Base local: `http://localhost:8000`.
- API versionada sob prefixo `api/`.
- IDs das entidades em UUID.

## Tecnologias
- Python 3.12
- Django 6
- Django REST Framework
- Simple JWT
- SQLite (ambiente local)

## Como executar

1. Ativar ambiente virtual (Windows PowerShell):

```powershell
& "venv\Scripts\Activate.ps1"
```

2. Instalar dependências:

```bash
pip install -r requirements.txt
```

3. Aplicar migrações:

```bash
python manage.py makemigrations api
python manage.py migrate
```

4. Criar usuário admin:

```bash
python manage.py createsuperuser
```

5. Subir servidor:

```bash
python manage.py runserver
```

## Autenticação e permissões

### JWT
- `POST /api/token/`
- `POST /api/token/refresh/`

Header para operações de escrita:

```http
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

### Regra de acesso
- Leitura (`GET`) pública
- Escrita (`POST`, `PUT`, `PATCH`, `DELETE`) autenticada

## Segurança e ambiente

- Configuração pronta para produção via variáveis de ambiente.
- Use o arquivo [.env.example](.env.example) como referência.
- Em produção, obrigatoriamente:
	- `DEBUG=False`
	- `SECRET_KEY` forte e secreta
	- `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS` e `CORS_ALLOWED_ORIGINS` corretos
	- Banco configurado conforme ambiente (SQLite para cenários simples; PostgreSQL recomendado para produção)

## Documentação funcional

- Lógica de negócio detalhada: [docs/logica-de-negocio.md](docs/logica-de-negocio.md)
- Rotas e bodies por operação: [docs/api-rotas-e-bodies.md](docs/api-rotas-e-bodies.md)

## Deploy

- Opção mais simples e gratuita: PythonAnywhere
- Arquivo pronto para Render: [render.yaml](render.yaml)
- Sugestões de hospedagem: Render, Railway ou Fly.io

## Qualidade e testes

Verificações recomendadas:

```bash
python manage.py check
python test_crud.py
```

O script [test_crud.py](test_crud.py) valida:
- criação, edição, consulta e exclusão dos recursos
- regras de agendamento
- atualização de estoque por sinal

## Estrutura do projeto

```text
PetFlow/
├─ api/                # models, serializers, views, signals
├─ docs/               # documentação funcional
├─ petflowapi/         # settings e urls do projeto Django
├─ frontend/           # interface web auxiliar
├─ test_crud.py        # suíte de teste CRUD e regras de negócio
├─ .env.example        # exemplo de variáveis de ambiente
├─ requirements.txt    # dependências do projeto
└─ README.md
```

```






