# Especificação funcional — Supply Chain Verde Web

> Estado funcional implementado, consolidado a partir das telas, rotas, `docs/tasks.md` e do histórico de commits. Contratos detalhados pertencem à API `supply-chain-verde-api`.

## 1. Objetivo

Oferecer uma interface para acompanhar a jornada de lotes e as informações de sustentabilidade da cadeia. Consumidores consultam dados públicos; usuários internos trabalham com dados e ações limitados pelo perfil autenticado.

## 2. Perfis

| Perfil | Capacidades na interface |
|---|---|
| Público | Consultar rastreabilidade e pegada de carbono por lote, sem autenticação |
| `admin` | Gerenciar usuários, fornecedores, produtos, lotes, etapas e auditoria |
| `manager` | Gerenciar fornecedores e produtos, consultar ranking/relatórios e operar lotes/etapas conforme a API |
| `auditor` | Consultar auditoria, ranking, certificações, relatórios e lotes; validar certificações conforme a API |
| `supplier` | Consultar/editar o perfil próprio, gerenciar certificações próprias e operar seus lotes/etapas permitidos |

A API é a autoridade final de autorização e escopo dos dados. A navegação e os guards também ocultam ou protegem áreas por perfil.

## 3. Funcionalidades entregues

### 3.1 Acesso e dashboard

- Login por email e senha usando `POST /auth/login`; mensagens de falha não distinguem email de senha.
- JWT e papel do usuário mantidos em `sessionStorage`; respostas `401`/`403` encerram a sessão conforme o interceptor.
- Dashboard autenticada com indicadores, lotes recentes, tabela e gráficos limitados aos dados fornecidos pela API. Distribuições por etapa representam a amostra recente, não totais globais.

### 3.2 Consulta pública

Em `/rastreio/:batchId`, sem login, exibe produto, fornecedor, etapas em linha do tempo, dados de transporte e pegada de carbono. Falhas de consulta são apresentadas de forma amigável.

### 3.3 Gestão operacional

- **Fornecedores:** listagem com busca e paginação, cards dos três primeiros do ranking, edição e acesso contextual a certificações e relatórios. O cadastro pode ser iniciado no fluxo de criação de lote, conforme a Task 28; a edição permanece contextual à gestão de fornecedores.
- **Certificações:** consulta no modal do fornecedor; criação e atualização de status aparecem de acordo com perfil e resposta da API. Não há tela dedicada de certificações.
- **Produtos:** a Task 28 planeja retirar a tela dedicada e concentrar escolha/cadastro de produto no primeiro passo do modal de criação de lote. A listagem global segue disponível via API, mas deixa de ser uma tela de navegação.
- **Lotes:** cards paginados com etapa atual e timeline completa, transporte e emissões. A criação está planejada para um modal multi-step com produto, fornecedor e revisão; inclusão de etapa permanece em modal. Transporte é condicional ao tipo/fluxo da etapa e o cálculo de emissão segue as ações disponíveis para o perfil.
- **Relatórios:** geração por período e consulta paginada no modal do fornecedor. A contagem exibida na listagem vem do resumo de fornecedores; a coleção é carregada sob demanda. Não há página dedicada nem detalhe individual.
- **Usuários:** listagem paginada, busca por email, criação em modal e alteração de papel para administradores.
- **Auditoria:** consulta somente leitura com período, operação e email opcionais, paginação e exportação CSV. A tabela e o CSV apresentam resumo legível dos snapshots disponibilizados pela API; o frontend não cria eventos nem envia a identidade do ator.

### 3.4 Navegação e apresentação

As telas autenticadas compartilham navegação superior e footer. O footer aparece nas telas autenticadas e públicas, exceto no login. A interface é responsiva.

## 4. Mapa de rotas

