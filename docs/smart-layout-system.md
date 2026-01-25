# Smart Layout System - Especificação Técnica

> **Objetivo**: Sistema inteligente que orquestra automaticamente as ~150 variáveis de posicionamento e dimensionamento para garantir layouts ótimos tanto no App quanto no PDF exportado.

---

## 1. Visão Geral

### 1.1 Problema a Resolver

Os gráficos do Modula possuem **150+ variáveis** distribuídas em 6 camadas de abstração, cada uma calculada de forma isolada. Isso causa:

1. **Overflow de labels** - Texto vaza para fora do container
2. **Inconsistência entre modos** - Infographic vs Classic têm regras diferentes
3. **Quebra no export PDF** - Posições não mapeiam corretamente
4. **Layout subótimo** - Espaço desperdiçado ou elementos comprimidos

### 1.2 Solução Proposta

Um **Smart Layout Engine** centralizado que:

```
┌──────────────────────────────────────────────────────────────────┐
│                    SMART LAYOUT ENGINE                            │
├──────────────────────────────────────────────────────────────────┤
│  INPUT                                                            │
│  ├─ ChartType, ChartData, ChartStyle, InfographicConfig          │
│  ├─ GridConfig (columns, rows, margins, gutter)                  │
│  └─ TargetOutput ('screen' | 'pdf')                              │
├──────────────────────────────────────────────────────────────────┤
│  PROCESSING                                                       │
│  ├─ LayoutCalculator: Compute optimal zones                      │
│  ├─ ConstraintSolver: Balance competing needs                    │
│  ├─ AdaptiveScaler: Apply scaleFactor intelligently              │
│  └─ ExportValidator: Ensure PDF compatibility                    │
├──────────────────────────────────────────────────────────────────┤
│  OUTPUT                                                           │
│  ├─ ComputedLayout: All margins, sizes, positions                │
│  ├─ Warnings: Potential issues detected                          │
│  └─ Suggestions: Recommended adjustments                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Arquitetura do Sistema

### 2.1 Camadas de Abstração (Existentes)

```
CONFIGURAÇÃO → CÁLCULO → COMPONENTE → ELEMENTOS → ANOTAÇÕES → EXPORT
```

### 2.2 Nova Camada: Layout Intelligence

```typescript
// src/services/smartLayoutEngine.ts

interface SmartLayoutEngine {
    // Análise de contexto
    analyzeChart(chart: Chart, gridConfig: GridConfig): ChartAnalysis;
    
    // Cálculo de layout
    computeLayout(analysis: ChartAnalysis, target: 'screen' | 'pdf'): ComputedLayout;
    
    // Validação
    validateLayout(layout: ComputedLayout): ValidationResult;
    
    // Recomendações
    suggestOptimizations(layout: ComputedLayout): Suggestion[];
}
```

---

## 3. Tipos e Interfaces

### 3.1 ChartAnalysis

```typescript
interface ChartAnalysis {
    // Identificação
    chartType: ChartType;
    mode: 'classic' | 'infographic';
    
    // Complexidade de dados
    dataComplexity: {
        categoryCount: number;      // Número de labels
        datasetCount: number;       // Número de séries
        maxValue: number;
        minValue: number;
        hasNegatives: boolean;
        maxLabelLength: number;     // Caracteres do maior label
        avgLabelLength: number;
    };
    
    // Requisitos de layout
    layoutRequirements: {
        needsLegend: boolean;
        needsAxisLabels: boolean;
        hasAnnotations: boolean;
        hasBadges: boolean;
        heroValueIndex?: number;
    };
    
    // Espaço disponível
    availableSpace: {
        width: number;
        height: number;
        aspectRatio: number;
    };
    
    // Aspect ratio ideal para o tipo
    idealAspectRatio: number;
}
```

### 3.2 ComputedLayout

```typescript
interface ComputedLayout {
    // Container externo
    container: {
        width: number;
        height: number;
    };
    
    // Áreas calculadas
    zones: {
        legend: Zone | null;
        plot: Zone;
        xAxis: Zone | null;
        yAxis: Zone | null;
        badges: Zone | null;
    };
    
    // Margens computadas
    margins: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    
    // Parâmetros de scaling
    scaling: {
        factor: number;
        appliedTo: ('margins' | 'fontSize' | 'elements')[];
    };
    
    // Parâmetros específicos do tipo
    typeSpecific: Record<string, number>;
    
    // Metadata para export
    exportMetadata: {
        requiredPadding: number;
        safeArea: Zone;
        overflowRisk: 'none' | 'low' | 'medium' | 'high';
    };
}

interface Zone {
    x: number;
    y: number;
    width: number;
    height: number;
}
```

### 3.3 ValidationResult

```typescript
interface ValidationResult {
    isValid: boolean;
    
