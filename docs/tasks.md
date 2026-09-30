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
- [x] `src/app/features/audit-log/index.service.ts` — serviço de auditoria (`GET /audit-logs`)
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

- [x] `.github/workflows/ci.yml` — pipeline de GitHub Actions para pull requests e pushes em `main`, configurando Node.js e cache do npm e executando `npm ci`, testes unitários em modo não interativo, `npm run build`, `npm audit` com nível mínimo de severidade definido e `npm run lint`; qualquer etapa com falha deve reprovar a pipeline
- [x] Configurar ESLint com regras apropriadas para Angular e TypeScript e adicionar o script `lint` ao `package.json`, sem aplicar correções automáticas na CI
- [x] `.github/PULL_REQUEST_TEMPLATE.md` — template com descrição/contexto, tipo de mudança, checklist de testes/build/lint, impacto técnico e evidências visuais quando aplicável
- [x] Configurar proteção da branch `main` no GitHub para bloquear pushes/commits diretos e exigir pull request aprovado, além da aprovação dos checks obrigatórios da CI antes do merge

---

## Fase 11 — Navegação superior

_Use `docs/references/reference-01.png` como referência visual principal para desenvolver a navegação superior. Adapte a composição ao Supply Chain Verde e às rotas/permissões existentes; a referência orienta o design, sem exigir cópia literal do conteúdo._

- [x] Substituir a sidebar por uma barra superior compartilhada no layout autenticado, com a marca do Supply Chain Verde e links para as áreas disponíveis ao perfil atual
- [x] Destacar o item correspondente à rota ativa e manter acessíveis as rotas já existentes, sem exibir uma opção de notificações
- [x] Adicionar acesso ao perfil do usuário na barra superior, com identificação do usuário e ações de perfil/sessão compatíveis com os recursos já disponíveis
- [x] Adaptar a navegação para telas menores, preservando acesso às opções de menu e ao perfil sem comprometer o conteúdo das páginas
- [x] Revisar as telas autenticadas para adequar espaçamento e largura do conteúdo ao layout sem sidebar e validar a navegação por perfil

---

## Task 12 — Redesign da Dashboard

_As telas serão redesenhadas individualmente para dar mais personalidade à interface. Esta task inicia o trabalho pela Dashboard. Use `docs/references/reference-01.png` como base visual, adaptando o conteúdo ao Supply Chain Verde e mantendo os dados que a Dashboard já apresenta; não reproduza os dados de exemplo da referência._

- [x] Reorganizar a Dashboard no padrão visual da referência, com hierarquia clara para saudação, indicadores e seções de análise, mantendo identidade visual própria do Supply Chain Verde
- [x] Exibir os quatro indicadores atuais em uma única fileira com quatro cards, seguindo a estrutura da referência, mapeando `activeBatches`, `expiringCertifications`, `suppliers` e `monthlyEmissionKgCo2e` da API
- [x] Exibir gráficos de barras verticais e de pizza derivados da distribuição por etapa dos 10 lotes recentes retornados pela API; o gráfico horizontal foi removido após revisão visual
- [x] Revisar o contrato da rota da Dashboard: a API fornece os quatro indicadores e lotes recentes, mas não séries de emissões por período, totais por categoria nem agregação de todos os lotes por etapa; os gráficos usam explicitamente apenas a amostra dos lotes recentes, sem inventar valores
- [x] Exibir em tabela os produtos associados aos até 10 lotes mais recentes retornados pela API e incluir “Ver todos” direcionando para a listagem de lotes; cada linha representa um lote e exibe o nome do produto associado
- [x] Não incluir o card “Inventory Snapshot” da referência
- [x] Não incluir filtros, seleção/filtro por período ou o botão de ação do cabeçalho exibidos na referência
- [x] Ajustar espaçamentos e comportamento responsivo da Dashboard para o layout da navegação superior da Fase 11
- [x] Registrar cada próxima tela como uma task de redesign independente, seguindo a mesma abordagem tela a tela; as Tasks 13–21 já registram essas telas

