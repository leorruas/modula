
import { SmartLayoutEngine } from './src/services/smartLayout/SmartLayoutEngine';
import { ChartData, ChartStyle, GridConfig } from './src/types';

console.log("Starting reproduction...");

const mockGridConfig: GridConfig = {
    baseFontSize: 11,
    baseFontUnit: 'pt',
    columns: 12,
    rows: 8,
    gutter: 16,
    margin: 24,
    pageFormat: 'A4',
    orientation: 'portrait',
    width: 210,
    height: 297
};

const labels = ['A', 'B'];
const datasets = [{ label: 'Series 1', data: [100, 50] }]; // Max value 100
const style: ChartStyle = { mode: 'classic' };

const chart = {
    type: 'bar',
    data: { labels, datasets },
    style
};

try {
    const analysis = SmartLayoutEngine.analyzeChart(
        chart as any,
        mockGridConfig,
        { w: 600, h: 400 }
    );

    console.log("Analysis Result:");
    console.log(JSON.stringify(analysis.dataComplexity, null, 2));

    const layout = SmartLayoutEngine.computeLayout(
        chart as any,
        mockGridConfig,
        { w: 600, h: 400 }
    );

    console.log("Classic Margins Right:", layout.margins.right);
} catch (e) {
    console.error(e);
}
