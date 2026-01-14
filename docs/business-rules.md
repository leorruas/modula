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

*   **Lógica de Divisão**: O grid é calculado dividindo a área útil (Canvas - Margens) pelo número de módulos.
*   **Parâmetros Configuráveis**:
    *   **Margens (Margins)**: Espaço vazio ao redor de todo o canvas (Top, Bottom, Left, Right).
    *   **Colunas (Columns)**: Quantidade de divisões verticais.
    *   **Linhas (Rows)**: Quantidade de divisões horizontais.
    *   **Gutter (Calha)**: Espaçamento entre as colunas e linhas.
*   **Cálculo do Módulo**: O tamanho final de cada módulo é resultado dessa equação matemática.
*   **Edição do Grid**: O sistema deve permitir a reconfiguração do grid (Colunas, Linhas, Margens e Gutter) a qualquer momento dentro do editor do projeto. Ajustes no grid não devem, idealmente, destruir layouts existentes, apenas reagrupar se necessário (ou manter posição absoluta se desejado).

### 1.3. Paginação (Pagination)
*   **Múltiplas Páginas**: Um projeto pode conter múltiplas páginas.
*   **Formato Único**: Todas as páginas de um projeto seguem o mesmo Grid e Formato definidos no projeto.
*   **Navegação**: O editor deve permitir navegar ou rolar entre as páginas.
*   **Capítulos (Chapters)**: Páginas podem ser tratadas como Capítulos nomeados (ex: "Introdução", "Mercado"). Isso é configurável por projeto.
    *   **Visualização Robusta**: A gestão de capítulos deve ter uma visualização dedicada (ex: Dashboard de Capítulos), permitindo organizar múltiplos gráficos sem o caos visual da paginação linear.

### 1.4. Exclusão e Reorganização
*   **Excluir Página**: O usuário pode excluir páginas. Se a página contiver gráficos, o sistema deve solicitar confirmação. A exclusão da página remove permanentemente os gráficos nela contidos. O projeto deve ter no mínimo 1 página.
*   **Excluir Capítulo**:
    *   **Remover Apenas Capítulo**: Remove a marcação do capítulo, mas mantém as páginas (que passam a pertencer ao capítulo anterior ou ficam sem capítulo).
    *   **Remover Capítulo e Páginas**: Exclui o capítulo e todas as páginas associadas a ele.

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
*   **Fluxo de Mapeamento (Wizard)**: Após o upload, deve haver uma etapa intermediária obrigatória onde o usuário define para cada dataset identificado:
    1.  **Tipo de Gráfico**: (ex: Linha, Barras, Pizza).
    2.  **Ocupação Modular**: (ex: 2x2, 4x3, Largura Total).
*   **Geração Automática**: O sistema distribuirá os gráficos automaticamente nas páginas disponíveis ou criará novas páginas/capítulos conforme necessário para acomodar o lote.

### 2.8. Estilização
*   **Cores**: O sistema deve permitir a definição de **paletas de cores** (múltiplas cores) para um gráfico, não apenas uma cor única. Isso é essencial para diferenciar séries de dados ou categorias (ex: Pizza, Barras Empilhadas).
*   **Cores do Projeto**: O projeto deve manter uma paleta de cores global que pode ser aplicada rapidamente aos gráficos.
*   **Tipografia**: Deve seguir a estética editorial (fontes serifadas/modernas).
*   **Rótulos de Eixos**: Gráficos devem suportar rótulos opcionais para eixos X e Y (ex: "Mês", "Vendas em R$"), essenciais para clareza editorial.
    *   Fonte serifada (Georgia) para rótulos de eixo
    *   Posicionamento centralizado e legível
    *   Cor neutra (#666) para não competir com dados

### 2.9 Tipos de Gráficos
O sistema deve suportar uma ampla gama de visualizações para cobrir necessidades editoriais:

#### Básicos
1.  **Barras (Bar)**: Comparação entre categorias (Horizontal).
2.  **Colunas (Column)**: Comparação entre categorias (Vertical).
    *   *Variações*: Agrupada, Empilhada.
3.  **Linha (Line)**: Evolução temporal ou sequencial.
    *   *Variações*: Simples, Múltipla.
4.  **Área (Area)**: Volume e tendência.
    *   *Variações*: Simples, Empilhada.
5.  **Pizza (Pie)**: Distribuição proporcional.
6.  **Donut**: Variação da Pizza com centro vazado.

#### Analíticos
7.  **Dispersão (Scatter)**: Correlação entre duas variáveis.
8.  **Bolhas (Bubble)**: Relação entre três variáveis (X, Y, Tamanho).
9.  **Histograma**: Distribuição de frequência.
10. **Boxplot**: Distribuição estatística e quartis.

#### Comparativos e Híbridos
11. **Comparativos**: Ranking, Antes vs Depois.
12. **Mistos**: Combinação de Barras/Colunas com Linhas (ex: Pareto, Chuva vs Temperatura).
13. **Radar**: Comparação multivariada.

### 2.6. Interação no Editor
*   **Pan**: O usuário deve conseguir arrastar (Pan) o canvas segurando a tecla Espaço ou Shift.
*   **Zoom**: Zoom in/out deve ser centrado no cursor ou no centro da tela.
*   **Seleção**: Áreas vazias podem ser selecionadas para criação. Gráficos existentes podem ser selecionados para edição.

### 2.10. Recomendação Inteligente de Gráficos
O sistema deve sugerir automaticamente o tipo de gráfico mais adequado com base nos dados fornecidos (CSV/colagem), sem uso de IA. A recomendação é baseada em heurísticas:

#### Regras de Recomendação (por prioridade):
1.  **Boxplot**: Se houver exatamente 5 datasets com rótulos contendo Min, Q1, Mediana, Q3, Max.
2.  **Histograma**: Dataset único com muitos pontos (>8) e rótulo sugerindo "frequência" ou "distribuição".
3.  **Pizza/Donut**: 
    *   Dataset único com valores positivos
    *   Dados somam ~100 (percentuais) OU
    *   3-7 categorias (proporções/partes de um todo)
4.  **Linha/Área**: Labels parecem datas (anos 1900-2099, formatos DD/MM, YYYY-MM, meses por extenso).
    *   Múltiplos datasets positivos → Área (acumulado)
    *   Caso contrário → Linha
5.  **Dispersão**: Labels contêm "vs" ou "versus" (correlação).
6.  **Radar**: 2+ datasets, 3-10 dimensões categóricas com keywords de habilidades/desempenho.
7.  **Misto**: Dois datasets com escalas muito diferentes (razão > 5x).
8.  **Barras**: Mais de 10 categorias (horizontal facilita leitura de labels longos).
9.  **Colunas**: Padrão para comparação entre categorias.

#### Interface
*   A sugestão é exibida em um alerta azul com botão "Aplicar Sugestão".
*   A explicação contextual justifica a escolha (ex: "Dados temporais detectados").
