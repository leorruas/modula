import { ChartType, ChartData } from '@/types';

export const recommendChartType = (data: ChartData): ChartType | null => {
    const { labels, datasets } = data;
    const datasetCount = datasets.length;
    const dataPointCount = labels.length;

    if (datasetCount === 0 || dataPointCount === 0) return null;

    // Helper: Check if labels look like years or dates
    const isTimeBased = labels.every(l => {
        return /^(19|20)\d{2}$/.test(l) ||
            /\d{1,2}\/\d{1,2}/.test(l) ||
            /\d{4}-\d{2}/.test(l) ||
            /^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i.test(l) ||
            /^(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i.test(l);
    });

    // Helper: Check if all values are positive
    const allPositive = datasets.every(ds => ds.data.every(v => v >= 0));

    // Helper: Check if values look like percentages (sum to ~100)
    const looksLikePercentages = datasetCount === 1 && allPositive &&
        Math.abs(datasets[0].data.reduce((a, b) => a + b, 0) - 100) < 5;

    // Helper: Calculate value variance
    const getVariance = (values: number[]) => {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    };

    // 1. BOXPLOT: If exactly 5 datasets with labels like Min/Q1/Median/Q3/Max
    const boxplotLabels = ['min', 'q1', 'median', 'q3', 'max'];
    if (datasetCount === 5) {
        const normalizedLabels = datasets.map(ds => ds.label.toLowerCase());
        const hasBoxplotPattern = boxplotLabels.every(bl =>
            normalizedLabels.some(nl => nl.includes(bl))
        );
        if (hasBoxplotPattern) return 'boxplot';
    }

    // 2. HISTOGRAM: Single dataset with many points and label suggests distribution/frequency
    const histogramKeywords = ['frequência', 'frequencia', 'distribuição', 'distribuicao', 'quantidade'];
    if (datasetCount === 1 && dataPointCount > 8) {
        const labelText = datasets[0].label.toLowerCase();
        if (histogramKeywords.some(kw => labelText.includes(kw))) {
            return 'histogram';
        }
    }

    // 3. PIE/DONUT: Percentages, proportions, or few categories
    if (datasetCount === 1 && dataPointCount <= 7 && allPositive) {
        if (looksLikePercentages) return 'pie';
        // Check if labels suggest parts of a whole
        const labelText = labels.join(' ').toLowerCase();
        if (labelText.includes('%') || labelText.includes('share') || labelText.includes('participação')) {
            return 'pie';
        }
        // For very few items (3-6), pie is good for proportion
        if (dataPointCount >= 3 && dataPointCount <= 6) return 'pie';
    }

    // 4. TIME SERIES: Line or Area
    if (isTimeBased) {
        // If multiple datasets stacked nicely, suggest area
        if (datasetCount > 1 && datasetCount <= 3 && allPositive) {
            return 'area';
        }
        // Single or few datasets -> Line
        return 'line';
    }

    // 5. SCATTER/BUBBLE: If labels look like coordinates or has "vs" pattern
    if (datasetCount === 1 || datasetCount === 2) {
        const labelPattern = labels.join(' ').toLowerCase();
        if (labelPattern.includes('vs') || labelPattern.includes('versus')) {
            return 'scatter';
        }
    }

    // 6. RADAR: Multi-dimensional comparison (categorical dimensions, multiple subjects)
    if (datasetCount >= 2 && dataPointCount >= 3 && dataPointCount <= 10) {
        // If labels look like dimensions/attributes
        const dimensionKeywords = ['capacidade', 'habilidade', 'skill', 'performance', 'desempenho'];
        const labelText = labels.join(' ').toLowerCase();
        if (dimensionKeywords.some(kw => labelText.includes(kw))) {
            return 'radar';
        }
    }

    // 7. MIXED: Two datasets with very different scales
    if (datasetCount === 2) {
        const scale1 = Math.max(...datasets[0].data);
        const scale2 = Math.max(...datasets[1].data);
        const ratio = Math.max(scale1, scale2) / Math.min(scale1, scale2);
        // If scales differ by more than 5x, suggest mixed
        if (ratio > 5) return 'mixed';
    }

    // 8. BAR vs COLUMN: Many categories -> Bar (horizontal better for labels)
    if (dataPointCount > 10) {
        return 'bar';
    }

    // 9. COLUMN: Default for categorical comparison
    if (datasetCount >= 1) {
        return 'column';
    }

    return null;
};

export const getRecommendationReason = (type: ChartType): string => {
    switch (type) {
        case 'line': return "Dados temporais detectados (ideal para evolução).";
        case 'area': return "Séries temporais múltiplas (mostra volume acumulado).";
        case 'pie': return "Proporções ou percentuais (composição do todo).";
        case 'donut': return "Variação do gráfico de pizza.";
        case 'bar': return "Muitas categorias (leitura horizontal facilita labels).";
        case 'column': return "Comparação entre categorias.";
        case 'mixed': return "Duas séries com escalas diferentes detectadas.";
        case 'scatter': return "Dados de correlação ou comparação vs.";
        case 'radar': return "Comparação multidimensional detectada.";
        case 'histogram': return "Distribuição de frequência detectada.";
        case 'boxplot': return "Dados estatísticos (quartis) detectados.";
        default: return "Sugestão baseada em padrões dos dados.";
    }
};
