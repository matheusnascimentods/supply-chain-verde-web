# spec.md — Supply Chain Verde (Frontend)

> Especificação funcional: o quê e por quê, sem detalhe de implementação técnica (isso fica no `plan.md`). Base para as telas do projeto A3 (UC: Banco de Dados, Anhembi Morumbi).

---

## 1. Contexto

O backend (`supply-chain-verde-api`) já expõe a API completa de rastreabilidade de cadeias de suprimento sustentáveis. Este documento define a camada de apresentação: quais telas existem, quem as acessa, e o que cada uma precisa fazer — atendendo ao entregável "Proposta de Arquitetura de Dados" (frontend) do edital, e servindo de roteiro pra demonstração na apresentação oral.

---

## 2. Perfis de Usuário

| Perfil | Quem é | Acesso |
|---|---|---|
| **Público** | Qualquer pessoa (consumidor escaneando QR Code) | Sem login |
| **admin** | Administrador do sistema | Total |
| **manager** | Gestor — cadastra fornecedores/produtos, gera relatórios | Amplo, sem gestão de usuários |
| **auditor** | Valida certificações, consulta relatórios e auditoria | Leitura + validação |
| **supplier** | Fornecedor — gerencia seus próprios lotes e certificações | Restrito aos próprios dados |

---

## 3. Telas e User Stories

### 3.1 Pública (sem login)

#### Rastreabilidade do Lote
> Como consumidor, quero escanear o QR Code de um produto para ver sua jornada completa, para confiar na origem sustentável do que estou comprando.

**Critérios de aceitação:**
- Acessível via `batchId` na URL, sem autenticação.
- Mostra: produto, fornecedor, linha do tempo das etapas (`Chain`), endereços de origem/destino por etapa, meio de transporte usado, e pegada de carbono total + por etapa.
- Se o `batchId` não existir, mostra mensagem de erro amigável (não expõe detalhe técnico).

---

### 3.2 Autenticação (todos os perfis)

#### Login
> Como usuário do sistema, quero entrar com email e senha, para acessar as funcionalidades do meu perfil.

**Critérios de aceitação:**
- Formulário com email/senha, chama `POST /auth/login`.
- Erro de credencial inválida exibido de forma clara, sem detalhar se foi o email ou a senha (segurança).
- Login bem-sucedido redireciona para o Dashboard.
- Sessão expira quando o JWT expira; usuário é redirecionado ao Login (sem refresh token, conforme decisão registrada no backend).

#### Dashboard
> Como usuário autenticado, quero ver um resumo relevante ao meu perfil assim que entro, para saber rapidamente o que fazer em seguida.

**Critérios de aceitação:**
- Conteúdo varia por `role` (ex: supplier vê seus lotes recentes; auditor vê certificações expirando; manager vê ranking de fornecedores).

---

### 3.3 Admin

#### Gestão de Usuários
> Como admin, quero cadastrar usuários e definir seu perfil de acesso, para controlar quem usa o sistema e com que permissão.

**Critérios de aceitação:**
- Lista de usuários com `role` visível.
- Formulário de criação (`POST /users`).
- Ação de alterar `role` de um usuário existente (`PATCH /users/{id}/role`).

#### Auditoria do Sistema
> Como admin, quero consultar o histórico de ações realizadas no sistema, para investigar qualquer inconsistência.

**Critérios de aceitação:**
- Lista somente leitura dos eventos retornados por `GET /audit-logs`, filtrável por intervalo inclusivo, operação e fragmento de email do ator.
- Cada evento mostra ator, ação, data/hora, tabela e detalhes; quando disponíveis, os detalhes apresentam `affectedEntityId` e os deltas de `beforeData`/`afterData` em linguagem legível, sem exibir JSON bruto.
- Eventos são produzidos por triggers PostgreSQL e não pelo frontend. A UI não envia nem escolhe o `userId` que identifica o ator; apenas apresenta `userId` e `userEmail` da resposta da API.
- Registros anteriores sem snapshots ou ID da entidade mostram `Detalhes indisponíveis`, sem inferir valores. O mesmo resumo é usado na exportação CSV.

Resposta esperada por item (além do envelope paginado `items`, `limit`, `offset`, `hasNext`, `totalPages`):

