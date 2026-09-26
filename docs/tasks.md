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

- [x] `src/app/features/traceability/index.schema.ts` — schemas Zod para `BatchTraceabilityResponseDTO` e `CarbonFootprintResponseDTO`
- [x] `src/app/features/traceability/index.service.ts` — chamadas `GET /batches/{id}/traceability` e `GET /batches/{id}/carbon-footprint`
- [x] `src/app/features/traceability/index.service.spec.ts` — testes unitários do serviço de rastreabilidade
- [x] `src/app/features/traceability/index.component.ts` — tela principal de rastreamento com timeline das etapas e tratamento de erro amigável
- [x] `src/app/features/traceability/index.component.html` — template da timeline pública
- [x] `src/app/features/traceability/index.component.spec.ts` — testes unitários do componente de rastreabilidade
- [x] `src/app/features/traceability/carbon-chart/index.component.ts` — componente gráfico de emissão de CO₂ por etapa
- [x] `src/app/features/traceability/carbon-chart/index.component.html` — template do gráfico de pegada de carbono
- [x] `src/app/features/traceability/carbon-chart/index.component.spec.ts` — testes unitários do gráfico de carbono

---

## Fase 5 — Feature: Dashboard

_Depende de: Fase 1 (role da sessão)._

- [x] `src/app/features/dashboard/index.component.ts` — componente de dashboard com conteúdo condicional conforme `role`
- [x] `src/app/features/dashboard/index.component.html` — template do dashboard role-aware
- [x] `src/app/features/dashboard/index.component.spec.ts` — testes unitários do dashboard

---

## Fase 6 — Features de Domínio

_Depende de: Fases 1 e 2. Cada feature é independente das outras — ideal para divisão da dupla._

### 6.1 Suppliers (Fornecedores e Ranking)

- [x] `src/app/features/suppliers/index.schema.ts` — schemas Zod (`supplierRequestSchema`, `supplierResponseSchema`, `supplierRankingResponseSchema`)
- [x] `src/app/features/suppliers/index.service.ts` — serviço de fornecedores e ranking com signals
- [x] `src/app/features/suppliers/index.service.spec.ts` — testes unitários do serviço
- [x] `src/app/features/suppliers/routes.ts` — rotas filhas de fornecedores (`list`, `form`, `ranking`)
- [x] `src/app/features/suppliers/list/index.component.ts` — tela de listagem e busca de fornecedores
- [x] `src/app/features/suppliers/list/index.component.html`
- [x] `src/app/features/suppliers/list/index.component.spec.ts`
- [x] `src/app/features/suppliers/form/index.component.ts` — tela de cadastro e edição (inclui endereço)
- [x] `src/app/features/suppliers/form/index.component.html`
- [x] `src/app/features/suppliers/form/index.component.spec.ts`
- [x] `src/app/features/suppliers/ranking/index.component.ts` — tela de ranking de sustentabilidade ordenável
- [x] `src/app/features/suppliers/ranking/index.component.html`
- [x] `src/app/features/suppliers/ranking/index.component.spec.ts`

### 6.2 Products (Produtos)

- [x] `src/app/features/products/index.schema.ts` — schemas Zod (`productRequestSchema`, `productResponseSchema`, enums `category` e `unit`)
- [x] `src/app/features/products/index.service.ts` — serviço de produtos com signals
- [x] `src/app/features/products/index.service.spec.ts` — testes unitários do serviço
- [x] `src/app/features/products/routes.ts` — rotas filhas de produtos (`list`, `form`)
- [x] `src/app/features/products/list/index.component.ts` — tela de listagem de produtos
- [x] `src/app/features/products/list/index.component.html`
- [x] `src/app/features/products/list/index.component.spec.ts`
- [x] `src/app/features/products/form/index.component.ts` — tela de cadastro/edição com select de enums
- [x] `src/app/features/products/form/index.component.html`
- [x] `src/app/features/products/form/index.component.spec.ts`

### 6.3 Certifications (Certificações)

- [x] `src/app/features/certifications/index.schema.ts` — schemas Zod (`certificationRequestSchema`, `certificationResponseSchema`, enum `status`)
- [x] `src/app/features/certifications/index.service.ts` — serviço de certificações (cadastro, expiring, alteração de status)
- [x] `src/app/features/certifications/index.service.spec.ts` — testes unitários do serviço
- [x] `src/app/features/certifications/routes.ts` — rotas filhas de certificações (`list`, `form`)
- [x] `src/app/features/certifications/list/index.component.ts` — listagem com filtro de expirando e ação de alterar status
- [x] `src/app/features/certifications/list/index.component.html`
- [x] `src/app/features/certifications/list/index.component.spec.ts`
- [x] `src/app/features/certifications/form/index.component.ts` — tela de envio de nova certificação
- [x] `src/app/features/certifications/form/index.component.html`
- [x] `src/app/features/certifications/form/index.component.spec.ts`