    errors: Array<{
        code: string;
        message: string;
        severity: 'critical' | 'warning' | 'info';
        affectedZone: string;
    }>;
    
    metrics: {
        plotAreaRatio: number;      // % do espaço para dados
        labelFitScore: number;      // 0-1 (labels cabem?)
        exportSafetyScore: number;  // 0-1 (vai funcionar no PDF?)
    };
}
```

---

## 4. Regras do Motor de Layout

### 4.1 Hierarquia de Prioridade de Espaço

| Prioridade | Zona | % Mínimo | % Ideal |
|------------|------|----------|---------|
| 1 | Plot Area (dados) | 50% | 60-70% |
| 2 | Labels/Eixos | 10% | 15% |
| 3 | Legenda | 10% | 15% |
| 4 | Badges/Annotations | 5% | 10% |
| 5 | Export Padding | 5% | 5% |

### 4.2 Regras por Tipo de Gráfico

```typescript
const CHART_TYPE_RULES: Record<ChartType, LayoutRules> = {
    bar: {
        idealAspectRatio: 4/3,
        preferredOrientation: 'landscape',
        legendPosition: 'bottom',
        marginPriority: ['left', 'top', 'bottom', 'right'],
        minPlotWidth: 0.5,
        labelStrategy: 'wrap-at-edge'
    },
    column: {
        idealAspectRatio: 3/4,
        preferredOrientation: 'portrait',
        legendPosition: 'top',
        marginPriority: ['bottom', 'top', 'left', 'right'],
        minPlotWidth: 0.6,
        labelStrategy: 'wrap-or-stagger'
    },
    line: {
        idealAspectRatio: 16/9,
        preferredOrientation: 'landscape',
        legendPosition: 'top',
        marginPriority: ['left', 'bottom', 'top', 'right'],
        minPlotWidth: 0.65,
        labelStrategy: 'wrap-or-rotate'
    },
    pie: {
        idealAspectRatio: 1,
        preferredOrientation: 'any',
        legendPosition: 'top',
        marginPriority: ['all-equal'],
        minPlotWidth: 0.6,
        labelStrategy: 'external-or-hide'
    },
    donut: {
        idealAspectRatio: 1,
        preferredOrientation: 'any',
        legendPosition: 'top',
        marginPriority: ['all-equal'],
        minPlotWidth: 0.6,
        labelStrategy: 'external-or-hide'
    },
    radar: {
        idealAspectRatio: 1,
        preferredOrientation: 'any',
        legendPosition: 'top',
        marginPriority: ['all-equal'],
        minPlotWidth: 0.65,
        labelStrategy: 'radial-external'
    },
    gauge: {
        idealAspectRatio: 2,
        preferredOrientation: 'landscape',
        legendPosition: 'none',
        marginPriority: ['left', 'right', 'bottom', 'top'],
        minPlotWidth: 0.7,
        labelStrategy: 'fixed-positions'
    }
    // ... outros tipos
};
```

### 4.3 Regras de Modo (Classic vs Infographic)

```typescript
const MODE_MODIFIERS = {
    classic: {
        fontSizeMultiplier: 1.0,
        marginMultiplier: 1.0,
        strokeWidthMultiplier: 1.0,
        opacityLevels: 'full',
        labelVisibility: 'all',
        gridVisibility: 'visible'
    },
    infographic: {
        fontSizeMultiplier: 1.3,
        marginMultiplier: 1.5,
        strokeWidthMultiplier: 1.2,
        opacityLevels: 'hierarchical',
        labelVisibility: 'selective',
        gridVisibility: 'minimal'
    }
};
```

---

## 5. Algoritmos Principais

### 5.1 Layout Computation

```typescript
function computeLayout(analysis: ChartAnalysis, target: 'screen' | 'pdf'): ComputedLayout {
    const rules = CHART_TYPE_RULES[analysis.chartType];
    const mode = MODE_MODIFIERS[analysis.mode];
    
    // 1. Calcular espaço base
    let availableWidth = analysis.availableSpace.width;
    let availableHeight = analysis.availableSpace.height;
    
    // 2. Reservar padding de export se necessário
    const exportPadding = target === 'pdf' ? 40 * (1 / PIXELS_PER_MM) : 0;
    availableWidth -= exportPadding * 2;
    availableHeight -= exportPadding * 2;
    
    // 3. Calcular zona de legenda
    const legendZone = analysis.layoutRequirements.needsLegend
        ? computeLegendZone(availableWidth, availableHeight, analysis.dataComplexity)
        : null;
    
    // 4. Subtrair legenda do espaço disponível
    const legendImpact = getLegendImpact(legendZone, rules.legendPosition);
    availableWidth -= legendImpact.width;
    availableHeight -= legendImpact.height;
    
    // 5. Calcular margens baseado nos labels
    const margins = computeDynamicMargins(
        analysis.dataComplexity,
        rules,
        mode,
        availableWidth,
        availableHeight
    );
    
    // 6. Calcular zona de plot
    const plotZone = {
        x: margins.left,
        y: margins.top,
        width: availableWidth - margins.left - margins.right,
        height: availableHeight - margins.top - margins.bottom
    };
    
    // 7. Validar proporção mínima
    const plotRatio = (plotZone.width * plotZone.height) / (availableWidth * availableHeight);
    if (plotRatio < rules.minPlotWidth) {
        // Aplicar scaling para recuperar espaço
        const scaleFactor = rules.minPlotWidth / plotRatio;
        applyScaling(margins, scaleFactor);
    }
    
    // 8. Retornar layout computado
    return {
        container: { width: analysis.availableSpace.width, height: analysis.availableSpace.height },
        zones: { legend: legendZone, plot: plotZone, xAxis: null, yAxis: null, badges: null },
        margins,
        scaling: { factor: 1.0, appliedTo: [] },
        typeSpecific: computeTypeSpecificParams(analysis.chartType, plotZone),
        exportMetadata: {
            requiredPadding: exportPadding,
            safeArea: plotZone,
            overflowRisk: assessOverflowRisk(analysis, plotZone)
        }
    };
}
```

### 5.2 Dynamic Margin Computation

### 5.2 Dynamic Margin Computation

```typescript
function computeDynamicMargins(
    dataComplexity: DataComplexity,
    rules: LayoutRules,
    mode: ModeModifiers,
    width: number,
    height: number
): Margins {
    const baseFontSize = 11; // pt
    
    // Margem Esquerda Inteligente (Smart Wrapping)
    let marginLeft = 0;
    if (rules.marginPriority.includes('left')) {
        // Detectar se deve usar layout Stacked (Rótulos no topo)
        // Gatilhos: Modo Infográfico OU Rótulos muito longos (>15 chars) OU Rótulos largos (>25% width)
        const isStacked = mode.isInfographic || 
                          dataComplexity.maxLabelLength > 15 || 
                          dataComplexity.maxLabelWidth > width * 0.25;
        
        if (isStacked) {
            // Stacked: Margem esquerda mínima, rótulos usam largura total (90%)
            // Isso permite que labels longos se espalhem no topo sem comprimir o gráfico
            marginLeft = Math.max(40, marginRight); // Mantém simetria ou padding mínimo
        } else {
            // Horizontal: Margem esquerda calculada com wrapping inteligente
            // Regras: Max 30% width, Max 12 palavras/linha, Prevenção de viúvas
            const smartMargin = SmartLabelWrapper.calculateSmartMargin(
                labels, 
                width * 0.3, // Max 30%
                baseFontSize
            );
            marginLeft = smartMargin.requiredWidth;
        }
    }
    
    // ...
    
    return { top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft, isStacked };
}
```

### 5.3 Smart Label Strategy

O sistema utiliza o `SmartLabelWrapper` para decidir como quebrar o texto:

1.  **Word Limit**: Labels com mais de 12 palavras forçam quebra de linha.
2.  **Orphan Prevention**: Evita deixar uma única palavra na última linha.
3.  **Stacked Detection**: Se o label precisa de muito espaço (>30%), o layout muda automaticamente para **Stacked** (label acima da barra), liberando espaço horizontal.

### 5.3 Export Safety Assessment

```typescript
function assessOverflowRisk(analysis: ChartAnalysis, plotZone: Zone): 'none' | 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    // Labels muito longos
    if (analysis.dataComplexity.maxLabelLength > 20) riskScore += 2;
    else if (analysis.dataComplexity.maxLabelLength > 15) riskScore += 1;
    
    // Muitas categorias
    if (analysis.dataComplexity.categoryCount > 10) riskScore += 2;
    else if (analysis.dataComplexity.categoryCount > 6) riskScore += 1;
    
    // Gráficos circulares com labels externos
    if (['pie', 'donut', 'radar'].includes(analysis.chartType)) riskScore += 1;
    
    // Modo infographic (elementos maiores)
    if (analysis.mode === 'infographic') riskScore += 1;
    
    // Badges ativos
    if (analysis.layoutRequirements.hasBadges) riskScore += 1;
    
    // Classificar risco
    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    if (riskScore >= 1) return 'low';
    return 'none';
}
```

---

## 6. Integração com Componentes Existentes

### 6.1 Ponto de Integração: Canvas.tsx

```typescript
// ANTES (atual)
const w = module.w * moduleWidth + (module.w - 1) * gutterPx;
const h = module.h * moduleHeight + (module.h - 1) * gutterPx;

