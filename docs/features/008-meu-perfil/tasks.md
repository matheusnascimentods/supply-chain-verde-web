# Tarefas — Meu perfil para todos os perfis

> Requisitos em [`spec.md`](spec.md); arquitetura em [`plan.md`](plan.md).

**Status:** concluída.

---

## Task 1 — `refactor/profile-route`

Só o fornecedor usa a tela, mas ela já fica no lugar novo. Não depende da API.

- [x] Mover a página para `features/profile` e criar a rota `/profile` (plan §2, §3)
- [x] `/suppliers/me` redirecionando para `/profile`
- [x] Remover a aba da navbar e mostrar o link do dropdown para todos (plan §1)
- [x] Voltar e Cancelar → `/dashboard`
- [x] Testes de navbar e rota (plan §5)

**Pronto:** o fornecedor edita o perfil em `/profile` como hoje, e nenhuma aba fica marcada.

## Task 2 — `feat/profile-all-roles`

- [x] Carregar nome, email e perfil via `GET /users/me`
- [x] Seções de fornecedor só para `supplier`
- [x] Repositório `PATCH /users/me` e save dos outros perfis (plan §3, §4)
- [x] Testes de página (plan §5)

**Pronto:** admin, gestor e auditor trocam nome e senha em `/profile`; `npm test` verde.
