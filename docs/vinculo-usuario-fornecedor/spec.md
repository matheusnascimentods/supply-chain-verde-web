# Especificação — Vínculo entre usuário e fornecedor

> Arquitetura em [`plan.md`](plan.md) e execução em [`tasks.md`](tasks.md). Regras e contratos da API: `supply-chain-verde-api/docs/vinculo-usuario-fornecedor/spec.md`.

## 1. Problema

- O frontend trata `userId` como `supplierId` (`suppliers` facade, formulário `/suppliers/me`, criação de lote). A API vai passar a ter um vínculo real (`supplier.user_id`) e enviar `supplierId` no token.
- Em `/suppliers/me` o fornecedor não consegue salvar: o formulário chama `PUT /suppliers/{id}`, que retorna 403 para `SUPPLIER`.
- O `MANAGER` não tem como criar fornecedor pela tela de Fornecedores (`suppliers/new` redireciona para a lista) nem dar acesso a ele.

## 2. Objetivo

Usar o vínculo real, deixar o fornecedor editar o próprio cadastro e permitir que `ADMIN` e `MANAGER` criem fornecedores com ou sem acesso.

## 3. Requisitos

| ID | Requisito |
|---|---|
| RF-01 | A sessão expõe `supplierId()` lido do token; nenhuma regra usa mais `userId()` como fornecedor. |
| RF-02 | Tela de Fornecedores: botão "Novo fornecedor" para `ADMIN` e `MANAGER`, abrindo `/suppliers/new`. |
| RF-03 | O formulário de novo fornecedor tem a seção opcional "Criar acesso" (nome, email, senha). Desmarcada, o fornecedor é criado sem usuário. |
| RF-04 | `MANAGER` acessa a tela de Usuários: vê só usuários `SUPPLIER`, não troca roles e só cria usuários `SUPPLIER`. |
| RF-05 | Ao criar usuário com role `SUPPLIER` (admin) ou qualquer usuário (manager), escolhe-se um fornecedor **sem acesso** num seletor com busca. É o caminho para um fornecedor existente virar usuário. |
| RF-06 | A listagem de usuários mostra o fornecedor vinculado. |
| RF-07 | `/suppliers/me` (só `SUPPLIER`) edita razão social, telefone, endereço, nome do usuário e senha. CNPJ e email aparecem só para leitura. |
| RF-08 | A troca de senha pede senha atual, nova senha e confirmação; a confirmação é validada no front. Campos de senha vazios = senha não muda. |
| RF-09 | O formulário de `/suppliers/me` envia só os campos alterados (`PATCH`). |
| RNF-01 | Erros 409/400 da API (email duplicado, fornecedor já vinculado, senha atual errada) aparecem no formulário, no padrão de erro atual. |
| RNF-02 | Lógica nova em `domain`/`application` tem `index.*.spec.ts`. |

## 4. Navegação por role

| Role | Muda |
|---|---|
| `admin` | Botão "Novo fornecedor"; seletor de fornecedor ao criar usuário `SUPPLIER`. |
| `manager` | Ganha o link "Usuários"; botão "Novo fornecedor". |
| `auditor` | Nada. |
| `supplier` | "Meu perfil" passa a salvar. |

## 5. Fora de escopo

- Troca de senha para os outros roles.
- Desvincular ou trocar o usuário de um fornecedor.