<BarChart width={w} height={h} data={chart.data} style={chart.style} />

// DEPOIS (com Smart Layout)
const smartLayout = smartLayoutEngine.computeLayout(
    smartLayoutEngine.analyzeChart(chart, gridConfig),
    'screen'
);

<BarChart
    width={w}
    height={h}
    data={chart.data}
    style={chart.style}
    computedLayout={smartLayout} // Novo prop
/>
```

### 6.2 Ponto de Integração: Componentes de Gráfico

```typescript
// BarChart.tsx - ANTES
const marginLeft = isStackedLayout ? 25 : (dynamicLabelSpace + ...);

// BarChart.tsx - DEPOIS
const { margins, zones, scaling, typeSpecific } = props.computedLayout || {};

// Se computedLayout foi passado, usa valores calculados
// Senão, fallback para cálculo local (retrocompatibilidade)
const marginLeft = margins?.left ?? (isStackedLayout ? 25 : ...);
```

### 6.3 Ponto de Integração: pdfExportService

```typescript
// ANTES
const PADDING = 40;

// DEPOIS
const smartLayout = smartLayoutEngine.computeLayout(analysis, 'pdf');
const PADDING = smartLayout.exportMetadata.requiredPadding;

// Adicionar validação
const validation = smartLayoutEngine.validateLayout(smartLayout);
if (validation.metrics.exportSafetyScore < 0.7) {
    console.warn('Export safety concerns:', validation.errors);
}
```

---

## 7. API Pública

### 7.1 Funções Exportadas

```typescript
// src/services/smartLayoutEngine.ts

