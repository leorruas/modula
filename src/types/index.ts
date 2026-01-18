export interface GridConfig {
    columns: number;
    rows: number;
    gutter: number; // in mm
    margin: number; // in mm
    pageFormat: 'A4' | 'A3' | 'A5' | 'Custom';
    orientation: 'portrait' | 'landscape';
    width: number; // in mm
    height: number; // in mm
    mode?: 'flexible' | 'fixed'; // New property
    fixedModuleWidth?: number; // New property
    fixedModuleHeight?: number; // New property
}

export interface ChartModule {
    x: number;
    y: number;
    w: number;
    h: number;
}

export type ChartType = 'bar' | 'column' | 'line' | 'area' | 'pie' | 'donut' | 'scatter' | 'bubble' | 'radar' | 'mixed' | 'histogram' | 'boxplot' | 'pictogram' | 'custom';

export interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
    }[];
    xAxisLabel?: string; // Optional X-axis label
    yAxisLabel?: string; // Optional Y-axis label
    iconConfig?: {
        category: string;
        iconKey: string;
        enabled: boolean;
        position?: 'left' | 'right';
    };
}

export interface ChartStyle {
    colorPalette: string[];
    fontFamily: string;
    mode?: 'classic' | 'infographic'; // Dual-mode system
}

export interface Chart {
    id: string;
    projectId: string;
    userId: string;
    name: string;
    type: ChartType;
    module: ChartModule;
    data: ChartData;
    style?: ChartStyle;
    notes?: string;
    page: number; // Added page number (1-based)
    createdAt: number;
    updatedAt: number;
}

export interface Project {
    id: string;
    userId: string;
    name: string;
    description?: string;
    gridConfig: GridConfig;
    totalPages: number;
    useChapters?: boolean;
    chapters?: { title: string; startPage: number }[];
    colors?: string[]; // Project-wide default color palette
    createdAt: number;
    updatedAt: number;
}
