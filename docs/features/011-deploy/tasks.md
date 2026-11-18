# Tarefas — Deploy em VM com Docker

> Requisitos em [`spec.md`](spec.md); arquitetura em [`plan.md`](plan.md).

**Status:** Task 1 concluída.

As dependências "API Task N" apontam para `supply-chain-verde-api/docs/features/012-deploy/tasks.md`. Cada task mexe em até 15 arquivos. Specs contam, e apagar ou mover conta como um arquivo. A lista de arquivos é uma estimativa.

---

### Task 1 — `fix/prod-environment`

Não depende da API.

- [x] `fileReplacements` na configuração `production` do `angular.json` (plan §1)
- [x] `environment.prod.ts` com `apiUrl: '/api/v1'` (RF-01)
- [x] README: tabela de variáveis com o valor de produção do `apiUrl`

**Arquivos (~3):** `angular.json`, `src/environments/environment.prod.ts`, `README.md`.

**Pronto:** `npm run build` sem `localhost:8080` em `dist/`, e `npm test` verde.

### Task 2 — `build/docker-image`

Depende da Task 1.

- [ ] `Dockerfile` (Node 22 → Caddy) e `.dockerignore` (plan §2)
- [ ] `Caddyfile` com proxy de `/api`, Swagger e fallback da SPA (plan §3, RF-02 a RF-05)
- [ ] `.env.example` com `SITE_ADDRESS` e `API_UPSTREAM` no lugar de `API_URL` e `PRODUCTION` (plan §4, RF-06)
- [ ] Job `publish` no `ci.yml` (plan §5)
- [ ] README: como rodar a imagem localmente e link para o deploy na API
- [ ] Depois do primeiro merge: marcar o pacote como público no GHCR

**Arquivos (~6):** `Dockerfile`, `.dockerignore`, `Caddyfile`, `.env.example`, `.github/workflows/ci.yml`, `README.md`.

**Pronto:** a fumaça do plan §6 passa, e o push na `main` publica `ghcr.io/matheusnascimentods/supply-chain-verde-web:latest`. Libera a API Task 3.
