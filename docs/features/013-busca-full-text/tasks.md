# Tarefas — Busca full text

> Requisitos em [`spec.md`](spec.md); arquitetura em [`plan.md`](plan.md).

**Status:** não iniciada.

Esta feature vem **antes** da `014-gestao-produtos`. A dependência "API Task N" aponta para `supply-chain-verde-api/docs/features/014-busca-full-text/tasks.md`. Cada task mexe em **no máximo 10 arquivos** (specs contam).

---

### Task 1 — `fix/busca-textos`

Depende das API Tasks 1–3 para a verificação. O merge não depende delas.

- [ ] `grep -rn "length\|minLength" src/app/features/*/application src/app/features/*/presentation/pages`: nenhuma searchbar corta termo curto (plan §1, RF-01)
- [ ] Placeholder do `#supplier-search` (plan §2, RF-02), mais o spec/Cypress que dependa dele
- [ ] Roteiro manual do plan §3 contra a API local

**Arquivos (~2):** `suppliers/presentation/pages/list/index.component.html` e, se houver, o spec que procura o placeholder.

**Pronto:** `npm test` verde, e o roteiro do plan §3 passa nas 6 searchbars.
