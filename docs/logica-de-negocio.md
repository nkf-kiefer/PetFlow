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