export const SmartLayoutEngine = {
    // Análise
    analyzeChart,
    
    // Computação
    computeLayout,
    computeLayoutForScreen: (chart, grid) => computeLayout(analyzeChart(chart, grid), 'screen'),
    computeLayoutForPdf: (chart, grid) => computeLayout(analyzeChart(chart, grid), 'pdf'),
    
    // Validação
    validateLayout,
    validateForExport,
    
    // Utilidades
    suggestOptimalModuleSize,
    getIdealAspectRatio,
    assessOverflowRisk
};
```

### 7.2 Hook React

```typescript
// src/hooks/useSmartLayout.ts

export function useSmartLayout(chart: Chart, gridConfig: GridConfig, target: 'screen' | 'pdf' = 'screen') {
    return useMemo(() => {
        const analysis = SmartLayoutEngine.analyzeChart(chart, gridConfig);
        const layout = SmartLayoutEngine.computeLayout(analysis, target);
        const validation = SmartLayoutEngine.validateLayout(layout);
        
        return {
            layout,
            validation,
            isValid: validation.isValid,
            warnings: validation.errors.filter(e => e.severity !== 'critical'),
            suggestions: SmartLayoutEngine.suggestOptimizations(layout)
        };
    }, [chart, gridConfig, target]);
}
```

---

## 8. Implementação Incremental

### Fase 1: Foundation (Sprint 1)
- [ ] Criar `src/services/smartLayoutEngine.ts`
- [ ] Implementar `analyzeChart()`
- [ ] Implementar tipos base (`ChartAnalysis`, `ComputedLayout`)
- [ ] Testes unitários básicos

### Fase 2: Core Logic (Sprint 2)
- [ ] Implementar `computeLayout()` para tipos principais (Bar, Column, Line)
- [ ] Implementar regras de modo (Classic vs Infographic)
- [ ] Adicionar `CHART_TYPE_RULES` completo
- [ ] Integrar marginalmente com Canvas.tsx

### Fase 3: Validation (Sprint 3)
- [ ] Implementar `validateLayout()`
- [ ] Implementar `assessOverflowRisk()`
- [ ] Adicionar warnings no editor antes de export
- [ ] Integrar com pdfExportService

### Fase 4: Full Integration (Sprint 4)
- [ ] Refatorar todos os 16 componentes de gráfico para usar `computedLayout`
- [ ] Criar hook `useSmartLayout`
- [ ] Documentação de API
- [ ] Testes de integração

### Fase 5: Optimization (Sprint 5)
- [ ] `suggestOptimalModuleSize()` - sugere tamanho ideal de módulo
- [ ] `suggestOptimizations()` - dicas para melhorar layout
- [ ] Performance tuning (memoization)
- [ ] Feature flag para ativar/desativar

---

## 9. Métricas de Sucesso

| Métrica | Baseline | Target |
|---------|----------|--------|
| Labels cortados no export | ~15% | < 2% |
| Warnings de layout ignorados | 100% | < 10% |
| Plot area ratio médio | ~55% | > 65% |
| Tempo de render | ~50ms | < 60ms |
| Consistência Classic/Infographic | N/A | > 95% |

---

## 11. Requisito de Resolução de Export

O Smart Layout precisa garantir que o layout calculado funcione não apenas na tela do usuário, mas na resolução final de exportação (PDF ou PNG).

### 11.1 Problema: Variabilidade de Dispositivos

O `devicePixelRatio` varia drasticamente entre usuários (1.0 a 3.0). Se o layout ou a geração de imagem dependerem disso, teremos inconsistências:
- **PDF**: Pode ficar borrado (low DPI) ou estourar memória (high DPI desnecessário).
- **Layout**: Zonas de segurança calculadas para 96 DPI podem falhar em 300 DPI se não houver normalização.

### 11.2 Especificação: Resolução Fixa

O sistema **DEVE** ignorar o `window.devicePixelRatio` para operações de exportação e usar constantes fixas:

| Target | Resolução Desejada | pixelRatio (Base 96) | Uso |
|--------|-------------------|----------------------|-----|
| **Screen** | Variável | `window.devicePixelRatio` | Renderização na tela (Canvas) |
| **PDF** | 300 DPI | `3.125` | Impressão de alta qualidade |
| **PNG** | 96 DPI | `1.0` | Arquivos leves para web |

### 11.3 Integração no Engine

O `computeLayout` deve aceitar o target e ajustar os cálculos de precisão:

```typescript
function computeLayout(
    analysis: ChartAnalysis, 
    target: 'screen' | 'pdf' | 'png'
): ComputedLayout {
    // 1. Determinar pixelRatio do target
    const pixelRatio = target === 'screen' 
        ? window.devicePixelRatio 
        : EXPORT_SETTINGS[target].pixelRatio;

    return {
        // ...
        exportMetadata: {
            // Garante que o consumidor do layout saiba qual resolução foi usada
            targetResolution: {
                dpi: target === 'screen' ? 96 * pixelRatio : EXPORT_SETTINGS[target].targetDpi,
                pixelRatio: pixelRatio
            },
            // Zonas de segurança ajustadas para a resolução
            safeArea: computeSafeArea(pixelRatio) 
        }
    };
}
```

### 11.4 Validação de Implementação

O sistema deve validar se o export está respeitando a resolução fixa:

```typescript
// Validação crítica no SmartLayoutEngine
validateExportContext(options: ExportOptions): ValidationResult {
    if (options.pixelRatio === window.devicePixelRatio && options.target !== 'screen') {
        return {
            isValid: false,
            error: "CRITICAL: Export using device-dependent resolution. Use fixed EXPORT_SETTINGS."
        };
    }
    return { isValid: true };
}
```

### 11.7 Checklist de Implementação

- [ ] Definir `EXPORT_SETTINGS` em `src/constants/exportSettings.ts`
- [ ] Remover qualquer uso de `devicePixelRatio` no export
- [ ] Atualizar `generateChartImage()` para aceitar `format` ao invés de `pixelRatio`
- [ ] Atualizar `pdfExportService` para usar `EXPORT_SETTINGS.pdf.pixelRatio`
- [ ] Adicionar validação que rejeita `devicePixelRatio`
- [ ] Testes: exportar do mesmo gráfico em devices diferentes e comparar

---

## 12. Estratégias de Adaptação (LOD - Level of Detail)

O sistema deve adaptar o **conteúdo** e não apenas a **escala** quando o espaço é reduzido.

### 12.1 Breakpoints Semânticos

| Nível | Largura (px) | Estratégia | Exemplo de Uso |
|-------|--------------|------------|----------------|
| **Tiny** | < 150px | Sparkline | Cards, Tabelas densas |
| **Compact** | 150 - 300px | Minimal | Colunas estreitas em PDF |
| **Normal** | 300 - 600px | Standard | Dashboard padrão (grid 3-col) |
| **Spacious** | > 600px | Detailed | Full width, Infográficos |

### 12.2 Regras de Visibilidade por Nível

```typescript
const LOD_RULES = {
    tiny: {
        showAxis: false,
        showGrid: false,
        showLegends: false,
        showValues: false,
        strokeWidth: 2,
        simplifyData: true // Downsampling
    },
    compact: {
        showAxis: 'x-only',     // Remove eixo Y
        showGrid: false,
        showLegends: 'bottom',  // Força bottom
        showValues: 'hero-only', // Apenas valores destacados
        simplifyData: false
    },
    normal: {
        showAxis: true,
        showGrid: true,
        showLegends: 'auto',
        showValues: 'smart',    // Evita colisão
        simplifyData: false
    },
    spacious: {
        showAxis: true,
        showGrid: 'full',
        showLegends: 'side',    // Permite lateral
        showValues: 'all',
        simplifyData: false
    }
};
```

### 12.3 Integração

O `computeLayout` deve determinar o LOD antes de calcular margens:

```typescript
const lodLevel = determineLOD(availableWidth);
const activeRules = LOD_RULES[lodLevel];

