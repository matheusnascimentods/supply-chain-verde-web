# tasks.md — Supply Chain Verde (Frontend)

> Checklist de implementação, derivado do `plan.md`, ordenado por dependência. Marque `[x]` conforme for concluindo. Contratos de schema em `plan.md` (seção 8); rotas e perfis em `spec.md` (seção 4).

**Como usar em dupla:** a partir do fim da Fase 2 (Core + Shared), as features das Fases 4 e 6 não dependem umas das outras — só de `core`/`shared` — então dá pra dividir por pessoa a partir daí. `traceability` (pública) também pode ser feita em paralelo com `auth`, já que não depende de sessão.

**Sobre wireframes/design visual:** por decisão do time, o desenho de tela fica para o final — este checklist cobre a implementação funcional; o polimento visual entra depois de tudo aqui estar de pé.

---

## Fase 0 — Bootstrap

_Já concluído (`ng new` com Tailwind, sem SSR/SSG, Copilot e variáveis de ambiente configuradas)._

- [x] Projeto Angular criado (`ng new`, Tailwind CSS, standalone components, sem SSR/SSG)
- [x] `.github/copilot-instructions.md` — instruções do Copilot integradas com stack, convenções e regras do `plan.md`
- [x] Instalar Zod (`npm install zod`)
- [x] `.env.example` — template de variáveis de ambiente do projeto
- [x] `src/environments/environment.ts` — configuração de ambiente de desenvolvimento (`apiUrl`)
- [x] `src/environments/environment.prod.ts` — configuração de ambiente de produção
- [x] `.gitignore` — regras para ignorar `node_modules/`, `dist/` e arquivos de IDE
- [x] Rodar `ng serve` e confirmar que a aplicação sobe vazia antes de criar qualquer feature

---

## Fase 1 — Core

_Depende apenas da Fase 0. Bloqueia guards/interceptor de todas as features protegidas._

- [x] `src/app/core/session/index.schema.ts` — schema Zod `UserRole` e funções de parsing/validação
- [x] `src/app/core/session/index.service.ts` — `SessionService` com Signal de `role`, persistência em `sessionStorage`
- [x] `src/app/core/session/index.service.spec.ts` — testes unitários do serviço de sessão
- [x] `src/app/core/guards/index.guard.ts` — `authGuard` (bloqueia sem sessão) e `roleGuard` (valida permissões)
- [x] `src/app/core/guards/index.guard.spec.ts` — testes unitários dos guards
- [x] `src/app/core/interceptors/index.interceptor.ts` — `authInterceptor` (injeta Bearer token, trata 401/403)
- [x] `src/app/core/interceptors/index.interceptor.spec.ts` — testes unitários do interceptor
- [x] `src/app/app.config.ts` — registrar `provideHttpClient(withInterceptors([authInterceptor]))`

---

## Fase 2 — Shared Components

_Depende apenas da Fase 0. Pode ser feita em paralelo com a Fase 1._

### 2.1 Spinner

- [x] `src/app/shared/components/spinner/index.component.ts` — componente de carregamento visual
- [x] `src/app/shared/components/spinner/index.component.html` — template com animação e acessibilidade
- [x] `src/app/shared/components/spinner/index.component.spec.ts` — testes unitários do spinner

### 2.2 Confirm Dialog

- [x] `src/app/shared/components/confirm-dialog/index.component.ts` — modal acessível com `input()` de título/mensagem e `output()` de ação
- [x] `src/app/shared/components/confirm-dialog/index.component.html` — template do diálogo modal
- [x] `src/app/shared/components/confirm-dialog/index.component.spec.ts` — testes unitários do diálogo

### 2.3 Enum Select

- [x] `src/app/shared/components/enum-select/index.component.ts` — `<select>` genérico alimentado pelas `.options` de um `z.ZodEnum`
- [x] `src/app/shared/components/enum-select/index.component.html` — template de seleção com bindings acessíveis
- [x] `src/app/shared/components/enum-select/index.component.spec.ts` — testes unitários da renderização das opções

### 2.4 Error Toast

