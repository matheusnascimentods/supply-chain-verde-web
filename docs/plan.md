# Arquitetura técnica — Supply Chain Verde Web

> Descrição da implementação atual, conferida com `src/app`, `package.json`, tarefas concluídas e commits recentes.

## 1. Stack

| Área | Tecnologia |
|---|---|
| Framework e roteamento | Angular 21, standalone components, lazy loading |
| Linguagem | TypeScript 5.9 |
| Estilos | Tailwind CSS 4 |
| Formulários | Reactive Forms |
| Validação de contratos | Zod 4 |
| HTTP | `HttpClient` e interceptor funcional |
| Estado | Signals e services por feature |
| Unit tests | Vitest, specs junto dos componentes e serviços |
| E2E | Cypress |

## 2. Estrutura do código

```text
src/app/
├── app.config.ts, app.routes.ts       # configuração e rotas
├── core/
│   ├── guards/                         # autenticação e autorização por papel
│   ├── interceptors/                   # Bearer token e respostas de autenticação
│   └── session/                        # sessão, token e papel do usuário
├── shared/components/
│   ├── app-shell/                      # layout autenticado
│   ├── app-footer/                     # footer global
│   ├── top-nav/                        # navegação responsiva
│   └── ...                             # spinner, diálogo, enum-select, toast
└── features/
    ├── auth/ dashboard/ traceability/
    ├── suppliers/ products/ batches/ chain/
    └── certifications/ reports/ users/ audit-log/
```

Cada feature mantém schemas, serviços, componentes e specs relacionados próximos. As rotas carregam componentes/features sob demanda. O ranking está na feature de fornecedores; certificações e relatórios são apresentados em modais dessa feature, sem páginas próprias. O fluxo de lote apresenta a timeline no card e permite operações em modais.

## 3. Sessão e autorização

- `SessionService` mantém o papel em Signal e persiste o JWT em `sessionStorage`.
- `authGuard` exige sessão e `roleGuard` compara os papéis permitidos declarados na rota.
- `authInterceptor` envia `Authorization: Bearer <token>` e trata respostas `401`/`403` limpando a sessão e direcionando o usuário ao login.
- A UI condiciona navegação e ações ao papel; a API continua sendo a autoridade para autorização e propriedade dos dados.
- Não há renovação automática de token/refresh token.

## 4. API e estado

Os services por feature usam `HttpClient` e Signals para carregar e expor os dados consumidos pelas telas. Schemas em `index.schema.ts` validam em runtime respostas e envelopes paginados, e também fornecem tipos e opções de enums. Os formulários usam os validators nativos de Reactive Forms.

A URL base fica em `src/environments/environment.ts` e a configuração de produção em `environment.prod.ts`. Consultas paginadas mantêm o contrato específico de cada recurso: `limit`/`offset` em telas de gestão e `page`/`size` na listagem de lotes.

### Auditoria

A feature `audit-log` consulta `GET /audit-logs`, formata `affectedEntityId`, `beforeData` e `afterData` para a tabela e reutiliza o resumo na exportação CSV local. O frontend não produz logs nem envia o ID do ator nas escritas; captura e contrato de auditoria são responsabilidades do backend.

## 5. Rotas

O mapa de rotas funcionais está em [`spec.md`](spec.md). A configuração efetiva está em `src/app/app.routes.ts` e nos arquivos `routes.ts` de cada feature. Rastreabilidade e login são públicos; as telas internas ficam sob a proteção de sessão, com restrições específicas por papel onde necessário.

## 6. Testes e comandos

Specs unitários acompanham serviços, guards, interceptor e componentes. Os cenários E2E estão em `cypress/e2e/` e cobrem login, rastreabilidade pública e o fluxo de lote/etapa.

```bash
npm ci
npm start
npm run build
npm test
npm run lint
npm run cypress:run
```

## 7. Decisões e limites conhecidos

- Organização por feature, sem NgRx, adequada ao estado majoritariamente local das telas.
- Angular standalone, sem `NgModule`; renderização client-side.
- JWT em `sessionStorage`; cookie `httpOnly` exigiria mudança coordenada com o backend e proteção CSRF.
- Sem refresh token: quando a sessão expira, o usuário precisa autenticar novamente.
- Indicadores e gráficos da dashboard respeitam a amostra e agregações realmente fornecidas pela API; não estimam séries ou totais ausentes.
- Endpoints, regras de permissão e formatos de payload pertencem ao contrato do backend e podem evoluir independentemente; mantenha os schemas e [`spec.md`](spec.md) sincronizados quando isso ocorrer.

## 8. Fluxo multi-step de lote (Task 28)

O modal de criação de lote é o ponto de entrada para selecionar ou cadastrar produto e fornecedor. Seleções e formulários ficam no estado local do wizard até a revisão final e então os recursos novos são persistidos nesta ordem: produto, fornecedor e lote. IDs de respostas bem-sucedidas são retidos para retomada após falhas subsequentes. Se houver persistência parcial, o modal permanece aberto e bloqueia fechamento; é possível voltar para ajustar quantidade/data e os cadastros já salvos ficam travados para reutilização, pois não há atomicidade entre requests no contrato atual.

### Contratos e implicações de interface

- Produtos: `GET /products?limit=&offset=&search=` oferece paginação/busca remotas; `POST /products` recebe `name`, `category`, `unit` e `description` e retorna o produto com `productId`.
- Fornecedores: usar `GET /suppliers?ranked=true&limit=20&offset=0` e `search` opcional para obter a listagem paginada no servidor. A resposta é ranqueada e inclui os dados do fornecedor; o step deve aceitar essa ordenação. `GET /suppliers` sem `ranked=true` permanece uma coleção simples, sem envelope paginado.
- Criação: `POST /suppliers` recebe `name`, `cnpj`, `address` e `phone`; `POST /batches` recebe `productId`, `supplierId`, `quantity` e `producedAt`.
- Permissões da configuração atual da API: produto/fornecedor podem ser criados por `ADMIN` e `MANAGER`; lote, por `ADMIN` e `SUPPLIER`. O controle da interface precisa refletir cada endpoint, e não presumir que quem pode criar cadastros pode criar lote. Fluxo completo com criação dos três recursos é permitido somente a `ADMIN` hoje.

### Estrutura do modal

1. **Produto:** formulário de cadastro inline e campos do lote `producedAt`/`quantity`, seguidos da listagem selecionável com busca e paginação; usar paginação remota para produtos existentes.
2. **Fornecedor:** formulário inline de cadastro, listagem selecionável e busca; paginação remota com `ranked=true`, seguindo a ordenação por ranking da resposta.
3. **Revisão:** resumo editável dos dados escolhidos e confirmação de criação.

O modal segue os padrões existentes para acessibilidade, foco, teclado, backdrop, carregamento, validação, erros e layout responsivo. A rota/entrada de navegação da tela Produtos e o modal de criação de fornecedor na gestão de fornecedores foram removidos; os serviços e modelos continuam disponíveis para os lotes e outros fluxos.

Com a remoção da tela de Produtos, os seis assets exclusivos em `public/images/products/` foram removidos após confirmar que não havia outras referências no frontend.