// Se axis Y está oculto, margem esquerda = 0
if (!activeRules.showAxis || activeRules.showAxis === 'x-only') {
    margins.left = 0;
}
```

---

## 13. Resolução de Conflitos (Collision Handling)

Para elementos que disputam o mesmo espaço (labels, anotações), o sistema deve ter estratégias ativas de resolução.

### 13.1 Algoritmos de Layout de Labels

1. **Greedy Placement** (Rápido):
   - Coloca o label se não colidir com anteriores.
   - Se colidir, esconde.
   - *Uso: Eixos, Time Series densas.*

2. **Force-Directed** (Iterativo):
   - Labels têm "carga física" e se repelem.
   - Linhas de conexão (leads) se esticam.
   - *Uso: Scatter plot, Bubble chart, Pie charts complexos.*

3. **Simulated Annealing** (Otimizado):
   - Tenta posições aleatórias e minimiza função de custo (sobreposição + distância do ponto).
   - *Uso: Mapas, diagramas de rede.*

4. **Y-Axis Stacking** (Ordenado):
   - Ordena labels por Y.
   - Se sobrepõem, empurra o de baixo para baixo.
   - *Uso: Listas de valores na direita de LineCharts.*

### 13.2 Configuração de Estratégia

```typescript
interface LabelingConfig {
    strategy: 'greedy' | 'force' | 'stack' | 'none';
    allowOverlap: boolean;
    minPadding: number; // px entre labels
    priority: 'value' | 'label' | 'none'; // Quem ganha o conflito?
}
```

---

## 14. Overrides do Usuário (Manual Adjustments)

O sistema "inteligente" nunca deve brigar com o usuário. Ajustes manuais têm prioridade absoluta ("The User is King").

### 14.1 Hierarquia de Decisão

1. **User Overrides** (Drag & drop, configs manuais)
2. **Export Constraints** (PDF DPI, tamanho de papel)
3. **Smart Layout Calculation** (Auto positioning)
4. **Defaults** (Hardcoded fallback)

### 14.2 Interface de Overrides

```typescript
interface LayoutOverrides {
    // Posições forçadas
    legendPosition?: { x: number, y: number, floating: boolean };
    
