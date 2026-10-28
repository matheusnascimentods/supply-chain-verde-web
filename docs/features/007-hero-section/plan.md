# Plano técnico — Hero section antes do login

> Requisitos em [`spec.md`](spec.md); passo a passo em [`tasks.md`](tasks.md).

## 1. Rotas

| Hoje | Depois |
|---|---|
| `{ path: '', pathMatch: 'full', redirectTo: 'login' }` | `{ path: '', pathMatch: 'full', canActivate: [guestGuard], loadChildren: () => import('./features/landing').then((m) => m.routes) }` |

- `guestGuard`: se `SessionService` tem sessão válida, devolve `createUrlTree(['/dashboard'])`; senão libera (RF-03). Ele mora em `core/auth/guards/index.guard.ts`, ao lado de `authGuard`.
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

## 3. Camadas visuais (efeito "texto atrás do objeto")

A imagem é gerada uma vez e depois dividida em duas, para o recorte encaixar pixel a pixel no fundo:

| z | Camada | Origem |
|---|---|---|
| 0 | `hero-bg` — céu + pilha de contêineres + contêiner içado | imagem gerada inteira |
| 1 | "VERDE" — `<span aria-hidden="true">`, `font-size: clamp(8rem, 28vw, 26rem)`, `font-weight: 900`, `letter-spacing: -0.04em`, branco, centralizado e cortado por `overflow: hidden` | CSS |
| 2 | `hero-subject` — **só** o contêiner içado, com cabo e gancho, em PNG/WebP com transparência, no mesmo tamanho e enquadramento do fundo | recorte da mesma imagem (ver [`image-prompt.md`](image-prompt.md) §4) |
| 3 | Nav, texto vertical, card de vidro | HTML |

As camadas 0 e 2 usam `position: absolute; inset: 0; object-fit: cover; object-position: <mesmo valor>`. Com o mesmo enquadramento, o recorte cai exatamente em cima do contêiner do fundo, e o "VERDE" fica entre os dois (RF-05).

## 4. Card de vidro

- `backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl`, mais um gradiente do verde (`#16a34a`, a cor da marca usada no login) para o grafite, no mesmo papel do laranja da referência.
- Título `h1` com `text-4xl sm:text-5xl font-semibold tracking-tight text-white`; subtítulo `text-white/85`.
- CTA: botão branco arredondado com "Entrar" + círculo verde com seta ↗, como na referência. É um `<a routerLink="/login">`, não um `<button>`.
- Contraste: o texto branco precisa de AA em qualquer trecho do céu. Por isso o card leva uma camada `bg-black/20` por baixo do gradiente; conferir com o DevTools.

## 5. Imagens e performance

| Arquivo | Tamanho | Formato |
|---|---|---|
| `public/landing/hero-bg-{1280,1920,2560}.avif` + `.webp` | 16:9 | sem transparência, ≤ 250 KB no 1920 |
| `public/landing/hero-subject-{1280,1920,2560}.webp` | 16:9, mesmo enquadramento | transparência (AVIF com alpha é opcional) |
| `public/landing/hero-bg-mobile.avif` | 9:16, recorte vertical do fundo | ≤ 120 KB |

- `NgOptimizedImage` com `priority` no fundo (é o elemento de LCP) e `ngSrcset`; o recorte não leva `priority`.
- Mobile: `<picture>` com `media="(max-width: 640px)"` troca o fundo. O recorte do contêiner continua com `object-position` ajustado, e, se não encaixar no 9:16, o mobile fica sem a camada 2 e o "VERDE" fica atrás de tudo.
- Animação: o contêiner entra com `translateY(-24px)` → `0` em 900 ms `ease-out`, dentro de `@media (prefers-reduced-motion: no-preference)`.

## 6. Testes

- Componente: renderiza o `h1`; o CTA aponta para `/login`; "VERDE" tem `aria-hidden`.
- `guestGuard`: sem sessão libera; com sessão redireciona para `/dashboard`.
- E2E: `/` → clicar em **Entrar** → `/login` → login → `/dashboard`.
- Manual: Lighthouse mobile com LCP ≤ 2,5 s e acessibilidade ≥ 95; conferir 375px, 768px, 1440px e 2560px.
