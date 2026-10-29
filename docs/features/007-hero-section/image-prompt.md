# Prompt da imagem da hero

> Usado pela [`spec.md`](spec.md) (RNF-01) e pelo [`plan.md`](plan.md) §3 e §5. Os prompts estão em inglês porque os geradores seguem melhor instruções em inglês. As explicações estão em português.

## 1. O que a imagem precisa resolver

Tudo sai de **uma única imagem 16:9**, usada como fundo; o mobile usa a mesma imagem com `object-position`. A composição já serve para o recorte do contêiner (§4), que fica para depois.

| Requisito | Por quê |
|---|---|
| Contêiner **grande**, ocupando ~45% da largura, um pouco à esquerda do centro, com o centro vertical na metade da altura | É o tamanho e a posição da referência; o "VERDE" cruza o terço de cima dele |
| Gancho e slings na faixa de **15–40% da altura**, cabo saindo pela borda de cima | É a faixa do "VERDE" (plan §3); quando houver o recorte, o gancho e os slings ficam na frente do texto, como na referência |
| Céu **azul saturado e profundo** na faixa do texto, com nuvens só fora dela | O "VERDE" branco precisa de contraste |
| Vegetação **compacta**, sem nada pendurado abaixo do contêiner | Fica mais próximo da referência e deixa o recorte futuro limpo, sem cipó solto para mascarar |
| Pilha de contêineres **perto da câmera, grande**, ocupando o terço de baixo, mais baixa à esquerda e mais alta à direita | Mesma profundidade da referência; o card de vidro fica embaixo à esquerda |
| Contraste de cor entre o contêiner içado (verde quase preto) e a pilha (verde da marca + branco) | Na referência é preto × laranja; contêiner verde sobre pilha verde se perde |
| Fotorrealista, sem texto, sem logo, sem pessoas | É a imagem 100% nossa, sem marca de terceiros |

## 2. Prompt principal (qualquer gerador)

```text
Ultra-realistic commercial advertising photograph for a sustainable logistics brand, shot from ground level looking up at a container being lifted, bold minimalist composition.

SUBJECT: one single 20-foot steel shipping container hanging in mid-air from a crane. It is LARGE in the frame: it spans about 45% of the image width, from roughly 22% to 67% of the width, and vertically from about 35% to 70% of the height, so its center sits slightly left of the image center. Low-angle view from below (about 15° looking up), so the underside and bottom frame of the container are clearly visible. The container is turned about 25° so the long corrugated side faces the camera and the short door end is visible on the right. Its steel is painted very dark forest green, almost black (#0f2e1d), matte, clean, with crisp corrugation and subtle wear.

VEGETATION: the roof is covered by a dense, compact carpet of bright living moss with a low crown of ferns and small leafy plants along the top edges; a few short ivy strands cling flat against the upper part of the sides. The vegetation stays tight to the container: nothing hangs below the container's bottom edge and no vines dangle in the air. The overall silhouette remains a clean, readable rectangular box.

RIGGING: four taut steel wire slings run from the four top corners of the container up to a single yellow-and-black diagonally striped crane hook block, forming a wide triangle. The hook block sits horizontally centered over the container, at about 15–20% of the image height. Above it, one single straight crane cable continues vertically and exits the TOP edge of the frame. No crane structure is visible.

FOREGROUND: the bottom third of the frame is filled by a stack of shipping containers placed CLOSE to the camera, large and sharp, in two alternating colors: vivid green (#16a34a) and clean off-white (#f1f5f9), corrugated metal, no markings. Left side: a single low row of containers whose top edge sits at about 75% of the image height. Center: a container slightly behind them, top at about 72%. Right side: a big container stack very close to the camera, taller, its top edge at about 62% of the image height, cut off by the right and bottom edges of the frame. The tops of the foreground containers never touch or cover the hanging container.

SKY: fills the entire background. Deep, saturated azure blue, strongest in the upper half of the image (between 15% and 45% of the height the sky is pure, evenly deep blue with only a faint soft cloud texture). Soft, slightly out-of-focus white cumulus clouds appear in the lower sky behind the container stack and near the top corners. No buildings, no birds, no aircraft.

LIGHT AND LOOK: bright midday sunlight from the upper right, crisp shadows on the corrugation, gentle rim light on the container edges, high contrast, vivid but natural colors, subtle fine film grain, polished premium advertising aesthetic. Hanging container and foreground stack both tack sharp; clouds slightly soft.

CAMERA: full-frame camera, 35mm lens, low angle, f/8, 8K detail.

STRICTLY NO: text, letters, numbers, logos, brand marks, watermarks, signage or codes on any container, people, vehicles, ships, ports, cranes or crane towers, buildings, birds, lens flare, vignette, motion blur, fisheye distortion, cartoon or 3D-render look, neon greens, vines hanging below the container.

Aspect ratio 16:9, landscape.
```