- [x] `src/app/shared/components/error-toast/index.service.ts` — serviço com signal para gerenciar mensagens de erro exibidas
- [x] `src/app/shared/components/error-toast/index.service.spec.ts` — testes unitários do serviço de toast
- [x] `src/app/shared/components/error-toast/index.component.ts` — componente visual do toast de erro
- [x] `src/app/shared/components/error-toast/index.component.html` — template do toast
- [x] `src/app/shared/components/error-toast/index.component.spec.ts` — testes unitários do componente de toast

---

## Fase 3 — Feature: Auth

_Depende de: Fase 1 (session), Fase 2 (error-toast/spinner)._

- [x] `src/app/features/auth/index.schema.ts` — schemas Zod `loginRequestSchema`, `loginResponseSchema` e tipos inferidos
- [x] `src/app/features/auth/index.service.ts` — `AuthService` com chamada `POST /auth/login` e integração com `SessionService`
- [x] `src/app/features/auth/index.service.spec.ts` — testes unitários do serviço de autenticação
- [x] `src/app/features/auth/login/index.component.ts` — formulário de login (Reactive Forms, mensagem genérica de credencial inválida)
- [x] `src/app/features/auth/login/index.component.html` — template da tela de login
- [x] `src/app/features/auth/login/index.component.spec.ts` — testes unitários da tela de login

---

## Fase 4 — Feature: Traceability (pública)

_Depende de: Fase 2 (shared components). Não depende de Fase 1/3 (rota pública, paralelizável com Auth)._

- [ ] `src/app/features/traceability/index.schema.ts` — schemas Zod para `BatchTraceabilityResponseDTO` e `CarbonFootprintResponseDTO`
- [ ] `src/app/features/traceability/index.service.ts` — chamadas `GET /batches/{id}/traceability` e `GET /batches/{id}/carbon-footprint`
- [ ] `src/app/features/traceability/index.service.spec.ts` — testes unitários do serviço de rastreabilidade
- [ ] `src/app/features/traceability/index.component.ts` — tela principal de rastreamento com timeline das etapas e tratamento de erro amigável
- [ ] `src/app/features/traceability/index.component.html` — template da timeline pública
- [ ] `src/app/features/traceability/index.component.spec.ts` — testes unitários do componente de rastreabilidade
- [ ] `src/app/features/traceability/carbon-chart/index.component.ts` — componente gráfico de emissão de CO₂ por etapa
- [ ] `src/app/features/traceability/carbon-chart/index.component.html` — template do gráfico de pegada de carbono
- [ ] `src/app/features/traceability/carbon-chart/index.component.spec.ts` — testes unitários do gráfico de carbono

---

## Fase 5 — Feature: Dashboard

_Depende de: Fase 1 (role da sessão)._

- [ ] `src/app/features/dashboard/index.component.ts` — componente de dashboard com conteúdo condicional conforme `role`
- [ ] `src/app/features/dashboard/index.component.html` — template do dashboard role-aware
- [ ] `src/app/features/dashboard/index.component.spec.ts` — testes unitários do dashboard

---

## Fase 6 — Features de Domínio

_Depende de: Fases 1 e 2. Cada feature é independente das outras — ideal para divisão da dupla._

### 6.1 Suppliers (Fornecedores e Ranking)

- [ ] `src/app/features/suppliers/index.schema.ts` — schemas Zod (`supplierRequestSchema`, `supplierResponseSchema`, `supplierRankingResponseSchema`)
- [ ] `src/app/features/suppliers/index.service.ts` — serviço de fornecedores e ranking com signals
- [ ] `src/app/features/suppliers/index.service.spec.ts` — testes unitários do serviço
- [ ] `src/app/features/suppliers/routes.ts` — rotas filhas de fornecedores (`list`, `form`, `ranking`)
- [ ] `src/app/features/suppliers/list/index.component.ts` — tela de listagem e busca de fornecedores
- [ ] `src/app/features/suppliers/list/index.component.html`
- [ ] `src/app/features/suppliers/list/index.component.spec.ts`
- [ ] `src/app/features/suppliers/form/index.component.ts` — tela de cadastro e edição (inclui endereço)
- [ ] `src/app/features/suppliers/form/index.component.html`
- [ ] `src/app/features/suppliers/form/index.component.spec.ts`
- [ ] `src/app/features/suppliers/ranking/index.component.ts` — tela de ranking de sustentabilidade ordenável
- [ ] `src/app/features/suppliers/ranking/index.component.html`
- [ ] `src/app/features/suppliers/ranking/index.component.spec.ts`