```json
{
  "logId": 981,
  "userId": 7,
  "userEmail": "ana.souza@empresa.com",
  "action": "UPDATE",
  "affectedTable": "supplier",
  "affectedEntityId": 42,
  "beforeData": { "name": "Fazenda Verde" },
  "afterData": { "name": "Fazenda Verde Ltda" },
  "performedAt": "2026-09-30T14:32:10"
}
```

O resumo exibido pode ser `Fornecedor #42 — Nome: Fazenda Verde → Fazenda Verde Ltda`. Para eventos antigos sem snapshots, a interface mostra que os detalhes não estão disponíveis.

---

### 3.4 Manager

#### Fornecedores
> Como manager, quero cadastrar e editar fornecedores, para manter a base de parceiros da cadeia atualizada.

**Critérios de aceitação:**
- Lista de fornecedores com busca.
- Formulário de cadastro/edição, incluindo endereço.

#### Ranking de Fornecedores
> Como manager, quero ver os fornecedores ranqueados por desempenho ambiental, para decidir com quem priorizar parceria.

**Critérios de aceitação:**
- Lista ordenável por score de sustentabilidade, nº de certificações ativas, e CO₂ total (`GET /suppliers?ranked=true`).

#### Produtos
> Como manager, quero cadastrar os produtos que a cadeia rastreia, para que cada lote possa ser vinculado a um produto conhecido.

**Critérios de aceitação:**
- Lista + formulário de cadastro/edição, com `category` e `unit` como `<select>` (refletindo os ENUMs do backend).

#### Relatórios
> Como manager, quero gerar e consultar relatórios de sustentabilidade no contexto do fornecedor, para acompanhar a evolução ambiental da cadeia.

**Critérios de aceitação:**
- Na lista de fornecedores, a coluna Relatórios mostra a quantidade e abre um modal contextual.
- O modal oferece geração por período (`POST /suppliers/{id}/reports`) e lista paginada do fornecedor (`GET /reports?supplierId={id}`), com CO₂ total, quantidade de lotes e data de geração. Não há tela individual de detalhe nesta versão.

---

### 3.5 Auditor

#### Certificações (modal de fornecedores)
> Como auditor, quero consultar as certificações de um fornecedor e validar seus status no contexto do fornecedor.

**Critérios de aceitação:**
- O badge de certificações na lista de fornecedores abre um modal com as certificações retornadas no ranking.
- Admin e auditor podem alterar status via `PATCH /certifications/{id}/status`.
- Admin pode cadastrar para qualquer fornecedor e fornecedor pode cadastrar para si via `POST /suppliers/{id}/certifications`; o status é definido pela API.

#### Relatórios (consulta)
> Como auditor, quero consultar os relatórios de sustentabilidade no contexto de cada fornecedor, para validar se os dados sustentam uma certificação externa.

**Critérios de aceitação:**
- Acessar os relatórios pelo badge de cada fornecedor; a geração respeita as permissões da API.

#### Auditoria do Sistema
- Mesma tela do admin (seção 3.3) — auditor também tem acesso, conforme a tabela de rotas.

---

### 3.6 Supplier

#### Meu Perfil
> Como fornecedor, quero ver e atualizar meus dados cadastrais, para manter minhas informações corretas.

**Critérios de aceitação:**
- Exibe dados do próprio `Supplier`; edição via `PUT /suppliers/{id}` (o próprio, não qualquer um).

#### Certificações
> Como fornecedor, quero consultar e cadastrar minhas certificações ambientais junto aos dados do meu fornecedor.

**Critérios de aceitação:**
- O badge na lista de fornecedores abre a lista de certificações com status visível.
- O formulário cadastra a certificação pela API sem campo de status.

#### Meus Lotes
> Como fornecedor, quero registrar um novo lote de produto, para iniciar o rastreamento da cadeia.

**Critérios de aceitação:**
- Lista dos próprios lotes.
- Formulário de cadastro (`POST /batches`), vinculando a um `Product` existente.

#### Etapas da Cadeia
> Como fornecedor, quero registrar as etapas pelas quais um lote passa (produção, armazenagem, transporte, distribuição, varejo), para que a rastreabilidade e a pegada de carbono sejam calculadas.