### 6.4 Batches (Lotes)

- [x] `src/app/features/batches/index.schema.ts` — schemas Zod (`batchRequestSchema`, `batchResponseSchema`, enum `status`)
- [x] `src/app/features/batches/index.service.ts` — serviço de gestão de lotes com signals
- [x] `src/app/features/batches/index.service.spec.ts` — testes unitários do serviço
- [x] `src/app/features/batches/routes.ts` — rotas filhas de lotes (`list`, `form`)
- [x] `src/app/features/batches/list/index.component.ts` — listagem de lotes do fornecedor
- [x] `src/app/features/batches/list/index.component.html`
- [x] `src/app/features/batches/list/index.component.spec.ts`
- [x] `src/app/features/batches/form/index.component.ts` — formulário de cadastro de lote vinculado a produto
- [x] `src/app/features/batches/form/index.component.html`
- [x] `src/app/features/batches/form/index.component.spec.ts`

### 6.5 Chain (Etapas da Cadeia, Transporte e Emissão)

- [x] `src/app/features/chain/index.schema.ts` — schemas Zod (`stageRequestSchema`, `stageResponseSchema`, `transportRequestSchema`, `emissionCalculationRequestSchema`)
- [x] `src/app/features/chain/index.service.ts` — chamadas de etapas, transporte e cálculo de CO₂
- [x] `src/app/features/chain/index.service.spec.ts` — testes unitários do serviço
- [x] `src/app/features/chain/routes.ts` — rotas filhas da cadeia (`list`, `form`)
- [x] `src/app/features/chain/list/index.component.ts` — linha do tempo cronológica das etapas de um lote
- [x] `src/app/features/chain/list/index.component.html`
- [x] `src/app/features/chain/list/index.component.spec.ts`
- [x] `src/app/features/chain/form/index.component.ts` — cadastro de etapa, subformulário condicional de transporte e ação para calcular emissão
- [x] `src/app/features/chain/form/index.component.html`
- [x] `src/app/features/chain/form/index.component.spec.ts`

### 6.6 Reports (Relatórios de Sustentabilidade)

- [x] `src/app/features/reports/index.schema.ts` — schemas Zod (`reportRequestSchema`, `reportResponseSchema`)
- [x] `src/app/features/reports/index.service.ts` — serviço para geração e consulta de relatórios
- [x] `src/app/features/reports/index.service.spec.ts` — testes unitários do serviço
- [x] `src/app/features/reports/routes.ts` — rotas filhas de relatórios (`list`, `form`)
- [x] `src/app/features/reports/list/index.component.ts` — listagem e consulta detalhada de relatórios gerados
- [x] `src/app/features/reports/list/index.component.html`
- [x] `src/app/features/reports/list/index.component.spec.ts`
- [x] `src/app/features/reports/form/index.component.ts` — formulário de geração de relatório por período/fornecedor
- [x] `src/app/features/reports/form/index.component.html`
- [x] `src/app/features/reports/form/index.component.spec.ts`

### 6.7 Users (Gestão de Usuários)

- [x] `src/app/features/users/index.schema.ts` — schemas Zod (`userRequestSchema`, `userResponseSchema`, `updateUserRoleSchema`)
- [x] `src/app/features/users/index.service.ts` — serviço de usuários (criação, listagem e alteração de role)
- [x] `src/app/features/users/index.service.spec.ts` — testes unitários do serviço
- [x] `src/app/features/users/routes.ts` — rotas filhas de usuários (`list`, `form`)
- [x] `src/app/features/users/list/index.component.ts` — listagem de usuários com ação de alterar perfil (`PATCH /users/{id}/role`)
- [x] `src/app/features/users/list/index.component.html`
- [x] `src/app/features/users/list/index.component.spec.ts`
- [x] `src/app/features/users/form/index.component.ts` — formulário de criação de novo usuário
- [x] `src/app/features/users/form/index.component.html`
- [x] `src/app/features/users/form/index.component.spec.ts`

### 6.8 Audit Log (Auditoria)

