# Deploy completo (Frontend + API) — PetFlow

Este projeto já está preparado para subir **frontend e API juntos** no mesmo app Django.

## Opção recomendada para você: PythonAnywhere (grátis)

Sim, **dá para fazer** e é uma boa opção para começar.

### Arquitetura no PythonAnywhere

- Frontend em `/` (redireciona para `/static/index.html`)
- API em `/api/*`
- Healthcheck em `/health/`
- Banco inicial: SQLite (mais simples no plano grátis)

---

## Passo a passo — PythonAnywhere (free)

### 1) Criar conta e abrir console Bash

Crie conta em PythonAnywhere e entre em **Consoles > Bash**.

### 2) Clonar projeto

```bash
git clone <URL_DO_SEU_REPO> PetFlow
cd PetFlow
```

### 3) Criar e ativar virtualenv

```bash
python3.12 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 4) Configurar variáveis de ambiente

No PythonAnywhere, edite o arquivo `~/.bashrc` e adicione:

```bash
export SECRET_KEY='sua-chave-forte'
export DEBUG='False'
export ALLOWED_HOSTS='<seu-usuario>.pythonanywhere.com'
export CSRF_TRUSTED_ORIGINS='https://<seu-usuario>.pythonanywhere.com'
export CORS_ALLOWED_ORIGINS='https://<seu-usuario>.pythonanywhere.com'
```

Depois:

```bash
source ~/.bashrc
```

> No plano grátis, mantenha SQLite (não defina `DB_ENGINE`).

### 5) Migrar banco e coletar estáticos

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

### 6) Criar Web App no painel

No menu **Web**:

1. **Add a new web app**
2. Escolha domínio `seuusuario.pythonanywhere.com`
3. Escolha **Manual configuration**
4. Python 3.12

### 7) Configurar WSGI

No arquivo WSGI do app (menu Web > WSGI configuration file), deixe assim (ajustando `seuusuario`):

```python
import os
import sys

path = '/home/seuusuario/PetFlow'
if path not in sys.path:
		sys.path.append(path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'petflowapi.settings')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

### 8) Configurar Virtualenv no Web app

No painel Web, em **Virtualenv**, informe:

```text
/home/seuusuario/PetFlow/venv
```

### 9) Configurar Static files

No painel Web > **Static files**:

- URL: `/static/`
- Directory: `/home/seuusuario/PetFlow/staticfiles`

### 10) Reload da aplicação

No topo da página Web, clique em **Reload**.

---

## URLs esperadas

- Frontend: `https://<seu-usuario>.pythonanywhere.com/`
- API: `https://<seu-usuario>.pythonanywhere.com/api/`
- Healthcheck: `https://<seu-usuario>.pythonanywhere.com/health/`

---

## Checklist rápido pós-deploy

- [ ] `/health/` retorna `{"status": "ok"}`
- [ ] Tela de login abre em `/`
- [ ] Login funciona
- [ ] CRUD básico funciona (ex.: Clínicas)
- [ ] KPI de saldo confirmado carrega

---

## Problemas comuns

1. **Erro 500**: veja os logs em Web > Error log.
2. **Static não carrega**: rode `collectstatic` de novo e confira caminho `/static/`.
3. **Host inválido**: confira `ALLOWED_HOSTS`.
4. **CSRF bloqueando**: confira `CSRF_TRUSTED_ORIGINS` com `https://`.
