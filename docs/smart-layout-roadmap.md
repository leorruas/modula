# Smart Layout System: Roadmap Reorganizado

> **Baseado em**: [Análise completa do plano original](../brain/analysis.md)  
> **Status**: 5% implementado (estrutura básica existe)  
> **Objetivo**: Substituir cálculos ad-hoc por um Engine centralizado e inteligente

---

## 🎯 Visão Geral

### Filosofia Core

**"Smart Engine → Dumb Component"**

- **Engine**: Calcula TODOS os valores (margins, thickness, positioning, wrapping)
- **Component**: Renderiza EXATAMENTE o que Engine mandou
- **Zero Guessing**: Medição precisa, não aproximações

### Priorização

- **P0 (Blocker)**: Sem isso, o sistema não funciona
- **P1 (Critical)**: Impacta qualidade visual drasticamente
- **P2 (Important)**: Melhoria significativa
- **P3 (Nice-to-have)**: Polimento fino

---

## 📊 Mapa de Dependências

```mermaid
graph TD
    A[TextMeasurementService] --> B[SmartLayoutEngine]
    B --> C[useSmartLayout Hook]
    C --> D[BarChart Component]
    B --> E[Export Service]
    E --> F[PDF Generator]
    
    G[types.ts] --> B
    H[barRules.ts] --> B
    I[constants.ts] --> B
    
    style A fill:#10b981
    style B fill:#3b82f6
    style C fill:#8b5cf6
    style D fill:#ec4899
    style E fill:#f59e0b
    style F fill:#ef4444
```

**Legenda:**
- 🟢 Verde: Serviços utilitários
- 🔵 Azul: Engine (cérebro)
- 🟣 Roxo: Hooks (ponte)
- 🔴 Rosa: Components (UI)
- 🟠 Laranja: Export (PDF/PNG)

---

## 📚 Lessons Learned (Conversation History)

### Conversation 4331873d: Fix Cropped Chart Exports
**Problema**: Charts cortados em PDF, fonts erradas, legends invisíveis  
**Solução**: Aumentar `pixelRatio` para 3.5, normalizar altura, mapear fonts  
**Lição**: 
- Export precisa de cálculo de layout SEPARADO (não pode usar window size)
- Fonts precisam ser mapeadas explicitamente (Outfit/Geist Mono)
- Safety buffer de 40px é crítico para evitar edge clipping

### Conversation 6e818cda: Document Chart Variables
**Problema**: Variáveis espalhadas por múltiplos arquivos, difícil rastrear  
**Solução**: Documentar todas as variáveis e dependências  
**Lição**:
- Charts dependem de: `pdfExportService`, `exportUtils`, `chartTheme`, `GridConfig`
- Cada chart tem variáveis próprias (margins, padding, fontSize)
- Necessário centralizar em um único ponto de verdade (Engine)

### Conversation 1cbd9303: Refine Chart Layout and Export
**Problema**: Labels wrapping errado, legend ocupando espaço demais  
**Solução**: Engine calcula `labelWrapThreshold`, aggressive legend reclaim  
**Lição**:
- Wrapping não pode ser "guessing" (width / charWidth)
- Engine deve simular wrapping ANTES de renderizar
- Legend deve ocupar EXATAMENTE o espaço medido (zero buffer)

### Conversation 5870325a: Implement Design Tokens System
**Problema**: Valores hardcoded espalhados, difícil manter consistência  
**Solução**: CSS variables como design tokens  
**Lição**:
- Componentização requer separação estrita (Engine vs Component)
- Variable-First Rendering: calcular antes de renderizar
- Prop-to-Token Mapping: props devem mapear para tokens, não valores diretos

---

## 🚀 FASE 1: Core Engine (P0 - Blocker)

**Objetivo**: Engine funcional que substitui 100% da lógica legada

**Consolidates**: Sub-Projects 1.1, 1.5, 1.8, 1.11, 1.15, 1.44

### 1.1 Text Measurement & Caching

**Problema Atual**: `TextMeasurementService` existe mas não tem cache, não detecta font loading