**Contrato consumido:** `GET /api/v1/dashboard/summary?limit=10`, disponível a qualquer usuário autenticado, retorna os quatro indicadores globais e os lotes recentes ordenados pela produção. A resposta não fornece série histórica de emissões, produtos por categoria nem total de lotes por etapa; os gráficos apresentam a distribuição por etapa somente dentro da amostra recente retornada. A tabela mantém uma linha por lote e identifica o produto associado, pois o contrato entrega lotes recentes, não uma listagem de produtos.

---

## Task 13 — Redesign e unificação de Fornecedores e Ranking

_Unifique as telas de fornecedores e ranking em uma experiência de gestão e desempenho ambiental. Use `docs/references/reference-02.png` como referência visual para apresentar os três primeiros colocados em cards destacados, adaptando o visual e os dados ao Supply Chain Verde, sem copiar conteúdo fictício da referência._

- [x] Combinar listagem de fornecedores e ranking em uma única tela, mantendo as informações e funcionalidades relevantes de ambas e evitando duas opções de navegação para a mesma área
- [x] No cabeçalho da área, dispor a busca de fornecedores e o botão de adicionar fornecedor na mesma linha, cada um ocupando 50% da largura disponível
- [x] Apresentar os três fornecedores mais bem ranqueados em cards próprios, seguindo a composição da referência e destacando sua posição e dados reais do ranking
- [x] Consumir `GET /api/v1/suppliers/ranking` de forma paginada com `limit=20` e `offset` iniciado em `0`, avançando o offset em 20 itens ao buscar páginas seguintes e usando o `hasNext` da resposta para controlar a navegação
- [x] Usar `docs/references/reference-04.png` como base visual para paginação e exibir página atual com botões Anterior/Próxima; desativar visualmente Anterior quando `offset=0` e Próxima quando `hasNext=false` (sem total de itens, não exibir total de páginas nem botão de última página)
- [x] Preservar a ordenação e os dados atuais do ranking, incluindo score, certificações e CO₂ total; na listagem ranqueada abaixo do top 3, substituir a barra verde de score pelas colunas CNPJ e telefone
- [x] Remover a badge “Ordenar por: Score” do cabeçalho da tela
- [x] Implementar a busca de fornecedores pela API, permitindo localizar fornecedores fora do top 3 por nome (full-text) ou CNPJ (correspondência parcial); enviar o termo junto à paginação, reiniciar o offset ao alterar a busca e preservar a busca ao navegar entre páginas
- [x] Garantir que o acesso aos detalhes/cadastro respeite as rotas e permissões existentes
- [x] Adaptar cards, busca e listagem para telas menores e alinhar a tela ao layout da navegação superior da Fase 11

---

## Task 14 — Cadastro de fornecedor em modal

_Substitua a navegação para uma página separada de cadastro por um modal aberto a partir da tela unificada de fornecedores. Use `docs/references/reference-03.png` como referência para a composição do formulário e adapte os campos ao modelo de fornecedor do projeto._

- [x] Abrir o formulário de criação de fornecedor em um modal sobre a tela de fornecedores, sem navegar para uma página separada
- [x] Organizar campos relacionados lado a lado em linhas/colunas quando houver espaço e empilhá-los em telas menores
- [x] Quando o CEP atingir oito dígitos válidos, aplicar um debounce curto antes de consultar a API ViaCEP e preencher os campos de endereço retornados; evitar consultas duplicadas e ignorar respostas de CEPs anteriores, mantendo número e complemento para preenchimento manual
- [x] Permitir revisar e editar os campos preenchidos e tratar CEP não encontrado, falha na consulta e indisponibilidade do serviço sem impedir o preenchimento manual do endereço
- [x] Preservar validações, mensagens de erro, estados de envio e comportamento de sucesso do cadastro atual, fechando o modal e atualizando a listagem após a criação
- [x] Garantir acessibilidade do modal, incluindo foco, fechamento e uso por teclado, além de comportamento responsivo

