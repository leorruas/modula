---
description: Histórico de aprendizados arquiteturais para evitar regressões
---

# 🧠 Modula: Aprendizados e Invariantes

Este documento registra as "pegadinhas" e aprendizados recorrentes para garantir a estabilidade do app modula.

## 🎨 SVG & Gradients

1.  **Nesting de Defs**: NUNCA coloque um `<defs>` dentro de outro. O React ou o browser pode ignorar o conteúdo aninhado, resultando em gráficos "vazios" ou sem gradiente.
    -   *Solução*: Use uma estrutura linear no topo do SVG ou remova as tags `<defs>` extras de strings injetadas via `dangerouslySetInnerHTML`.
2.  **IDs Determinísticos**: Em contextos de exportação ou renderização múltipla, `useId()` do React pode não ser estável o suficiente.
    -   *Solução*: Use prefixos robustos e, se necessário, passe IDs explícitos para garantir que referências como `url(#id)` funcionem em PDF/PNG.
3.  **Stale Closures em Event Listeners**: Ao usar `addEventListener` dentro de `useEffect` para ações globais (como atalhos ou eventos de exportação), **TODAS** as variáveis de estado usadas dentro do handler devem estar no array de dependências.
    -   *Caso Real*: O `handleExport` capturava `activePage` apenas no mount (valor 1), ignorando a página atual do usuário ao gerar o nome do arquivo.

4.  **Estratégias de Exportação de Gráficos (PDF)**:
    -   **Raster (html-to-image)**: Ideal para gráficos visuais complexos (sombras, blur, glassmorphism), mas **frágil** com SVG filtros pesados (`defs` instáveis) e transições CSS ativas (geram telas brancas).
    -   **Vector (svg2pdf)**: Ideal para geometria pura (Treemaps), garantindo nitidez e evitando "telas brancas".
    -   **Font Fallback**: PDFs vetoriais exigem fontes padrão ("Helvetica") explicitamente setadas nos nós de texto SVG, caso contrário, fallback para Times New Roman (Serif).

## 📏 Spatial Reasoning (Espacialidade)

1.  **Margens de Label**: Gráficos que usam "Spider Legs" (ex: Treemap, Pie) precisam de um buffer horizontal/vertical explícito no Motor de Layout. Se o motor usar 100% da largura para o gráfico, os labels externos serão cortados.
    -   *Solução*: Garanta que o `plotZone` calculado no `SmartLayoutEngine` reserve pelo menos 60px de padding quando houver labels externos.
2.  **Sincronização de Fontes**: O motor de layout e o componente visual DEVEM compartilhar a mesma lógica de multiplicadores de fonte (ex: Modo Infográfico 4.5x).

## 📄 Exportação (PDF/PNG)

1.  **Tempo de Estabilização (Settlement)**: Gráficos Modula possuem transições de entrada (0.6s). Capturar o canvas antes disso resulta em imagens vazias ou incompletas.
    -   *Aprendizado*: O `PDFExportService` deve esperar pelo menos 800ms antes de rasterizar cada gráfico.
2.  **Rasterização vs Vetorial**: Usamos rasterização (html-to-image) para garantir que efeitos complexos como `filter: drop-shadow` e `glass finish` apareçam no PDF. Capturas vetoriais puras costumam quebrar esses filtros.
3.  **Filtros SVG em Alta Resolução**: Filtros complexos como `backdrop-filter` ou referências SVG (`url(#id)`) podem causar falha total (tela branca) no `html-to-image` quando o `pixelRatio` é alto (> 2).
    -   *Solução*: No `exportUtils`, usamos o callback `onClone` para remover filtros problemáticos durante a exportação, priorizando a legibilidade sobre o "eye candy" se necessário.
4.  **Nomes de Arquivo**: Ao gerar arquivos baseados em capítulos, use a página *alvo* (`targetPage`) como prefixo numérico (ex: "34."), e não a página de *início* do capítulo, para evitar confusão.

## 🚀 Workflows Relacionados
- [/create_new_chart](file://.agent/workflows/create_new_chart.md): Como adicionar novos tipos seguindo estes padrões.
