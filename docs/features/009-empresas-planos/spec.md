# Especificação — Planos, cadastro de empresas e visão por companhia

> Arquitetura em [`plan.md`](plan.md) e execução em [`tasks.md`](tasks.md). Contrato e regras da API: `supply-chain-verde-api/docs/features/010-empresas-planos/spec.md`.

## 1. Problema

- O CTA da landing só leva ao login. Não há como uma empresa conhecer os planos nem se cadastrar.
- Fornecedores são criados por admin ou gestor na tela de fornecedores. Com o cadastro self-service, esse caminho deixa de existir.
- O front conhece quatro perfis e não sabe a que empresa o usuário pertence.
- O lote é criado pelo fornecedor ou pelo admin, sem status e sem possibilidade de recusa.

## 2. Objetivo

- A landing leva para uma página pública de planos.
- Escolhido um plano, a empresa (varejista ou fornecedor) se cadastra com os dados dela e do primeiro admin, e já entra logada.
- Dentro do app, cada perfil vê só a própria companhia.
- O mercado pede lotes, e o fornecedor executa ou recusa.

## 3. Requisitos

### Planos e cadastro

| ID | Requisito |
|---|---|
| RF-01 | O CTA da hero section leva a `/planos`. |
| RF-02 | `/planos` é pública e tem um header com a marca e o botão **Entrar** (`/login`). Usuário logado é redirecionado ao dashboard, como já acontece na landing. |
| RF-03 | `/planos` mostra os planos de `GET /plans` lado a lado (Basic, Pro, Pro Max), com o limite de contas de cada um e o botão **Escolher**. Sem preço nesta versão. |
| RF-04 | **Escolher** leva a `/cadastro?plano=<code>`. Plano ausente ou inválido volta para `/planos`. |
| RF-05 | `/cadastro` tem três passos:<br>1. **Empresa:** tipo (Varejista / Fornecedor), razão social, CNPJ, email, telefone e endereço com busca de CEP.<br>2. **Administrador:** nome, email, senha e confirmação.<br>3. **Revisão:** plano, empresa e admin, com **Voltar** em cada passo. |
| RF-06 | Ao confirmar, chama `POST /companies`. No sucesso, salva a sessão como no login e vai para `/dashboard`. |
| RF-07 | CNPJ ou email já cadastrado (409) mostra a mensagem da API no passo correspondente, sem perder o que foi digitado. |

### Perfis e companhia

| ID | Requisito |
|---|---|
| RF-08 | Novo perfil `platform_admin` ("Admin da plataforma"). |
| RF-08a | O menu depende do tipo de companhia e do perfil:<br>- **Varejista:** admin vê Fornecedores, Lotes, Usuários e Auditoria; gestor vê Fornecedores, Lotes e Usuários; auditor vê Auditoria, Fornecedores, Lotes e Usuários.<br>- **Fornecedor:** admin vê Lotes, Produtos, Certificações, Usuários e Auditoria; fornecedor vê Lotes, Produtos, Certificações e Usuários.<br>- **`platform_admin`:** vê Fornecedores, Lotes, Usuários e Auditoria.<br>As rotas fora do menu de cada um são bloqueadas por guard. |
| RF-08b | Dashboard: para o fornecedor, o card "Fornecedores" vira "Lotes pendentes", com link para `/batches?status=PENDING`. Para o varejista, o card conta só os fornecedores com quem ele já trabalhou. |
| RF-09 | O menu do usuário mostra o nome da companhia; o `platform_admin` vê "Plataforma". |
| RF-10 | "Meu perfil": todo usuário edita o próprio acesso (`PATCH /users/me`, como hoje). O `admin` também edita os dados e o endereço da companhia (`PATCH /companies/me`), e vê o plano ativo e o uso de contas (ex.: "2 de 3 contas"), só para leitura. |
| RF-11 | Usuários:<br>- Todos os perfis com companhia veem a lista da própria companhia, só para leitura. **+ Adicionar usuário** e o menu de troca de perfil aparecem só para `admin` e `platform_admin`.<br>- A coluna "Fornecedor" sai. O `platform_admin` vê a coluna "Empresa".<br>- O `admin` cria usuários só com os perfis do tipo da companhia (varejista: admin, gestor, auditor; fornecedor: admin, fornecedor).<br>- O seletor de fornecedor sai do modal.<br>- O erro de limite do plano ou de último admin (409) aparece como toast com a mensagem da API. |
| RF-12 | Fornecedores: saem o botão **+ Novo fornecedor** e o modal de criar e editar. O nome do fornecedor deixa de abrir edição. Ranking, certificações e relatórios continuam. |
| RF-12a | A tela mostra o catálogo de todos os fornecedores. Ao lado da busca entra o filtro **Só com quem já trabalhei** (`workedWith=true`). A tela lembra a última escolha de cada usuário. |
| RF-12b | Fornecedor que você já contratou recebe o selo "Já trabalhou". O botão de relatórios aparece só nesses fornecedores. |
| RF-12c | Companhias fornecedoras não acessam a tela: ela some do menu, e a rota tem guard. |

### Lotes e produtos

| ID | Requisito |
|---|---|
| RF-13 | Criar lote passa a ser ação de `admin` e `manager` de varejista. Passos do modal:<br>1. **Produto:** categoria e unidade.<br>2. **Fornecedor:** recomendação global, como hoje.<br>3. **Produto do fornecedor:** os produtos dele naquela categoria e unidade.<br>4. **Revisão:** com a quantidade.<br>Saem a criação inline de produto e de fornecedor e o campo de data de produção. |
| RF-14 | O lote mostra o status (Pendente, Em andamento, Recusado) no card e no detalhe. A lista ganha um filtro por status. Lote recusado mostra o motivo. |
| RF-15 | Para o fornecedor, um lote pendente tem **Recusar**, que abre um modal com o motivo obrigatório. A primeira etapa disponível para ele é **Produção**. O varejista não registra etapa em lote pendente. |
| RF-16 | Nova tela **Produtos** (`/products`), só para fornecedor (`admin` e `supplier` de companhia fornecedora): lista e cadastra os próprios produtos. |
| RF-17 | Nova tela **Certificações** (`/certifications`), só para companhia fornecedora: lista, cadastra e muda o status das próprias certificações. No varejista, o auditor continua consultando as certificações pelo modal da tela de Fornecedores, só para leitura. |

### Não funcionais

| ID | Requisito |
|---|---|
| RNF-01 | As respostas novas da API (`/plans`, `/companies`, `/companies/me`, campos novos de lote e de sessão) são validadas com Zod, como o resto. |
| RNF-02 | O cadastro é acessível: cada passo tem título, os erros ficam ligados ao campo, e o foco vai para o título do passo ao avançar. |
| RNF-03 | A página de planos e o cadastro funcionam a partir de 360 px de largura. |

## 4. Fora de escopo

- Pagamento, preço e troca de plano.
- Confirmação de email e recuperação de senha.
- Tela de gestão do catálogo de planos ou de companhias para o `platform_admin`.
- Editar fornecedor pelo varejista.
