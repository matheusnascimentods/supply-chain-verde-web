# Plano técnico — Vínculo entre usuário e fornecedor

> Requisitos em [`spec.md`](spec.md); passo a passo em [`tasks.md`](tasks.md).

## 1. Sessão

- `core/auth/session/index.service.ts`: `supplierId()` lendo o claim `supplierId` do JWT, no mesmo padrão de `userId()`.
- `core/auth/session/current-user/index.dto.ts`: `supplierId` nulo no schema de `/users/me`.

| Onde usa `userId()` como fornecedor | Passa a usar |
|---|---|
| `suppliers/application/index.facade.ts` (`canOpenReports`, `canCreateCertification`) | `supplierId()` |
| `suppliers/presentation/pages/form` (`/suppliers/me`) | `supplierId()` |
| `batches/application/create-batch/index.facade.ts` (`loadOwnSupplier`) | `supplierId()` |

## 2. Rotas e navegação

```ts
// app.routes.ts
{ path: 'users', canActivate: [roleGuard], data: { roles: ['admin', 'manager'] }, ... }

// features/suppliers/index.routes.ts
{ path: 'new', canActivate: [roleGuard], data: { roles: ['admin', 'manager'] }, loadComponent: loadForm },
```

`core/layout/navigation/index.constants.ts`: `manager` ganha `{ label: 'Usuários', path: '/users' }`.

## 3. Fornecedores

| Camada | Mudança |
|---|---|
| `domain/index.rules.ts` | `canManageSuppliers` já cobre o botão; nova `canEditOwnProfile(role)`. |
| `domain/index.model.ts` | `NewSupplier.user?: { name; email; password }`; `OwnSupplierPatch` (campos opcionais). |
| `infrastructure/index.repository.ts` | `create` envia `user`; `updateOwn(patch)` → `PATCH /suppliers/me`; `loadRanking` aceita `withoutUser`. |
| `application/use-cases/create-supplier` | Repassa o bloco `user`. |
| `application/use-cases/update-own-supplier` (novo) | Calcula o diff entre o valor inicial e o atual do formulário e envia só o que mudou. |
| `presentation/pages/list` | Botão "Novo fornecedor" quando `canManageSuppliers`. |
| `presentation/pages/form` | Três modos pela rota: `new` (com seção "Criar acesso"), `:id/edit` (como hoje) e `me` (CNPJ/email só leitura, seção de senha). |

A validação "nova senha = confirmação" e "nova senha exige senha atual" fica num validator de grupo do formulário, com spec.

## 4. Usuários

| Camada | Mudança |
|---|---|
| `domain/index.rules.ts` | `canChangeRoles(role)` (só `admin`); `creatableRoles(role)` (`manager` → `['supplier']`). |
| `domain/index.model.ts` | `User.supplierId`, `User.supplierName`; `NewUser.supplierId`. |
| `infrastructure` | DTO com os campos novos; `create` envia `supplierId`. |
| `presentation/components/create-modal` | Opções de role vindas de `creatableRoles`; quando o role é `supplier`, mostra seletor de fornecedor (busca em `GET /suppliers?ranked=true&withoutUser=true&search=`), obrigatório. |
| `presentation/components/role-menu` | Escondido quando `!canChangeRoles`. |
| `presentation/pages/list` | Coluna "Fornecedor". |

O seletor reaproveita o `PagedSearch` já usado no modal de criar lote.

## 5. Testes

- `session`: `supplierId()` com e sem claim.
- Rules: `creatableRoles`, `canChangeRoles`, `canEditOwnProfile`.
- `update-own-supplier`: só campos alterados; senha omitida quando vazia.
- Create-modal: role `supplier` sem fornecedor não envia.
- Guard: `manager` entra em `/users` e `/suppliers/new`; `auditor` não.
