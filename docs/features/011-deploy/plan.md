# Plano técnico — Deploy em VM com Docker

> Requisitos em [`spec.md`](spec.md); passo a passo em [`tasks.md`](tasks.md). A visão geral (três containers, um domínio) está em `supply-chain-verde-api/docs/features/012-deploy/plan.md` §1.

## 1. Build de produção com `environment.prod.ts`

Em `angular.json`, na configuração `production` do `build`:

```json
"fileReplacements": [
  { "replace": "src/environments/environment.ts", "with": "src/environments/environment.prod.ts" }
]
```

E em `environment.prod.ts`:

```ts
apiUrl: '/api/v1',
```

- **URL relativa:** o front e a API ficam no mesmo domínio (RN-06 da API), então não há domínio fixo no bundle nem CORS. A mesma imagem funciona em `localhost`, no IP da VM ou no domínio final.
- Os repositórios já importam `environments/environment`, então nenhum arquivo de feature muda.
- `ng serve` usa a configuração `development`, sem substituição: continua chamando `http://localhost:8080/api/v1`. Os testes também não são afetados.

## 2. Imagem (`Dockerfile`)

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist/supply-chain-verde-web/browser /srv
```

- **Node 22**, o mesmo do CI.
- O `outputPath` padrão do `@angular/build:application` é `dist/supply-chain-verde-web/browser`.
- **Caddy em vez de nginx:** ele serve os arquivos estáticos, faz o proxy e emite e renova o HTTPS sem certbot nem cron. Um processo só cuida das três coisas.
- `.dockerignore`: `node_modules/`, `dist/`, `.angular/`, `.git/`, `coverage/`, `cypress/videos/` e `cypress/screenshots/`. Sem isso, o `COPY . .` levaria o `node_modules` local para dentro do build.

## 3. `Caddyfile`

```caddyfile
{$SITE_ADDRESS::80} {
	encode zstd gzip

	@api path /api/* /swagger-ui* /v3/api-docs*
	handle @api {
		reverse_proxy {$API_UPSTREAM:api:8080}
	}

	handle {
		root * /srv
		try_files {path} /index.html
		file_server
	}
}
```

- `{$VAR:padrão}` é a interpolação de variável de ambiente do Caddy. Com `SITE_ADDRESS` igual a um domínio, o Caddy liga o HTTPS automático e redireciona `http` para `https`. Com `:80`, serve só HTTP.
- O `reverse_proxy` já envia `X-Forwarded-For`, `-Proto` e `-Host`. A API passa a usar esses cabeçalhos (plan §4 da API), e o Swagger gera links em `https`.
- O `try_files` resolve o RF-02.

## 4. `.env.example`

O arquivo continua no repositório para quem baixa o projeto saber das variáveis (RF-06). O conteúdo muda para:

```dotenv
# Variáveis da imagem Docker (Caddy). O Angular não lê variáveis de ambiente:
# a URL da API fica em src/environments (environment.ts no dev, environment.prod.ts no build).

# Domínio público. Com um domínio real, o Caddy emite o HTTPS sozinho; :80 serve só HTTP (teste local).
SITE_ADDRESS=:80

# Onde o Caddy encontra a API. No compose de produção da API, é o serviço "api".
API_UPSTREAM=api:8080
```

O `.gitignore` já ignora `.env` e `.env.*`, mas não o `.env.example`, e isso continua igual.

## 5. Publicação da imagem (CI)

Um job `publish` novo no `ci.yml`, com `needs: [tests, build, audit, lint]`. Ele é igual ao da API (plan §6 da API):

- roda só em push na `main`;
- usa `permissions: packages: write`;
- faz login no GHCR com o `GITHUB_TOKEN`;
- gera as tags `latest` e `sha`, só para `linux/amd64`.

Os quatro jobs atuais não mudam. O pacote também precisa ser marcado como público depois da primeira publicação.

## 6. Testes

- `npm test -- --watch=false` e `npm run lint`, sem mudança.
- `npm run build`, seguido de `grep -r "localhost:8080" dist/` sem resultado.
- Fumaça da imagem com a API local rodando (`./mvnw spring-boot:run`):
  - `docker build -t web .`
  - `docker run --rm -p 8080:80 -e API_UPSTREAM=host.docker.internal:8080 --add-host=host.docker.internal:host-gateway web`
  - login, navegação e F5 em `/dashboard` em `http://localhost:8080`.
- O teste com HTTPS e o compose completo fica na Task 3 da API.
