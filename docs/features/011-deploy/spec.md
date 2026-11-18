# Especificação — Deploy em VM com Docker

> Arquitetura em [`plan.md`](plan.md) e execução em [`tasks.md`](tasks.md). Contrato, compose de produção e regras gerais: `supply-chain-verde-api/docs/features/012-deploy/spec.md`.

## 1. Problema

- **O build de produção chama `localhost`.** O `angular.json` não tem `fileReplacements`, então o `ng build` usa `environment.ts`, com `apiUrl: 'http://localhost:8080/api/v1'`. Em produção, o navegador de quem acessa o site tentaria chamar a própria máquina. O `environment.prod.ts` existe, mas nunca entra no build.
- **Não existe imagem Docker do front** nem um servidor configurado para entregar a SPA. Sem fallback para o `index.html`, um F5 em `/dashboard` dá 404.
- **O `.env.example` lista `API_URL` e `PRODUCTION`, mas nada lê essas variáveis.** O Angular escolhe a configuração pelos arquivos de `src/environments` no build. Quem baixa o projeto e preenche o arquivo acha que configurou algo, e não configurou.

## 2. Objetivo

- Gerar uma imagem do front que, sozinha, sirva o Angular e seja a porta de entrada do domínio, com HTTPS automático e `/api` repassado para a API.
- Fazer o build de produção chamar a API no mesmo domínio (`/api/v1`).
- Fazer o `.env.example` listar exatamente as variáveis que o projeto usa.

## 3. Requisitos

| ID | Requisito |
|---|---|
| RF-01 | O build de produção usa `environment.prod.ts`, com `apiUrl: '/api/v1'`. O `ng serve` e os testes continuam com `environment.ts`, sem mudança no dia a dia. |
| RF-02 | A imagem serve o build do Angular e devolve o `index.html` para qualquer rota que não seja arquivo, então o F5 funciona em todas as rotas. |
| RF-03 | A imagem repassa `/api/*`, `/swagger-ui*` e `/v3/api-docs*` para a API. O Swagger continua público. |
| RF-04 | O domínio vem da variável `SITE_ADDRESS`. Com um domínio real, o certificado HTTPS é emitido e renovado sozinho. Com `:80`, a imagem serve só HTTP, para testes locais. |
| RF-05 | O endereço da API dentro da rede do compose vem de `API_UPSTREAM`, com padrão `api:8080`, o nome do serviço no compose de produção da API. |
| RF-06 | O `.env.example` continua no repositório como documentação das variáveis. Ele passa a listar `SITE_ADDRESS` e `API_UPSTREAM`, explicando cada uma, e deixa de listar `API_URL` e `PRODUCTION`. Um comentário explica que a URL da API do Angular fica nos arquivos de `src/environments`. |
| RF-07 | A imagem só é publicada depois de testes, build, auditoria e lint passarem, e só a partir da `main`. |
| RF-08 | O `Referrer-Policy: no-referrer` (RF-11 da feature 010) continua valendo. A `<meta>` do `index.html` não muda. |

## 4. Fora do escopo

- O passo de deploy que depende do provedor (SSH, OIDC). A VM só faz `pull` da imagem nova, e isso é manual por enquanto.
- SSR, prerender, cache de CDN e headers de cache por arquivo.
- Configuração em tempo de execução (por exemplo, um `config.json` lido no boot). Com a API no mesmo domínio, a URL relativa basta.

## 5. Critérios de aceite

- `npm run build` gera um bundle que chama `/api/v1/...`. Isso se confere buscando `localhost:8080` em `dist/`, o que não deve retornar nada.
- `docker run -e SITE_ADDRESS=:80 -e API_UPSTREAM=host.docker.internal:8080 -p 4200:80 ...` abre o app em `http://localhost:4200` (a 8080 do host fica com a API). O login funciona contra a API local, e um F5 em `/dashboard` não dá 404.
- No compose de produção da API, `https://<domínio>/` abre o app e `https://<domínio>/swagger-ui.html` abre o Swagger.
- O `.env.example` só lista variáveis que alguém realmente lê.
- Um push na `main` com o CI verde publica `ghcr.io/matheusnascimentods/supply-chain-verde-web:latest`.