### 6.2 Products (Produtos)

- [ ] `src/app/features/products/index.schema.ts` — schemas Zod (`productRequestSchema`, `productResponseSchema`, enums `category` e `unit`)
- [ ] `src/app/features/products/index.service.ts` — serviço de produtos com signals
- [ ] `src/app/features/products/index.service.spec.ts` — testes unitários do serviço
- [ ] `src/app/features/products/routes.ts` — rotas filhas de produtos (`list`, `form`)
- [ ] `src/app/features/products/list/index.component.ts` — tela de listagem de produtos
- [ ] `src/app/features/products/list/index.component.html`
- [ ] `src/app/features/products/list/index.component.spec.ts`
- [ ] `src/app/features/products/form/index.component.ts` — tela de cadastro/edição com select de enums
- [ ] `src/app/features/products/form/index.component.html`
- [ ] `src/app/features/products/form/index.component.spec.ts`

### 6.3 Certifications (Certificações)

- [ ] `src/app/features/certifications/index.schema.ts` — schemas Zod (`certificationRequestSchema`, `certificationResponseSchema`, enum `status`)
- [ ] `src/app/features/certifications/index.service.ts` — serviço de certificações (cadastro, expiring, alteração de status)
- [ ] `src/app/features/certifications/index.service.spec.ts` — testes unitários do serviço
- [ ] `src/app/features/certifications/routes.ts` — rotas filhas de certificações (`list`, `form`)
- [ ] `src/app/features/certifications/list/index.component.ts` — listagem com filtro de expirando e ação de alterar status
- [ ] `src/app/features/certifications/list/index.component.html`
- [ ] `src/app/features/certifications/list/index.component.spec.ts`
- [ ] `src/app/features/certifications/form/index.component.ts` — tela de envio de nova certificação
- [ ] `src/app/features/certifications/form/index.component.html`
- [ ] `src/app/features/certifications/form/index.component.spec.ts`

### 6.4 Batches (Lotes)

- [ ] `src/app/features/batches/index.schema.ts` — schemas Zod (`batchRequestSchema`, `batchResponseSchema`, enum `status`)
- [ ] `src/app/features/batches/index.service.ts` — serviço de gestão de lotes com signals
- [ ] `src/app/features/batches/index.service.spec.ts` — testes unitários do serviço
- [ ] `src/app/features/batches/routes.ts` — rotas filhas de lotes (`list`, `form`)
- [ ] `src/app/features/batches/list/index.component.ts` — listagem de lotes do fornecedor
- [ ] `src/app/features/batches/list/index.component.html`
- [ ] `src/app/features/batches/list/index.component.spec.ts`
- [ ] `src/app/features/batches/form/index.component.ts` — formulário de cadastro de lote vinculado a produto
- [ ] `src/app/features/batches/form/index.component.html`
- [ ] `src/app/features/batches/form/index.component.spec.ts`

### 6.5 Chain (Etapas da Cadeia, Transporte e Emissão)

- [ ] `src/app/features/chain/index.schema.ts` — schemas Zod (`stageRequestSchema`, `stageResponseSchema`, `transportRequestSchema`, `emissionCalculationRequestSchema`)
- [ ] `src/app/features/chain/index.service.ts` — chamadas de etapas, transporte e cálculo de CO₂
- [ ] `src/app/features/chain/index.service.spec.ts` — testes unitários do serviço
- [ ] `src/app/features/chain/routes.ts` — rotas filhas da cadeia (`list`, `form`)
- [ ] `src/app/features/chain/list/index.component.ts` — linha do tempo cronológica das etapas de um lote
- [ ] `src/app/features/chain/list/index.component.html`
- [ ] `src/app/features/chain/list/index.component.spec.ts`
- [ ] `src/app/features/chain/form/index.component.ts` — cadastro de etapa, subformulário condicional de transporte e ação para calcular emissão
- [ ] `src/app/features/chain/form/index.component.html`
- [ ] `src/app/features/chain/form/index.component.spec.ts`

