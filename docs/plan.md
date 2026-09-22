# plan.md — Supply Chain Verde (Frontend)

> Tradução técnica do `spec.md`: como construir, não o quê construir. O conteúdo final vai para `.github/copilot-instructions.md`, o arquivo de instruções lido pelo GitHub Copilot neste repositório.

---

## 1. Visão Geral

SPA em Angular que consome a API REST do `supply-chain-verde-api` (contratos completos no `CLAUDE.md` do backend, seções 9-10). Organização **por feature**, não por camada — ver justificativa completa na decisão registrada anteriormente: o frontend não tem regra de negócio complexa o suficiente para justificar a cerimônia de Clean Architecture; a lógica de negócio pesada já mora no backend.

---

## 2. Stack Tecnológico

| Item | Escolha |
|---|---|
| Framework | Angular (standalone components, sem `NgModule`) |
| Estilo | Tailwind CSS |
| Renderização | CSR puro — sem SSR/SSG (decisão já registrada: app majoritariamente autenticado, sem ganho real de SEO) |
| Formulários | Reactive Forms |
| Validação/Schemas | Zod — valida respostas da API em runtime, fonte única de tipos + `ENUM`s (ver seção 8) |
| HTTP | `HttpClient` + interceptor funcional (`HttpInterceptorFn`) |
| Guards de rota | Funcionais (`CanActivateFn`), não baseados em classe |
| Estado | Signals + services por feature — sem NgRx (ver seção 7) |
| Testes unitários | `*.spec.ts` (test runner padrão gerado pelo `ng new`) |
| Testes E2E | Cypress |
| Ferramenta de IA | GitHub Copilot → `.github/copilot-instructions.md` |

---

## 3. Arquitetura: Organização por Feature

```
core/       ← singletons carregados uma vez: guards, interceptors, sessão
shared/     ← componentes reutilizáveis entre features
features/   ← um diretório por domínio, praticamente autocontido
```

Cada feature agrupa tudo que só ela usa (`index.service.ts`, `index.schema.ts`, subpastas `list/`, `form/`). Isso favorece lazy loading nativo por rota e reduz acoplamento sem precisar de camadas abstratas.

---

## 4. Estrutura de Pastas

```
web/src/app/
├── app.routes.ts
├── app.config.ts
│
├── core/
│   ├── interceptors/
│   │   ├── index.interceptor.ts        ← anexa JWT em toda chamada, trata 401 global
│   │   └── index.interceptor.spec.ts
│   ├── guards/
│   │   ├── index.guard.ts              ← bloqueia rota por role
│   │   └── index.guard.spec.ts
│   └── session/
│       ├── index.service.ts            ← token/role decodificados (signal)
│       └── index.service.spec.ts
│
├── shared/
│   └── components/                     ← spinner, dialog de confirmação, enum-select, toast de erro
│
├── features/
│   ├── auth/
│   │   ├── index.service.ts
│   │   ├── index.schema.ts             ← espelha LoginRequestDTO/LoginResponseDTO
│   │   └── login/index.component.{ts,html,spec.ts}
│   │
│   ├── traceability/                   ← PÚBLICA
│   │   ├── index.service.ts
│   │   ├── index.schema.ts             ← espelha BatchTraceabilityResponseDTO, CarbonFootprintResponseDTO
│   │   ├── index.component.{ts,html,spec.ts}
│   │   └── carbon-chart/index.component.{ts,html,spec.ts}
│   │
│   ├── suppliers/
│   │   ├── index.service.ts
│   │   ├── index.schema.ts
│   │   ├── list/index.component.{ts,html,spec.ts}
│   │   ├── form/index.component.{ts,html,spec.ts}
│   │   └── ranking/index.component.{ts,html,spec.ts}
│   │
│   ├── products/       (index.service.ts, index.schema.ts, list/, form/)
│   ├── certifications/ (index.service.ts, index.schema.ts, list/, form/)
│   ├── batches/        (index.service.ts, index.schema.ts, list/, form/)
│   ├── chain/          (index.service.ts, index.schema.ts, list/, form/ — inclui sub-form de transporte)
│   ├── reports/        (index.service.ts, index.schema.ts, list/, form/)
│   ├── users/          (index.service.ts, index.schema.ts, list/, form/)
│   ├── audit-log/      (index.service.ts, index.schema.ts, list/)
│   └── dashboard/      (index.component.{ts,html,spec.ts} — role-aware)
│
└── environments/
    ├── environment.ts
    └── environment.prod.ts

cypress/
├── e2e/
│   ├── login.cy.ts
│   ├── traceability-public.cy.ts
│   └── register-batch-flow.cy.ts
└── fixtures/
```

---

## 5. Roteamento

Rotas lazy-loaded, mapeando diretamente as telas do `spec.md`:

