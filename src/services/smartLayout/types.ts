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
        [key: string]: any;
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