---

## Task 15 — Redesign da tela de Produtos

_Redesenhe a listagem de produtos como uma grade de cards com imagens, usando `docs/references/reference-05.png` e `docs/references/reference-06.png` como referências visuais. Adapte o conteúdo ao Supply Chain Verde: use imagens relacionadas às categorias dos produtos em vez das imagens de veículos e preserve os dados e ações já existentes._

- [x] Substituir a tabela atual por cards responsivos que exibam imagem, nome, categoria, descrição e unidade do produto, preservando as ações disponíveis
- [x] Organizar a busca e o botão “Novo” na mesma linha, cada um ocupando 50% da largura disponível, seguindo a estrutura definida para Fornecedores; o botão deve abrir o modal de cadastro definido na Task 16, sem navegar para uma página separada
- [x] Consumir `GET /api/v1/products` com `limit=20` e `offset` iniciado em `0`; enviar o termo de busca à API para pesquisar por nome, categoria ou descrição com full-text antes da paginação e encontrar produtos em todas as páginas
- [x] Usar `hasNext` para controlar a paginação visual inspirada em `docs/references/reference-04.png`: exibir página atual e botões Anterior/Próxima, desativando Anterior no `offset=0` e Próxima quando `hasNext=false`
- [x] Associar imagens às categorias atuais e carregá-las de `public/images/products/`: `agriculture.webp`, `livestock.webp`, `processed-food.webp`, `textile.webp`, `forestry.webp` e `other.webp`; apresentar fallback quando uma imagem não estiver disponível
- [x] Alinhar a grade e seus estados de carregamento, erro e vazio ao layout da Fase 11 e garantir comportamento responsivo

---

## Task 16 — Cadastro de produto em modal

_Substitua a navegação para a página separada de cadastro por um modal aberto a partir da listagem de produtos. Use `docs/references/reference-03.png` como referência de composição do modal, adaptando os campos atuais de produto._

- [x] Abrir o formulário de criação de produto em um modal sobre a listagem, sem navegar para `/products/new`
- [x] Manter no formulário os campos atuais de nome, descrição, categoria e unidade, com validações e mensagens de erro
- [x] Seguir a composição visual da referência de modal, com layout responsivo e campos organizados lado a lado quando houver espaço
- [x] Preservar os estados de envio e, após sucesso, fechar o modal e atualizar a lista de produtos
- [x] Garantir acessibilidade do modal, incluindo foco, fechamento e uso por teclado

---

## Task 17 — Redesign da tela de Certificações

_Redesenhe a listagem conforme `docs/screenshots/09-certifications-list.png`, seguindo o padrão visual dos screenshots do projeto. O screenshot define o alvo da listagem; para o cadastro, use `docs/references/reference-03.png` como referência de modal, pois não há screenshot específico para esse fluxo._

- [x] Exibir na listagem fornecedor, certificação, órgão emissor, data de emissão, data de validade e status
- [x] Substituir o checkbox atual pelo dropdown “Apenas expirando”, funcional para alternar entre todas as certificações e as que estão expirando
- [x] Exibir o status como badge com dropdown funcional por certificação, permitindo atualizar o status pelos valores suportados pela API (`active`, `expired`, `suspended`, `underReview`) e atualizar a listagem após sucesso
- [x] Exibir o botão “Nova certificação” e abrir o cadastro em modal, sem navegar para uma página separada
- [x] No modal, manter os campos atuais de nome, organização emissora, número, emissão, validade e URL do documento, além da associação correta ao fornecedor autenticado
- [x] Preservar validações, permissões, estados de carregamento/erro/sucesso e atualizar a listagem após a criação
- [x] Garantir acessibilidade dos dropdowns e do modal, além de adaptar a listagem e o formulário para telas menores

---

## Task 18 — Redesign da tela de Auditoria