### 6.6 Reports (Relatórios de Sustentabilidade)

- [ ] `src/app/features/reports/index.schema.ts` — schemas Zod (`reportRequestSchema`, `reportResponseSchema`)
- [ ] `src/app/features/reports/index.service.ts` — serviço para geração e consulta de relatórios
- [ ] `src/app/features/reports/index.service.spec.ts` — testes unitários do serviço
- [ ] `src/app/features/reports/routes.ts` — rotas filhas de relatórios (`list`, `form`)
- [ ] `src/app/features/reports/list/index.component.ts` — listagem e consulta detalhada de relatórios gerados
- [ ] `src/app/features/reports/list/index.component.html`
- [ ] `src/app/features/reports/list/index.component.spec.ts`
- [ ] `src/app/features/reports/form/index.component.ts` — formulário de geração de relatório por período/fornecedor
- [ ] `src/app/features/reports/form/index.component.html`
- [ ] `src/app/features/reports/form/index.component.spec.ts`

### 6.7 Users (Gestão de Usuários)

- [ ] `src/app/features/users/index.schema.ts` — schemas Zod (`userRequestSchema`, `userResponseSchema`, `updateUserRoleSchema`)
- [ ] `src/app/features/users/index.service.ts` — serviço de usuários (criação, listagem e alteração de role)
- [ ] `src/app/features/users/index.service.spec.ts` — testes unitários do serviço
- [ ] `src/app/features/users/routes.ts` — rotas filhas de usuários (`list`, `form`)
- [ ] `src/app/features/users/list/index.component.ts` — listagem de usuários com ação de alterar perfil (`PATCH /users/{id}/role`)
- [ ] `src/app/features/users/list/index.component.html`
- [ ] `src/app/features/users/list/index.component.spec.ts`
- [ ] `src/app/features/users/form/index.component.ts` — formulário de criação de novo usuário
- [ ] `src/app/features/users/form/index.component.html`
- [ ] `src/app/features/users/form/index.component.spec.ts`

### 6.8 Audit Log (Auditoria)

- [ ] `src/app/features/audit-log/index.schema.ts` — schema Zod (`auditLogResponseSchema`)
- [ ] `src/app/features/audit-log/index.service.ts` — serviço de auditoria (`GET /audit-logs` com filtros)
- [ ] `src/app/features/audit-log/index.service.spec.ts` — testes unitários do serviço
- [ ] `src/app/features/audit-log/index.component.ts` — tela de listagem de logs de auditoria
- [ ] `src/app/features/audit-log/index.component.html`
- [ ] `src/app/features/audit-log/index.component.spec.ts`

---

## Fase 7 — Roteamento Final

_Depende de: todas as features da Fase 6 existirem para o roteamento fazer sentido de ponta a ponta._

- [ ] `src/app/app.routes.ts` — configuração completa das rotas com lazy loading (`loadComponent`, `loadChildren`), `authGuard` e `roleGuard`
- [ ] Conferir cada rota contra o sitemap do `spec.md` (seção 4)
- [ ] Testar manualmente a navegação com um usuário de cada `role`

---

## Fase 8 — Testes E2E (Cypress)

_Depende de: fluxo completo (Fases 3–7) funcionando._

- [ ] `cypress/e2e/login.cy.ts` — teste E2E do fluxo de autenticação e redirecionamento
- [ ] `cypress/e2e/traceability-public.cy.ts` — teste E2E da consulta pública de rastreabilidade
- [ ] `cypress/e2e/register-batch-flow.cy.ts` — teste E2E do fluxo do fornecedor: lote → etapa → transporte → emissão

---

## Fase 9 — Design Visual (por último, por decisão do time)

- [ ] Wireframes/mockups das 13 telas do `spec.md`
- [ ] Revisão visual dos componentes em `src/app/shared/components/` contra o wireframe (classes Tailwind CSS)
- [ ] Ajuste de responsividade para a tela de apresentação/projeção
