# Supply Chain Verde — Frontend

SPA Angular para rastreabilidade de cadeias de suprimentos sustentáveis. A aplicação consome a API REST do projeto `supply-chain-verde-api` e atende consumidores públicos, fornecedores, auditores, gestores e administradores.

## Status

O repositório está no bootstrap do frontend Angular. A estrutura funcional está especificada, mas as features de autenticação, rastreabilidade e domínio ainda precisam ser implementadas conforme o checklist em [`docs/tasks.md`](docs/tasks.md).

O conceito visual e os fluxos principais estão no arquivo do Figma:

[Supply Chain Verde — Login](https://www.figma.com/design/RwTUc1H65VlQ0qsKmBu48A/Supply-Chain-Verde---Login?node-id=0-1)

As telas foram exportadas para [`screenshots/`](screenshots/) usando o MCP do Composio.

## Telas

### Login

![Tela de login](screenshots/01-login.png)

### Rastreabilidade pública

![Tela de rastreabilidade pública](screenshots/02-traceability.png)

### Dashboard

![Dashboard](screenshots/03-dashboard.png)

### Lista de fornecedores

![Lista de fornecedores](screenshots/04-suppliers-list.png)

### Ranking de fornecedores

![Ranking de fornecedores](screenshots/05-suppliers-ranking.png)

### Formulário de fornecedor

![Formulário de fornecedor](screenshots/06-supplier-form.png)

### Lista de produtos

![Lista de produtos](screenshots/07-products-list.png)

### Formulário de produto

![Formulário de produto](screenshots/08-product-form.png)

### Lista de certificações

![Lista de certificações](screenshots/09-certifications-list.png)

### Lista de lotes

![Lista de lotes](screenshots/10-batches-list.png)

### Etapas da cadeia

![Etapas da cadeia](screenshots/11-chain-stages-list.png)

### Nova etapa sem transporte

![Nova etapa sem transporte](screenshots/12-chain-form-no-transport.png)

### Nova etapa com transporte

![Nova etapa com transporte](screenshots/13-chain-form-transport.png)

### Cálculo de emissão

![Cálculo de emissão](screenshots/14-chain-form-calculate-emission.png)

### Emissão calculada

![Emissão calculada](screenshots/15-chain-form-emission-calculated.png)

### Lista de relatórios

![Lista de relatórios](screenshots/16-reports-list.png)

### Lista de usuários

![Lista de usuários](screenshots/17-users-list.png)

As imagens documentam uma aplicação desktop de 1440 px de largura, com navegação lateral nas telas autenticadas, cartões e tabelas para os dados operacionais e fluxo progressivo para registro de etapas e cálculo de emissões.

## Objetivo do produto

Permitir que cada lote tenha uma jornada rastreável, desde a produção até o varejo, com fornecedores, certificações, etapas logísticas e pegada de carbono associados. Consumidores consultam a origem por uma URL pública ou QR Code; usuários internos trabalham conforme o perfil de acesso.

## Perfis de acesso

| Perfil | Responsabilidades |
| --- | --- |
| **Público** | Consulta a rastreabilidade de um lote sem autenticação |
| **admin** | Administração de usuários, fornecedores, produtos e auditoria |
| **manager** | Fornecedores, produtos, ranking e geração de relatórios |
| **auditor** | Validação de certificações, relatórios e auditoria do sistema |
| **supplier** | Perfil próprio, certificações, lotes, etapas e relatórios próprios |

## Telas e fluxos principais

### Autenticação

- Tela de login com email e senha.
- Requisição `POST /auth/login`.
- Mensagem genérica para credenciais inválidas, sem revelar qual campo falhou.
- Sessão armazenada em `sessionStorage`, com o papel do usuário derivado do JWT.
- Expiração do JWT encerra a sessão e redireciona para `/login`.

### Rastreabilidade pública

Disponível em `/rastreio/:batchId`, sem autenticação. Exibe produto, fornecedor, linha do tempo da cadeia, endereços de origem e destino, transporte e emissões de carbono por etapa e no total. Um lote inexistente deve gerar uma mensagem amigável.

### Área autenticada

Após o login, o usuário acessa um dashboard adaptado ao papel:

- **admin:** usuários e auditoria do sistema;
- **manager:** fornecedores, ranking, produtos e relatórios;
- **auditor:** certificações, relatórios e auditoria;
- **supplier:** perfil, certificações, lotes, etapas e relatórios próprios.

O fluxo operacional do fornecedor é:

```text
Novo lote → nova etapa → transporte (quando aplicável) → cálculo de emissão
```

## Sitemap e API principal

| Rota/tela | Perfis | Endpoint(s) |
| --- | --- | --- |
| Rastreabilidade do lote | Público | `GET /batches/{id}/traceability`, `GET /batches/{id}/carbon-footprint` |
| Login | Todos | `POST /auth/login` |
| Dashboard | Autenticados | Conteúdo por perfil |
| Usuários | admin | `POST /users`, `GET /users/me`, `PATCH /users/{id}/role` |
| Auditoria | admin, auditor | `GET /audit-logs` |
| Fornecedores | admin, manager | `POST/PUT/GET /suppliers` |
| Ranking | admin, manager, auditor, supplier | `GET /suppliers/ranking` |
| Produtos | admin, manager | `POST/PUT/GET /products` |
| Relatórios | manager, auditor, supplier | `POST/GET /suppliers/{id}/reports` |
| Certificações | auditor, supplier | `POST /suppliers/{id}/certifications`, `PATCH /certifications/{id}/status` |
| Lotes | supplier, admin, manager, auditor | `POST /batches`, `GET /suppliers/{id}/batches` |
| Etapas da cadeia | supplier, manager, admin | `POST/GET /batches/{id}/stages`, `POST /stages/{id}/transport`, `POST /stages/{id}/emission` |

## Arquitetura planejada

O projeto usa organização por feature e componentes standalone:

```text
src/app/
├── core/       # sessão, guards e interceptors
├── shared/     # componentes reutilizáveis
├── features/   # auth, traceability, dashboard e domínios
└── environments/
```

Decisões técnicas:

- Angular 21 com standalone components e sem `NgModule`;
- Signals e services por feature, sem NgRx;
- Reactive Forms;
- Tailwind CSS;
- Zod para validar respostas da API em runtime e derivar tipos/enums;
- `HttpInterceptorFn` para anexar o JWT e tratar `401`/`403`;
- guards funcionais para autenticação e autorização por papel;
- lazy loading nas rotas de features;
- Cypress para os fluxos E2E principais.

## Como executar

### Pré-requisitos

- Node.js compatível com Angular 21;
- npm 10 ou superior;
- API backend disponível, quando forem implementadas as chamadas reais.

### Instalação

```bash
npm install
```

### Servidor de desenvolvimento

```bash
npm start
```

A aplicação fica disponível em `http://localhost:4200/`.

### Build de produção

```bash
npm run build
```

### Testes unitários

```bash
npm test
```

O projeto ainda não define uma suíte E2E no `package.json`; o plano prevê Cypress para login, rastreabilidade pública e registro de lote.

## Documentação do projeto

- [`docs/spec.md`](docs/spec.md): requisitos funcionais, perfis, telas, sitemap e fluxos.
- [`docs/plan.md`](docs/plan.md): arquitetura Angular, estado, autenticação, contratos e convenções.
- [`docs/tasks.md`](docs/tasks.md): checklist de implementação por fases.

## Fora do escopo do MVP

- Exportação de relatórios em PDF ou CSV;
- dashboards com múltiplos gráficos elaborados;
- autocadastro público de fornecedores;
- refresh token e renovação automática de sessão.

## Licença

Projeto acadêmico do grupo Supply Chain Verde.
