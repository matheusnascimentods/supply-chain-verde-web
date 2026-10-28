# Prompt da imagem da hero

> Usado pela [`spec.md`](spec.md) (RNF-01) e pelo [`plan.md`](plan.md) §3 e §5. Os prompts estão em inglês porque os geradores seguem melhor instruções em inglês. As explicações estão em português.

## 1. O que a imagem precisa resolver

| Requisito | Por quê |
|---|---|
| Contêiner içado **no centro horizontal, terço superior-médio**, inteiro, com cabo e gancho visíveis até a borda de cima | O "VERDE" passa atrás dele (plan §3) |
| Céu **limpo e uniforme** atrás do contêiner, sem prédio nem guindaste cruzando | O recorte (§4) precisa de borda limpa, e o "VERDE" branco precisa de fundo legível |
| Pilha de contêineres **só no quinto inferior**, e mais baixa à esquerda | O card de vidro fica embaixo à esquerda |
| 16:9 com folga nas laterais | `object-fit: cover` corta as bordas em telas mais largas ou mais estreitas |
| Fotorrealista, sem texto, sem logo, sem pessoas | É a imagem 100% nossa, sem marca de terceiros |

## 2. Prompt principal (qualquer gerador)

```text
Ultra-realistic editorial advertising photograph for a sustainable supply-chain technology brand.

SUBJECT: a single 20-foot steel shipping container suspended in mid-air by a crane, centered horizontally and placed in the upper-middle third of the frame, seen from slightly below (low angle, 10–15° tilt up), rotated about 20° so one long side and one short end are visible. The container is painted deep forest green (#14532d), matte, with subtle wear, and is overgrown with living vegetation: thick moss carpeting the roof, ferns and small leafy plants spilling over the top edges, ivy trailing down the corrugated sides, a few leaves catching the light. Four steel lifting slings run from the container's top corners up to a yellow-and-black striped crane hook block; the crane cable continues straight up and exits the TOP edge of the frame. Nothing else is attached to the container.

BACKGROUND: vast clear late-morning sky, saturated cerulean blue at the top fading to a soft warm white with a faint green tint near the horizon, a few thin wispy high clouds far from the container, no buildings, no crane structure, no birds, no aircraft. The sky directly around the container must be clean and uniform.

FOREGROUND: only in the bottom fifth of the frame, a cropped stack of shipping containers in alternating forest green (#166534) and off-white (#f1f5f9), corrugated metal, sharp detail, the stack is lower on the left side and taller on the right side, partially cut off by the bottom and right edges.

LIGHT: bright natural sunlight from the upper right, crisp soft shadows, gentle rim light on the container edges, high dynamic range, clean bright color grading, slightly lifted shadows, no haze.

CAMERA: full-frame camera, 35mm lens, f/8, deep focus, tack-sharp container, 8K detail, commercial product photography, minimalist composition with generous negative space.

STRICTLY NO: text, letters, numbers, logos, brand marks, watermarks, signage on the containers, people, vehicles, ships, ports, buildings, birds, lens flare, vignette, motion blur, fisheye distortion, cartoon or 3D-render look, oversaturated neon greens.

Aspect ratio 16:9.
```

## 3. Versões por gerador

### Midjourney v7

```text
ultra-realistic editorial advertising photo, single 20ft shipping container suspended mid-air by a crane, centered in the upper-middle third, low angle, rotated 20°, deep forest green matte steel overgrown with living moss on the roof, ferns spilling over the edges, ivy trailing down corrugated sides, four steel slings to a yellow-black striped crane hook, cable exiting the top of the frame, vast clear cerulean sky fading to warm white near the horizon, thin wispy high clouds, bottom fifth: cropped stack of forest green and off-white containers, lower on the left, bright sunlight from upper right, crisp shadows, 35mm, f/8, tack sharp, minimalist, generous negative space --ar 16:9 --style raw --stylize 150 --quality 2 --no text, letters, logo, watermark, people, buildings, ships, birds, lens flare, vignette, cartoon, 3d render
```

Para variações: `--seed <número>` mantém o enquadramento enquanto se ajusta o resto, e `--chaos 10` explora de leve.

### ChatGPT / GPT-image · Gemini / Imagen · Flux

- Usar o **prompt principal (§2)** sem alteração e pedir **1792×1024** ou **16:9**.
- Flux: `guidance 3.5`, `steps 40`. Se o gerador tiver campo de prompt negativo, mover para ele o bloco "STRICTLY NO".
- Se o modelo puser texto ou logo no contêiner, mandar na mesma conversa: `Same image, remove every letter, number, logo and marking from all containers; keep everything else identical.`

### Fundo mobile (9:16)

Gerar só se o recorte vertical do 16:9 não ficar bom. Adicionar ao fim do prompt principal:

```text
Vertical 9:16 composition: the suspended container occupies the center of the upper half, the container stack fills only the bottom 15% of the frame, and the sky between them stays clean for overlaid text.
```

## 4. Recorte do contêiner (camada `hero-subject`)

1. Escolher a melhor imagem 16:9 e exportar em **2560×1440** (upscale do gerador ou Upscayl).
2. Recortar **só** o contêiner içado + slings + gancho + cabo, sem a pilha de baixo. Ferramentas: remove.bg, Photoroom, a seleção de objeto do Photoshop, ou `rembg` (`pip install rembg && rembg i hero.png subject.png`).
3. O arquivo do recorte precisa ter **o mesmo tamanho de tela (2560×1440)** do fundo, com tudo transparente fora do contêiner. **Não** cortar a tela no tamanho do objeto: o alinhamento das camadas depende disso (plan §3).
4. Conferir a borda do cabo fino; se a ferramenta comer o cabo, desenhar a máscara à mão nesse trecho.
5. Exportar os tamanhos e formatos do plan §5 (Squoosh ou `npx @squoosh/cli`).

## 5. Checklist de aprovação

- [ ] Nenhum texto, número, logo ou marca em lugar nenhum da imagem
- [ ] O contêiner inteiro aparece, sem cortar quina, e o cabo sai pela borda de cima
- [ ] Céu limpo ao redor do contêiner; um "VERDE" branco por cima continua legível
- [ ] A pilha de contêineres ocupa só a faixa de baixo e é mais baixa à esquerda
- [ ] O verde da vegetação é natural, não neon
- [ ] O recorte encaixa no fundo sem halo
- [ ] Tamanhos finais dentro do plan §5
- [ ] Os termos de uso do gerador escolhido permitem uso no projeto, e o gerador fica registrado no `tasks.md`
