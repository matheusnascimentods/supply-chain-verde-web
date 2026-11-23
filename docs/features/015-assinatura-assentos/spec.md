# Especificação — Assinatura única e ativação de usuários

> Arquitetura em [`plan.md`](plan.md) e execução em [`tasks.md`](tasks.md). Contraparte na API: `supply-chain-verde-api/docs/features/016-assinatura-assentos/` (regras RN-xx citadas aqui são de lá). Substitui a escolha de plano da `009-empresas-planos`.

## 1. Problema

- O cadastro começa em `/planos`, com três cards (Basic 3, Pro 10, Pro Max 15) que só mudam o número de contas. A escolha vai na URL (`?plano=PRO`) e reaparece no cadastro e no perfil.
- Na tela de usuários não dá para desativar ninguém, nem filtrar por perfil ou por situação.
- O admin só descobre que a companhia está cheia ao tomar um 409.

## 2. Objetivo

- `/planos` vira `/assinatura`: uma página que explica a assinatura única, **até 10 usuários ativos**, e o modelo de assentos (desativar libera vaga, reativar ocupa), com CTA para o cadastro.
- O cadastro deixa de ter passo ou parâmetro de plano.
- A tela de usuários ganha, em cada linha, uma pílula Ativo/Inativo que desativa ou reativa com um clique, badges de filtro por perfil (múltipla escolha), filtro Todos/Ativos/Inativos e o contador de assentos.

## 3. Requisitos

| ID | Requisito |
|---|---|
| RF-01 | Rota `/assinatura` (pública, `guestGuard`), com título "Supply Chain Verde \| Assinatura". A rota `/planos` é renomeada e deixa de existir, sem redirect. |
| RF-02 | `/assinatura` não chama a API: o teto (10) e as features são texto fixo. Ela tem um CTA "Criar conta" → `/cadastro`. |
| RF-03 | `/cadastro` não lê `?plano`, não chama `GET /plans` e não envia `planCode`. O resumo mostra "Assinatura · até 10 usuários ativos". "Voltar" e "Trocar plano" levam a `/assinatura`, e "Trocar plano" sai. |
| RF-04 | A landing troca "Conhecer os planos" por "Conhecer a assinatura" → `/assinatura`. |
| RF-05 | O perfil do admin perde a seção "Plano". Os assentos aparecem só no contador da lista de usuários (RF-08), que lê `seatsUsed`/`maxUsers` de `GET /companies/me`. O `countCompanyUsers` sai. |
| RF-06 | A lista de usuários ganha a coluna **Situação**, com uma pílula Ativo (verde) ou Inativo (cinza). Para quem troca perfil (`canChangeRoles`), a pílula é um botão que desativa ou reativa (`PATCH /users/{id}/status`). Na própria linha e em usuário sem companhia (`PLATFORM_ADMIN`), ela é só leitura. |
| RF-07 | Em linha inativa, o menu de perfil fica desabilitado (RN-12 da API). |
| RF-08 | Contador "X de 10 assentos em uso" no topo da lista, só para o `admin` de companhia. Com o contador cheio, a pílula de um inativo e "+ Convidar usuário" ficam desabilitados, com `title` explicando o motivo. |
| RF-09 | Badges de perfil com múltipla escolha. As opções vêm de `ROLES_BY_COMPANY_TYPE` do usuário logado. Para o `platform_admin`, todos os perfis. Nenhum badge marcado significa todos. |
| RF-10 | Filtro de situação Todos / Ativos / Inativos, começando em Todos. |
| RF-11 | Mudar qualquer filtro volta para a página 1 e combina com a busca por email. |
| RF-12 | Erros 409/400/403 da ativação vão para o toast com a mensagem da API, como na troca de perfil. Depois de ativar ou desativar, a lista e o contador recarregam. |

## 4. Fora do escopo

- Modal de confirmação ao desativar. A ação se desfaz com um clique e segue o padrão da troca de perfil.
- Persistir os filtros na URL.
- Ação em lote (desativar vários).
- Cor de `platform_admin` no `role-badge`.

## 5. Critérios de aceite

- `/assinatura` mostra "até 10 usuários ativos" e leva ao cadastro sem query param. `/planos` não existe mais.
- O cadastro completo funciona sem `GET /plans` (Cypress `signup.cy.ts`).
- Um admin com 10/10 vê a pílula dos inativos e "Convidar" desabilitados. Ele desativa alguém, o contador vai a 9/10 e a reativação habilita.
- A pílula da própria linha do admin é só leitura.
- Marcar Gestor + Auditor e Inativos lista só os gestores e auditores inativos.
- `npm test` verde.
