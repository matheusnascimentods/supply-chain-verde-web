# Especificação — Rate limit

> Arquitetura em [`plan.md`](plan.md) e execução em [`tasks.md`](tasks.md). Contrato e regras da API: `supply-chain-verde-api/docs/features/013-rate-limit/spec.md`.

## 1. Problema

- A API passa a responder `429 Too Many Requests` quando um cliente passa do limite, com corpo `{ "message": "Muitas requisições. Tente novamente em instantes." }`.
- O front não trata o `429`:
  - O `apiErrorMessage` só aproveita a mensagem da API em 400, 409 e 502. Num `429`, mostra o fallback de cada tela ("Confira os dados e tente novamente"), o que engana o usuário.
  - O login mostra a mensagem genérica de credenciais para qualquer erro. Quem está bloqueado por tentativas demais é levado a achar que errou a senha.

## 2. Objetivo

Quando o usuário for bloqueado, a tela diz isso com a mensagem da API, em vez de culpar os dados que ele digitou.

## 3. Requisitos

| ID | Requisito |
|---|---|
| RF-01 | O `apiErrorMessage` aproveita a mensagem da API também no `429`. Todas as telas que já o usam passam a mostrar "Muitas requisições. Tente novamente em instantes." sem mudar nada nelas. |
| RF-02 | No login, um `429` mostra a mensagem da API no lugar da mensagem de credenciais. Os outros erros continuam com a mensagem de hoje. |
| RF-03 | O `429` não derruba a sessão: só 401 e 403 fazem logout (regra atual do `authInterceptor`). |

## 4. Fora do escopo

- Contagem regressiva com o `Retry-After`, ou retentativa automática.
- Toast global para `429` no interceptor. As telas que carregam dados sem `apiErrorMessage` (dashboard, listas) mostram o erro de carregamento que já têm. Para um uso normal, o limite de 120 por minuto não é atingido.
- Limitar requisições no próprio front (debounce, cache). O limite é da API.

## 5. Critérios de aceite

- Com a API respondendo `429` no login, a tela mostra "Muitas requisições. Tente novamente em instantes." e não "Email ou senha incorretos".
- Com a API respondendo `429` num formulário que usa `apiErrorMessage`, aparece a mensagem da API.
- Depois de um `429`, o usuário continua logado.