**Tasks**:
- [ ] Implementar cache em `TextMeasurementService` (Map<string, number>)
- [ ] Adicionar font loading detection (`document.fonts.ready`)
- [ ] Adicionar batch measurement (medir múltiplos textos de uma vez)
- [ ] Implementar `calibrationFactor` para PDF rasterization drift

**Files**:
- [MODIFY] `src/services/smartLayout/TextMeasurementService.ts`

**Acceptance Criteria**:
- [ ] Medição com precisão ±2px
- [ ] Cache reduz medições repetidas em 80%+
- [ ] Font loading não causa layout shift
- [ ] PDF measurements são consistentes com screen

---

### 1.2 Dynamic Margins Solver

**Problema Atual**: Engine calcula margens básicas, mas Component ainda tem fallbacks complexos

**Tasks**:
- [ ] Implementar `computeDynamicMargins` completo para todas as posições
- [ ] Adicionar `exportBuffer` logic (safety margin para PDF)
- [ ] Implementar `assessOverflowRisk` (detectar quando texto vai vazar)
- [ ] Adicionar `Universal Legend Solver` (calcular espaço exato para legends)

**Files**:
- [MODIFY] `src/services/smartLayout/SmartLayoutEngine.ts`

**Acceptance Criteria**:
- [ ] Margens adaptam a labels de 5-100 caracteres
- [ ] User preference (legendPosition) sempre tem prioridade
- [ ] Export buffer previne clipping em PDF
- [ ] Legend ocupa exatamente o espaço medido (zero whitespace extra)

**Code Example**:
```typescript
// Engine deve retornar:
margins: {
  top: 20,
  right: 60,  // baseado em maxValueWidth + badges
  bottom: 45, // baseado em legend height medida
  left: 120   // baseado em maxLabelWidth + padding
}
```

---

### 1.3 Label Wrapping Intelligence

**Problema Atual**: Component usa `width / charWidth` (guessing), não respeita boundary exato

**Tasks**:
- [ ] Calcular `labelWidthThresholdPx` baseado em `marginLeft` reservado
- [ ] Passar `labelWrapThreshold` via `typeSpecific` para component
- [ ] Implementar wrapping simulation (prever quantas linhas ANTES de renderizar)
- [ ] Adicionar `estimatedLines` logic científico

**Files**:
- [MODIFY] `src/services/smartLayout/SmartLayoutEngine.ts`
- [MODIFY] `src/features/charts/components/BarChart.tsx`

**Acceptance Criteria**:
- [ ] Labels wrappam EXATAMENTE no boundary do gutter
- [ ] Wrapping simulation reserva espaço vertical correto
- [ ] Mudar window size: wrapping adapta precisamente
- [ ] Zero "surpresas" (texto nunca overflow)

**Code Example**:
```typescript
// Engine calcula:
typeSpecific: {
  labelWrapThreshold: 18, // caracteres
  labelWidthThresholdPx: 120, // pixels
  estimatedMaxLines: 3
}

// Component usa:
const lines = wrapLabel(label, computedLayout.typeSpecific.labelWrapThreshold);
```

---

### 1.4 Legend Sizing (Predictive)

**Problema Atual**: Legends usam margin fixo, desperdiçam espaço

**Tasks**:
- [ ] Implementar `calculatePredictedLegendWidth` (para left/right)
- [ ] Implementar `calculatePredictedLegendHeight` (para top/bottom)
- [ ] Suportar todas as posições (top/bottom/left/right)
- [ ] Implementar "Compact Legend Grid" (CSS Grid ao invés de Flexbox)

**Files**:
- [MODIFY] `src/services/smartLayout/SmartLayoutEngine.ts`

**Acceptance Criteria**:
- [ ] Legend bottom: altura = `lines * itemHeight` (zero buffer)
- [ ] Legend lateral: largura = `maxItemWidth + 16px` (padding)
- [ ] Chart expande para preencher espaço economizado
- [ ] Legends curtas (1-2 items) usam espaço mínimo

**Code Example**:
```typescript
// Para legend bottom com 3 items curtos:
marginBottom = 30 // ao invés de 60

// Para legend lateral com items longos:
marginLeft = 140 // ao invés de fixed 60
```

---

### Verification (FASE 1)

**Unit Tests**:
```bash
npm test -- SmartLayoutEngine.test.ts
npm test -- TextMeasurementService.test.ts
```