- [x] `src/app/features/audit-log/index.schema.ts` — schema Zod (`auditLogResponseSchema`)
- [x] `src/app/features/audit-log/index.service.ts` — serviço de auditoria (`GET /audit-logs` com filtros)
- [x] `src/app/features/audit-log/index.service.spec.ts` — testes unitários do serviço
- [x] `src/app/features/audit-log/index.component.ts` — tela de listagem de logs de auditoria
- [x] `src/app/features/audit-log/index.component.html`
- [x] `src/app/features/audit-log/index.component.spec.ts`

---

## Fase 7 — Roteamento Final

_Depende de: todas as features da Fase 6 existirem para o roteamento fazer sentido de ponta a ponta._

- [x] `src/app/app.routes.ts` — configuração completa das rotas com lazy loading (`loadComponent`, `loadChildren`), `authGuard` e `roleGuard`
- [x] Conferir cada rota contra o sitemap do `spec.md` (seção 4)
- [ ] Testar manualmente a navegação com um usuário de cada `role`

_A navegação manual por perfil requer sessão/API e navegador, indisponíveis neste ambiente; a compilação de produção foi verificada._

---

## Fase 8 — Testes E2E (Cypress)

_Depende de: fluxo completo (Fases 3–7) funcionando._

- [x] `cypress/e2e/login.cy.ts` — teste E2E do fluxo de autenticação e redirecionamento
- [x] `cypress/e2e/traceability-public.cy.ts` — teste E2E da consulta pública de rastreabilidade
- [x] `cypress/e2e/register-batch-flow.cy.ts` — teste E2E do fluxo do fornecedor: lote → etapa → transporte → emissão

---

## Fase 9 — Design Visual (por último, por decisão do time)

- [x] Wireframes/mockups das 13 telas do `spec.md`
- [x] Revisão visual dos componentes em `src/app/shared/components/` contra o wireframe (classes Tailwind CSS)
- [x] Ajuste de responsividade para a tela de apresentação/projeção

---

## Fase 10 — CI e padrões de contribuição

_Automatiza as verificações do frontend em cada pull request e mantém o fluxo de contribuição alinhado ao repositório da API. Usar `npm ci` com o `package-lock.json` para instalações reproduzíveis._

