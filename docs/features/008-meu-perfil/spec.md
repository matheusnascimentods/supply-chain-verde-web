# Especificação — Meu perfil para todos os perfis

> Arquitetura em [`plan.md`](plan.md) e execução em [`tasks.md`](tasks.md). Contrato da API: `supply-chain-verde-api/docs/features/009-meu-perfil/spec.md`.

## 1. Problema

- "Meu perfil" existe só para o fornecedor, em `/suppliers/me`, e aparece em dois lugares: como aba na navbar (`NAV_LINKS.supplier`) e no menu do usuário.
- Admin, gestor e auditor não têm onde ver os próprios dados nem trocar a própria senha. O menu deles só tem **Sair**.
- Como a rota fica dentro de `/suppliers`, a aba **Fornecedores** aparece marcada quando o fornecedor está no próprio perfil.

## 2. Objetivo

Uma tela "Meu perfil" para todos os perfis, acessada só pelo menu do usuário (avatar no canto superior direito), acima de **Sair**. A navbar deixa de ter a aba e não marca nenhum item enquanto o usuário está nessa tela.

## 3. Requisitos

| ID | Requisito |
|---|---|
| RF-01 | O menu do usuário mostra **Meu perfil** acima de **Sair** para todos os perfis. |
| RF-02 | A aba "Meu perfil" sai da navbar do fornecedor (desktop e mobile). |
| RF-03 | A tela fica em `/profile`. Nenhum link da navbar fica ativo nessa rota, nem o Dashboard. |
| RF-04 | `/suppliers/me` redireciona para `/profile`, para não quebrar link salvo. |
| RF-05 | A seção **Meu acesso** vale para todos os perfis: nome (editável), email (só leitura), perfil (só leitura) e troca de senha (senha atual, nova e confirmação). |
| RF-06 | As seções **Dados do fornecedor** e **Endereço** aparecem só para o fornecedor, com o comportamento atual. |
| RF-07 | O fornecedor salva tudo numa chamada (`PATCH /suppliers/me`, como hoje). Os outros perfis salvam em `PATCH /users/me`. |
| RF-08 | Depois de salvar o nome, o novo nome aparece sem precisar entrar de novo. |
| RF-09 | **Cancelar** e **Voltar** levam ao `/dashboard`, não mais a `/suppliers`. |
| RNF-01 | Mantém as validações atuais de senha: a confirmação precisa conferir, e a senha atual é obrigatória para trocar. A acessibilidade dos formulários continua como está. |

## 4. Fora de escopo

- Editar email ou perfil de acesso na própria tela: continua sendo trabalho do admin em `/users`.
- Foto ou avatar de imagem.
- Recuperação de senha esquecida.