**Integration Test**:
- [ ] BarChart usa 100% Engine (zero fallback)
- [ ] Remover linhas 103-106 de `BarChart.tsx` (fallback logic)
- [ ] Dashboard com 5 charts diferentes renderiza corretamente

**Visual Test**:
- [ ] Labels longos (50+ chars): margin expande, zero truncation
- [ ] Labels curtos (5 chars): margin compacta, chart expande
- [ ] Legend com 1 item: usa espaço mínimo
- [ ] Legend com 10 items: wraps corretamente

---

## 🎨 FASE 2: Visual Refinement (P1 - Critical)

**Objetivo**: Charts sempre preenchem o container de forma elegante

**Consolidates**: Sub-Projects 1.2, 1.3, 1.4, 1.6, 1.7, 1.10, 1.12, 1.14, 1.42

### 2.1 Vertical Fill Strategy

**Problema**: Charts "flutuam" em containers grandes, desperdiçam whitespace

**Tasks**:
- [ ] Implementar `Vertical Fill Strategy` (preencher plotHeight)
- [ ] Adicionar density-aware scaling (low density = thicker bars)
- [ ] Implementar caps dinâmicos baseados em densidade

**Acceptance Criteria**:
- [ ] Charts preenchem 100% da altura do container (até cap)
- [ ] Low density (2-3 categories): bars até 80px
- [ ] High density (20+ categories): bars mínimo 12px

---

### 2.2 Scale Safety (Caps)

**Problema**: Containers grandes + poucas categorias = bars gigantes

**Tasks**:
- [ ] Implementar `maxBarThickness` cap (60-80px)
- [ ] Decouple `fontSize` de `barHeight` (prevenir fonts gigantes)
- [ ] Implementar `Fill Factor Limit` (não preencher 100% se violar normas)

**Acceptance Criteria**:
- [ ] Bars nunca excedem 80px de altura
- [ ] Fonts permanecem legíveis (não gigantes)
- [ ] Whitespace é distribuído elegantemente

---

### 2.3 Optical Balance & Gutter

**Problema**: Distância entre labels e bars parece inconsistente

**Tasks**:
- [ ] Calcular `labelPadding` baseado em `baseFontSize` (0.8 * fontSize)
- [ ] Passar `categoryLabelX` e `categoryLabelAnchor` via `typeSpecific`
- [ ] Implementar "Optical Gutter" (distância respirável)

**Acceptance Criteria**:
- [ ] Infographic: labels têm distância de ~18px das bars
- [ ] Classic: labels alinhados corretamente no eixo
- [ ] Distância é proporcional ao fontSize

---

### 2.4 Density Adaptation

**Problema**: Mesma lógica para charts densos e esparsos

**Tasks**:
- [ ] Calcular `density = categoryCount / (plotHeight / 100)`
- [ ] Ajustar caps baseado em densidade
- [ ] Implementar "Adaptive Thickness Intelligence"

**Acceptance Criteria**:
- [ ] Low density: targetFill = 0.75, maxThickness = 80px
- [ ] High density: targetFill = 0.6, maxThickness = 40px

---

### Verification (FASE 2)

**Visual Tests**:
- [ ] 3 categories em 600px altura: bars ~70px, centradas
- [ ] 20 categories em 400px altura: bars ~15px, preenchem tudo
- [ ] Labels têm distância consistente das bars

---

## 📄 FASE 3: Export Fidelity (P1 - Critical)

**Objetivo**: PDF = Screen (1:1 fidelity)

**Consolidates**: Sub-Project 2 completo + 1.7

### 3.1 Environment Invariants

**Problema**: PDF usa window size, causando layouts diferentes

**Tasks**:
- [ ] Hardcode `EXPORT_PIXEL_RATIO = 3.5` (configurável)
- [ ] Implementar "Virtual Canvas" dimensions para PDF
- [ ] Adicionar `target: 'screen' | 'pdf'` parameter em `computeLayout`

**Acceptance Criteria**:
- [ ] PDF ignora window size
- [ ] Layout é calculado baseado em dimensões virtuais
- [ ] Screen e PDF têm mesmas proporções relativas

