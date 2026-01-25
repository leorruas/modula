# Regras de Negócio (Business Rules)

## 1. Estrutura do Projeto (Project Setup)

### 1.1. Definição do Canvas
Todo projeto começa pela definição da área de trabalho (Canvas). O sistema deve oferecer flexibilidade total de dimensões.

*   **Presets de Formato**: O sistema deve oferecer tamanhos de papel padrão para agilidade.
    *   **A4** (210 x 297 mm)
    *   **A3** (297 x 420 mm)
    *   **A5** (148 x 210 mm)
*   **Formato Customizado**: O usuário pode definir livremente a Largura e Altura.
*   **Unidades de Medida**: O sistema deve aceitar e converter as seguintes unidades:
    *   **Milímetros (mm)** - *Unidade padrão do sistema*.
    *   **Centímetros (cm)**
    *   **Pixels (px)** - Considerar resolução de tela (ex: 72 DPI ou 96 DPI) ou conversão direta para mídia digital.

### 1.2. Definição do Grid Modular
Após estabelecer o tamanho do Canvas, o usuário define o sistema de grid que dividirá essa área.

*   **Modos de Grid**:
    *   **Flexível (Padrão)**: O usuário define o número de Colunas e Linhas. O tamanho do módulo é calculado automaticamente.
    *   **Fixo**: O usuário define o **tamanho exato do módulo** (Largura e Altura em mm). O sistema calcula quantas colunas e linhas cabem na área útil do Canvas.
*   **Cálculo do Módulo**: No modo Flexível, o tamanho final de cada módulo é resultado da divisão da área útil. No modo Fixo, as Colunas/Linhas são limitadas pelo espaço disponível.
*   **Edição do Grid**: O sistema deve permitir a reconfiguração do grid (Modo, Colunas/Linhas ou Tamanho do Módulo, Margens e Gutter) a qualquer momento.

### 1.3. Páginas e Paginação

*   **Multi-Página**: O canvas suporta múltiplas páginas para documentos longos.
*   **Navegação**: Usar setas ou inputs de página para navegar entre páginas.
*   **Criação de Página**: Adicionar novas páginas dinamicamente.
*   **Exclusão de Página**: Somente se a página estiver vazia (sem gráficos).
*   **Capítulos (Chapters)**: Páginas podem ser tratadas como Capítulos nomeados (ex: "Introdução", "Mercado"). Isso é configurável por projeto.
    *   **Visualização Robusta**: A gestão de capítulos deve ter uma visualização dedicada (ex: Dashboard de Capítulos), permitindo organizar múltiplos gráficos sem o caos visual da paginação linear.

### 1.4. Reconfiguração Dinâmica do Grid

**Comportamento ao Alterar Grid (Colunas/Linhas):**

Quando o usuário altera a configuração do grid (ex: de 12×8 para 10×10), **todos os gráficos existentes são automaticamente reposicionados proporcionalmente**.

#### Regras de Reposicionamento Automático:

1. **Cálculo Proporcional**: Posição e tamanho calculados como percentuais relativos ao grid total
   - Exemplo: Chart em x=6 de 12 colunas → 50% → x=5 em 10 colunas

2. **Fórmula de Recálculo**:
   ```
   newX = round((oldX / oldColumns) × newColumns)
   newY = round((oldY / oldRows) × newRows)
   newW = max(1, round((oldW / oldColumns) × newColumns))
   newH = max(1, round((oldH / oldRows) × newRows))
   ```

3. **Clamping aos Limites**: Charts não podem ultrapassar bordas do novo grid
   - `x` clamped: `max(0, min(newX, newColumns - newW))`
   - `y` clamped: `max(0, min(newY, newRows - newH))`

4. **Tamanho Mínimo**: Largura e altura sempre ≥ 1 módulo

5. **Feedback Visual**: Toast mostra quantidade de gráficos reposicionados
   - "Grid atualizado! 5 gráfico(s) reposicionado(s)"

