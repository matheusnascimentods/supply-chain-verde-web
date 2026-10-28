# Plano técnico — Meu perfil para todos os perfis

> Requisitos em [`spec.md`](spec.md); passo a passo em [`tasks.md`](tasks.md).

## 1. Navegação (`core/layout`)

| Arquivo | Mudança |
|---|---|
| `navigation/index.constants.ts` | Remover `{ label: 'Meu perfil', path: '/suppliers/me' }` de `supplier` (RF-02). |
| `top-nav/index.component.html` | O link do dropdown perde o `@if (isSupplier())` e aponta para `/profile` (RF-01). |
| `top-nav/index.component.ts` | Remover `isSupplier`, que fica sem uso. |
| `top-nav/index.component.spec.ts` | Rota de teste `suppliers/me` → `profile`; novos casos da §5. |

Nenhuma mudança em `isLinkActive`/`isDashboardActive`: como `/profile` não está em `NAV_LINKS` e não é `/dashboard`, nenhum link fica ativo (RF-03).

## 2. Rotas

```ts
// app.routes.ts, dentro dos children do AppShellComponent
{
  path: 'profile',
  title: 'Supply Chain | Meu perfil',
  loadChildren: () => import('./features/profile').then((module) => module.routes),
},
```

Em `features/suppliers/index.routes.ts`, a rota `me` vira `{ path: 'me', pathMatch: 'full', redirectTo: '/profile' }` (RF-04) e o `roleGuard` sai dela.

## 3. Feature `features/profile`

A página sai de `features/suppliers/presentation/pages/form` e vai para uma feature própria. Ela deixa de ser uma tela de fornecedor e passa a ser a tela do usuário logado:

```
features/profile/
├── index.ts | index.routes.ts
├── domain/index.model.ts            # AccountPatch { name?, currentPassword?, newPassword? }
├── infrastructure/index.repository.ts  # updateMe(patch) → PATCH /users/me
└── presentation/pages/profile/      # o componente atual, movido e generalizado
```

| Ponto | Como fica |
|---|---|
| Dados iniciais | `CurrentUserService.load()` (`GET /users/me`, já existe) para nome, email e perfil. Se for `supplier`, o carregamento atual do fornecedor continua. |
| Seções | "Meu acesso" sempre; "Dados do fornecedor" e "Endereço" dentro de `@if (isSupplier())` (RF-05, RF-06). Fora do fornecedor, esses controles não entram no `FormGroup`, para não bloquear o `invalid()`. |
| Salvar | Fornecedor: `UpdateOwnSupplierUseCase` de `features/suppliers`, sem mudança. Esse use case passa a ser exportado em `features/suppliers/index.ts`. Demais perfis: `profileRepository.updateMe` com só os campos alterados, na mesma regra de diff do fornecedor (RF-07). |
| Validação de senha | `passwordMismatch` e `currentPasswordRequired` saem do componente para `profile/domain/index.rules.ts`, sem mudar a lógica. |
| Nome no topo | Hoje a navbar mostra email e perfil, não o nome, então RF-08 não exige nada na navbar. Se algum lugar passar a mostrar o nome, atualizar o `SessionService` depois do save. |
| Links | "← Voltar" e **Cancelar** → `/dashboard` (RF-09). |

O que sobra em `features/suppliers`: `OwnSupplierProfile`, `OwnSupplierPatch` e `UpdateOwnSupplierUseCase` continuam lá, porque são do domínio do fornecedor. A pasta `presentation/pages/form` é apagada.

## 4. Contrato novo

`PATCH /users/me`, qualquer perfil autenticado:

```json
{ "userName": "Novo nome", "currentPassword": "atual", "newPassword": "nova" }
```

- Todos os campos são opcionais, e `newPassword` exige `currentPassword`.
- Senha atual errada ou ausente devolve 400 sem alterar nada.
- A resposta tem o mesmo formato de `GET /users/me`. O schema Zod `currentUserResponseSchema` é reaproveitado.

Detalhes no repositório da API: `docs/features/009-meu-perfil`.

## 5. Testes

- Top-nav: o dropdown tem **Meu perfil** antes de **Sair** para os 4 perfis; a navbar do fornecedor não tem mais a aba; em `/profile`, nenhum link tem `aria-current`.
- Página: admin vê só "Meu acesso"; fornecedor vê as três seções; admin salvando chama `PATCH /users/me` só com os campos alterados; fornecedor continua chamando `PATCH /suppliers/me`.
- Rota: `/suppliers/me` redireciona para `/profile`.
- Os specs atuais do form de fornecedor migram junto com o componente.
