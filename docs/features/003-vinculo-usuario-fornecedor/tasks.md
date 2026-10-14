# Tarefas — Vínculo entre usuário e fornecedor

> Requisitos em [`spec.md`](spec.md); arquitetura em [`plan.md`](plan.md). Cada task é um branch/PR para `main`, em sequência.

**Status:** implementado na branch `feat/vinculo-usuario-fornecedor` (um commit por task). Depende da API (`supply-chain-verde-api/docs/features/002-vinculo-usuario-fornecedor/tasks.md`). Primeira feature a implementar; o gráfico de emissões usa o `supplierId()` da sessão.

---

## Task 1 — `feat/session-supplier-id` (após API Task 2)

- [x] `supplierId()` na sessão e no DTO de `/users/me`
- [x] Trocar `userId()` por `supplierId()` em suppliers e batches
- [x] Specs

## Task 2 — `fix/supplier-own-profile` (após API Task 4)

- [x] `updateOwn` no repositório e use-case `update-own-supplier`
- [x] Modo `me` do formulário: CNPJ/email só leitura, seção de senha com validator de grupo
- [x] Specs

## Task 3 — `feat/create-supplier-with-access` (após API Task 3)

- [x] Rota `suppliers/new` para `admin`/`manager` e botão na lista
- [x] Seção opcional "Criar acesso" no formulário
- [x] Specs

## Task 4 — `feat/manager-users` (após API Task 3)

- [x] Rota e link de Usuários para `manager`
- [x] `creatableRoles`/`canChangeRoles`; role-menu escondido
- [x] Seletor de fornecedor sem acesso no create-modal
- [x] Coluna "Fornecedor" na listagem
- [x] Specs

**Pronto:** `grep -rn "userId()" src/app/features` sem resultado.
