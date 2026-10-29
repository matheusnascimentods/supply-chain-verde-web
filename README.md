# 🌱 Supply Chain Verde — Frontend de Rastreabilidade & Sustentabilidade

![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-4-3E67B1?style=for-the-badge&logo=zod&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)

> Rastreabilidade pública de lotes, gestão de fornecedores e acompanhamento das emissões de CO₂ da cadeia de suprimentos.

O **Supply Chain Verde Web** é uma Single Page Application (SPA) desenvolvida em **Angular 21** e **TypeScript**, organizada em **core / shared / features**, com cada feature separada nas camadas **domain, application, infrastructure e presentation**. A aplicação consome a [API Supply Chain Verde](https://github.com/matheusnascimentods/supply-chain-verde-api) e coloca consumidores, fornecedores, gestores, auditores e administradores em contato com os fluxos de rastreabilidade, emissões, certificações, relatórios e auditoria.

```mermaid
sequenceDiagram
    autonumber
    actor User as Operador / Fornecedor
    actor Consumer as Consumidor
    participant Web as Frontend (Presentation)
    participant Facade as Application (Facade)
    participant Repo as Infrastructure (Repository + Zod)
    participant API as API REST

    User->>Web: Registra a próxima etapa do lote
    Web->>Facade: registerStage(batchId, etapa)
    Facade->>Repo: POST /api/v1/batches/{batchId}/stages
    Repo->>API: Authorization: Bearer <token>
    API-->>Repo: 201 Created (etapa)
    Repo->>API: POST /api/v1/stages/{chainId}/transport e /emission
    API-->>Repo: Transporte e CO₂ calculado
    Repo->>Repo: Valida respostas com Zod e converte em modelos de domínio
    Repo-->>Facade: Etapa, transporte e emissão
    Facade-->>Web: Signals atualizam a timeline do lote

    Consumer->>Web: Abre /rastreio/{batchId} (QR Code)
    Web->>API: GET /batches/{batchId}/traceability e /carbon-footprint
    API-->>Web: Jornada do lote e pegada de carbono
    Web-->>Consumer: Timeline e gráfico de CO₂ por etapa, sem login
```

---

## ✨ O Problema
Os dados de sustentabilidade de uma cadeia de suprimentos são difíceis de consumir:
- **Informação espalhada**: origem, transporte, certificações e emissões ficam em sistemas e documentos diferentes, sem uma visão única por lote.
- **Operação trabalhosa**: cadastrar um lote exige produto, fornecedor, etapas, transporte e emissão, normalmente em telas e passos separados.
- **Comparação difícil entre fornecedores**: sem ranking nem recomendação, escolher o parceiro com menor emissão depende de planilhas.
- **Opacidade para o consumidor**: o consumidor final não tem uma forma simples de consultar a procedência e a pegada de carbono do produto.

---

## 🚀 A Solução
O frontend reúne os recursos da API numa interface única, adaptada a cada perfil:
- **Rastreabilidade pública**: página aberta, acessível por QR Code, com a jornada do lote e o CO₂ de cada etapa.
- **Dashboard operacional**: indicadores gerais, lotes por etapa, série mensal de emissões de CO₂ e lotes recentes.
- **Gestão de fornecedores**: listagem e ranking de sustentabilidade na mesma tela, com cadastro, certificações e relatórios em modais do próprio fornecedor.
- **Gestão da cadeia**: criação de lotes num fluxo de etapas que cadastra produto e fornecedor sem sair do modal e recomenda os fornecedores com menor emissão por unidade.
- **Governança**: gestão de usuários e perfis, e consulta da auditoria com exportação CSV.

---

## 🎯 Diferenciais
- **Arquitetura em camadas por feature**: cada domínio separa modelo, orquestração, acesso HTTP e telas; features só se comunicam pela API pública (`index.ts`).
- **Contratos validados na entrada**: schemas Zod verificam cada resposta da API antes de qualquer dado chegar às telas.
- **Ordem da cadeia guiada pela interface**: ao registrar uma etapa, só a próxima etapa válida é oferecida, espelhando a regra do banco.
- **Recomendação de fornecedores verdes**: a criação de lotes sugere os fornecedores com menor CO₂ por unidade do produto escolhido.
- **Relatório em PDF sem dependência de servidor**: o detalhe do relatório é montado em Markdown, convertido em HTML e impresso pelo navegador.
- **Experiência por perfil**: navegação e guards mostram a cada papel apenas as áreas que ele pode usar; a API aplica a autorização final.
- **Sem bibliotecas de gráficos ou de UI**: gráficos em SVG e componentes próprios em `shared/ui`, estilizados com Tailwind.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Framework** | Angular 21 (standalone components, router com lazy loading) |
| **Linguagem** | TypeScript 5.9 |
| **Estilos** | Tailwind CSS 4 |
| **Estado** | Angular Signals em facades por feature |
| **Formulários** | Angular Reactive Forms |
| **HTTP** | Angular `HttpClient` com interceptor funcional |
| **Contratos & Validação** | Zod 4 |
| **Relatório em PDF** | marked (Markdown → HTML) + impressão do navegador |
| **Endereço por CEP** | ViaCEP |
| **Testes Unitários** | Vitest (via `ng test`) |
| **Testes E2E** | Cypress 16 |
| **Lint** | ESLint + angular-eslint |

---

## 🏛️ Arquitetura (core / shared / features em camadas)

O projeto segue a mesma **Regra da Dependência** da API: as camadas externas apontam para dentro, e o domínio de cada feature não conhece HTTP nem Angular.

```
core       ← Sessão, guards, interceptor, usuário logado, layout e integrações (ViaCEP). Não importa features
shared     ← UI genérica, diretivas e utilitários. Não importa core nem features
features   ← Um diretório por domínio, cada um com:
   domain          ← Modelos, regras e value objects
      ↑
   application     ← Facade com signals e use-cases
      ↑
   infrastructure  ← Repository HTTP, DTOs Zod e mappers
      ↑
   presentation    ← Páginas e componentes
```

```mermaid
flowchart LR
    Browser[Navegador] --> Routes[Angular Router]
    Routes --> Guards[Auth Guard / Role Guard]
    Guards --> Presentation[Presentation<br/>pages e components]
    Presentation --> Facade[Application<br/>facade e use-cases]
    Facade --> Repository[Infrastructure<br/>repository]
    Repository --> HTTP[HttpClient]
    HTTP --> Interceptor[Auth Interceptor]
    Interceptor --> API[Supply Chain Verde API]
    Repository --> Zod[DTOs Zod + mappers]
    Zod --> Domain[Domain models]
    Domain --> Facade
    Facade --> Signals[Angular Signals]
    Signals --> Presentation
```

### Status de Implementação

- **Base (000) concluída**: autenticação JWT, rastreabilidade pública, dashboard, fornecedores e ranking, lotes e etapas, certificações, relatórios, usuários e auditoria com exportação CSV.
- **Reestruturação em camadas (001) concluída**: `core`, `shared` e `features` separados; cada feature dividida em domain, application, infrastructure e presentation.
- **Recomendação de fornecedores (002) concluída**: a criação de lotes sugere os fornecedores com menor CO₂ por unidade do produto.
- **Vínculo usuário–fornecedor (003) concluído**: o fornecedor pode ser criado com acesso próprio; o perfil SUPPLIER usa o `supplierId` do token e edita o próprio cadastro em `/profile`.
- **Gráfico de emissões (004) concluído**: série mensal de CO₂ no dashboard, com os meses sem emissão zerados.
- **Relatório em PDF (005) concluído**: download do detalhe do relatório (fornecedor, emissões por etapa, lote e metodologia e certificações vigentes no período).
- **Contrato novo da API (006) concluído**: só a próxima etapa da cadeia é oferecida, certificações não aceitam validade vencida nem reativação depois de vencidas, e o relatório avisa que é um retrato da data de geração.
- **Hero section (007) concluída**: `/` apresenta o produto antes do login, com o CTA **Entrar**; quem já tem sessão vai direto para o `/dashboard`, e o logout volta para a hero.
- **Testes**: 81 arquivos de testes unitários e 3 fluxos Cypress (login, cadastro de lote e rastreio público).
- **Pendente**: tela de perfil para os demais usuários; hoje só o fornecedor edita os próprios dados.

### Principais Áreas da Aplicação
- **`auth`**: login e criação da sessão.
- **`dashboard`**: indicadores globais, gráficos por etapa, emissões mensais e lotes recentes.
- **`traceability`**: consulta pública do lote e gráfico da pegada de carbono.
- **`suppliers`**: listagem e ranking, cadastro e edição, perfil do fornecedor e modais de certificações e relatórios (com exportação em PDF).
- **`certifications`**: domínio e formulário de certificações usados no modal do fornecedor.
- **`batches`**: lotes, produtos, criação em etapas, registro de etapas, transporte e emissões.
- **`users`**: listagem, criação e alteração de perfil de acesso.
- **`audit-log`**: consulta de eventos e exportação CSV.

---

## 🗺️ Telas & Rotas

Todas as rotas carregam a feature sob demanda (`loadChildren`). As rotas autenticadas ficam dentro do `AppShellComponent` (navegação superior e rodapé) e passam pelo `authGuard`; algumas exigem também o `roleGuard`.

### Mapa de rotas

```mermaid
flowchart TD
    Root["/<br/>hero, guestGuard"] -->|Entrar| Login["/login"]
    Public["/rastreio/:batchId<br/>público"]
    Login -->|JWT| Shell["AppShellComponent<br/>authGuard"]
    Shell --> Dashboard["/dashboard"]
    Shell --> Suppliers["/suppliers"]
    Shell --> Batches["/batches"]
    Shell --> Users["/users<br/>roleGuard: admin, manager"]
    Shell --> Audit["/audit-log<br/>roleGuard: admin, auditor"]
    Shell --> Me["/profile<br/>menu do usuário"]
    Suppliers -.modal.-> SupplierForm[Cadastro / edição]
    Suppliers -.modal.-> Certs[Certificações]
    Suppliers -.modal.-> Reports[Relatórios + PDF]
    Batches -.modal.-> BatchCreate[Criação de lote<br/>produto e fornecedor inline]
    Batches -.modal.-> Stage[Registro de etapa<br/>transporte e emissão]
    Users -.modal.-> UserCreate[Criação de usuário]
    Audit -.modal.-> Csv[Exportação CSV]
```

| Rota | Tela | O que entrega | Acesso |
| :--- | :--- | :--- | :--- |
| `/` | Hero | Apresentação do produto e CTA **Entrar**; com sessão, redireciona para `/dashboard` | Público |
| `/rastreio/:batchId` | Rastreio público | Jornada do lote, etapas, transporte e gráfico de CO₂ por etapa | **Público** |
| `/login` | Login | Autenticação e criação da sessão | Público |
| `/dashboard` | Dashboard | Indicadores, lotes por etapa, emissões mensais e lotes recentes | Autenticado |
| `/suppliers` | Fornecedores | Listagem e ranking com busca e paginação; modais de cadastro, certificações e relatórios | Autenticado |
| `/profile` | Meu perfil | Edição do cadastro do próprio fornecedor, pelo menu do usuário (`/suppliers/me` redireciona para cá) | `supplier` |
| `/batches` | Lotes | Cards com a etapa atual e a timeline; criação de lote e registro de etapas | Autenticado |
| `/users` | Usuários | Listagem com busca, criação e alteração de perfil | `admin`, `manager` |
| `/audit-log` | Auditoria | Eventos por período com filtros e exportação CSV | `admin`, `auditor` |

Rotas desconhecidas dentro da área autenticada redirecionam para `/dashboard`.

### Capturas de tela

<table>
  <tr>
    <td align="center" width="50%"><img src="docs/screenshots/00-landing.jpeg" alt="Hero section" /><br/><sub>Hero section</sub></td>
    <td align="center" width="50%"><img src="docs/screenshots/01-login.jpeg" alt="Login" /><br/><sub>Login</sub></td>
  </tr>
  <tr>
    <td align="center" width="50%"><img src="docs/screenshots/03-dashboard.jpeg" alt="Dashboard" /><br/><sub>Dashboard</sub></td>
    <td align="center" width="50%"><img src="docs/screenshots/02-dashboard-full-page.jpeg" alt="Dashboard (página inteira)" /><br/><sub>Dashboard (página inteira)</sub></td>
  </tr>
  <tr>
    <td align="center" width="50%"><img src="docs/screenshots/04-suppliers-list.jpeg" alt="Fornecedores" /><br/><sub>Fornecedores</sub></td>
    <td align="center" width="50%"><img src="docs/screenshots/08-suppliers-search.jpeg" alt="Busca de fornecedores" /><br/><sub>Busca de fornecedores</sub></td>
  </tr>
  <tr>
    <td align="center" width="50%"><img src="docs/screenshots/07-supplier-form-modal.jpeg" alt="Cadastro de fornecedor" /><br/><sub>Cadastro de fornecedor</sub></td>
    <td align="center" width="50%"><img src="docs/screenshots/05-supplier-certifications-modal.jpeg" alt="Certificações do fornecedor" /><br/><sub>Certificações do fornecedor</sub></td>
  </tr>
  <tr>
    <td align="center" width="50%"><img src="docs/screenshots/06-supplier-reports-modal.jpeg" alt="Relatórios do fornecedor" /><br/><sub>Relatórios do fornecedor</sub></td>
    <td align="center" width="50%"><img src="docs/screenshots/09-batches-list.jpeg" alt="Lotes" /><br/><sub>Lotes</sub></td>
  </tr>
  <tr>
    <td align="center" width="50%"><img src="docs/screenshots/10-batch-create-new-product.jpeg" alt="Novo lote: produto novo" /><br/><sub>Novo lote: produto novo</sub></td>
    <td align="center" width="50%"><img src="docs/screenshots/11-batch-create-select-product.jpeg" alt="Novo lote: seleção de produto" /><br/><sub>Novo lote: seleção de produto</sub></td>
  </tr>
  <tr>
    <td align="center" width="50%"><img src="docs/screenshots/12-batch-create-new-supplier.jpeg" alt="Novo lote: fornecedor novo" /><br/><sub>Novo lote: fornecedor novo</sub></td>
    <td align="center" width="50%"><img src="docs/screenshots/13-batch-create-supplier-recommendation.jpeg" alt="Novo lote: recomendação de fornecedores" /><br/><sub>Novo lote: recomendação de fornecedores</sub></td>
  </tr>
  <tr>
    <td align="center" width="50%"><img src="docs/screenshots/14-batch-create-review.jpeg" alt="Novo lote: revisão" /><br/><sub>Novo lote: revisão</sub></td>
    <td align="center" width="50%"><img src="docs/screenshots/15-users-list.jpeg" alt="Usuários" /><br/><sub>Usuários</sub></td>
  </tr>
  <tr>
    <td align="center" width="50%"><img src="docs/screenshots/16-audit-log.jpeg" alt="Auditoria" /><br/><sub>Auditoria</sub></td>
  </tr>
</table>

### Navegação por perfil

O menu superior é montado a partir de [`core/layout/navigation/index.constants.ts`](src/app/core/layout/navigation/index.constants.ts):

| Perfil | Itens do menu |
| :--- | :--- |
| `admin` | Fornecedores, Lotes, Usuários, Auditoria |
| `manager` | Fornecedores, Lotes, Usuários |
| `auditor` | Auditoria do sistema, Fornecedores, Lotes |
| `supplier` | Meus lotes, Fornecedores |

### Fluxo de criação de lote

```mermaid
sequenceDiagram
    autonumber
    actor User as Fornecedor / Admin
    participant Modal as Modal de criação
    participant API as API REST

    User->>Modal: Abre "Novo lote"
    Modal->>API: GET /products?search=...
    alt Produto não existe
        User->>Modal: Cadastra produto inline
        Modal->>API: POST /products
    end
    Modal->>API: GET /suppliers?ranked=true&productId={id}
    API-->>Modal: Fornecedores ordenados por CO₂ por unidade
    alt Fornecedor não existe
        User->>Modal: Cadastra fornecedor inline (CEP via ViaCEP)
        Modal->>API: POST /suppliers
    end
    User->>Modal: Revisa quantidade e data de produção
    Modal->>API: POST /batches
    API-->>Modal: 201 Created
    Modal-->>User: Lote aparece na listagem
```

---

## 📁 Estrutura do Projeto

```text
supply-chain-verde-web/
├── .github/workflows/ci.yml     # Testes, build, npm audit e lint
├── cypress/e2e/                 # Fluxos ponta a ponta (login, cadastro de lote, rastreio público)
├── docs/
│   ├── features/                # Specs SDD por feature (spec, plan, tasks)
│   ├── references/              # Referências visuais do design
│   └── screenshots/             # Capturas das telas
├── public/                      # Assets estáticos (favicon)
└── src/
    ├── app/                     # Código da aplicação (detalhe abaixo)
    └── environments/            # URL da API e do ViaCEP por ambiente
```

```text
src/app/
│
├── core/                        # Infraestrutura global (não importa features)
│   ├── auth/                    # Sessão, usuário logado, guards (auth e role) e interceptor JWT
│   ├── integrations/via-cep/    # Consulta de endereço por CEP
│   └── layout/                  # App shell, top-nav, footer e navegação por perfil
│
├── shared/                      # Reutilizáveis (não importa core nem features)
│   ├── ui/                      # button, data-table, enum-select, error-toast, modal, pagination, spinner, text-field
│   ├── directives/              # close-on-outside-click
│   └── utils/                   # date, format (CNPJ, telefone, CEP, número pt-BR) e http
│
├── features/                    # Um diretório por domínio
│   ├── auth/
│   ├── dashboard/
│   ├── traceability/
│   ├── suppliers/
│   ├── certifications/
│   ├── batches/
│   ├── users/
│   └── audit-log/
│       ├── domain/              # Modelos, regras e value objects
│       ├── application/         # Facade com signals e use-cases
│       ├── infrastructure/      # Repository HTTP, DTOs Zod e mappers
│       ├── presentation/        # Páginas e componentes
│       ├── index.routes.ts      # Rotas da feature (lazy loading)
│       └── index.ts             # API pública da feature
│
├── app.routes.ts                # Rotas raiz, guards e shell autenticado
└── app.config.ts                # Providers (router, HttpClient, interceptor)
```

## 📚 Documentação do Projeto

| Documento | Conteúdo |
|---|---|
| [`docs/features/000-base`](docs/features/000-base/spec.md) | Funcionalidades, perfis, rotas, arquitetura e histórico de implementação |
| [`docs/features/001-folder-restructure`](docs/features/001-folder-restructure/spec.md) | Reestruturação em core, shared e features em camadas |
| [`docs/features/002-recomendacao-fornecedores`](docs/features/002-recomendacao-fornecedores/spec.md) | Recomendação de fornecedores por CO₂ por unidade |
| [`docs/features/003-vinculo-usuario-fornecedor`](docs/features/003-vinculo-usuario-fornecedor/spec.md) | Vínculo entre usuário e fornecedor |
| [`docs/features/004-grafico-emissoes`](docs/features/004-grafico-emissoes/spec.md) | Gráfico de emissões por período no dashboard |
| [`docs/features/005-relatorio-pdf`](docs/features/005-relatorio-pdf/spec.md) | Relatório de sustentabilidade em PDF |
| [`docs/features/006-contrato-api`](docs/features/006-contrato-api/spec.md) | Ajustes ao contrato novo da API |
| [`docs/features/007-hero-section`](docs/features/007-hero-section/spec.md) | Hero section antes do login |

Cada pasta contém `spec.md` (problema e requisitos), `plan.md` (decisões técnicas) e `tasks.md` (tarefas e PRs).

### Pipeline de Qualidade

O workflow de GitHub Actions roda em pull requests e em pushes para `main`, com jobs separados:

- testes unitários (`npm test -- --watch=false`);
- build de produção (`npm run build`);
- auditoria de dependências (`npm audit --omit=dev --audit-level=high`);
- análise estática com ESLint (`npm run lint`).

Todos os jobs instalam as dependências com `npm ci` para builds reproduzíveis.

---

## ⚡ Quick Start (Frontend + API)

### Pré-requisitos
- [Node.js 22](https://nodejs.org/) e npm 10 ou superior
- [API Supply Chain Verde](https://github.com/matheusnascimentods/supply-chain-verde-api) em execução localmente (PostgreSQL via Docker Compose)

### 1. Clonar o repositório
```bash
git clone https://github.com/matheusnascimentods/supply-chain-verde-web.git
cd supply-chain-verde-web
```

### 2. Subir a API
Siga o [Quick Start da API](https://github.com/matheusnascimentods/supply-chain-verde-api#-quick-start-com-docker-compose). Por padrão o frontend espera a API em `http://localhost:8080/api/v1`, e a API libera CORS para `http://localhost:4200`.

### 3. Executar o Frontend
```bash
npm ci
npm start
```

A aplicação estará disponível em: **`http://localhost:4200`**

O rastreio público pode ser aberto direto pela URL, sem login: **`http://localhost:4200/rastreio/{batchId}`**

### Usuários Seed

As migrations de seed da API criam usuários de cada perfil para desenvolvimento e demonstração. A senha de todos os usuários seed é:

```text
rolocompressor06
```

Os e-mails estão nas migrations de seed da API (veja [Usuários Seed](https://github.com/matheusnascimentods/supply-chain-verde-api#usu%C3%A1rios-seed)). Essa credencial é exclusiva para o ambiente local/demonstrativo e não deve ser usada em ambientes compartilhados ou de produção.

---

## 💻 Comandos Úteis de Desenvolvimento

```bash
# Iniciar o servidor de desenvolvimento
npm start

# Gerar o build de produção
npm run build

# Build contínuo em modo desenvolvimento
npm run watch

# Rodar os testes unitários
npm test

# Rodar o lint
npm run lint

# Executar os testes E2E (com o servidor iniciado em outro terminal)
npm run cypress:run

# Abrir o Cypress interativo
npm run cypress:open
```

---

## 🔌 API Reference (Recursos Consumidos)

O frontend consome os endpoints versionados sob `/api/v1`. Contratos completos, parâmetros e regras de autorização estão no [README da API](https://github.com/matheusnascimentods/supply-chain-verde-api#-api-reference-principais-recursos) e no Swagger UI (`http://localhost:8080/swagger-ui.html`) da API em execução.

### 🔐 Autenticação & Sessão
| Método | Rota | Uso na interface | Tela |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Autenticação e emissão do JWT | Login |
| `GET` | `/api/v1/users/me` | Usuário logado (nome e `supplierId`) | Navegação e dashboard |

### 📊 Dashboard
| Método | Rota | Uso na interface | Tela |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard/summary?limit={n}` | Indicadores, lotes por etapa e lotes recentes | Dashboard |
| `GET` | `/api/v1/dashboard/emissions?from=...&to=...` | Série mensal de CO₂ | Dashboard |

### 🏢 Fornecedores
| Método | Rota | Uso na interface | Tela |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/suppliers?ranked=true&limit=&offset=&search=` | Listagem e ranking paginados com busca | Fornecedores |
| `GET` | `/api/v1/suppliers?ranked=true&productId={id}` | Recomendação por CO₂ por unidade do produto | Criação de lote |
| `GET` | `/api/v1/suppliers?supplierId={id}` | Dados do fornecedor | Meu perfil |
| `POST` | `/api/v1/suppliers` | Cadastro (com usuário de acesso opcional) | Modal de fornecedor / criação de lote |
| `PUT` | `/api/v1/suppliers/{supplierId}` | Edição | Modal de fornecedor |
| `PATCH` | `/api/v1/suppliers/me` | Edição do próprio cadastro | Meu perfil |

### 📜 Certificações
| Método | Rota | Uso na interface | Tela |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/suppliers/{supplierId}/certifications` | Cadastro de certificação | Modal de certificações |
| `PATCH` | `/api/v1/certifications/{certificationId}/status` | Alteração de status | Modal de certificações |

### 📦 Lotes, Produtos & Etapas
| Método | Rota | Uso na interface | Tela |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/batches?page=&size=` | Lotes com etapa atual e timeline | Lotes |
| `POST` | `/api/v1/batches` | Criação de lote | Modal de criação de lote |
| `GET` | `/api/v1/products?search=&limit=&offset=` | Busca paginada de produtos | Modal de criação de lote |
| `POST` | `/api/v1/products` | Cadastro inline de produto | Modal de criação de lote |
| `POST` | `/api/v1/batches/{batchId}/stages` | Registro da próxima etapa | Modal de etapa |
| `POST` | `/api/v1/stages/{chainId}/transport` | Dados de transporte da etapa | Modal de etapa |
| `POST` | `/api/v1/stages/{chainId}/emission` | Cálculo da emissão de CO₂ | Modal de etapa |

### 🔎 Rastreabilidade Pública
| Método | Rota | Uso na interface | Tela |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/batches/{batchId}/traceability` | Jornada completa do lote | Rastreio público |
| `GET` | `/api/v1/batches/{batchId}/carbon-footprint` | Pegada de carbono por etapa | Rastreio público |

### 📊 Relatórios ESG
| Método | Rota | Uso na interface | Tela |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reports?supplierId=&limit=&offset=` | Relatórios paginados do fornecedor | Modal de relatórios |
| `GET` | `/api/v1/reports?reportId={id}` | Detalhe usado no PDF | Modal de relatórios |
| `POST` | `/api/v1/suppliers/{supplierId}/reports` | Geração por período | Modal de relatórios |

### 👥 Usuários
| Método | Rota | Uso na interface | Tela |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users?limit=&offset=&email=` | Listagem paginada com busca por e-mail | Usuários |
| `POST` | `/api/v1/users` | Criação de usuário | Modal de usuário |
| `PATCH` | `/api/v1/users/{userId}/role` | Alteração do perfil de acesso | Usuários |

### 🧾 Auditoria
| Método | Rota | Uso na interface | Tela |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/audit-logs?from=&to=&action=&userEmail=&limit=&offset=` | Eventos do período com filtros; o CSV é gerado no navegador | Auditoria |

### 🌐 Integrações Externas
| Método | Rota | Uso na interface | Tela |
| :--- | :--- | :--- | :--- |
| `GET` | `https://viacep.com.br/ws/{cep}/json/` | Preenchimento do endereço pelo CEP | Cadastro de fornecedor |

---

## 🗂️ Variáveis de Ambiente & Configuração

O Angular não lê variáveis de ambiente em tempo de execução: a configuração fica nos arquivos de [`src/environments`](src/environments), escolhidos no build.

| Configuração | Descrição | Valor Default (Local) |
| :--- | :--- | :--- |
| `environment.ts` → `apiUrl` | URL base da API no desenvolvimento | `http://localhost:8080/api/v1` |
| `environment.ts` → `viaCepUrl` | URL base do ViaCEP | `https://viacep.com.br/ws` |
| `environment.prod.ts` → `apiUrl` | URL base da API no build de produção | Definida conforme o ambiente de deploy |
| `CORS_ALLOWED_ORIGINS` (na API) | Origem liberada para o frontend | `http://localhost:4200` |

---

## 🔒 Segurança & Boas Práticas

- **Sessão JWT**: o token e o perfil ficam em `sessionStorage` e o interceptor envia `Authorization: Bearer <token>` em cada requisição à API.
- **Sessão inválida encerrada**: respostas `401`/`403` limpam a sessão e levam o usuário de volta ao login.
- **Controle por perfil (RBAC)**: `authGuard`, `roleGuard` e o menu por perfil limitam a experiência a cada papel (`admin`, `manager`, `auditor`, `supplier`); a API aplica a autorização efetiva.
- **Dados validados**: nenhuma resposta da API chega às telas sem passar por um schema Zod.
- **Auditoria somente leitura**: o frontend só exibe os eventos gravados pelas triggers do banco; não cria logs nem define o autor das operações.
- **Sem refresh token**: quando o JWT expira, o usuário precisa entrar de novo.
- **Credenciais seed**: a senha de demonstração só deve ser usada localmente.

---

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie uma branch para a sua funcionalidade (`git checkout -b feature/nome-da-feature`)
3. Rode `npm test`, `npm run build` e `npm run lint`
4. Faça o commit das suas alterações (`git commit -m 'feat: implementa nova funcionalidade'`)
5. Envie para o repositório remoto (`git push origin feature/nome-da-feature`)
6. Abra um **Pull Request** detalhando as alterações

---

## 📄 Licença

Distribuído sob a licença MIT. Veja [`LICENSE.txt`](LICENSE.txt) para mais detalhes.

---
Feito com ❤️ por [@matheusnascimentods](https://github.com/matheusnascimentods)