**Critérios de aceitação:**
- Lista de etapas de um lote específico, em ordem cronológica.
- Formulário de nova etapa: tipo, endereço de origem/destino (opcionais), datas de início/fim.
- Se o tipo de etapa envolver transporte, formulário adicional de transporte (modal, distância, combustível) na mesma tela/fluxo.
- Após registrar a etapa (e transporte, se houver), oferece ação explícita para calcular a emissão de carbono daquela etapa (`POST /stages/{id}/emission`) — usuário escolhe a metodologia (`calculationMethod`).

#### Meus Relatórios
> Como fornecedor, quero consultar os relatórios de sustentabilidade gerados sobre minha operação, para acompanhar meu próprio desempenho.

**Critérios de aceitação:**
- Consultar somente os próprios relatórios no modal contextual da gestão de fornecedores; a API limita os resultados ao fornecedor autenticado.

---

## 4. Sitemap (Tabela-Resumo)

| Tela | Perfis | Endpoint(s) principal(is) |
|---|---|---|
| Rastreabilidade do Lote | Público | `GET /batches/{id}/traceability`, `GET /batches/{id}/carbon-footprint` |
| Login | Todos | `POST /auth/login` |
| Dashboard | Todos autenticados | varia por perfil |
| Usuários | admin | `POST /users`, `GET /users/me`, `PATCH /users/{id}/role` |
| Auditoria do Sistema | admin, auditor | `GET /audit-logs` |
| Fornecedores | admin, manager | `POST/PUT/GET /suppliers` |
| Ranking de Fornecedores | admin, manager, auditor, supplier | `GET /suppliers?ranked=true&limit=20&offset=0` |
| Produtos | admin, manager | `POST/PUT/GET /products` |
| Relatórios (modal em Fornecedores) | admin, manager, auditor; supplier (próprios) | `GET /reports?supplierId={id}`, `POST /suppliers/{id}/reports` |
| Certificações (modal de fornecedores) | admin (cadastrar/validar), manager (consultar), auditor (validar), supplier (próprias) | ranking inclui certificações; `POST /suppliers/{id}/certifications`, `PATCH /certifications/{id}/status` |
| Meu Perfil (Fornecedor) | supplier | `GET /suppliers?supplierId={id}`, `PUT /suppliers/{id}` |
| Meus Lotes | supplier, admin, manager, auditor (consulta) | `POST /batches`, `GET /suppliers/{id}/batches` |
| Etapas da Cadeia | supplier, manager, admin | `POST/GET /batches/{id}/stages`, `POST /stages/{id}/transport`, `POST /stages/{id}/emission` |

---

## 5. Fluxos Principais

### 5.1 Login → Dashboard

```mermaid
flowchart TD
    A[Tela de Login] -->|credenciais válidas| B[JWT armazenado + role decodificada]
    B --> C[Dashboard role-aware]
    A -->|credenciais inválidas| A
    C -->|token expira| A
```

### 5.2 Rastreabilidade Pública (QR Code)

```mermaid
flowchart TD
    A[Consumidor escaneia QR Code] --> B[Abre URL pública com batchId]
    B --> C{batchId existe?}
    C -->|sim| D[Exibe jornada do lote + pegada de carbono]
    C -->|não| E[Mensagem de erro amigável]
```

### 5.3 Registro de Lote → Etapa → Emissão (fluxo do Supplier)

```mermaid
flowchart TD
    A[Supplier: Meus Lotes] --> B[Novo Lote]
    B --> C[Lote criado]
    C --> D[Etapas da Cadeia deste lote]
    D --> E[Nova Etapa: tipo + origem/destino + datas]
    E --> F{Etapa envolve transporte?}
    F -->|sim| G[Formulário de Transporte]
    F -->|não| H[Escolher metodologia de cálculo]
    G --> H
    H --> I[Emissão de CO2 calculada e registrada]
    I --> D
```

---

## 6. Fora de Escopo (MVP)

- Exportação de relatório em PDF/CSV
- Dashboards com múltiplos gráficos elaborados (um gráfico simples de CO₂ por período é suficiente)
- Autocadastro público de fornecedor (cadastro é feito por `admin`/`manager`, não self-service)
- Refresh token / renovação automática de sessão (pendência já registrada no backend)

---

*Próximo documento: `plan.md`, traduzindo esta especificação em arquitetura técnica Angular (módulos, roteamento, estado, e o `CLAUDE.md` do repositório frontend).*