---

### 3.2 Font Synchronization

**Problema**: PDF usa fonts diferentes, causando medições erradas

**Tasks**:
- [ ] Carregar Outfit e Geist Mono em `globals.css`
- [ ] Criar `.category-label` e `.data-value` utility classes
- [ ] Atualizar `TextMeasurementService` para usar fonts corretas
- [ ] Simplificar `fontEmbedCSS` em `exportUtils.ts`

**Acceptance Criteria**:
- [ ] PDF usa Outfit para labels
- [ ] PDF usa Geist Mono para valores
- [ ] Medições são idênticas entre screen e PDF

---

### 3.3 Resolution Handling & Safety Buffers

**Problema**: Texto clippa nas bordas do PDF

**Tasks**:
- [ ] Implementar `exportBuffer` (safety margin)
- [ ] Converter padding fixo (40px) em invariants que escalam
- [ ] Implementar `calibrationFactor` para rasterization drift

**Acceptance Criteria**:
- [ ] Zero clipping em PDF exports
- [ ] Safety buffer de 40px é respeitado
- [ ] Texto nunca corta nas bordas

---

### Verification (FASE 3)

**Export Tests**:
```bash
# Criar dashboard com charts variados
# Exportar para PDF
# Comparar visualmente com screen
```

**Success Criteria**:
- [ ] Fonts idênticas (Outfit/Geist Mono)
- [ ] Cores idênticas
- [ ] Espaçamentos idênticos
- [ ] Zero truncation (`...`)
- [ ] Zero clipping (bordas)

---

## 🧠 FASE 4: Advanced Intelligence (P2 - Important)

**Objetivo**: Charts auto-otimizam para storytelling

**Consolidates**: Sub-Projects 1.16-1.29

### 4.1 Smart Positioning (Anchor Point)

**Problema**: Valores sempre à direita, mesmo quando caberiam dentro

**Tasks**:
- [ ] Implementar lógica: `barWidth > labelWidth + 20px` → inside
- [ ] Passar `valuePositioning: 'inside' | 'outside' | 'top'` via `typeSpecific`

---

### 4.2 Contrast-Aware Labels

**Problema**: Texto branco em bar clara = ilegível

**Tasks**:
- [ ] Calcular luminance da cor da bar
- [ ] Retornar `textColor: 'black' | 'white'` baseado em contraste

---

### 4.3 Auto-Highlighting (Outliers)

**Problema**: User precisa configurar manualmente hero values

**Tasks**:
- [ ] Calcular Z-Score para cada valor
- [ ] Se `score > 2.0`: aplicar hero styling automaticamente

---

### 4.4 Semantic Features

Consolidar: Smart Sorting, Semantic Units, Smart Currency, etc.

---

### Verification (FASE 4)

**Visual Tests**:
- [ ] Valores aparecem dentro de bars largas
- [ ] Texto sempre legível (contraste automático)
- [ ] Outliers destacados automaticamente

---

## 🔄 FASE 5: Component Expansion (P2 - Important)

**Objetivo**: Todos os 16 charts usam Engine

**Consolidates**: Sub-Project 3

### 5.1 Column Family

**Charts**: `ColumnChart`, `StackedColumnChart`

**Challenge**: Staggered labels, dynamic bottom margin

**Tasks**:
- [ ] Criar `columnRules.ts`
- [ ] Implementar wrap-or-stagger strategy para X-axis
- [ ] Conectar `ColumnChart.tsx` ao Engine

---

### 5.2 Line Family

**Charts**: `LineChart`, `AreaChart`

**Challenge**: Continuous scales, aspect ratio preference

**Tasks**:
- [ ] Criar `lineRules.ts`
- [ ] Priorizar aspect ratio 16:9
- [ ] Garantir `minPlotWidth` para evitar linhas squashed

---

### 5.3 Circular Family

**Charts**: `PieChart`, `DonutChart`, `RadarChart`, `GaugeChart`

**Challenge**: 1:1 aspect ratio, external labels

**Tasks**:
- [ ] Criar `radialRules.ts`
- [ ] Implementar square constraints
- [ ] Implementar "Spider Legs" para labels

---

### 5.4 Mixed Charts