```typescript
export const routes: Routes = [
  { path: 'rastreio/:batchId', loadComponent: () => import('./features/traceability').then(m => m.TraceabilityComponent) },
  { path: 'login', loadComponent: () => import('./features/auth/login').then(m => m.LoginComponent) },

  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard').then(m => m.DashboardComponent) },
      { path: 'suppliers', data: { roles: ['admin', 'manager'] }, canActivate: [roleGuard], loadChildren: () => import('./features/suppliers/routes') },
      { path: 'suppliers/ranking', loadComponent: () => import('./features/suppliers/ranking').then(m => m.RankingComponent) },
      { path: 'products', data: { roles: ['admin', 'manager'] }, canActivate: [roleGuard], loadChildren: () => import('./features/products/routes') },
      { path: 'certifications', data: { roles: ['auditor', 'supplier'] }, canActivate: [roleGuard], loadChildren: () => import('./features/certifications/routes') },
      { path: 'batches', loadChildren: () => import('./features/batches/routes') },
      { path: 'batches/:batchId/stages', loadChildren: () => import('./features/chain/routes') },
      { path: 'reports', loadChildren: () => import('./features/reports/routes') },
      { path: 'users', data: { roles: ['admin'] }, canActivate: [roleGuard], loadChildren: () => import('./features/users/routes') },
      { path: 'audit-log', data: { roles: ['admin', 'auditor'] }, canActivate: [roleGuard], loadComponent: () => import('./features/audit-log').then(m => m.AuditLogComponent) },
    ],
  },
];
```

- `authGuard` — bloqueia se não houver sessão válida, redireciona pro `/login`.
- `roleGuard` — lê `route.data['roles']` e compara com a `role` da sessão; um guard genérico reaproveitado, não um por feature.
- Rotas sem `data.roles` mas dentro do bloco protegido = qualquer perfil autenticado (ex: `batches`, `reports`, cujo acesso varia por *dado* — o próprio ou todos —, não por rota).

---

## 6. Autenticação e Sessão

### Onde guardar o token: `sessionStorage`, não `localStorage`

| Opção | Prós | Contras |
|---|---|---|
| `localStorage` | Sobrevive a fechar o navegador | Exposto a XSS indefinidamente |
| **`sessionStorage`** (escolhido) | Some ao fechar a aba — reduz a janela de exposição a XSS | Perde sessão entre abas/reinício do navegador |
| Memória (variável JS) | Não persiste em nenhum storage do navegador | Perde sessão em qualquer F5 — ruim demais pra UX |
| Cookie `httpOnly` | Imune a XSS (JS não lê o cookie) | Exige o backend mudar `LoginResponseDTO` para `Set-Cookie` + proteção CSRF — fora do escopo atual |

`sessionStorage` é o equilíbrio razoável dado que o backend já retorna o token no corpo JSON (não como cookie) — mudar isso reabriria uma decisão de arquitetura do backend. Fica registrado como possível evolução futura na seção 13.

### Fluxo

```typescript
// core/session/index.service.ts (esboço)
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly _role = signal<UserRole | null>(null);
  readonly role = this._role.asReadonly();

  setSession(token: string, role: UserRole) {
    sessionStorage.setItem('token', token);
    this._role.set(role);
  }

  clearSession() {
    sessionStorage.removeItem('token');
    this._role.set(null);
  }

  get token(): string | null {
    return sessionStorage.getItem('token');
  }
}
```

- Guard funcional (`authGuard`, `roleGuard`) lê `SessionService` diretamente via `inject()`.
- Interceptor funcional injeta `Authorization: Bearer <token>` em toda chamada, e trata `401`/`403` globalmente (logout automático + redirecionamento).
- Sem refresh token — mesma pendência já registrada no backend. Ao expirar, o próximo `401` já dispara logout.

---

## 7. Gerenciamento de Estado: Signals + Services, sem NgRx

Cada feature expõe seu estado via `signal`/`computed` no próprio `index.service.ts` — sem store global, sem boilerplate de actions/reducers. Justificativa: o app não tem estado compartilhado complexo entre features distantes (cada tela majoritariamente busca, exibe, envia — CRUD), então o custo de um NgRx não se paga aqui. Se alguma tela especificamente precisar de estado mais elaborado (ex: um formulário multi-step como o `chain/form` com transporte + emissão em sequência), isso fica local ao componente, não vira estado global.

```typescript
// features/suppliers/index.service.ts (esboço)
@Injectable({ providedIn: 'root' })
export class SuppliersService {
  private http = inject(HttpClient);
  private readonly _suppliers = signal<SupplierResponseDTO[]>([]);
  readonly suppliers = this._suppliers.asReadonly();

  load() {
    this.http.get<SupplierResponseDTO[]>(`${environment.apiUrl}/suppliers`)
      .subscribe(data => this._suppliers.set(data));
  }
}
```

---

## 8. Comunicação com a API