## 3. Versões por gerador

### Midjourney v7

```text
ultra-realistic commercial advertising photo, low angle from the ground, one LARGE 20ft shipping container hanging mid-air from a crane, spanning 45% of the frame width, slightly left of center, middle of the frame, underside visible, turned 25° with door end on the right, very dark almost black forest green matte steel, compact carpet of bright moss and low ferns on the roof, short ivy flat on the upper sides, nothing hanging below, clean rectangular silhouette, four taut steel slings to a yellow-black diagonally striped hook block, single straight cable exiting the top of the frame, deep saturated azure sky, pure blue in the upper half, soft out-of-focus cumulus low and in corners, bottom third: large close-up stack of vivid green and off-white containers, low on the left, tall on the right cut by the frame edge, bright midday sun from upper right, crisp shadows, fine film grain, 35mm, f/8, tack sharp, bold minimalist --ar 16:9 --style raw --stylize 150 --no text, letters, numbers, logo, watermark, people, buildings, crane tower, ships, birds, lens flare, vignette, cartoon, 3d render, hanging vines
```

Para variações: `--seed <número>` mantém o enquadramento enquanto se ajusta o resto, e `--chaos 10` explora de leve.

### ChatGPT / GPT-image · Gemini / Imagen · Flux

- Usar o **prompt principal (§2)** sem alteração, no maior formato paisagem disponível (16:9 de preferência).
- Flux: `guidance 3.5`, `steps 40`. Se o gerador tiver campo de prompt negativo, mover para ele o bloco "STRICTLY NO".
- Se o modelo puser texto ou logo no contêiner, mandar na mesma conversa: `Same image, remove every letter, number, logo and marking from all containers; keep everything else identical.`

### Ajuste a partir da primeira geração

Para editar a imagem já gerada na mesma conversa, em vez de gerar do zero:

```text
Keep the same scene, camera and lighting, and apply these changes:
1. Make the hanging container much larger and closer: it should span about 45% of the image width and sit in the vertical middle of the frame, slightly left of center, with its underside visible.
2. Repaint the hanging container very dark forest green, almost black.
3. Trim the vegetation: a compact moss carpet and low ferns on the roof only, a few short ivy strands flat on the upper sides, and nothing hanging below the container.
4. Bring the container stack much closer to the camera so it fills the bottom third: a low row on the left, a taller big stack on the right cut by the frame edge, in vivid green and off-white.
5. Make the sky a deeper, more saturated azure, pure blue in the upper half, with soft out-of-focus clouds only low and in the corners. Add subtle film grain.
No text, logos or markings anywhere.
```

## 4. Exportação e recorte do contêiner

Agora só o passo 1 e a exportação do fundo (passo 5). Os passos 2 a 4 ficam para quando o efeito de profundidade entrar (plan §3, "Depois").

1. Exportar a imagem aprovada em **1920×1080** (upscale do gerador ou Upscayl, se ela vier menor).
2. Recortar **só** o contêiner içado + vegetação + slings + gancho + cabo, sem a pilha de baixo. Ferramentas: remove.bg, Photoroom, a seleção de objeto do Photoshop, ou `rembg` (`pip install rembg && rembg i hero.png subject.png`).
3. O arquivo do recorte precisa ter **o mesmo tamanho de tela (1920×1080)** do fundo, com tudo transparente fora do contêiner. **Não** cortar a tela no tamanho do objeto: o alinhamento das camadas depende disso (plan §3).
4. Conferir a borda do cabo e dos slings finos; se a ferramenta comer algum trecho, desenhar a máscara à mão.
5. Exportar os arquivos do plan §5 (Squoosh ou `npx @squoosh/cli`).

## 5. Checklist de aprovação

- [ ] Nenhum texto, número, logo ou marca em lugar nenhum da imagem
- [ ] O contêiner inteiro aparece, grande, sem cortar quina, e o cabo sai pela borda de cima
- [ ] Céu azul profundo na faixa de 15–45% da altura; um "VERDE" branco por cima continua legível
- [ ] Nada da vegetação pendura abaixo do contêiner
- [ ] A pilha de contêineres está perto da câmera, no terço de baixo, mais baixa à esquerda
- [ ] O contêiner içado se destaca da pilha (escuro × verde vivo/branco)
- [ ] O verde da vegetação é natural, não neon
- [ ] Tamanhos finais dentro do plan §5
- [ ] Os termos de uso do gerador escolhido permitem uso no projeto, e o gerador fica registrado no `tasks.md`
