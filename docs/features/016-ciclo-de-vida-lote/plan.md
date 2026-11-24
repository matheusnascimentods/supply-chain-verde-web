# Plano técnico: Ciclo de vida do lote

> Os requisitos estão em [`spec.md`](spec.md) e o passo a passo em [`tasks.md`](tasks.md).

## 1. Status novos (Task 1)

`domain/index.model.ts`:

```ts
export const BATCH_STATUSES = ['PENDING', 'ACTIVE', 'COMPLETED', 'REJECTED', 'CANCELED'] as const;

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  PENDING: 'Pendente',
  ACTIVE: 'Em andamento',
  COMPLETED: 'Concluído',
  REJECTED: 'Recusado',
  CANCELED: 'Cancelado',
};
```

- O `index.dto.ts` já usa `z.enum(BATCH_STATUSES)` e o filtro da lista itera `BATCH_STATUSES`, então os dois mudam sem edição.
- `status-badge/index.component.css`: `:host([data-status='COMPLETED'])` com `bg-teal-100 text-teal-800` e `:host([data-status='CANCELED'])` com `bg-slate-100 text-slate-700`.
- Esta task **precisa entrar em produção antes da API Task 1**. Hoje um `status` desconhecido quebra o `parse` da listagem inteira.

## 2. Máquina de estados espelhada (Task 2)

O front espelha a mesma tabela do `BatchStatus` da API em `domain/index.rules.ts`, sem biblioteca:

```ts
// Espelho do BatchStatus.canTransitionTo da API (017). Os estados ausentes são finais.
const TRANSITIONS: Partial<Record<BatchStatus, readonly BatchStatus[]>> = {
  PENDING: ['ACTIVE', 'REJECTED', 'CANCELED'],
  ACTIVE: ['COMPLETED'],
};
const canMove = (from: BatchStatus, to: BatchStatus) => TRANSITIONS[from]?.includes(to) ?? false;
```

`domain/stage/index.model.ts`, ao lado do `nextStage`:

```ts
/** RN-08 da API: o mercado registra só o RETAIL; o resto da cadeia é do fornecedor. */
export const stageOwner = (stage: StageType): CompanyType => (stage === 'RETAIL' ? 'market' : 'supplier');
```

As regras passam a ser:

```ts
const MARKET_ROLES: readonly Role[] = ['admin', 'manager'];
const SUPPLIER_ROLES: readonly Role[] = ['admin', 'supplier'];
const actsFor = (side: CompanyType, role: Role, companyType: Company) =>
  companyType === side && (side === 'market' ? MARKET_ROLES : SUPPLIER_ROLES).includes(role);

export function canAddStageTo(role: Role, companyType: Company, batch: Batch): boolean {
  const next = nextStage(batch.currentStage);
  if (next === null || (batch.status !== 'PENDING' && batch.status !== 'ACTIVE')) return false;
  return actsFor(stageOwner(next), role, companyType);
}

export function canReject(role: Role, companyType: Company, batch: Batch): boolean {
  return actsFor('supplier', role, companyType) && canMove(batch.status, 'REJECTED');
}

export function canCancel(role: Role, companyType: Company, batch: Batch): boolean {
  return actsFor('market', role, companyType) && canMove(batch.status, 'CANCELED');
}

export function canCalculateEmission(role: Role): boolean {
  return role === 'admin' || role === 'manager' || role === 'supplier';
}
```

- O `canAddStageTo` atual (perfis + `PENDING` só para o fornecedor) é substituído por essa versão, que é mais curta e não tem o caso especial do `PENDING`: em `PENDING` a próxima etapa é a Produção, que é do fornecedor.
- O `canCreateBatch` pode reaproveitar o `actsFor('market', ...)`.

## 3. Cancelar (Task 3)

- `infrastructure/index.repository.ts`: `cancel(batchId)` faz `PATCH ${base}/${batchId}/cancel` com `{}` e passa a resposta pelo `batchResponseSchema.parse`, como o `reject`.
- `application/use-cases/cancel-batch/index.use-case.ts`: `CancelBatchUseCase.execute(batchId)` repassa para o repositório. Segue o padrão do `RejectBatchUseCase`, sem a validação do motivo.
- `application/index.facade.ts`: `canCancel(batch)`, igual ao `canReject`.
- `batch-card`: `canCancel = input(false)`, `cancel = output<void>()` e o botão **Cancelar pedido** (`data-testid="batch-cancel"`) ao lado do **Recusar**, com o mesmo estilo secundário.
- `pages/list`: `cancelBatch = signal<Batch | null>(null)` e uma confirmação com o `app-modal` compartilhado ("Cancelar o pedido do lote #258? O fornecedor não poderá mais aceitá-lo."). Ao confirmar, chama `CancelBatchUseCase` e depois `facade.load()`, como o `batchRejected`. No erro, usa o toast com `apiErrorMessage`.

`ponytail:` a confirmação fica direto na página de lista, sem um `cancel-modal` próprio, porque não há formulário. Vira um componente se ganhar campo (por exemplo, um motivo).

## 4. Testes

- `index.rules.spec.ts`:
  - `canAddStageTo`: mercado × fornecedor em cada etapa (Pendente, Armazenagem, Distribuição, Varejo concluído), e os status finais.
  - `canCancel` e `canReject` só em Pendente e só do lado certo.
  - `canCalculateEmission('supplier')` devolve `true`.
- `status-badge` spec: os labels dos 5 status.
- `batch-card` spec: o botão **Cancelar pedido** aparece com `canCancel` e emite `cancel`.
- `list` spec: confirmar o cancelamento chama o use case e recarrega a lista. Um erro 409 mostra o toast.
- Cypress `register-batch-flow.cy.ts`: o mercado cancela um lote pendente, e o mercado registra o Varejo, que deixa o lote Concluído.
