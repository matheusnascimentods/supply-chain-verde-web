# Especificação — Ajustes ao contrato novo da API

> Arquitetura em [`plan.md`](plan.md) e execução em [`tasks.md`](tasks.md). Origem das mudanças na API: `supply-chain-verde-api/docs/features/006-views-procedures/spec.md` (PR #66) e `supply-chain-verde-api/docs/features/007-ordem-etapas/spec.md` (PR #67).

## 1. Problema

A API passou a aplicar no servidor três regras que o frontend ainda não conhece. Nenhum campo foi renomeado ou removido, então nada quebra na leitura. O problema está na escrita: a tela oferece opções que a API recusa, e quando recusa o usuário vê uma mensagem genérica em vez do motivo.

| Fluxo | O que a API faz agora | Como a tela está hoje |
|---|---|---|
| Cadastrar certificação | `POST /suppliers/{id}/certifications` com `expiresAt` no passado → 400 | O formulário aceita qualquer data e, no erro, mostra "Não foi possível salvar. Confira os dados e tente novamente." |
| Mudar status da certificação | `PATCH /certifications/{id}/status` com `ACTIVE` numa certificação vencida → 400. Vencidas viram `EXPIRED` sozinhas toda madrugada (`pg_cron`) | O menu oferece "Ativa" para qualquer certificação e, no erro, mostra "Não foi possível atualizar o status de …" |
| Gerar relatório | O relatório é um **retrato** do momento da geração: CO₂, lotes e produtos ficam gravados e não mudam depois | Nada avisa que dados lançados depois exigem gerar outro relatório |
| Registrar etapa | Só aceita a **próxima** etapa da sequência `PRODUCTION → STORAGE → PROCESSING → TRANSPORT → DISTRIBUTION → RETAIL`; fora de ordem → 400 | O seletor lista as 6 etapas e, no erro, mostra "Não foi possível registrar a etapa. Confira os dados e tente novamente." |

Além disso, a migration V39 inseriu nos lotes antigos as etapas que faltavam: 82 nos seeds, quase todas "Armazenagem". Elas não têm endereço, transporte nem emissão, e passam a aparecer na jornada do lote.

## 2. Objetivo

A tela só oferece o que a API aceita, explica o porquê quando restringe e, se mesmo assim a API recusar, mostra a mensagem dela.

## 3. Regras

| ID | Regra |
|---|---|
| RN-01 | "Hoje" é a data local do navegador (`yyyy-MM-dd`), a mesma usada nos filtros da auditoria. |
| RN-02 | Uma certificação está vencida quando `expiresAt < hoje`. A data de hoje ainda vale. |
| RN-03 | A próxima etapa de um lote é `PRODUCTION` se ele não tem etapas; senão, a seguinte à `currentStage` na ordem de `STAGE_TYPES`. Depois de `RETAIL` não há próxima. |
| RN-04 | Mensagens de erro 400/409 vêm da API (`apiErrorMessage`); os textos atuais continuam como fallback para os outros erros. |

## 4. Requisitos

| ID | Requisito |
|---|---|
| RF-01 | O formulário de nova certificação não aceita `expiresAt` anterior a hoje nem anterior a `issuedAt`. O campo de data tem `min` e a validação mostra a mensagem junto do campo. |
| RF-02 | No menu de status, "Ativa" fica desabilitada para certificação vencida, com o motivo legível por leitor de tela. As demais opções seguem iguais. |
| RF-03 | Os quatro fluxos de escrita (cadastrar certificação, mudar status, gerar relatório, registrar etapa) exibem a mensagem da API em 400/409. |
| RF-04 | O formulário de geração e cada card de relatório avisam: "Retrato da data de geração. Dados lançados depois exigem gerar um novo relatório." O PDF traz a mesma frase junto da data de geração. |
| RF-05 | O modal de nova etapa recebe a etapa atual do lote e mostra só a próxima (RN-03), já selecionada e com a explicação "As etapas seguem a ordem da cadeia". O campo de transporte continua aparecendo quando a próxima é `TRANSPORT`. |
| RF-06 | A sequência de etapas vive num só lugar do domínio (`nextStage`) e é a mesma ordem de `STAGE_TYPES`, que espelha o enum da API. |
| RF-07 | Etapa sem endereço, sem transporte e sem emissão aparece sem erro e sem linha vazia na jornada pública, no card do lote e no gráfico de carbono. |
| RNF-01 | Nenhuma chamada nova à API: tudo sai de dados já carregados (`currentStage`, `expiresAt`). |
| RNF-02 | Acessibilidade: opção desabilitada usa `disabled` + `aria-describedby`; avisos novos são texto visível, não só tooltip. |

## 5. Fora de escopo

- Mudanças no ranking e no dashboard: a API garante as mesmas respostas (diff byte a byte no PR #66).
- Editar ou apagar etapas: a API não tem esse endpoint, e o banco impede apagar uma etapa com sucessora.
- Mostrar quando a próxima expiração automática vai rodar.