_Use `docs/references/reference-07.png` como referência visual principal e `docs/references/reference-08.png` como referência para o seletor de intervalo de datas. Preserve a tabela e os dados reais de auditoria, adaptando as referências ao layout do Supply Chain Verde._

- [ ] Manter a tabela de auditoria com usuário/email, operação, data e hora, tabela afetada e detalhes disponíveis; exibir as operações em badges com cores diferentes e consistentes
- [ ] Remover os filtros dropdown de usuário e navegador; manter somente o dropdown de operação, além da busca por email e do filtro de intervalo de datas
- [ ] Implementar o seletor de datas inspirado em `reference-08.png`; na abertura da tela, buscar somente os últimos sete dias, sem filtro de operação ou email
- [ ] Consumir `GET /api/v1/audit-logs` com intervalo obrigatório, operação e email opcionais, `limit=20` e `offset`; filtrar o email parcialmente e sem diferenciar maiúsculas de minúsculas na API; usar `hasNext` para a paginação, desativando Anterior no primeiro offset e Próxima quando `hasNext=false`
- [ ] Abrir um modal pelo botão “Exportar logs”, com intervalo de datas obrigatório e filtros opcionais de operação e email do usuário
- [ ] Buscar todas as páginas correspondentes aos filtros do modal e gerar/baixar o CSV localmente no navegador; não exigir endpoint de exportação de arquivo na API
- [ ] Tratar carregamento, erro, resultado vazio e falha durante a exportação, mantendo a tela e o modal responsivos e acessíveis

---

## Task 19 — Redesign da tela de Usuários

_Use `docs/references/reference-09.png` como referência visual para a gestão de usuários. Adapte a composição ao layout compartilhado da Fase 11 e exiba somente informações existentes e necessárias ao Supply Chain Verde. Para o formulário de criação, use `docs/references/reference-03.png` como referência de modal._

- [ ] Apresentar usuários em uma tabela com as colunas Nome, Email, Role e `createdAt`, sem dados de exemplo como última atividade
- [ ] Incluir busca por email e fazer o botão “Adicionar usuário” abrir um modal, sem navegar para uma página separada
- [ ] No modal, manter os campos atuais de nome, email, senha e role, com as validações existentes, e criar o usuário pela rota `POST /api/v1/users`
- [ ] Após a criação bem-sucedida, fechar o modal e atualizar a tabela; preservar estados de envio e mensagens de erro
- [ ] Exibir a role como badge com dropdown para alteração; salvar a seleção pela rota existente `PATCH /api/v1/users/{userId}/role`, disponível somente para administradores
- [ ] Consumir a listagem paginada `GET /api/v1/users` com `limit=20`, `offset` e `hasNext`; enviar o email à API para correspondência parcial case-insensitive antes da paginação e reutilizar os controles de paginação das tasks anteriores
- [ ] Garantir acessibilidade do modal e dos dropdowns e preservar estados de carregamento, erro e lista vazia, com tabela responsiva

---

## Task 20 — Redesign da tela de Lotes

_Redesenhe a tela de lotes usando `docs/references/reference-10.png` como referência principal para a grade de cards com timeline e `docs/references/reference-11.png` como referência secundária para a hierarquia de informações do lote. Adapte ambas ao layout do Supply Chain Verde. Não criar uma página separada de detalhes: os dados e etapas devem ser apresentados nos próprios cards._

