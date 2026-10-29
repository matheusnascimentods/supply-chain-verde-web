# Plano técnico — Hero section antes do login

> Requisitos em [`spec.md`](spec.md); passo a passo em [`tasks.md`](tasks.md).

## 1. Rotas

| Hoje | Depois |
|---|---|
| `{ path: '', pathMatch: 'full', redirectTo: 'login' }` | `{ path: '', pathMatch: 'full', canActivate: [guestGuard], loadChildren: () => import('./features/landing').then((m) => m.routes) }` |

- `guestGuard`: se `SessionService` tem sessão válida, devolve `createUrlTree(['/dashboard'])`; senão libera (RF-03). Ele mora em `core/auth/guards/index.guard.ts`, ao lado de `authGuard`.
- `SessionService.logout()` navega para `/` (a hero), não mais para `/login`. A sessão expirada (401 no interceptor) continua indo para `/login`.
- `app.ts`: `showFooter` passa a ser falso para `/` e `/login` (RF-07).
- `cypress/e2e/login.cy.ts`: o primeiro teste visita `/` e espera `/login`. Passa a visitar `/`, clicar em **Entrar** e então seguir o fluxo.

## 2. Feature `features/landing`

Só camada de apresentação: a página não tem estado, regra nem chamada à API, então não ganha `domain`/`application`/`infrastructure` vazios.

```
features/landing/
├── index.ts
├── index.routes.ts                  # title: 'Supply Chain Verde'
└── presentation/pages/landing/
    ├── index.component.ts|html|css
    └── index.component.spec.ts
```

## 3. Camadas visuais

Por enquanto, sem o efeito de profundidade: o "VERDE" fica por cima da imagem inteira (RF-05).

| z | Camada | Origem |
|---|---|---|
| 0 | `hero-bg` — céu + pilha de contêineres + contêiner içado | imagem gerada inteira |
| 1 | "VERDE" — `<span aria-hidden="true">`, `font-size: clamp(8rem, 28vw, 26rem)`, `font-weight: 900`, `letter-spacing: -0.04em`, branco, centralizado e cortado por `overflow: hidden` | CSS |
| 2 | Nav, texto vertical, card de vidro | HTML |

O fundo usa `position: absolute; inset: 0; object-fit: cover`.

**Depois:** para o "VERDE" passar atrás do contêiner, entra uma camada `hero-subject` entre o texto e o conteúdo: o recorte do contêiner, com transparência, na mesma tela e com o mesmo `object-position` do fundo (ver [`image-prompt.md`](image-prompt.md) §4).

## 4. Card de vidro

- `backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl`, mais um gradiente do verde (`#16a34a`, a cor da marca usada no login) para o grafite, no mesmo papel do laranja da referência.
- Título `h1` com `text-4xl sm:text-5xl font-semibold tracking-tight text-white`; subtítulo `text-white/85`.
- CTA: botão branco arredondado com "Entrar" + círculo verde com seta ↗, como na referência. É um `<a routerLink="/login">`, não um `<button>`.
- Contraste: o texto branco precisa de AA em qualquer trecho do céu. Por isso o card leva uma camada `bg-black/20` por baixo do gradiente; conferir com o DevTools.

## 5. Imagens e performance

| Arquivo | Tamanho | Formato |
|---|---|---|
| `public/landing/hero-bg.avif` | 1672×941 (16:9, resolução do gerador) | sem transparência, ≤ 250 KB |

- Um arquivo só, sem `srcset`: o mobile baixa o mesmo arquivo. Se o Lighthouse mobile reprovar o LCP, gerar 1280 e 2560 e passar a usar `ngSrcset`.
- `NgOptimizedImage` com `priority` no fundo (é o elemento de LCP).
- Mobile: a mesma imagem com `object-position` ajustado para manter o contêiner à vista.
- Animação: o "VERDE" entra com `translateY(-24px)` → `0` em 900 ms `ease-out`, dentro de `@media (prefers-reduced-motion: no-preference)`.

## 6. Testes

- Componente: renderiza o `h1`; o CTA aponta para `/login`; "VERDE" tem `aria-hidden`.
- `guestGuard`: sem sessão libera; com sessão redireciona para `/dashboard`.
- E2E: `/` → clicar em **Entrar** → `/login` → login → `/dashboard`.
- Manual: Lighthouse mobile com LCP ≤ 2,5 s e acessibilidade ≥ 95; conferir 375px, 768px, 1440px e 2560px.
