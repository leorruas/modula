'use client';

import React from 'react';
import { DonutChart } from '@/features/charts/components/DonutChart';
import { generateCrowdedData, generateWallOfTextData, generateExtremeNumericData } from '@/utils/chartMockData';

export default function RadialStressPage() {
    const gridConfig = {
        baseFontSize: 11,
        columns: 12,
        rows: 8,
        gutter: 16,
        margin: 24,
        pageFormat: 'A4',
        orientation: 'portrait',
        width: 210,
        height: 297
    } as any;

    // Real World Test Case with specific small slices
    const realWorldData = {
        labels: ['Organic Search', 'Direct Traffic', 'Referral', 'Social Media', 'Other'],
        datasets: [{
            label: 'Traffic Source',
            data: [4200, 3100, 1500, 800, 400]
        }]
    };

    return (
        <div style={{ padding: 40, background: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div>
                <h1 style={{ color: '#111', fontWeight: '900', fontSize: 32, marginBottom: 8 }}>Radial Layout Engine</h1>
                <p style={{ color: '#666' }}>Stress testing geometric containment and variable thickness strategies.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 24 }}>

                {/* Scenario 1: Real World Mixed Mix */}
                <div style={{ background: 'white', padding: 32, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <h2 style={{ fontSize: 14, fontWeight: '700', textTransform: 'uppercase', marginBottom: 24, color: '#888', letterSpacing: '0.05em' }}>Real World Performance</h2>
                    <div style={{ width: 400, height: 400, margin: '0 auto' }}>
                        <DonutChart
                            width={400}
                            height={400}
                            data={realWorldData}
                            style={{ mode: 'infographic', fontFamily: 'Inter' }}
                            gridConfig={gridConfig}
                        />
                    </div>
                </div>

                {/* Scenario 2: Wall of Text - Dynamic Margins Test */}
                <div style={{ background: 'white', padding: 32, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <h2 style={{ fontSize: 14, fontWeight: '700', textTransform: 'uppercase', marginBottom: 24, color: '#888', letterSpacing: '0.05em' }}>Dynamic Margin (Wall of Text)</h2>
                    <div style={{ width: 400, height: 400, margin: '0 auto' }}>
                        <DonutChart
                            width={400}
                            height={400}
                            data={generateWallOfTextData()}
                            style={{ mode: 'infographic', fontFamily: 'Inter' }}
                            gridConfig={gridConfig}
                        />
                    </div>
                </div>

                {/* Scenario 3: Extreme Numbers */}
                <div style={{ background: 'white', padding: 32, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <h2 style={{ fontSize: 14, fontWeight: '700', textTransform: 'uppercase', marginBottom: 24, color: '#888', letterSpacing: '0.05em' }}>Extreme Numeric Formatting</h2>
                    <div style={{ width: 400, height: 400, margin: '0 auto' }}>
                        <DonutChart
                            width={400}
                            height={400}
                            data={generateExtremeNumericData()}
                            style={{ mode: 'infographic', fontFamily: 'Inter' }}
                            gridConfig={gridConfig}
                        />
                    </div>
                </div>

                {/* Scenario 4: Crowded Data (Spider Legs Chaos) */}
                <div style={{ background: 'white', padding: 32, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <h2 style={{ fontSize: 14, fontWeight: '700', textTransform: 'uppercase', marginBottom: 24, color: '#888', letterSpacing: '0.05em' }}>Crowded Optimization (12+ Slices)</h2>
                    <div style={{ width: 400, height: 400, margin: '0 auto' }}>
                        <DonutChart
                            width={400}
                            height={400}
                            data={generateCrowdedData(12)}
                            style={{ mode: 'infographic', fontFamily: 'Inter' }}
                            gridConfig={gridConfig}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