#### Casos Especiais:

- **Grid aumentado**: Charts mantêm espaçamento proporcional, podem ganhar módulos extras
- **Grid reduzido**: Charts encolhem proporcionalmente, respeitando mínimo de 1 módulo
- **Mesmo grid**: Nenhum chart é alterado, toast padrão "Grid atualizado com sucesso"

**Importante**: Alterações de margin/gutter NÃO disparam reposicionamento (apenas colunas/linhas).

### 1.5. Exclusão e Reorganização
*   **Excluir Página**: O usuário pode excluir páginas. Se a página contiver gráficos, o sistema deve solicitar confirmação. A exclusão da página remove permanentemente os gráficos nela contidos. O projeto deve ter no mínimo 1 página.
*   **Excluir Capítulo**:
    *   **Remover Apenas Capítulo**: Remove a marcação do capítulo, mas mantém as páginas (que passam a pertencer ao capítulo anterior ou ficam sem capítulo).
    *   **Remover Capítulo e Páginas**: Exclui o capítulo e todas as páginas associadas a ele.
*   **Reorganizar Capítulos**: O usuário pode alterar a ordem dos capítulos.
    *   **Logística de Blocos**: Ao mover um capítulo, todo o bloco de páginas associado a ele (do `startPage` até a página anterior ao próximo capítulo) é movido junto, preservando a integridade do conteúdo do capítulo.
    *   **Numeração**: As páginas são renumeradas automaticamente para refletir a nova sequência.
*   **Reorganizar Páginas**: O usuário pode mover páginas individuais (contendo gráficos) entre posições e capítulos.
    *   **Deslocamento**: Mover uma página "empurra" as páginas existentes para acomodar a nova posição (shift).
    *   **Capítulos Estáticos**: Os marcadores de início de capítulo (`startPage`) se ajustam automaticamente se páginas forem inseridas ou removidas antes deles, mantendo a consistência da estrutura.

### 1.6. Modo de Pré-visualização (Preview Mode) 👁️
O sistema deve oferecer um modo de visualização limpa para simular o resultado final da exportação:
*   **Acesso**: Botão "Toggle" na barra de ferramentas superior (ícone de Olho).
*   **Comportamento**:
    *   Oculta linhas de grid, guias de seleção e alças de redimensionamento.
    *   Oculta a Sidebar de edição.
    *   Desabilita interações de seleção e arraste de gráficos.
    *   Exibe o layout exatamente como será impresso/exportado.
*   **Saída**: O usuário clica novamente no botão para retornar ao modo de edição.

### 1.7. Interação Avançada com o Canvas 🖱️

*   **Pan com Rodinha (Middle Click)**: 
    *   O usuário deve conseguir fazer panning (arrastar o canvas) usando o botão do meio do mouse (roda).
    *   **Comportamento Universal**: Esta ação deve funcionar incondicionalmente, mesmo que o cursor esteja posicionado sobre um gráfico (o gráfico não deve capturar o clique para seleção neste caso).
*   **Deseleção de Grid (Toggle)**:
    *   Clicar em um módulo de grid já selecionado (sem arrastar) deve limpar a seleção atual.
    *   Isso permite um "Undo" rápido de seleções indesejadas sem precisar clicar fora.

## 2. Motor de Gráficos (Chart Engine)

### 2.1. Ocupação Modular
*   Nenhum gráfico pode ser "solto" no canvas.
*   Todo gráfico deve ocupar um conjunto inteiro de módulos (ex: 2x2, 4x3).
*   Ao redimensionar um gráfico, ele deve "snap" (imantar) para as linhas do grid mais próximas.
*   **Identificação de Página**: Cada gráfico pertence a uma página específica.

### 2.2. Metadados e Busca
*   **Nomenclatura**: Todo gráfico deve possuir um Nome/Título identificável.
*   **Status Editorial**: Gráficos possuem estados de fluxo de trabalho:
    *   `draft` (Rascunho)
    *   `ready` (Pronto)
    *   `published` (Publicado)
