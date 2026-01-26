import { ChartData } from '@/types';

/**
 * Utility to generate "crowded" datasets for testing anti-collision and spider legs logic.
 */
export const generateCrowdedData = (count: number = 12): ChartData => {
    // Realistic messy labels
    const baseLabels = [
        "Direct Sales Channel",
        "Referral Program (Q3)",
        "Organic Search (Primary)",
        "Social Media Ads - Retargeting",
        "Email Campaign #402",
        "Partner Network",
        "In-App Upsells",
        "Legacy Customers",
        "Abandoned Cart Recovery",
        "B2B Enterprise Grade",
        "Indie Developers",
        "Educational Institutions"
    ];

    const labels = Array.from({ length: count }, (_, i) => baseLabels[i % baseLabels.length] + (i >= baseLabels.length ? ` ${i}` : ''));
    const data = Array.from({ length: count }, () => Math.floor(Math.random() * 50) + 10);

    return {
        labels,
        datasets: [
            {
                label: 'Crowded Dataset',
                data,
            },
        ],
    };
};

/**
 * Generates extreme numeric data for stress testing.
 */
export const generateExtremeNumericData = (): ChartData => {
    return {
        labels: ['Billionaire Club', 'Startup Phase', 'Debt Level', 'Growth Rate %'],
        datasets: [
            {
                label: 'Financial Extremes',
                data: [980500600.55, 120.45, -500000, 42.12],
            },
        ],
    };
};

/**
 * Generates data with extremely long labels (Wall of Text).
 */
export const generateWallOfTextData = (): ChartData => {
    return {
        labels: [
            'Relatório de Desempenho Operacional e Eficiência de Recursos em Ambientes de Alta Disponibilidade Corporativa',
            'Investimentos em Infraestrutura de Redes de Próxima Geração com Foco em Latência Ultrabaixa',
            'Sistemas de Gerenciamento de Identidade e Acesso para Usuários Externos e Terceirizados em Conformidade com a LGPD',
            'Manutenção Preventiva de Ativos de Hardware em Data Centers Regionais do Sudeste'
        ],
        datasets: [
            {
                label: 'Complex Infrastructure',
                data: [35, 25, 20, 20],
            },
        ],
    };
};
