# Análise de Variáveis para Exportação de Gráficos e Sistema Inteligente

Este documento analisa as variáveis envolvidas na renderização e exportação de gráficos para PDF, visando a criação de um sistema de cálculo inteligente que garanta fidelidade absoluta entre o grid da tela e o arquivo final.

---

## 1. O Problema
Atualmente, existe uma desconexão entre a renderização na tela (baseada em pixels, zoom do navegador e containers flexíveis) e a exportação para PDF (milímetros físicos, 300 DPI fixo). Isso resulta em:
*   Gráficos cortados ou com scroll não capturado.
*   Fontes ilegíveis ou desproporcionais.
*   Diferença visual entre o que o usuário vê no Grid e o que sai no PDF.

## 2. Variáveis (O que muda)

Estes são os inputs dinâmicos que o "Sistema Inteligente" deve monitorar e reagir.

### A. Inputs do Usuário (Layout & Design)
| Variável | Descrição | Impacto no Export |
| :--- | :--- | :--- |
| **Grid Slots (W x H)** | Espaço designado pelo usuário no grid (ex: 2x2, 4x3). | Determina o *Container Box* máximo permitido. O gráfico **precisa** caber aqui. |
| **Formato de Página** | A4, A3, Custom (mm). | Define o limite físico absoluto. Um grid 4x4 no A4 é muito menor que no A3. |
| **Margens & Gutter** | Espaçamento entre gráficos. | Reduz a área útil real de cada slot. |
| **Escala de Fonte** | Tamanho base da fonte (pt/px). | Afeta o cálculo de "Natural Height". Fontes maiores exigem mais espaço vertical. |

### B. Inputs de Conteúdo (Dados)
| Variável | Descrição | Impacto no Export |
| :--- | :--- | :--- |
| **Volume de Dados** | Quantidade de barras, linhas ou fatias. | Define a densidade horizontal. Muitos dados = colunas finas ou necessidade de rolagem (que é inaceitável no PDF). |
| **Comprimento de Labels** | Texto dos eixos e legendas. | Variável mais crítica. Labels longos "empurram" o gráfico para cima ou para baixo, comendo espaço do desenho. |
| **Valores Extremos** | Diferença entre Min/Max (Escala Y). | Afeta a largura reservada para o eixo Y (se visível) ou labels de dados. |

### C. Contexto Técnico
| Variável | Descrição | Impacto no Export |
| :--- | :--- | :--- |
| **Resolução de Tela** | Largura da janela do navegador (Viewport). | **CRÍTICO HOJE:** O export atual captura a tela. Se a tela for pequena, o export sai com baixa qualidade ou layout mobile. |
| **Pixel Ratio** | Densidade de pixels do monitor (Retina vs Standard). | Afeta a nitidez da rasterização inicial antes do PDF. |

---

## 3. Constantes (O que é Fixo)

Estes são os limites inegociáveis que o sistema deve respeitar.

1.  **Dimensões Físicas do PDF**: Um A4 tem sempre 210x297mm. O espaço é finito.
2.  **Legibilidade Mínima**: Fontes abaixo de 6pt são ilegíveis em impresso. O sistema não pode simplesmente "encolher infinitamente" um gráfico para caber; ele deve atingir um limite e avisar ou mudar o layout.
3.  **Identidade Visual (Brand)**: Cores, famílias tipográficas e espessuras de linha são fixas (definidas no tema).
4.  **Rasterização (Limitação Técnica)**: Como usamos efeitos de vidro (glassmorphism) e gradientes complexos, a exportação **deve** ser via Imagem (PNG) e não Vetor puro (SVG in PDF), para garantir fidelidade visual dos efeitos.

---

## 4. O Sistema Inteligente de Cálculo (Proposta)

Para garantir que o gráfico ocupe *sempre* e *exatamente* o espaço designado, precisamos inverter a lógica. Hoje, o gráfico "empurra" o container (Natural Height). O sistema ideal deve ser "Container-First".

### Conceito 1: O "Virtual Viewport"
Ao invés de capturar a tela do usuário (que pode ser pequena), o sistema de exportação deve renderizar os gráficos em um container invisível (off-screen) com dimensões fixas e ideais para o PDF alvo.
*   *Exemplo:* Se o usuário escolheu A4, renderizamos o gráfico internamente em um canvas de 2480px de largura (eq. 300dpi A4) antes de gerar a imagem.

### Conceito 2: Cálculo de Loop de Feedback (Layout Solver)
Antes de renderizar, o sistema deve rodar um cálculo matemático simples:
1.  **Input**: Área Disponível (WxH em mm).
2.  **Cálculo**: Área necessária para Labels + Legendas.
3.  **Resultado**: Área restante para o Gráfico (Bars/Lines).
4.  **Verificação**: Se Área Restante < Mínimo Aceitável -> Ação de Correção.

### Ações de Correção Automática (A "Inteligência")
Se o gráfico não couber no espaço designado, o sistema deve tomar decisões autônomas (em ordem de prioridade):
1.  **Densidade**: Reduzir padding entre barras.
2.  **Tipografia**: Reduzir tamanho da fonte (até o limite de legibilidade).
3.  **Layout Alternativo**: Mudar legenda de "Top" para "Right" ou "Overlay".
4.  **Aviso Crítico**: Se nada funcionar, avisar o usuário que "O dado não cabe no slot selecionado".

---

## 5. Limitações Atuais vs. Solução

| Limitação Atual | Solução Proposta |
| :--- | :--- |
| **Dependência da Tela**: O PDF reflete o tamanho do monitor do usuário. | **Headless Rendering**: Renderizar em dimensões virtuais fixas baseadas no formato de saída (A4, etc) independente do monitor. |
| **Overflow "Dumb"**: Gráficos cortados se excederem o tamanho. | **Container Query**: O gráfico sabe seu tamanho e reage (esconde elementos, reduz fonte) para nunca estourar. |
| **Squashing**: Gráficos esticados ou achatados. | **Aspect Ratio Lock**: Manter a proporção 1:1 entre o design do Grid e a saída. |

---

## Recomendação Imediata (Próximos Passos)

1.  **Refatorar o `PDFExportService`**: Implementar o conceito de "Virtual Viewport". O export não pode depender do `offsetWidth` da tela visível. Ele deve forçar uma largura fixa baseada na configuração de página do projeto.
2.  **Padronizar Componentes**: Criar um hook `useChartDimensions` que receba as dimensões do container e retorne as métricas calculadas (font size, margins) para garantir que o componente obedeça o container pai, e não o contrário.