- [ ] Substituir a listagem atual por cards em duas colunas em telas largas, responsivos para uma coluna em telas menores; exibir em cada card o ID do lote, produto, fornecedor, quantidade, data de produção, status/etapa atual e uma timeline cronológica das etapas registradas
- [ ] Usar `GET /api/v1/batches` com `page` iniciado em `0` e `size=20`; renderizar a paginação com página atual e botões Anterior/Próxima, desativando Anterior na primeira página e Próxima quando `page + 1 >= totalPages`
- [ ] A listagem paginada já está prevista na **Task 12 da API**, com acesso para `ADMIN`, `MANAGER` e `AUDITOR`, query `page`/`size` e resposta contendo `content`, `page`, `size`, `totalElements` e `totalPages`; a task da API ainda está pendente
- [ ] Obter etapas e emissões pela rota existente `GET /api/v1/batches/{batchId}/traceability`, exibindo-as na timeline sem navegar para outra tela; antes da implementação, confirmar como o status atual deve ser representado, pois o contrato atual da listagem paginada não inclui status nem etapas. Se necessário, atualizar a Task 12 da API para retornar esses dados de forma eficiente, evitando uma chamada de rastreabilidade por card
- [ ] Manter somente a ação “Novo lote” no cabeçalho, sem searchbar; mostrar a ação apenas para `ADMIN` e `SUPPLIER`, perfis autorizados a criar lotes, e abrir um modal baseado em `docs/references/reference-03.png`
- [ ] No modal de lote, usar o contrato de `POST /api/v1/batches`: `productId` e `supplierId` (selecionados por nome na interface e enviados como IDs), `quantity` positiva e `producedAt` em formato de data. Não incluir validade ou descrição, pois esses campos não fazem parte do `BatchRequestDTO` atual
  - **Payload esperado:**
    ```json
    {
      "productId": 8,
      "supplierId": 4,
      "quantity": 500.0,
      "producedAt": "2026-09-20"
    }
    ```
- [ ] Em cada card, oferecer a ação “Adicionar etapa”, que abre um modal. Usar `docs/screenshots/12-chain-form-no-transport.png` e `docs/screenshots/13-chain-form-transport.png` como referências para os campos e `docs/screenshots/14-chain-form-calculate-emission.png` e `docs/screenshots/15-chain-form-emission-calculated.png` para o fluxo de cálculo de emissão
- [ ] No modal de etapa, incluir tipo da etapa, início e fim, origem/destino opcionais e, para etapas do tipo transporte, modal, distância, combustível e capacidade. Criar a etapa por `POST /api/v1/batches/{batchId}/stages`; depois, quando aplicável, registrar transporte e calcular emissão com as rotas existentes. Alinhar o payload ao contrato da API (`batchId`, `originAddressId`, `destinationAddressId`, `stageType`, `startedAt`, `endedAt`), sem enviar objetos de endereço aninhados se a API continuar esperando IDs
  - **Payload da etapa:**
    ```json
    {
      "batchId": 101,
      "originAddressId": 51,
      "destinationAddressId": 52,
      "stageType": "TRANSPORT",
      "startedAt": "2026-09-20T08:00:00",
      "endedAt": null
    }
    ```
  - Para transporte, enviar `transportMode`, `distance`, `fuelType` e `capacity` a `POST /api/v1/stages/{stageId}/transport`; para cálculo de emissão, enviar `calculationMethod` a `POST /api/v1/stages/{stageId}/emission`. Endereços no payload da etapa são IDs de endereços existentes; se o fluxo precisar cadastrar endereços digitados no modal, documentar primeiro a alteração necessária no contrato da API.
- [ ] Após criar lote ou etapa, fechar o modal correspondente e atualizar o card/listagem; preservar validação, estados de envio, mensagens de erro, acessibilidade de foco/teclado e layout responsivo
- [ ] Salvar as imagens dos cards em `public/images/batches/`, usando nomes estáveis por tipo de etapa: `production.webp`, `storage.webp`, `processing.webp`, `transport.webp`, `distribution.webp` e `retail.webp`; escolher a imagem pela etapa atual e oferecer fallback se o arquivo não carregar

### Prompts para gerar as imagens dos cards

Gerar uma imagem por tipo de etapa, mantendo o estilo consistente entre os seis arquivos. Usar orientação horizontal 3:2, composição simples que permaneça legível em um card pequeno, estética editorial realista e sustentável, paleta natural com detalhes verdes, iluminação suave, sem texto, letras, números, logotipos, marcas d'água ou elementos de interface. Salvar cada resultado no caminho indicado acima.