    // Margens forçadas
    margins?: { top?: number, right?: number, bottom?: number, left?: number };
    
    // Visibilidade forçada
    forceShowLabels?: number[]; // Índices de labels que OBRIGATORIAMENTE aparecem
    forceHideLabels?: number[];
    
    // Escala manual
    manualScaleFactor?: number;
}
```

### 14.3 Aplicação no Engine

```typescript
function applyOverrides(layout: ComputedLayout, overrides: LayoutOverrides) {
    // 1. Aplicar margens manuais
    if (overrides.margins) {
        layout.margins = { ...layout.margins, ...overrides.margins };
        // Recalcular plot area baseado nas novas margens
        updatePlotZone(layout);
    }
    
    // 2. Aplicar posição de legenda
    if (overrides.legendPosition) {
        layout.zones.legend = {
            ...layout.zones.legend,
            x: overrides.legendPosition.x,
            y: overrides.legendPosition.y
        };
        // Se flutuante, não subtrai do plot area
        if (overrides.legendPosition.floating) {
            maximizePlotZone(layout);
        }
    }
}
```

---

---

## 15. Performance e Caching

Cálculos de layout (especialmente medição de texto e detecção de colisão) podem ser custosos (10-50ms por gráfico). Para manter 60 FPS no editor, precisamos de estratégias de cache.

### 15.1 Estratégia de Memoization

O `computeLayout` deve ser puro e memoizado baseando-se em chaves estáveis.

```typescript
const layoutCache = new Map<string, ComputedLayout>();