*   **Busca Global**: O sistema deve permitir buscar gráficos pelo nome e notas internas e capítulos pelo nome.
*   **Navegação**: O usuário deve conseguir "pular" para a página de um gráfico através da busca.

### 2.3. Edição e Persistência
*   **Edição Posterior**: O usuário deve conseguir selecionar um gráfico existente para reabrir suas configurações (dados, cores, tipo) e salvá-las novamente.
*   **Entrada de Dados**:
    *   **Tabela (Padrão)**: A inserção de dados deve ocorrer prioritariamente via interface visual de linhas e colunas (estilo planilha).
    *   **Importação**: O sistema deve aceitar dados colados ou importados de CSV/Excel.
    *   **Abstração Técnica**: O usuário não deve manipular JSON bruto diretamente.
    *   **Dados de Exemplo**: Botão "💡 Carregar Exemplo" ao lado do seletor de tipo preenche automaticamente dados de mockup apropriados para visualização do gráfico.

### 2.7. Importação em Lote (Bulk Import)
*   **Upload CSV/Excel**: O sistema deve permitir o upload de um arquivo contendo múltiplos datasets.
    *   **Drag & Drop**: A interface deve suportar arrastar e soltar arquivos CSV diretamente na sidebar para carregamento rápido.
*   **Fluxo de Mapeamento (Wizard)**: Após o upload, deve haver uma etapa intermediária obrigatória onde o usuário define para cada dataset identificado:
    1.  **Tipo de Gráfico**: (ex: Linha, Barras, Pizza).
    2.  **Ocupação Modular**: (ex: 2x2, 4x3, Largura Total).
*   **Geração Automática**: O sistema distribuirá os gráficos automaticamente nas páginas disponíveis ou criará novas páginas/capítulos conforme necessário para acomodar o lote.

### 2.8. Estilização
*   **Cores**: O sistema deve permitir a definição de **paletas de cores** (múltiplas cores) para um gráfico.
    *   **Lógica de Cores Inteligente**:
        *   *Série Única*: Se o gráfico (Barra/Coluna) tiver apenas 1 dataset, ele deve usar **uma cor diferente para cada categoria** (ciclando pela paleta).
        *   *Múltiplas Séries*: Se houver >1 dataset, cada série tem uma cor única uniforme para fins de comparação.
