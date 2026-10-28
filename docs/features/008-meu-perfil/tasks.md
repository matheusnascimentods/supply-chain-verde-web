# Tarefas — Meu perfil para todos os perfis

> Requisitos em [`spec.md`](spec.md); arquitetura em [`plan.md`](plan.md).

**Status:** planejado, nada implementado. A Task 2 depende do `PATCH /users/me` da API (`supply-chain-verde-api/docs/features/009-meu-perfil/tasks.md`).

---

## Task 1 — `refactor/profile-route`

Só o fornecedor usa a tela, mas ela já fica no lugar novo. Não depende da API.

- [ ] Mover a página para `features/profile` e criar a rota `/profile` (plan §2, §3)
- [ ] `/suppliers/me` redirecionando para `/profile`
- [ ] Remover a aba da navbar e mostrar o link do dropdown para todos (plan §1)
- [ ] Voltar e Cancelar → `/dashboard`
- [ ] Testes de navbar e rota (plan §5)

**Pronto:** o fornecedor edita o perfil em `/profile` como hoje, e nenhuma aba fica marcada.

## Task 2 — `feat/profile-all-roles`

- [ ] Carregar nome, email e perfil via `GET /users/me`
- [ ] Seções de fornecedor só para `supplier`
- [ ] Repositório `PATCH /users/me` e save dos outros perfis (plan §3, §4)
- [ ] Testes de página (plan §5)

**Pronto:** admin, gestor e auditor trocam nome e senha em `/profile`; `npm test` verde.
