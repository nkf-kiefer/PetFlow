# Documento de Lógica de Negócio — PetFlow

## Escopo
Este documento descreve as regras de negócio aplicadas na API, o comportamento esperado e os pontos de consistência verificados no código.

## Regras de negócio implementadas

### 1) Agendamento no futuro
- Entidade: `Scheduling`
- Regra: não permite `date_time` no passado.
- Implementação: validação em `SchedulingSerializer.validate()`.
- Resultado esperado: retorno HTTP 400 quando a data/hora for menor que o horário atual.

### 2) Conflito de agenda por profissional
- Entidade: `Scheduling`
- Regra: o mesmo `employee` não pode ter dois agendamentos no mesmo `date_time`.
- Implementação: busca de sobreposição em `SchedulingSerializer.validate()`.
- Resultado esperado: HTTP 400 para conflito exato.

### 3) Serviços agendados vinculados
- Entidades: `Scheduling` e `ScheduledService`
- Regra: ao criar/atualizar agendamento, os serviços enviados em `scheduled_services` devem ser persistidos no relacionamento.
- Implementação:
  - `create()`: cria `Scheduling` e em seguida cria itens em `ScheduledService`.
  - `update()`: substitui os `scheduled_services` quando enviados.

### 4) Controle de estoque por movimentação
- Entidades: `Product` e `StockMovement`
- Regra: estoque é atualizado por evento de movimentação.
- Implementação: sinal `post_save` em `StockMovement` (`handle_stock_movement`).
  - `entrada`: soma
  - `saida`: subtrai sem permitir negativo
  - `devolucao`: soma
  - `ajuste`: define valor absoluto

### 5) Entrada inicial automática de estoque
- Entidade: `Product`
- Regra: ao criar produto com `quantity > 0`, deve registrar entrada inicial.
- Implementação: sinal `post_save` em `Product` (`handle_product_creation`).
- Observação de consistência: para evitar duplicidade, o produto é zerado antes da criação do `StockMovement` automático.

### 6) Fluxo financeiro manual
- Entidades: `FinancialTransaction` e `FinancialRecord`
- Regra: não há geração automática obrigatória de lançamento financeiro no create de agendamento.
- Implementação: comentário e comportamento explícito em `SchedulingSerializer.create()`.

## Regras de acesso
- Padrão adotado: `GET` público e escrita autenticada (JWT).
- Implementação: `AuthReadWritePermission` (`IsAuthenticatedOrReadOnly`) em todos os `ModelViewSet`.

## Verificação de consistência (auditoria)

### Ajustes aplicados
1. **Permissões inconsistentes**
   - Situação encontrada: alguns endpoints estavam com `AllowAny`.
   - Correção aplicada: `schedulings`, `stock-movements` e `financial-records` agora usam `AuthReadWritePermission`.

2. **Sinal de estoque (duplicação de quantidade)**
   - Situação anterior: criação de produto com quantidade inicial podia duplicar o valor.
   - Correção já aplicada: zerar quantidade antes de gerar `StockMovement` inicial.

### Pontos de atenção (não bloqueantes)
1. Campo `Employee.password` pertence ao modelo de domínio (não é `django.contrib.auth.User`), porém o hashing é aplicado no `EmployeeSerializer` em `create()` e `update()`.
2. Não há escopo multiclínica por usuário na camada de consulta (querysets retornam todos os registros).
3. Não há paginação/filtro padrão configurados no DRF.

## Evidência de validação
- Resultado: fluxo de criação, edição, exclusão e validação de regras foi verificado durante os testes funcionais do projeto.