| Rota | Acesso | Conteúdo |
|---|---|---|
| `/login` | Público | Autenticação |
| `/rastreio/:batchId` | Público | Rastreabilidade e pegada de carbono |
| `/dashboard` | Autenticado | Indicadores e atividade recente |
| `/suppliers` | Perfis conforme autorização | Fornecedores, ranking, certificações e relatórios contextuais |
| `/suppliers/me` | `supplier` | Perfil do fornecedor autenticado |
| `/products` | Perfis conforme autorização | Catálogo atual; remoção planejada na Task 28, com seleção/cadastro no fluxo de lote |
| `/batches` | Autenticado; ações condicionadas | Lotes e fluxo de etapas |
| `/batches/:batchId/stages` | `admin`, `manager`, `supplier` | Etapas do lote |
| `/users` | `admin` | Gestão de usuários |
| `/audit-log` | `admin`, `auditor` | Consulta de auditoria |

O ranking está integrado a `/suppliers`; certificações e relatórios são modais contextuais. Não existem rotas dedicadas para esses recursos.

## 5. Integrações principais

O frontend consome autenticação, dashboard, fornecedores/ranking, produtos, certificações, lotes, etapas/transporte/emissões, relatórios, usuários, auditoria e rastreabilidade pública da API REST. A base de desenvolvimento é configurada em `src/environments/environment.ts`; os schemas Zod das features validam as respostas usadas pela aplicação.

## 6. Task 28 — Fluxo multi-step de criação de lote (planejado)

O modal de lote terá três passos: **Produto**, **Fornecedor** e **Revisão**. Os dois primeiros combinam formulário de cadastro inline, busca e seleção de itens existentes; a seleção fica em memória até a confirmação. O formulário do produto inclui os dados cadastrais definidos pela API e, no contexto do lote, data de produção e quantidade. O passo de fornecedor reutiliza os campos cadastrais e de endereço do formulário atual. A revisão apresenta produto, fornecedor, data e quantidade antes do envio.

Na confirmação, criar primeiro o produto se for novo, depois o fornecedor se for novo e, com os IDs retornados, enviar `POST /api/v1/batches` com `productId`, `supplierId`, `quantity` e `producedAt`. Cada criação é uma request independente: a API não oferece transação que englobe produto, fornecedor e lote. Se uma etapa posterior falhar, manter os IDs e seleções já confirmados no estado do wizard, indicar o recurso persistido e permitir retomar sem duplicar cadastros. O lote só é considerado criado quando a resposta de criação do lote for bem-sucedida.

**Limites do contrato e permissões atuais:** `GET /api/v1/products` aceita `limit`, `offset` e `search`, oferecendo busca e paginação no servidor. Para fornecedores, usar `GET /api/v1/suppliers?ranked=true&limit=20&offset=0` (com `search` opcional): esse modo retorna itens paginados e ranqueados, incluindo os dados de fornecedor necessários à seleção. O endpoint padrão `GET /api/v1/suppliers` sem `ranked=true` continua retornando a coleção sem envelope paginado. A lista do wizard seguirá a ordenação de ranking nesse modo. `POST /api/v1/products` e `POST /api/v1/suppliers` aceitam os respectivos DTOs atuais; `POST /api/v1/batches` recebe os quatro campos acima. As permissões atuais permitem cadastrar produto/fornecedor a `ADMIN` e `MANAGER`, mas criar lote a `ADMIN` e `SUPPLIER`; portanto, somente `ADMIN` consegue executar as três criações em sequência. O fluxo deve respeitar os perfis e expor apenas ações autorizadas, sem presumir compatibilidade de permissões entre endpoints.

O padrão visual deve seguir os modais já existentes: overlay, cabeçalho, cartões/bordas discretas, estados de carregamento/erro, foco contido, fechamento por teclado/backdrop, responsividade e indicadores claros dos passos. A retirada da tela Produtos também remove sua entrada de navegação e rota dedicada; manter os serviços e contratos de produto necessários ao wizard. A criação de fornecedor deve sair do modal da tela de fornecedores quando o wizard passar a ser o ponto de criação previsto.

Para detalhes atualizados de payloads, permissões e paginação, consulte a documentação da API. O checklist e a evolução das telas estão em [`tasks.md`](tasks.md).
