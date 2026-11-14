# Especificação — Convite de usuários

> Arquitetura em [`plan.md`](plan.md) e execução em [`tasks.md`](tasks.md). Contrato e regras da API: `supply-chain-verde-api/docs/features/011-convites/spec.md`.

## 1. Problema

- Na tela de usuários, o admin cria a conta digitando nome, email, senha e perfil, e precisa passar a senha ao colega por fora.
- A API passa a criar usuários só por convite por email, e o `POST /users` deixa de existir.

## 2. Objetivo

- O admin convida informando email e perfil.
- O convidado abre o link do email, vê para qual empresa e perfil foi convidado, informa nome e senha e entra logado.

## 3. Requisitos

### Tela de usuários

| ID | Requisito |
|---|---|
| RF-01 | O botão **Novo usuário** vira **Convidar usuário** e só aparece para o `admin` (regra atual de `canCreateUsers`). |
| RF-02 | O modal de convite tem só **email** e **perfil**. Os perfis são os da companhia (`creatableRoles`). |
| RF-03 | No sucesso (201), o modal fecha e mostra o toast "Convite enviado para <email>.". A lista não muda, porque o convidado ainda não é usuário. |
| RF-04 | Os erros 409 (email já cadastrado, convite ativo para o email, limite do plano) e 502 (falha no envio) aparecem como toast com a mensagem da API. O 400 fica no modal, como hoje. |

### Página do convite (`/convites/:token`)

| ID | Requisito |
|---|---|
| RF-05 | A rota é pública e usa `guestGuard`: quem já está logado vai para o dashboard. |
| RF-06 | Ao abrir, a página chama `GET /invites/{token}` e mostra um spinner enquanto isso. O formulário só aparece se o convite for válido. |
| RF-07 | Se a API devolver 404, a página mostra "Convite inválido ou expirado. Peça um novo convite ao administrador da sua empresa." e um link para **Entrar**. O formulário não é carregado. |
| RF-08 | O formulário mostra **email**, **empresa** e **perfil** só para leitura, e pede **nome**, **senha** e **confirmar senha**. Valem as mesmas regras de senha do cadastro de empresa: mínimo de 8 caracteres e confirmação igual. |
| RF-09 | Ao enviar, a página chama `POST /invites/accept`, grava a sessão com o token devolvido e vai para `/dashboard`. |
| RF-10 | Se o aceite devolver 404 (expirou entre abrir e enviar), a página troca para o estado do RF-07. Se devolver 409, mostra um toast com a mensagem da API. |
| RF-11 | A página não vaza o token: a aplicação envia `Referrer-Policy: no-referrer`. |

## 4. Fora do escopo

- Listar, reenviar ou cancelar convites (também fora da API).
- Convidar pela tela de outra companhia (`platform_admin`).

## 5. Critérios de aceite

- O admin convida e vê o toast. O botão e o modal antigos de criação não existem mais.
- Um link válido mostra o formulário preenchido. Depois de aceitar, o usuário cai no dashboard logado com o perfil do convite.
- Um link expirado ou reutilizado mostra o aviso, sem formulário.
- Com a sessão aberta, `/convites/x` redireciona para o dashboard.
