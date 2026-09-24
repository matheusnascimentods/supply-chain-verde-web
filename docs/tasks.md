# tasks.md — Supply Chain Verde (Frontend)

> Checklist de implementação, derivado do `plan.md`, ordenado por dependência. Marque `[x]` conforme for concluindo. Contratos de schema em `plan.md` (seção 8); rotas e perfis em `spec.md` (seção 4).

**Como usar em dupla:** a partir do fim da Fase 2 (Core + Shared), as features das Fases 4 e 6 não dependem umas das outras — só de `core`/`shared` — então dá pra dividir por pessoa a partir daí. `traceability` (pública) também pode ser feita em paralelo com `auth`, já que não depende de sessão.

**Sobre wireframes/design visual:** por decisão do time, o desenho de tela fica para o final — este checklist cobre a implementação funcional; o polimento visual entra depois de tudo aqui estar de pé.

---

## Fase 0 — Bootstrap

*Já parcialmente feito (`ng new` com Tailwind, sem SSR/SSG, Copilot configurado). Confirmar o restante antes de seguir.*

- [x] Projeto Angular criado (`ng new`, Tailwind, standalone components, sem SSR/SSG)
- [x] `.github/copilot-instructions.md` gerado pelo Angular CLI
- [x] Complementar `.github/copilot-instructions.md` com o conteúdo deste `plan.md` (stack, estrutura de pastas, convenções — preservando o conteúdo genérico do Angular já presente)
- [x] Instalar Zod (`npm install zod`)
- [x] Criar `.env.example` com todas as variáveis de ambiente conhecidas
- [x] Configurar `environments/environment.ts` e `environment.prod.ts` (`apiUrl`)
- [x] Confirmar `.gitignore` cobre `node_modules/`, `dist/`, arquivos de IDE
- [x] Rodar `ng serve` e confirmar que a aplicação sobe vazia antes de criar qualquer feature

---

## Fase 1 — Core

*Depende apenas da Fase 0. Bloqueia guards/interceptor de todas as features protegidas.*

- [x] Definir `UserRole` (schema Zod compartilhado — decidir local: `core/session/index.schema.ts`)
- [x] `core/session/index.service.ts` — signal de `role`, leitura/escrita em `sessionStorage` (ver plan.md seção 6)
- [x] `core/session/index.service.spec.ts`
- [x] `core/guards/index.guard.ts` — `authGuard` (bloqueia sem sessão) + `roleGuard` (compara `route.data['roles']` com a sessão)
- [x] `core/guards/index.guard.spec.ts`
- [x] `core/interceptors/index.interceptor.ts` — injeta `Authorization: Bearer`, trata `401`/`403` global (logout automático)
- [x] `core/interceptors/index.interceptor.spec.ts`
- [x] Registrar guard/interceptor em `app.config.ts` (`provideHttpClient(withInterceptors([...]))`)

---

## Fase 2 — Shared Components

*Depende apenas da Fase 0. Pode ser feita em paralelo com a Fase 1.*

- [ ] `shared/components/spinner/index.component.ts`
- [ ] `shared/components/confirm-dialog/index.component.ts`
- [ ] `shared/components/enum-select/index.component.ts` — recebe um `z.enum(...)` e monta o `<select>` a partir de `.options` (ver plan.md seção 9)
- [ ] `shared/components/error-toast/index.component.ts`

---

## Fase 3 — Feature: Auth

*Depende de: Fase 1 (session), Fase 2 (error-toast/spinner).*

- [ ] `features/auth/index.schema.ts` — `loginRequestSchema`, `loginResponseSchema` (Zod)
- [ ] `features/auth/index.service.ts` — chama `POST /auth/login`, valida resposta, popula `SessionService`
- [ ] `features/auth/index.service.spec.ts`
- [ ] `features/auth/login/index.component.{ts,html,spec.ts}` — formulário Reactive Forms, erro de credencial sem detalhar campo

---

## Fase 4 — Feature: Traceability (pública)

*Depende de: Fase 2 (shared components). Não depende de Fase 1/3 — rota pública, pode ser feita em paralelo com Auth.*

- [ ] `features/traceability/index.schema.ts` — espelha `BatchTraceabilityResponseDTO`, `CarbonFootprintResponseDTO`
- [ ] `features/traceability/index.service.ts` — `GET /batches/{id}/traceability` + `/carbon-footprint`
- [ ] `features/traceability/index.service.spec.ts`
- [ ] `features/traceability/index.component.{ts,html,spec.ts}` — linha do tempo das etapas, tratamento de `batchId` inexistente
- [ ] `features/traceability/carbon-chart/index.component.{ts,html,spec.ts}`

---

## Fase 5 — Feature: Dashboard

*Depende de: Fase 1 (role da sessão).*

- [ ] `features/dashboard/index.component.{ts,html,spec.ts}` — conteúdo condicional por `role` (ver spec.md seção 3.2)

---

## Fase 6 — Features de Domínio

*Depende de: Fases 1 e 2. Cada feature é independente das outras — boa hora para dividir entre os dois integrantes.*

- [ ] **suppliers**: `index.schema.ts`, `index.service.ts` (+ `.spec.ts`), `list/`, `form/`, `ranking/`
- [ ] **products**: `index.schema.ts`, `index.service.ts` (+ `.spec.ts`), `list/`, `form/`
- [ ] **certifications**: `index.schema.ts`, `index.service.ts` (+ `.spec.ts`), `list/` (com ação de validar status), `form/`
- [ ] **batches**: `index.schema.ts`, `index.service.ts` (+ `.spec.ts`), `list/`, `form/`
- [ ] **chain**: `index.schema.ts`, `index.service.ts` (+ `.spec.ts`), `list/`, `form/` (incluindo sub-formulário de transporte + ação de calcular emissão — ver spec.md seção 3.6)
- [ ] **reports**: `index.schema.ts`, `index.service.ts` (+ `.spec.ts`), `list/`, `form/` (geração)
- [ ] **users**: `index.schema.ts`, `index.service.ts` (+ `.spec.ts`), `list/`, `form/`
- [ ] **audit-log**: `index.schema.ts`, `index.service.ts` (+ `.spec.ts`), `list/`

---

## Fase 7 — Roteamento Final

*Depende de: todas as features da Fase 6 existirem (ao menos como componente vazio) para o roteamento fazer sentido de ponta a ponta.*

- [ ] Montar `app.routes.ts` completo (ver plan.md seção 5), com `authGuard`/`roleGuard` aplicados conforme `spec.md` seção 4
- [ ] Conferir cada rota contra o sitemap do `spec.md` — nenhuma tela esquecida, nenhum perfil com acesso indevido
- [ ] Testar manualmente a navegação com um usuário de cada `role`

---

## Fase 8 — Testes E2E (Cypress)

*Depende de: fluxo completo (Fases 3–7) funcionando.*

- [ ] `cypress/e2e/login.cy.ts`
- [ ] `cypress/e2e/traceability-public.cy.ts`
- [ ] `cypress/e2e/register-batch-flow.cy.ts` — fluxo completo: lote → etapa → transporte → emissão (spec.md seção 5.3)

---

## Fase 9 — Design Visual (por último, por decisão do time)

- [ ] Wireframes/mockups das 13 telas do `spec.md`
- [ ] Revisar componentes de `shared/` contra o wireframe (ajustar classes Tailwind, não estrutura)
- [ ] Ajuste de responsividade para a tela de apresentação/projeção
