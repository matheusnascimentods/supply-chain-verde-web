# Especificação — Hero section antes do login

> Arquitetura em [`plan.md`](plan.md), execução em [`tasks.md`](tasks.md) e prompt da imagem em [`image-prompt.md`](image-prompt.md). Referência visual: [`reference.png`](reference.png).

## 1. Problema

- A raiz `/` redireciona direto para `/login` (`app.routes.ts`). Quem chega no sistema cai num formulário, sem saber o que é o Supply Chain Verde nem por que deveria entrar.
- Não existe nenhuma página que apresente o produto: rastreabilidade de lotes, emissão de CO₂ por etapa e ranking de fornecedores sustentáveis.
- O projeto é avaliado também pela apresentação, e a primeira tela é a que fica na memória.

## 2. Objetivo

Uma página de entrada em `/`, de tela cheia, que apresenta o produto num único impacto visual e leva ao login com um clique. A composição segue a referência: palavra gigante atrás do objeto principal, objeto "saltando" na frente do texto e card de vidro com a chamada. Tudo com identidade e imagem próprias, geradas por IA.

## 3. Composição (o que a referência ensina)

| Elemento da referência | No Supply Chain Verde |
|---|---|
| Céu azul ocupando a tela inteira | Céu limpo de fim de manhã, mais quente e levemente esverdeado na base |
| Wordmark gigante "HORIZON" cortado nas bordas | **"VERDE"** em caixa alta, branco, cortado nas bordas laterais |
| Contêiner preto içado pelo guindaste, **na frente** do texto | Contêiner coberto de vegetação viva (musgo, samambaias, folhagem), içado por guindaste, na frente do "VERDE" |
| Pilha de contêineres laranja embaixo | Pilha de contêineres em verde-floresta e branco-gelo no rodapé da imagem |
| Logo centralizado + links no topo | Marca "Supply Chain Verde" (ícone atual da folha) e links âncora |
| Card de vidro com título e CTA, embaixo à esquerda | Card de vidro com título, subtítulo e botão **Entrar** |
| Botão de play "Discover" | Não entra: não temos vídeo |
| Avatares + "20K+ shipments" | Não entra: seriam pessoas e números inventados |
| Texto vertical lateral | "Rastreabilidade de ponta a ponta", vertical, na lateral esquerda (só desktop) |

## 4. Requisitos

| ID | Requisito |
|---|---|
| RF-01 | `/` passa a renderizar a hero; `/login` continua igual. |
| RF-02 | O CTA principal **Entrar** leva para `/login`. |
| RF-03 | Usuário com sessão válida que acessa `/` vai direto para `/dashboard`, como acontece hoje depois do login. |
| RF-04 | Conteúdo em português. Título: "O futuro da cadeia de suprimentos é verde". Subtítulo: "Rastreie cada lote da origem ao varejo, meça o CO₂ de cada etapa e escolha fornecedores mais sustentáveis." |
| RF-05 | A palavra "VERDE" fica **atrás** do contêiner içado e **na frente** do céu (efeito de profundidade da referência). |
| RF-06 | Mobile (≤ 640px): palavra gigante menor e ainda cortada, card de vidro em largura total no rodapé, links do topo escondidos e só a marca visível. |
| RF-07 | Sem rodapé do app nesta rota, como no `/login`. |
| RNF-01 | Imagem 100% própria, gerada por IA com o prompt de [`image-prompt.md`](image-prompt.md). Nenhum asset da referência é reutilizado. |
| RNF-02 | Sem nova dependência: Angular + Tailwind já instalados; imagem via `NgOptimizedImage`. |
| RNF-03 | LCP ≤ 2,5 s em 4G simulado: imagem em AVIF/WebP com `srcset` e `priority`, e no máximo ~250 KB no desktop. |
| RNF-04 | Acessível: o texto do card tem contraste AA sobre o vidro; "VERDE" é decorativo (`aria-hidden`) e o `h1` real é o título do card; o CTA funciona por teclado com foco visível; a animação de entrada respeita `prefers-reduced-motion`. |

## 5. Fora de escopo

- Seções abaixo da dobra (features, depoimentos, rodapé institucional): a página tem só a hero.
- Vídeo, contador de entregas ou avatares de clientes.
- Páginas de destino para os links do topo além de âncoras e do `/login`.
- Campo de busca de lote na hero: o rastreio público continua em `/rastreio/:batchId`.
