# Especificação: Cálculo de carbono

> A arquitetura está em [`plan.md`](plan.md) e a execução em [`tasks.md`](tasks.md). A contraparte na API fica em `supply-chain-verde-api/docs/features/019-calculo-de-carbono/`. As regras RN-xx citadas aqui são de lá, e os problemas de origem estão em `debitos.md`, na mesma pasta (citados como D-n).

## 1. Problema

- O cálculo de emissão é uma caixa opcional, desmarcada por padrão, no modal de etapa (D-5).
- O texto de ajuda promete "calcular a emissão em outro momento", mas não existe tela para isso (D-6).
- O transporte só aparece na etapa Transporte, e as outras etapas não pedem dado nenhum: o cálculo delas sempre dá 0 (D-1).
- O select oferece IPCC e EMEP/EEA e não mostra que a escolha muda o número (D-3).
- O modal tem um texto dizendo que o cálculo é "para perfis de gestor e administrador", mas o `supplier` também calcula, e o texto nunca chega a aparecer (D-12).

## 2. Objetivo

- Tornar a emissão parte obrigatória do registro da etapa, com o dado da atividade certo para cada tipo de etapa.
- Oferecer só as combinações de metodologia, modo, combustível e fonte que têm fator na API.
- Permitir calcular a emissão pendente da última etapa de um lote.

## 3. Regras de exibição

| ID | Regra | API |
|---|---|---|
| RF-01 | O passo **Emissão** do modal deixa de ter a caixa "Calcular emissão desta etapa". A metodologia é obrigatória e o passo só avança com os campos válidos. | RN-11 |
| RF-02 | Em **Transporte** e **Distribuição**, o passo mostra modo, combustível, distância, capacidade e peso da carga. Se o lote está em `KG` ou `TON`, o peso vem preenchido pela quantidade e travado. Nas outras unidades, o peso é obrigatório e maior que zero. | RN-06, RN-07 |
| RF-03 | Em **Produção**, **Armazenagem**, **Processamento** e **Varejo**, o passo mostra a fonte de energia (Energia elétrica em kWh, Diesel em L, GLP em kg, Gás natural em m³) e o consumo, obrigatório e maior ou igual a 0. A unidade aparece ao lado do campo. | RN-08 |
| RF-04 | O select de metodologia só tem **GHG Protocol** e **DEFRA**. Para a combinação escolhida (modo + combustível, ou fonte), só aparecem as metodologias com fator em `GET /emission-factors`, e os combustíveis de cada modo também são filtrados. Se não houver nenhuma, o passo mostra "Nenhuma metodologia tem fator para esta combinação" e não avança. | RN-04, RN-05 |
| RF-05 | A revisão mostra a metodologia, o dado da atividade e o fator (`0,10356 kg CO₂e/t·km`), com a fonte e o ano. O CO₂e calculado aparece no card depois de salvar. | RN-09 |
| RF-06 | No card do lote, quando a última etapa não tem emissão e quem está logado é do lado dono dela, aparece a ação **Calcular emissão**. Ela abre o mesmo modal só com os passos **Emissão** e **Revisão**, e com o transporte já preenchido e travado se a etapa já tiver um. Isso vale também para lote Concluído. | RN-11, RN-13, RN-19 |
| RF-07 | Com a emissão pendente, a ação **Adicionar etapa** não aparece. | RN-11 |
| RF-08 | O texto "O cálculo de emissão está disponível para perfis de gestor e administrador." sai do modal (D-12). Ele nunca aparece: só abre o modal quem passa em `canAddStageTo` ou `canCalculatePendingEmission`, e esses perfis sempre calculam. | RN-10 (017) |
| RF-09 | Um 400 ou 409 da API mostra a mensagem dela no erro do modal. É o caso, por exemplo, de outro usuário que calculou a emissão antes. | RNF-01 |
| RF-10 | As unidades de emissão aparecem como `kg CO₂e` em todas as telas. | D-8 |

## 4. Fora do escopo

- Recalcular uma emissão ou calcular a emissão de etapas antigas que não são a última do lote.
- Mostrar a quebra do dado da atividade na rastreabilidade pública. Ela continua mostrando o CO₂e por etapa.
- Mais de uma fonte de energia por etapa.

## 5. Critérios de aceite

- Como `supplier`, registrar a Produção exige fonte e consumo. Sem eles, o passo **Emissão** não avança. Depois de salvar, o card mostra o CO₂e da etapa.
- Num lote em `TON`, a Distribuição mostra o peso preenchido e travado. Num lote em `UNIT`, o peso é obrigatório.
- Escolher **Aéreo** só oferece **Querosene de aviação** como combustível.
- Um lote cuja última etapa não tem emissão mostra **Calcular emissão** e não mostra **Adicionar etapa**. Depois do cálculo, volta a mostrar **Adicionar etapa**.
- Se a chamada de emissão falhar depois que a etapa foi salva, tentar de novo não cria a etapa duas vezes (o `StageProgress` atual).
- `npm test` passa, e o Cypress `register-batch-flow.cy.ts` cobre a emissão obrigatória e a emissão pendente.
