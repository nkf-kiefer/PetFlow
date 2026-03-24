# Lógica de negócio 

## Regras principais

### 1) Agendamento só no futuro
- Se `date_time` estiver no passado, a API rejeita com `400`.
- Validação feita em `SchedulingSerializer.validate()`.

### 2) Sem conflito de profissional no mesmo horário
- Um mesmo `employee` não pode ter dois agendamentos no mesmo `date_time`.
- Se houver conflito, retorna `400`.

### 3) Serviços do agendamento
- O campo `scheduled_services` é salvo junto com o agendamento.
- No `update()`, se esse campo vier no payload, os serviços antigos são substituídos pelos novos.

### 4) Estoque atualizado por movimentação
No `post_save` de `StockMovement`:
- `entrada`: soma no estoque
- `saida`: subtrai (sem deixar negativo)
- `devolucao`: soma
- `ajuste`: define quantidade final

### 5) Entrada inicial automática ao cadastrar produto
- Se o produto é criado com `quantity > 0`, a API cria uma movimentação de entrada automática.
- O ajuste para evitar duplicidade já está aplicado.

### 6) Financeiro no agendamento
- O agendamento **não** cria lançamento financeiro automático por padrão.
- Lançamentos financeiros seguem fluxo manual.

## Permissões
- `GET`: público
- `POST`, `PUT`, `PATCH`, `DELETE`: autenticado com JWT

Todos os `ModelViewSet` usam `AuthReadWritePermission`.

## Pontos que valem atenção
1. `Employee.password` é do modelo de domínio (não do `User`), mas passa por hashing no `EmployeeSerializer` (`create()` e `update()`).
2. Ainda não existe escopo multiclínica por usuário (as consultas retornam tudo).
3. A API ainda não tem paginação/filtro global configurados no DRF.

## Status
As regras acima foram testadas no uso funcional do projeto e estão ativas.

## Estratégia de banco de dados

### Cenário atual
- O projeto usa SQLite como banco principal.
- Em ambiente local, os dados ficam no arquivo `db.sqlite3` da própria máquina.
- Em deploy, o objetivo é concentrar o banco no servidor para que todos os clientes consumam os mesmos dados via API.

### Decisão de design
- A escolha por SQLite nesta fase prioriza simplicidade de setup, custo e velocidade de entrega.
- A consistência entre dispositivos não é feita por replicação de arquivo local, e sim por acesso ao mesmo backend publicado.

### Consequências esperadas
- Dados não sincronizam automaticamente entre dois backends distintos (ex.: localhost e produção).
- Migrações devem ser aplicadas no ambiente onde a API está rodando.
- Backup operacional é baseado em cópia do arquivo do banco no servidor.

### Próximo passo arquitetural
- Caso o sistema aumente concorrência e volume transacional, a evolução prevista é PostgreSQL.