function getLayoutKey(analysis: ChartAnalysis, overrides: LayoutOverrides): string {
    // Hash composto por:
    // - Chart ID + Data Hash (só muda se dados mudarem)
    // - Container Size (width x height)
    // - Chart Type + Mode
    // - Overrides Hash
    return `${analysis.id}:${analysis.dataHash}:${width}x${height}:${mode}:${hash(overrides)}`;
}
```

### 15.2 Lazy Evaluation

Não calcular layout PDF enquanto estiver editando na tela.

| Contexto | Estratégia |
|----------|------------|
| **Editor (Screen)** | Calcula `computedLayout` on-demand ou debounced (100ms) no resize. |
| **Drag & Drop** | Usa layout "simplificado" (bounding boxes apenas) durante o arraste. |
| **Export (PDF)** | Calcula synchronously apenas no momento do clique em "Exportar". |

---

## 16. Ferramentas de Debug Visual

Para entender *por que* o sistema tomou certas decisões, precisamos de um modo de inspeção visual.

### 16.1 Overlay de Zonas

Flag de desenvolvimento `debugLayout=true` que renderiza:

- 🟦 **Plot Zone**: Área azul semi-transparente onde gráfico é desenhado.
- 🟥 **Margins**: Área vermelha excluída do plot.
- 🟨 **Padding**: Área amarela de segurança.
- 🟩 **Legend Zone**: Área verde reservada para legenda.
- 🟣 **Collision Boxes**: Bounding boxes reais dos labels.

### 16.2 Output de Console Estruturado

```typescript
[SmartLayout] Chart: "Revenue Growth" (BarChart)
------------------------------------------------
Input: 400x300px (Compact)
LOD: Compact (No Y-Axis, Hero Values only)
Rules Applied: BarChartRules + InfographicMode
Margins: { T: 20, R: 10, B: 40, L: 0 }
Collision: 2 overlaps resolved via 'hide' strategy.
Resolution: Screen (dpr: 2) -> PDF (dpr: 3.125)
Score: 0.85 (Good)
```

---

## 17. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Breaking changes em gráficos existentes | Alta | Alto | Fallback para cálculo local se `computedLayout` não passado |
| Performance degradation | Média | Médio | Memoization agressiva, cálculos lazy |
| Complexidade excessiva | Média | Alto | Implementação incremental por tipo de gráfico |
| Edge cases não cobertos | Alta | Baixo | Logging extensivo + fallbacks graceful |

---

## 18. Dependência de Medição de Texto (Text Measurement)

Para garantir que as margens sejam precisas, o Engine deve abandonar estimativas baseadas em contagem de caracteres e usar medição real de pixels.

### 18.1 TextMeasurementService

```typescript
const measureTextWidth = (options: TextMetricsOptions): number => {
    // 1. Criar canvas offscreen
    // 2. Definir contexto com fonte exata
    // 3. Retornar width real com cache
};
```

### 18.2 Integração no Pipeline
O `analyzeChart` deve consumir este serviço para preencher `dataComplexity.maxLabelWidthPx`.

---

## 19. Contexto de Exportação (Export Awareness)

### 19.1 Modos de Execução
1. **Browser**: Usa WebFonts carregadas.
2. **Export (Headless)**: Requer carregamento explícito de fontes e fallback seguro.

### 19.2 Estratégia de "Safe Box"
O Engine deve adicionar um `exportBuffer` configurável (ex: 5-10%) para evitar que mudanças sutis de renderização cortem textos no PDF.

---

## 20. Refinamentos Pós-Auditoria Visual (Correções v1.2)

Baseado na auditoria de regressão visual (Casos 1-6), o sistema deve evoluir para tratar layout de conteúdo e não apenas container.

### 20.1 Estratégia de Preenchimento (Fill Strategy)

O Engine deve ditar como o gráfico ocupa o espaço interno (`plotZone`), evitando o colapso vertical.

```typescript
interface LayoutStrategy {
    verticalFill: 'compact' | 'grow' | 'distribute'; 
    // compact: usa altura natural (atual)
    // grow: estica as barras (aumenta barThickness)
    // distribute: aumenta o espaçamento (categoryGap)
    
    horizontalFill: 'default' | 'stretch';
}

// No output do computeLayout:
computedLayout.typeSpecific.barThickness = calculateOptimalBarThickness(availableHeight, datasetCount, 'grow');
```

### 20.2 Detecção de Cabeçalho Agrupado (Grouped Headers)

Para evitar margens laterais fantasmas quando os labels estão no topo.

```typescript
// Em analyzeChart:
const isGroupedHeaderMode = style.mode === 'infographic' && chart.type === 'bar'; // Simplificação, idealmente flag explícita