- **`production.webp` — produção:** “Aerial editorial photograph of sustainable Brazilian agriculture at the production stage, healthy crop rows and a farmer inspecting plants, rich natural greens, soft morning light, responsible farming, realistic photography, horizontal 3:2 composition, no text, no logos.”
- **`storage.webp` — armazenagem:** “Editorial photograph inside a clean sustainable warehouse at the storage stage, neatly organized reusable produce crates and sacks on shelves, subtle green accents, natural soft light, realistic photography, horizontal 3:2 composition, no text, no logos.”
- **`processing.webp` — processamento:** “Editorial photograph of an efficient clean food processing facility at the processing stage, workers handling agricultural produce on a hygienic production line, stainless equipment and subtle green details, realistic photography, horizontal 3:2 composition, no text, no logos.”
- **`transport.webp` — transporte:** “Editorial photograph of a modern low-emission delivery truck transporting agricultural goods on a green rural route in Brazil, landscape and vehicle visible, sustainable logistics, soft daylight, realistic photography, horizontal 3:2 composition, no text, no logos.”
- **`distribution.webp` — distribuição:** “Editorial photograph of the distribution stage at a local logistics hub, workers moving reusable crates from a small low-emission vehicle to a neighborhood delivery point, sustainable supply chain, natural soft light, realistic photography, horizontal 3:2 composition, no text, no logos.”
- **`retail.webp` — varejo:** “Editorial photograph of the retail stage in a welcoming Brazilian grocery store, fresh locally sourced produce arranged on shelves with a shop worker restocking, sustainable retail, warm natural light, realistic photography, horizontal 3:2 composition, no text, no logos.”

---

## Task 21 — Redesign da gestão de Relatórios

_Redesenhe a gestão de relatórios para seguir a hierarquia visual das telas de gestão já estabelecidas, especialmente a Task 19 de Usuários. A tela deve facilitar a consulta dos relatórios existentes; a geração de relatório permanece disponível pelas ações e permissões atuais._

- [ ] Exibir os relatórios em uma tabela com as colunas CNPJ, Razão social, Período, CO₂ total, Total de lotes e Data de geração; formatar CNPJ, datas e valores numéricos para leitura, sem trocar os valores retornados pela API
- [ ] Consumir a nova listagem geral `GET /api/v1/reports` definida na **Task 17 da API**, com `limit=20` e `offset` inicial `0`; a rota atual `GET /api/v1/suppliers/{supplierId}/reports` lista somente relatórios de um fornecedor e não é paginada
- [ ] Implementar a paginação no padrão das telas anteriores: exibir página atual e botões Anterior/Próxima, avançar o offset em 20 itens e desativar Próxima quando `hasNext=false`; desativar Anterior no offset `0`
- [ ] Ao selecionar uma linha ou ação de um relatório, navegar para uma tela de detalhe dedicada usando `GET /api/v1/reports/{reportId}`; apresentar os dados do relatório separadamente, incluindo identificação do fornecedor, período, totais e data de geração, sem oferecer edição se não houver operação de edição na API
- [ ] Manter a ação de geração de relatório e o formulário existentes, preservando suas permissões, validações, estados de carregamento/erro/sucesso e associação ao fornecedor
- [ ] Tratar carregamento, erro e lista vazia; manter tabela e detalhe acessíveis e responsivos, respeitando a navegação e identidade visual compartilhadas

### Contrato esperado para a listagem

```json
{
  "items": [
    {
      "reportId": 301,
      "supplierId": 4,
      "supplierCnpj": "12.345.678/0001-90",
      "supplierName": "Fazenda Verde Ltda",
      "periodStartAt": "2026-08-01",
      "periodEndAt": "2026-08-31",
      "totalCo2Kg": 125.75,
      "totalBatchCount": 12,
      "generatedAt": "2026-09-01T10:30:00"
    }
  ],
  "limit": 20,
  "offset": 0,
  "hasNext": true
}
```
