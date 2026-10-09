# Tarefas — Vínculo entre usuário e fornecedor

> Requisitos em [`spec.md`](spec.md); arquitetura em [`plan.md`](plan.md). Cada task é um branch/PR para `main`, em sequência.

**Status:** não iniciado. Depende da API (`supply-chain-verde-api/docs/vinculo-usuario-fornecedor/tasks.md`). Primeira feature a implementar; o gráfico de emissões usa o `supplierId()` da sessão.

---

## Task 1 — `feat/session-supplier-id` (após API Task 2)

- [ ] `supplierId()` na sessão e no DTO de `/users/me`
- [ ] Trocar `userId()` por `supplierId()` em suppliers e batches
- [ ] Specs

## Task 2 — `fix/supplier-own-profile` (após API Task 4)

- [ ] `updateOwn` no repositório e use-case `update-own-supplier`
- [ ] Modo `me` do formulário: CNPJ/email só leitura, seção de senha com validator de grupo
- [ ] Specs

## Task 3 — `feat/create-supplier-with-access` (após API Task 3)

- [ ] Rota `suppliers/new` para `admin`/`manager` e botão na lista
- [ ] Seção opcional "Criar acesso" no formulário
- [ ] Specs

## Task 4 — `feat/manager-users` (após API Task 3)

- [ ] Rota e link de Usuários para `manager`
- [ ] `creatableRoles`/`canChangeRoles`; role-menu escondido
- [ ] Seletor de fornecedor sem acesso no create-modal
- [ ] Coluna "Fornecedor" na listagem
- [ ] Specs

**Pronto:** `grep -rn "userId()" src/app/features` sem resultado.
