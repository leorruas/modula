# Sugestões de Layout: Gráficos Circulares (Pie & Donut)

Este documento detalha as melhorias propostas para a renderização de gráficos circulares no sistema Modula, focando em inteligência de layout, aproveitamento de espaço e legibilidade em cenários de alta densidade de dados.

## 1. Spider Legs (Perninhas de Aranha)
**Problema**: Em gráficos com muitas fatias pequenas (crowded data), os rótulos e valores colidem no centro ou nas bordas, tornando-se ilegíveis.
**Solução**: Implementar um algoritmo de anti-colisão "Spider".

- **Trigger**: Ativado quando `sliceAngle < 15°` ou quando o número de fatias ultrapassa um limite (ex: 8 fatias).
- **Mecânica**: 
  - Os rótulos são empurrados para fora do raio do gráfico em duas colunas verticais (esquerda e direita).
  - Uma linha conectora (polyline) liga o centroide da fatia ao rótulo.
  - As linhas têm um ponto de inflexão para manter a estética "magazine-quality".
- **Opção do Usuário**: Esta feature deve ser controlável por uma flag `showAllLabels` ou `spiderLabels: boolean`.

## 2. Gestão de Colisão de Números e Rótulos
**Problema**: Números (porcentagens) sobrepondo o nome da categoria ou saindo da área visível.
**Solução**: Arbitragem de Centroide.

- **Inteligência de Espaço**: O motor de layout calcula se a `boundingbox` do texto (Categoria + Valor) cabe dentro da fatia.
- **Degradação Graciosa**: 
  1. Se cabe -> Renderiza dentro da fatia (Empilhado: Nome em cima, Valor embaixo).
  2. Se não cabe -> O nome vai para a "Perninha de Aranha" e o valor fica na borda externa da fatia.
  3. Se a fatia é "micro" -> Ambos os elementos são movidos para fora via Spider Legs.

## 3. Contraste Inteligente (Accessibility-Aware)
**Problema**: Números pretos em fatias escuras (ex: Violeta escuro) são ilegíveis.
**Solução**: Cálculo de Luminância Dinâmica.

- **getContrastColor**: Uma função que analisa o hexadecimal da fatia. Se a luminância for menor que 0.5, o texto renderizado *dentro* da fatia deve ser Branco. Caso contrário, Preto.
- **Borda de Segurança**: Para rótulos externos, aplicar uma leve sombra ou "halo" se o fundo do gráfico for personalizado.

## 4. Integração com Smart Layout (Aproveitamento de Espaço)
**Problema**: Gráficos circulares costumam deixar muito "espaço morto" nos cantos por serem quadrados em containers retangulares.
**Solução**: Recuperação de Margens Laterais.

- **Legend Squeeze**: Em modo infográfico, a legenda deve ser compactada em colunas dinâmicas para liberar altura.
- **Auto-Scale**: Se houver muitas perninhas de aranha de um lado só, o centro do gráfico (centerX) deve sofrer um leve "nudge" para o lado oposto, maximizando a área de plotagem.
- **LOD (Level of Detail)**: Se o container for menor que 150px, esconder rótulos externos e converter para "Iconographic Mode" (apenas o gráfico e tooltip).

## 5. Curadoria de Cores
**Problema**: Cores muito próximas dificultam a distinção de fatias adjacentes.
**Solução**: Paletas Harmônicas Distintas.

- **Geração Determinística**: As cores devem ser atribuídas baseadas no nome da categoria (persistência visual).
- **Distinct Colors**: Garantir que fatias vizinhas tenham uma diferença mínima de matiz (hue) de 30 graus.

## 6. Donut: Narrative Center
**Sugestão**: Em vez de apenas o "Total", o centro do Donut pode alternar entre:
- Total da categoria principal (Hero).
- Share percentual da fatia selecionada (hover).
- Uma "Golden Circle" ratio de 0.618 para máxima elegância estética.
