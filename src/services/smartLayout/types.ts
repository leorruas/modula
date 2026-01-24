import { ChartData, ChartStyle, GridConfig as ProjectGridConfig } from '@/types';

export type GridConfig = ProjectGridConfig;

export interface Zone {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ChartAnalysis {
    chartType: string;
    mode: 'classic' | 'infographic';
    dataComplexity: {
        categoryCount: number;
        datasetCount: number;
        maxValue: number;
        minValue: number;
        maxLabelWidthPx: number;
        maxValueWidthPx: number;
    };
    layoutRequirements: {
        needsLegend: boolean;
        needsAxisLabels: boolean;
        userLegendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';
        hasTitle?: boolean;
        titleText?: string;
        hasCaption?: boolean;
        captionText?: string;
    };
    availableSpace: {
        width: number;
        height: number;
        aspectRatio: number;
    };
}

export interface ComputedLayout {
    container: {
        width: number;
        height: number;
    };
    zones: {
        plot: Zone;
        legend: Zone | null;
        xAxis: Zone | null;
        yAxis: Zone | null;
    };
    margins: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    scaling: {
        factor: number;
        appliedTo: string[];
    };
    typeSpecific?: {
        barThickness?: number;
        labelWrapThreshold?: number;      // Character threshold for wrapping
        labelWrapThresholdPx?: number;    // Pixel threshold for wrapping
        estimatedLabelLines?: number;     // Max lines across all labels
        wrappedLabels?: string[][];       // Array of wrapped lines per label
        [key: string]: any;
    };
    overflowRisk?: {
        hasRisk: boolean;
        warnings: string[];
        appliedAdjustments: boolean;
    };
}

export interface LayoutRules {
    idealAspectRatio: number;
    preferredOrientation: 'portrait' | 'landscape' | 'any';
    legendPosition: 'top' | 'bottom' | 'left' | 'right' | 'none';
    marginPriority: ('top' | 'bottom' | 'left' | 'right' | 'all-equal')[];
    minPlotWidth: number; // Ratio (0-1)
}

export type ModeModifiers = {
    fontSizeMultiplier: number;
    marginMultiplier: number;
    strokeWidthMultiplier: number;
};