if (isGroupedHeaderMode) {
    // Labels estão acima das barras, não na esquerda
    // Margem esquerda serve apenas para grid ticks ou zero
    rules.marginPriority = rules.marginPriority.filter(p => p !== 'left');
    // Adiciona prioridade de topo extra para os headers
    rules.marginPriority.push('top-header');
}
```

### 20.3 Zonas de Anotação (Annotation Reserves)

Para badges de "Mínimo/Máximo" não cortarem ou sobreporem.

```typescript
// Em computeDynamicMargins:
if (layoutRequirements.hasBadges) {
    const badgeHeight = 25; // px
    // Se badge é 'top', reserva espaço
    margins.top += badgeHeight;
    // Se badge é 'bottom' (Mínimo no BarChart as vezes), reserva margem inferior
    margins.bottom += badgeHeight;
}
```

### 20.4 Restrição e Clipping (Grid Safety)

Para evitar vazamento de linhas de grade.

```typescript
// Output:
computedLayout.exportMetadata.clipPath = `inset(0px 0px 0px 0px)`; // CSS clip
// O componente deve aplicar:
// <g clipPath="url(#chartAreaClip)">...</g>
```

---

## 21. Robustness Guards & Safety Caps (v1.3 - v1.5)

Evolução do motor para tratar casos extremos de densidade e escalas cômicas.

### 21.1 Bar Thickness Cap (v1.3)
Para evitar que gráficos com 1-2 itens em containers altos criem barras gigantes:
- **Hard Cap**: 80px de espessura máxima.
- **Font Decoupling**: O tamanho da fonte deve escalar com a barra *renderizada*, não com o espaço disponível, prevenindo tipografia gigantista.

### 21.2 Fator de Densidade - Density Factor (v1.4)
O motor ajusta o `targetFill` (taxa de ocupação) dinamicamente:
- **Alta Densidade (> 2 itens/100px)**: Preenche 65% do espaço (foco em legibilidade).
- **Baixa Densidade (< 1 item/100px)**: Preenche 50% do espaço (foco em elegância e respiro).
- **Robustez Mínima**: Barras nunca colapsam abaixo de 12px (garantindo visibilidade em telas de baixa resolução).

### 21.3 Avaliação Inteligente - Smart Evaluation (v1.5)
O sistema deixa de usar constantes "mágicas" para usar medição real preventiva.

- **MarginRight Dinâmica**: O Engine mede o pixel-width do maior valor do dataset + badges e reserva exatamente o espaço necessário na margem direita.
- **Mapeamento de Coordenadas (Engine-Driven)**: O Engine dita as coordenadas exatas (`labelX`, `anchor`) para o componente.
  - **Lógica**: Se o layout for `infographic`, o Engine calcula o offset baseado no `marginLeft` e passa para o componente como `categoryLabelX`.
  - **Benefício**: O componente torna-se "burro" (stateless), apenas renderizando o que o Engine prescreveu, garantindo consistência matemática total.

### 21.4 Fidelidade de Exportação & Posicionamento (v1.7)
Garantia de que o layout renderizado na tela seja 1:1 no PDF.

- **Sync de Fontes**: Mapeamento explícito de fontes para o exportador PDF, garantindo que pesos (Bold/Black) e tipos (Narrative/Data) sejam preservados.
- **Normalização de Aspect Ratio (PDF)**: O Engine força proporções ideais quando o target é `pdf`, prevenindo o efeito "achatado" causado pela diferença de Viewport entre tela e papel.

---

## 22. Inteligência Avançada (Advanced Intelligence Capsules)

O sistema evoluiu para um estado de "Consciência de Design", onde cada decisão é baseada em simulações e física de colisão.

### 22.1. Smart Label Wrapping (v1.8)
O componente não "chuta" mais onde o texto vai quebrar. O Engine calcula o `labelWidthThresholdPx` (largura máxima permitida pela margem esquerda) e passa para o componente o `labelWrapThreshold` exato.

### 22.2. Self-Healing & Retry Loop (v1.21)
Implementação de um circuito de segurança:
1.  **Validate**: Após calcular o layout, o Engine verifica o `riskScore`.
2.  **Detect**: Se houver colisões iminentes ou espaço insuficiente (`plotRatio < 40%`).
3.  **Retry**: O Engine dispara uma nova tentativa com parâmetros de contenção (ex: `compactMode: true`, `hideAxis: true`).

### 4.4 Vacuum-Seal (Elasticidade Total)
- **Vertical Fill**: Se a altura dos dados for menor que a altura do container, o sistema expande a espessura das barras (até um cap de 120px) e o espaçamento entre elas para preencher o módulo completamente.
- **Gravity Well**: Elementos como títulos e legendas "puxam" o gráfico para perto (proximidade de 24px), forçando o Plot Area a expandir no espaço restante.

### 4.5 Intelligent Label Wrapping
Para garantir legibilidade em rótulos longos, o sistema aplica:
1.  **Limite de Palavras**: Rótulos com mais de 12 palavras são forçados a quebrar linha.
2.  **Prevenção de Viúvas**: Se a quebra forçada criar uma viúva (1 palavra na última linha), a quebra é cancelada (se couber na largura).
3.  **Detecção de Stacked Layout**: Se os rótulos forem muito longos (>15 chars) ou o modo for Infográfico, o sistema muda para layout "Stacked", permitindo que os rótulos usem 90% da largura do container em vez de se espremerem na margem lateral.

### 22.3. Vacuum-Seal & Grid Elasticity (v1.36 / v1.54)
Estratégia para eliminar "espaço morto":
- **Elastic Core**: O gráfico não flutua no meio do módulo. Ele se expande como um fluido para preencher o vácuo entre a legenda e as margens.
- **Gravity Balance**: Badges de anotação e títulos exercem "gravidade" sobre o gráfico, mantendo uma proximidade constante de 24px (Optical Rhythm).

### 22.4. Editorial Intelligence (v1.40 - v1.50)
- **Direct Labeling**: Substituição de legendas por labels diretos no final das linhas ou fatias (reduz carga cognitiva).
- **Spider Collision**: Algoritmo que repele labels de Pie Charts, organizando-os em colunas limpas com linhas conectoras dinâmicas.
- **Semantic Formatting**: Detecção automática de ordem (Pareto/Temporal) e formatação inteligente de unidades (R$ 1.5M vs R$ 1.523).