- [ ] `.github/workflows/ci.yml` — pipeline de GitHub Actions para pull requests e pushes em `main`, configurando Node.js e cache do npm e executando `npm ci`, testes unitários em modo não interativo, `npm run build`, `npm audit` com nível mínimo de severidade definido e `npm run lint`; qualquer etapa com falha deve reprovar a pipeline
- [ ] Configurar ESLint com regras apropriadas para Angular e TypeScript e adicionar o script `lint` ao `package.json`, sem aplicar correções automáticas na CI
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` — template com descrição/contexto, tipo de mudança, checklist de testes/build/lint, impacto técnico e evidências visuais quando aplicável
- [ ] Configurar proteção da branch `main` no GitHub para bloquear pushes/commits diretos e exigir pull request aprovado, além da aprovação dos checks obrigatórios da CI antes do merge

---

## Fase 11 — Navegação superior

_Use `docs/references/reference-01.png` como referência visual principal para desenvolver a navegação superior. Adapte a composição ao Supply Chain Verde e às rotas/permissões existentes; a referência orienta o design, sem exigir cópia literal do conteúdo._

- [ ] Substituir a sidebar por uma barra superior compartilhada no layout autenticado, com a marca do Supply Chain Verde e links para as áreas disponíveis ao perfil atual
- [ ] Destacar o item correspondente à rota ativa e manter acessíveis as rotas já existentes, sem exibir uma opção de notificações
- [ ] Adicionar acesso ao perfil do usuário na barra superior, com identificação do usuário e ações de perfil/sessão compatíveis com os recursos já disponíveis
- [ ] Adaptar a navegação para telas menores, preservando acesso às opções de menu e ao perfil sem comprometer o conteúdo das páginas
- [ ] Revisar as telas autenticadas para adequar espaçamento e largura do conteúdo ao layout sem sidebar e validar a navegação por perfil

---

## Task 12 — Redesign da Dashboard

_As telas serão redesenhadas individualmente para dar mais personalidade à interface. Esta task inicia o trabalho pela Dashboard. Use `docs/references/reference-01.png` como base visual, adaptando o conteúdo ao Supply Chain Verde e mantendo os dados que a Dashboard já apresenta; não reproduza os dados de exemplo da referência._

- [ ] Reorganizar a Dashboard no padrão visual da referência, com hierarquia clara para saudação, indicadores e seções de análise, mantendo identidade visual própria do Supply Chain Verde
- [ ] Exibir os quatro indicadores atuais em uma única fileira com quatro cards, seguindo a estrutura da referência, preservando seus dados e mapeando cada card para a resposta atual da rota
- [ ] Incluir os gráficos da referência que fazem sentido para os dados disponíveis: gráfico de barras verticais, gráfico menor de barras horizontais e gráfico de pizza
- [ ] Revisar o contrato e os dados retornados pela rota da Dashboard para identificar se os gráficos e indicadores podem ser preenchidos; se faltarem dados relevantes, documentar a necessidade de enriquecimento da API antes de implementar valores, sem inventar dados
- [ ] Exibir uma tabela com os 10 produtos mais recentes e incluir a ação “Ver todos” direcionando para a tela de produtos
- [ ] Não incluir o card “Inventory Snapshot” da referência
- [ ] Não incluir filtros, seleção/filtro por período ou o botão de ação do cabeçalho exibidos na referência
- [ ] Ajustar espaçamentos e comportamento responsivo da Dashboard para o layout da navegação superior da Fase 11
- [ ] Registrar cada próxima tela como uma task de redesign independente, seguindo a mesma abordagem tela a tela

---

## Task 13 — Redesign e unificação de Fornecedores e Ranking

_Unifique as telas de fornecedores e ranking em uma experiência de gestão e desempenho ambiental. Use `docs/references/reference-02.png` como referência visual para apresentar os três primeiros colocados em cards destacados, adaptando o visual e os dados ao Supply Chain Verde, sem copiar conteúdo fictício da referência._

- [ ] Combinar listagem de fornecedores e ranking em uma única tela, mantendo as informações e funcionalidades relevantes de ambas e evitando duas opções de navegação para a mesma área
- [ ] No cabeçalho da área, dispor a busca de fornecedores e o botão de adicionar fornecedor na mesma linha, cada um ocupando 50% da largura disponível
- [ ] Apresentar os três fornecedores mais bem ranqueados em cards próprios, seguindo a composição da referência e destacando sua posição e dados reais do ranking
- [ ] Consumir `GET /api/v1/suppliers/ranking` de forma paginada com `limit=20` e `offset` iniciado em `0`, avançando o offset em 20 itens ao buscar páginas seguintes e usando o `hasNext` da resposta para controlar a navegação
- [ ] Usar `docs/references/reference-04.png` como base visual para paginação e exibir página atual com botões Anterior/Próxima; desativar visualmente Anterior quando `offset=0` e Próxima quando `hasNext=false` (sem total de itens, não exibir total de páginas nem botão de última página)
- [ ] Preservar a ordenação e os dados atuais do ranking, incluindo score, certificações e CO₂ total; na listagem ranqueada abaixo do top 3, substituir a barra verde de score pelas colunas CNPJ e telefone
- [ ] Remover a badge “Ordenar por: Score” do cabeçalho da tela
- [ ] Garantir que a busca continue permitindo localizar fornecedores fora do top 3 e que o acesso aos detalhes/cadastro respeite as rotas e permissões existentes
- [ ] Adaptar cards, busca e listagem para telas menores e alinhar a tela ao layout da navegação superior da Fase 11

---

## Task 14 — Cadastro de fornecedor em modal

_Substitua a navegação para uma página separada de cadastro por um modal aberto a partir da tela unificada de fornecedores. Use `docs/references/reference-03.png` como referência para a composição do formulário e adapte os campos ao modelo de fornecedor do projeto._

- [ ] Abrir o formulário de criação de fornecedor em um modal sobre a tela de fornecedores, sem navegar para uma página separada
- [ ] Organizar campos relacionados lado a lado em linhas/colunas quando houver espaço e empilhá-los em telas menores
- [ ] Quando o CEP atingir oito dígitos válidos, aplicar um debounce curto antes de consultar a API ViaCEP e preencher os campos de endereço retornados; evitar consultas duplicadas e ignorar respostas de CEPs anteriores, mantendo número e complemento para preenchimento manual
- [ ] Permitir revisar e editar os campos preenchidos e tratar CEP não encontrado, falha na consulta e indisponibilidade do serviço sem impedir o preenchimento manual do endereço
- [ ] Preservar validações, mensagens de erro, estados de envio e comportamento de sucesso do cadastro atual, fechando o modal e atualizando a listagem após a criação
- [ ] Garantir acessibilidade do modal, incluindo foco, fechamento e uso por teclado, além de comportamento responsivo
