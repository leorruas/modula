export interface GridConfig {
    columns: number;
    rows: number;
    gutter: number; // in mm
    margin: number; // in mm (deprecated, use individual margins)
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    pageFormat: 'A4' | 'A3' | 'A5' | 'Custom';
    orientation: 'portrait' | 'landscape';
    width: number; // in mm
    height: number; // in mm
    mode?: 'flexible' | 'fixed'; // New property
    fixedModuleWidth?: number; // New property
    fixedModuleHeight?: number; // New property
    baseFontSize?: number; // Default base size for text
    baseFontUnit?: 'pt' | 'px' | 'mm'; // Unit for base size
    unit?: 'mm' | 'cm' | 'px' | 'in'; // Preferred display unit
}

export interface ChartModule {
    x: number;
    y: number;
    w: number;
    h: number;
}

export type ChartType = 'bar' | 'column' | 'line' | 'area' | 'pie' | 'donut' | 'scatter' | 'bubble' | 'radar' | 'mixed' | 'histogram' | 'boxplot' | 'pictogram' | 'gauge' | 'custom';

export interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        metadata?: string[]; // Phase 3: Per-value custom annotations
    }[];
    xAxisLabel?: string; // Optional X-axis label
    yAxisLabel?: string; // Optional Y-axis label
    iconConfig?: {
        category: string;
        iconKey: string;
        enabled: boolean;
        position?: 'left' | 'right';
        valuePerIcon?: number;
    };
}


export interface NumberFormatConfig {
    type: 'number' | 'percent' | 'currency';
    currency?: 'BRL' | 'USD' | 'EUR' | 'GBP';
    decimals?: number; // default based on type
    scale?: number; // e.g. 100 for percentage if data is 0-1
}

export interface ChartStyle {
    colorPalette?: string[];
    fontFamily: string;
    mode?: 'classic' | 'infographic'; // Dual-mode system
    useGradient?: boolean;
    showShadow?: boolean;
    finish?: 'standard' | 'glass'; // New finish option
    glassIntensity?: 'light' | 'medium' | 'heavy';
    glassColor?: string; // Custom tint for glass
    legendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';

    // New: Number Formatting
    numberFormat?: NumberFormatConfig;
    secondaryNumberFormat?: NumberFormatConfig; // Format for Y2 axis or specific datasets

    // Phase 2: Infographic Controls
    infographicConfig?: {
        heroValueIndex?: number;           // Manual hero value highlighting (index)
        showValueAnnotations?: boolean;    // Show annotation badges
        showDeltaPercent?: boolean;        // Show % vs average
        annotationLabels?: string[];       // Custom labels for annotations (by index)
        legendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';
        showExtremes?: boolean; // Phase 3: Highlight Max/Min automatically
        useMetadata?: boolean;  // Phase 3: Use metadata from data for annotations
        showAllLabels?: boolean; // Toggle to disable smart hiding of labels in infographics
        sortSlices?: boolean; // Sort slices by value (Largest to Smallest)
        autoSort?: boolean;   // Phase 4: Smart Sorting for Bar/Column charts
        debugLayoutMode?: boolean; // SUB-PROJECT 1.12: Visual transparency
        labelLayout?: 'radial' | 'column-left' | 'column-right' | 'balanced'; // Smart Column Layout (Spider Legs)
        minSliceSize?: boolean; // Ensure small slices are visible
        showLabelsCategory?: boolean; // Toggle category names in labels for high density


    };
    datasetTypes?: ('bar' | 'line')[]; // Explicit type definition for mixed charts
    stacked?: boolean; // Stacked charts for bar/mixed types
    useDualAxis?: boolean; // MixedChart: enables y2Axis for line datasets
    y2AxisLabel?: string;  // Label for the secondary Y axis
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
    defaultStyle?: ChartStyle; // Project-wide default style
    createdAt: number;
    updatedAt: number;
}

export interface UserPreferences {
    defaultColors?: string[];
    defaultStyle?: ChartStyle;
}
