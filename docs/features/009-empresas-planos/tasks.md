# Tarefas — Planos, cadastro de empresas e visão por companhia

> Requisitos em [`spec.md`](spec.md); arquitetura em [`plan.md`](plan.md).

**Status:** não iniciada.

As dependências apontam para `supply-chain-verde-api/docs/features/010-empresas-planos/tasks.md`.

---

## Task 1 — `feat/plans-signup`

Depende da Task 2 da API.

- [ ] Feature `signup`: página de planos, `public-header` e wizard de cadastro (plan §2)
- [ ] CTA da landing → `/planos`
- [ ] Campos de empresa movidos para `shared/forms/company-fields`
- [ ] Testes unitários de planos e cadastro; `login.cy.ts` e o novo `signup.cy.ts`

**Pronto:** da landing até o dashboard logado, sem passar pelo login.

## Task 2 — `feat/company-session`

Depende da Task 3 da API.

- [ ] `platform_admin` e `companyId`/`companyType` na sessão (plan §1)
- [ ] Menu por tipo de companhia e perfil, e guard com `companyTypes` (RF-08a)
- [ ] Usuários: lista para todos, criação e troca de perfil só para o admin, perfis por tipo, sem seletor de fornecedor (plan §4)
- [ ] Card "Lotes pendentes" no dashboard do fornecedor (RF-08b)
- [ ] Rotas `users` e `audit-log` com `platform_admin`; labels de auditoria
- [ ] Testes de regras e do modal de usuário

**Pronto:** o admin de um fornecedor cria um usuário `supplier` e recebe o erro de limite no plano Basic.

## Task 3 — `refactor/remove-supplier-crud`

Depende da Task 3 da API.

- [ ] Remover o botão, o modal e os use cases de criar e editar fornecedor (plan §3)
- [ ] Catálogo com o filtro "Só com quem já trabalhei" (lembrado no `localStorage`) e o selo "Já trabalhou" (RF-12a, RF-12b)
- [ ] Perfil com seção da companhia para admin, plano e uso de contas
- [ ] Testes da lista de fornecedores e do perfil

**Pronto:** a tela de fornecedores é só ranking, e o admin edita a própria companhia em `/profile`.

## Task 4 — `feat/batch-request`

Depende da Task 4 da API.

- [ ] Status no DTO, no card e no filtro; modal de recusa (plan §5)
- [ ] Modal de criação com 4 passos, sem criação inline
- [ ] Feature `products` para o fornecedor
- [ ] Página `/certifications` do fornecedor e o modal do varejista só para leitura (plan §6)
- [ ] Testes de regras e do modal; `register-batch-flow.cy.ts`

**Pronto:** o mercado pede o lote, o fornecedor vê o lote pendente e consegue registrar a produção ou recusar, e o mercado vê a recusa com o motivo.