**Charts**: `MixedChart`, `PictogramChart`

**Challenge**: Dual-axis, non-standard grids

**Tasks**:
- [ ] Criar `mixedRules.ts`
- [ ] Implementar dual-axis margin reservation

---

### Verification (FASE 5)

**Regression Test**:
- [ ] Dashboard com 1 de cada tipo (16 charts)
- [ ] Todos renderizam corretamente
- [ ] Export PDF: todos visíveis, centralizados, sem crop

---

## 📋 Definition of Done

### Por Fase:

**FASE 1 (Core Engine)**:
- [ ] `npm test` passa (unit tests)
- [ ] `npm run build` passa (zero TypeScript errors)
- [ ] BarChart usa 100% Engine (fallback removido)
- [ ] Dashboard visual test passa

**FASE 2 (Visual Refinement)**:
- [ ] Charts preenchem containers elegantemente
- [ ] Density adaptation funciona (low/high)
- [ ] Optical balance é consistente

**FASE 3 (Export Fidelity)**:
- [ ] PDF = Screen (1:1 visual)
- [ ] Zero truncation
- [ ] Zero clipping
- [ ] Fonts corretas

**FASE 4 (Advanced Intelligence)**:
- [ ] Smart positioning funciona
- [ ] Contrast-aware funciona
- [ ] Auto-highlighting funciona

**FASE 5 (Expansion)**:
- [ ] Todos os 16 charts usam Engine
- [ ] Zero regressions
- [ ] Export test passa

---

## 🎯 Roadmap Visual

```mermaid
gantt
    title Smart Layout Implementation Timeline
    dateFormat  YYYY-MM-DD
    section FASE 1
    Text Measurement       :p0-1, 2026-01-24, 2d
    Dynamic Margins        :p0-2, after p0-1, 3d
    Label Wrapping         :p0-3, after p0-2, 2d
    Legend Sizing          :p0-4, after p0-3, 2d
    
    section FASE 2
    Vertical Fill          :p1-1, after p0-4, 2d
    Scale Safety           :p1-2, after p1-1, 1d
    Optical Balance        :p1-3, after p1-2, 2d
    Density Adaptation     :p1-4, after p1-3, 1d
    
    section FASE 3
    Environment Invariants :p1-5, after p1-4, 2d
    Font Synchronization   :p1-6, after p1-5, 2d
    Resolution Handling    :p1-7, after p1-6, 1d
    
    section FASE 4
    Smart Positioning      :p2-1, after p1-7, 2d
    Advanced Features      :p2-2, after p2-1, 3d
    
    section FASE 5
    Column Family          :p2-3, after p2-2, 2d
    Line Family            :p2-4, after p2-3, 2d
    Circular Family        :p2-5, after p2-4, 3d
    Mixed Charts           :p2-6, after p2-5, 2d
```

**Estimativa Total**: ~6-8 semanas (assumindo trabalho focado)

---

## 🚨 Riscos & Mitigações

### Risco 1: Performance (Text Measurement)

**Problema**: Medir texto para cada label pode ser lento

**Mitigação**:
- Implementar cache agressivo
- Batch measurements
- Usar Web Workers para medições pesadas

### Risco 2: Complexity Creep

**Problema**: Engine pode ficar muito complexo

**Mitigação**:
- Manter Engine stateless
- Separar concerns em modules (measurement, margins, wrapping)
- Extensive unit tests

### Risco 3: Migration Resistance

**Problema**: Componentes legados podem resistir à mudança

**Mitigação**:
- Manter fallback durante transição
- Migrar um chart por vez
- Extensive regression testing

---

## 📚 Referências

- **Original Plan**: `docs/smart-layout-implementation-plan.md`
- **Analysis**: `brain/analysis.md`
- **Related Skills**: 
  - `componentization`: Separation of concerns
  - `system_architecture`: Measurement-first, LOD principles
  - `task_breakdown`: Phased execution

---

## ✅ Next Steps

1. **Review este roadmap** com o time
2. **Criar task.md** para FASE 1
3. **Começar com 1.1** (Text Measurement & Caching)
4. **Iterar rapidamente** com testes visuais
5. **Documentar learnings** conforme avançamos