*   **Cores do Projeto**: O projeto deve manter uma paleta de cores global que pode ser aplicada rapidamente aos gráficos.
*   **Tipografia**: Deve seguir a estética editorial (fontes serifadas/modernas).
*   **Rótulos de Eixos**: Gráficos devem suportar rótulos opcionais para eixos X e Y (ex: "Mês", "Vendas em R$"), essenciais para clareza editorial.
    *   Fonte serifada (Georgia) para rótulos de eixo
    *   Posicionamento centralizado e legível
    *   Cor neutra (#666) para não competir com dados
    *   Cor neutra (#666) para não competir com dados

### 2.8.5. Efeitos Premium de Gradiente e Sombra
*   **Gradientes**: Todos os gráficos suportam gradientes premium quando `style.useGradient` é verdadeiro.
    *   **Radiais**: (Pie, Bubble, Radar, Scatter) Usam transição de 100% → 85% → 60% de opacidade para profundidade 3D.
    *   **Lineares**: (Column, Bar, Area, Histogram, Mixed) Usam transição de 100% → 70%.
*   **Sombras (Depth)**: Aplicado um filtro SVG `chartShadow` (drop-shadow sutil) aos elementos de dados para destacar o gráfico do canvas.
*   **Acabamento Cristal (Liquid Glass)**:
    *   **Definição**: Acabamento estético que simula vidro líquido ("Gummy") usando filtros morfológicos internos (Rim Light) em vez de bordas físicas.
    *   **Exclusividade**: Este acabamento é **mutuamente exclusivo** com o efeito de Gradiente. Ativar um desativa o outro automaticamente na interface.
    *   **Disponibilidade**: Disponível para todos os tipos de gráfico.
    *   **Comportamento em Linhas**: Em gráficos de linha (Line, Mixed), o filtro aplica uma erosão reduzida (0.5px) para evitar o desaparecimento de traços finos.

### 2.9 Tipos de Gráficos
O sistema deve suportar uma ampla gama de visualizações para cobrir necessidades editoriais:

#### Básicos
1.  **Barras (Bar)**: Comparação entre categorias (Horizontal).
2.  **Colunas (Column)**: Comparação entre categorias (Vertical).
    *   *Variações*: Agrupada, Empilhada.
3.  **Linha (Line)**: Evolução temporal ou sequencial.
    *   *Variações*: Simples, Múltipla.
4.  **Misto (Mixed)**: Combinação de Barras (quantitativo) e Linhas (tendência/meta).
    *   *Variações*: Múltiplas colunas agrupadas + Múltiplas linhas sobrepostas.
    *   *Controle*: Definição de tipo (Barra vs Linha) granular por dataset via Editor Avançado.
5.  **Área (Area)**: Volume e tendência.
    *   *Variações*: Simples, Empilhada.
5.  **Pizza (Pie)**: Distribuição proporcional.
6.  **Donut**: Variação da Pizza com centro vazado.
7.  **Gauge (Goal Chart)**: Visualização de metas e atingimento percentual.

#### Analíticos
7.  **Dispersão (Scatter)**: Correlação entre duas variáveis.
8.  **Bolhas (Bubble)**: Relação entre três variáveis (X, Y, Tamanho).
9.  **Histograma**: Distribuição de frequência.
10. **Boxplot**: Distribuição estatística e quartis.

### 2.10. Recomendação Heurística de Gráficos (Chart Recommendation)

*   **Análise de Dados**: Quando o usuário insere dados via CSV, o sistema deve analisar os padrões (ex: séries temporais, número de categorias, distribuição de valores) e sugerir o tipo de gráfico mais adequado.
*   **Heurísticas Implementadas**:
    *   **Boxplot**: Detecta múltiplos datasets numéricos (≥3) para comparação de distribuições.
    *   **Histogram**: Detecta grande quantidade de valores numéricos únicos (≥10) para visualizar distribuição.
    *   **Pie/Donut**: Detecta poucos valores (≤6) que somam 100% ou próximo.
    *   **Line/Area**: Detecta séries temporais ou progressões ordenadas.
    *   **Scatter**: Detecta datasets com valores dispersos (alta variância).
    *   **Radar**: Detecta múltiplas métricas (3-8). Otimizado para ocupar o máximo de espaço modular disponível (Margens: 35px Classic / 60px Infographic).
    *   **Mixed**: Detecta 2+ datasets com valores em escalas muito diferentes.
    *   **Bar/Column**: Fallback padrão para comparações categóricas.
    *   **Mixed**: Detecta 2+ datasets com escalas ou tipos de dados mistos (ex: valor absoluto vs percentual).

### 2.10.1. Lógica do Gráfico Misto (Mixed Chart Logic)
*   **Flexibilidade**: Suporta **N** Colunas agrupadas e **M** Linhas simultâneas.
*   **Definição de Tipo**:
    *   **Explícita**: O usuário define via `datasetTypes: ('bar' | 'line')[]` no Editor Avançado.
    *   **Implícita (Fallback)**: Se não definido, os primeiros N-1 datasets são Barras, e o último é Linha.
*   **Visualização**:
    *   **Colunas Agrupadas**: Datasets do tipo 'bar' são renderizados lado a lado, com espaçamento calculado automaticamente (`groupWidth`, `colWidth`).
    *   **Linhas em Camadas**: Datasets do tipo 'line' são renderizados **sobre** as barras, com sombra (`drop-shadow`) para separação visual (Figura-Fundo).
*   **Interface**: Exibir card de sugestão com botão "Aplicar Sugestão" logo abaixo da área de input CSV. A recomendação deve incluir uma breve justificativa (ex: "Série temporal detectada").

---

### 2.11. Sistema Dual-Mode: Clássico vs Infográfico 🎨

O sistema suporta **dois modos de visualização** por chart, permitindo flexibilidade entre análise técnica e impacto editorial.

#### 2.11.1. Modos Disponíveis

**Modo Clássico (default)**
- Grid lines sutis (opacity 0.15)
- Padding: 50px
- Font sizes: 11-16px
- Eixos bem definidos (opacity 0.3)
- Ideal para: dashboards, relatórios técnicos

**Modo Infográfico**
- **Zero grid** (opacity 0)
- **Padding: 100px** (espaçamento editorial)
- **Hero numbers: 56-96px** (font-weight 900)
- Eixos invisíveis (opacity 0.1)
- Stroke grosso (3-4px em linhas)
- Labels externos (Pie/Donut)
- Ideal para: publicações, apresentações

#### 2.11.1.b Hierarquia Tipográfica Proporcional (Fase 1)
- **Escalabilidade Automática**: O tamanho das fontes e pesos deve ser proporcional ao valor da barra/coluna:
    - **Valores Altos (80%+ do Max)**: 2.0x tamanho base, Peso Black (900), Caixa Alta.
    - **Valores Médios (50-80%)**: 1.5x tamanho base, Peso Semibold (600).
    - **Valores Baixos (<50%)**: 1.0x tamanho base, Opacidade Reduzida (0.6).

#### 2.11.2. Controles de Usuário (Fase 2)
- **Hero Value Override**: O usuário pode selecionar manualmente um ponto de dados como "Hero". Este ponto recebe um bônus de 1.3x de tamanho sobre sua hierarquia calculada.
- **Delta Percentage**: Exibição opcional da variação percentual (`+X%` ou `-Y%`) de cada valor em relação à média do dataset.
- **Legendas Dinâmicas**: Suporte para posicionamento em Top, Bottom, Left, Right ou ocultação total.
- **Anotações Customizadas**: Suporte para badges de texto (ex: "RECORDE") definidos manualmente no modal.

#### 2.11.3. Inteligência de Dados (Fase 3)
- **Destaque de Extremos (Opcional)**: Detecção automática e aplicação de badges 🏆 **MÁXIMO** e 🔻 **MÍNIMO**.
- **Metadados de Dados**: Suporte para leitura de anotações diretamente do objeto de dados (campo `metadata` no JSON).
- **Precedência de Badge**: Anotação Manual > Metadados > Extremos Automáticos.

#### 2.11.2. UI Toggle

**Implementação**: Toggle switch animado no ChartSidebar
- Estados: "📊 Clássico" ↔ "🎨 Infográfico"
- Visual: Cor cyan (#00D9FF) quando infográfico
- Hint: Descrição dinâmica do modo selecionado
- Salvamento: `chart.style.mode` no Firestore

#### 2.11.3. Color Presets

**4 Paletas Curadas**:

1. **Editorial Pastel**: `#FF8A80, #FFB3AD, #F5E6D3, #B2DFDB, #FFCDD2`
2. **Vibrant Modern** (default): `#00D9FF, #D4FF00, #00BFA6, #9C27B0, #FF6F00`
3. **Classic Business**: `#2563eb, #10b981, #f59e0b, #ef4444, #8b5cf6`
4. **Monochrome + Accent**: `#1a1a1a, #666666, #00D9FF, #999999, #cccccc`

**UI**: Dropdown com preview (5 círculos coloridos 24x24px)

#### 2.11.4. Charts com Dual-Mode

**Todos os 12 tipos** implementam dual-mode:
- Bar, Column, Line, Area, Pie, Donut
- Scatter, Radar, Bubble, Histogram, Mixed, Boxplot

**Diferenças visuais específicas**:
- **Pie/Donut infográfico**: Labels externos, linhas conectoras, percentuais gigantes
- **Line/Area infográfico**: Hero numbers nos pontos, stroke 4px. Margens aumentadas (Top: 60px) para evitar corte de números.
- **Bar/Column infográfico**: Valores à direita (Bar) ou acima (Column). Padding generoso (Margin Right: 80px, Left: 140px em Bar) para labels e números gigantes.
- **Pie/Donut infográfico**: Labels externos, linhas conectoras, percentuais gigantes. Padding aumentado para 80px para garantir que labels externos fiquem dentro do módulo.
- **Pictogram**:
    - *Clássico*: Ícones funcionais, legenda técnica "Cada ícone = X".
    - *Infográfico*: Ícones expandidos, tipografia de destaque para o valor total.
- **Gauge**:
    - *Clássico*: Arco moderado, legenda de progresso absoluta (ex: "75 de 100").
    - *Infográfico*: Arco dominante, foco total no percentual central (Hero number).

#### 2.11.5. Persistência

```typescript
interface ChartStyle {
  colorPalette: string[];
  fontFamily: string;
  mode?: 'classic' | 'infographic';
  colorPreset?: string;
}
```

---

### 2.12. Sistema de Ícones

#### 2.12.1. Icon Library

**Lucide React**: 18+ ícones em 6 categorias
- 👥 **People**: person, people, user
- 🎓 **Education**: student, book, school
- 💼 **Business**: briefcase, chart, money
- 💻 **Tech**: laptop, phone, server
- 🏠 **Places**: home, building, factory
- ⭐ **Symbols**: heart, star, award

#### 2.12.2. IconSelectorModal

**UI**: Modal 600px com:
- **Header**: Título + botão fechar (×)
- **Busca**: Input para filtrar ícones
- **Tabs**: 6 categorias clicáveis
- **Grid**: 6 colunas, preview 24x24px
- **Footer**: Contador + botão Cancelar

**Interação**:
- Hover: Border cyan (#00D9FF)
- Selecionado: Background cyan claro (#E6FAFF)
- Click: Seleciona e fecha modal

#### 2.12.3. Tipos com Ícones

**Bar Chart**:
- Ícone aparece à esquerda do label
- Renderizado via `foreignObject` (SVG)
- Tamanho: 16px

**Pictogram Chart** (NOVO TIPO):
- Ícones **repetidos** representam quantidades
- Calcula `valuePerIcon` automaticamente
- Layout: Grid multi-linhas (max 15 por linha)
- Legenda: "Cada ícone = X unidades"

#### 2.12.4. Persistência

```typescript
interface ChartData {
  labels: string[];
  datasets: Dataset[];
  iconConfig?: {
    category: string;
    iconKey: string;
    enabled: boolean;
    position: 'left' | 'right';
  };
}

#### 2.12.5. Lógica do Gráfico de Gauge (Metas)
- **Estrutura de Dados**: Espera ao menos um valor no dataset.
    - 1 valor: Interpretado como Valor Atual (Meta padrão = 100).
    - 2 valores: `[Valor Atual, Meta]`.
- **Cálculo**: `(Atual / Meta) * 100` limitado entre 0 e 100%.
- **Visual**: Arco semi-circular de 180 graus com valor central em destaque.
    - *Modo Infográfico*: O valor central é tratado como **Hero Number** (96px), dominando a composição. Legendas de "Atual de Meta" são omitidas para reduzir ruído visual.

---

## 3. Notificações (Toast)

### 3.1. Configuração

- **Posição**: `top-right` (não bloqueia botões inferiores)
- **Close button**: Sim (`closeButton: true`)
- **Rich colors**: Sim (verde success, vermelho error)
- **Auto-dismiss**: 3-4 segundos
- **Stack**: Empilha múltiplas notificações

### 3.2. Casos de Uso

- ✅ "Gráfico criado com sucesso!"
- ✅ "Gráfico atualizado"
- ✅ "Projeto salvo"
- ❌ "Erro ao atualizar: JSON inválido"
- ℹ️ Feedback de ações do usuário

---

## 4. Regras de Layout Inteligente (Smart Layout Rules)

O **Smart Layout Engine** é o árbitro final de todas as dimensões do gráfico, substituindo cálculos locais por uma orquestração centralizada.

### 4.1. Cálculo de Margens Dinâmicas
As margens não são fixas; elas "respiram" conforme o conteúdo:
- **Margem Esquerda (Gutter)**: Calculada medindo o pixel-width do label mais longo do eixo Y ou das categorias. No modo Infográfico, adiciona-se um "Optical Gutter" de 18-24px.
- **Margem Direita (Value Reserve)**: Reserva espaço para o `maxValue` (medido em pixels) + badges de anotação (Max/Min) + buffer de segurança de 15px.
- **Margem Inferior/Superior**: Ajustada pelo número de linhas resultantes do cross-wrapping de legendas e títulos.

### 4.2. Universal Legend Solver
A legenda dita o espaço útil do gráfico:
- **Lateral (Left/Right)**: O sistema mede o item mais largo da legenda e reserva exatamente esse espaço. Se a legenda for curta, o `plotArea` se expande horizontalmente para ocupar o vácuo.
- **Vertical (Top/Bottom)**: O sistema simula a quebra de linha (wrapping) da legenda e reserva a altura exata necessária (N linhas * line-height), eliminando espaços em branco "mortos".

### 4.3. Hierarquia Anti-Conflito (Anti-Wrapping Policy)
Para evitar que labels se sobreponham, o sistema segue esta ordem de tentativa:
1.  **Wrap**: Quebrar em até 3 linhas (se houver altura).
2.  **Stagger**: Alternar labels em duas alturas diferentes (odd/even).
3.  **Abbreviate**: Usar dicionário semântico (ex: "Janeiro" -> "Jan").
4.  **Rotate**: Inclinar 45 graus (último recurso).
5.  **LOD (Level of Detail)**: Ocultar elementos secundários se o "Ratio de Ilegibilidade" for alto.

**Regras de Quebra de Linha (Line Break):**
*   **Limite de Palavras**: Máximo de 12 palavras por linha para evitar leitura cansativa ("wall of text").
*   **Viúvas (Widows)**: Nunca deixar uma única palavra isolada na última linha, a menos que seja inevitável. O sistema deve tentar acomodá-la na linha anterior se houver espaço.

### 4.4. Vacuum-Seal (Elasticidade Total)
- **Vertical Fill**: Se a altura dos dados for menor que a altura do container, o sistema expande a espessura das barras (até um cap de 120px) e o espaçamento entre elas para preencher o módulo completamente.
- **Gravity Well**: Elementos como títulos e legendas "puxam" o gráfico para perto (proximidade de 24px), forçando o Plot Area a expandir no espaço restante.

---

### 2.13. Hierarquia de Carregamento de Estilos (Style Priority)
Para garantir consistência e agilidade, o sistema carrega estilos seguindo esta ordem de precedência:

1.  **Estilo do Gráfico (Editando)**: Se o usuário estiver editando um gráfico, as configurações salvas nele são mantidas.
2.  **Padrão do Projeto**: Novos gráficos herdam o `defaultStyle` definido no objeto do `Project`.
3.  **Preferências do Usuário**: Se o projeto não tem padrões, o sistema busca o `defaultStyle` no perfil do usuário (`/users/{userId}/preferences`).
4.  **Sistema (Hardcoded Fallback)**: Se nenhuma preferência for encontrada, o sistema aplica o modo "Classic" com variações de Cinza.