Cada `index.schema.ts` define os contratos com **Zod**, não `interface` pura — os DTOs Java documentados no `CLAUDE.md` do backend (seções 10.1–10.12) viram schemas validáveis em runtime, com o tipo TS inferido automaticamente:

```typescript
// features/suppliers/index.schema.ts
import { z } from 'zod';

export const addressResponseSchema = z.object({
  addressId: z.number(),
  street: z.string(),
  number: z.string(),
  neighborhood: z.string(),
  complement: z.string(),
  zipCode: z.string(),
  city: z.string(),
  state: z.string(),
});

export const supplierRequestSchema = z.object({
  name: z.string(),
  cnpj: z.string(),
  address: addressResponseSchema,
  phone: z.string(),
});

export const supplierResponseSchema = supplierRequestSchema.extend({
  supplierId: z.number(),
  registeredAt: z.string(), // LocalDate serializado como ISO string
});

export type SupplierRequestDTO = z.infer<typeof supplierRequestSchema>;
export type SupplierResponseDTO = z.infer<typeof supplierResponseSchema>;
```

No service, a resposta da API é validada antes de entrar no estado da aplicação — se o formato não bater, falha na hora, no ponto de entrada, não silenciosamente em algum componente adiante:

```typescript
// features/suppliers/index.service.ts
load() {
  this.http.get<unknown>(`${environment.apiUrl}/suppliers`).subscribe(raw => {
    const suppliers = z.array(supplierResponseSchema).parse(raw);
    this._suppliers.set(suppliers);
  });
}
```

`ENUM`s do backend (`CertificationStatus`, `ProductCategory`, etc.) usam `z.enum(...)`, com o tipo e as opções de `<select>` nascendo da mesma fonte (ver seção 9) — elimina a duplicação entre "o tipo" e "a lista de opções da UI".

`LocalDate`/`LocalDateTime` do backend chegam como string ISO 8601 no JSON — validados como `z.string()`, sem coerção pra `Date` no schema; a conversão de exibição fica a cargo de quem consome (`DatePipe`).

**Escopo do Zod**: usado para validar dados que **entram** vindos da API (resposta) e como fonte de tipos/`ENUM`s. Validação de **formulário** continua com os validators nativos do Reactive Forms — não existe integração oficial `zodResolver` para Angular como há no ecossistema React, então não vale forçar essa ponte.

---

## 9. Estilo e Componentização

- Tailwind via classes utilitárias diretamente no template — sem `index.component.scss` por padrão (só criar se algo realmente não for coberto por utilitário).
- Componentes de `shared/components/` recebem dado via `input()`/`output()` (signals), sem lógica de negócio própria.
- Campos `ENUM` do backend (`ProductCategory`, `CertificationStatus`, etc.) viram `<select>` alimentado por `.options` do próprio `z.enum(...)` definido no `index.schema.ts` da feature (ver seção 8) — tipo e opções de UI vêm da mesma fonte, sem lista duplicada em `shared/`.

---

## 10. Testes

- **Unitários** (`*.spec.ts`, ao lado de cada arquivo): services (lógica de estado/chamada HTTP com `HttpTestingController`), guards, interceptor.
- **E2E** (Cypress): os 3 fluxos principais do `spec.md` seção 5 — login, rastreabilidade pública, registro de lote → etapa → emissão.

---

## 11. Variáveis de Ambiente

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
};

// environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: '', // definido em build time / variável de ambiente do deploy
};
```

---

## 12. Convenção de Nomenclatura de Arquivos

Herdada do projeto de referência do time: `index.<tipo>.ts` dentro de pasta com nome significativo, em vez de `nome-completo.tipo.ts` na raiz da feature.

| Tipo de arquivo | Sufixo |
|---|---|
| Componente | `index.component.ts` / `.html` / `.spec.ts` |
| Serviço | `index.service.ts` / `.spec.ts` |
| Guard | `index.guard.ts` / `.spec.ts` |
| Interceptor | `index.interceptor.ts` / `.spec.ts` |
| Tipos/DTOs | `index.schema.ts` |

---

## 13. Decisões em Aberto

- **Token em `sessionStorage` vs. cookie `httpOnly`**: se o time quiser eliminar totalmente o risco de XSS sobre o token, isso exige revisar o backend (`LoginResponseDTO` viraria `Set-Cookie`, mais proteção CSRF) — fora do escopo atual, registrado aqui para retomada futura.
- **Sem refresh token** — mesma pendência do backend (seção 14 do `CLAUDE.md`); ao expirar o JWT, o usuário precisa logar de novo.
- **Test runner exato**: usar o que o `ng new` já gerou por padrão no projeto; não foi uma decisão deliberada do time até agora.

---

*Próximo documento: `tasks.md`, ordenando a implementação por dependência (bootstrap → core → shared → features, na ordem que fizer sentido para paralelizar entre os dois integrantes).*
