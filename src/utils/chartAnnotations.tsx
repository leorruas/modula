/**
 * Radial Gradient Helper for Charts
 * Creates vibrant radial gradients for infographic aesthetics
 */

import React from 'react';

export function createRadialGradient(id: string, color: string, centerX: number = 50, centerY: number = 50) {
    return (
        <defs>
            <radialGradient id={id} cx={`${centerX}%`} cy={`${centerY}%`} r="50%">
                <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                <stop offset="50%" stopColor={color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={color} stopOpacity={0.1} />
            </radialGradient>
        </defs>
    );
}

/**
 * Chart Annotation/Callout Type
 */
export interface ChartAnnotation {
    type: 'arrow' | 'text' | 'box' | 'circle';
    x: number;
    y: number;
    text?: string;
    targetX?: number;
    targetY?: number;
    width?: number;
    height?: number;
    color?: string;
    fontSize?: number;
}

/**
 * Render annotation/callout on chart
 */
export function renderAnnotation(annotation: ChartAnnotation, index: number) {
    const color = annotation.color || '#3b82f6';
    const fontSize = annotation.fontSize || 12;

    switch (annotation.type) {
        case 'arrow':
            return (
                <g key={index}>
                    <defs>
                        <marker
                            id={`arrowhead-${index}`}
                            markerWidth={10}
                            markerHeight={10}
                            refX={9}
                            refY={3}
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <path d="M0,0 L0,6 L9,3 z" fill={color} />
                        </marker>
                    </defs>
                    <line
                        x1={annotation.x}
                        y1={annotation.y}
                        x2={annotation.targetX}
                        y2={annotation.targetY}
                        stroke={color}
                        strokeWidth={2}
                        markerEnd={`url(#arrowhead-${index})`}
                    />
                    {annotation.text && (
                        <text
                            x={annotation.x}
                            y={annotation.y - 10}
                            fontSize={fontSize}
                            fontWeight={600}
                            fill={color}
                        >
                            {annotation.text}
                        </text>
                    )}
                </g>
            );

        case 'text':
            return (
                <text
                    key={index}
                    x={annotation.x}
                    y={annotation.y}
                    fontSize={fontSize}
                    fontWeight={600}
                    fill={color}
                >
                    {annotation.text}
                </text>
            );

        case 'box':
            return (
                <g key={index}>
                    <rect
                        x={annotation.x}
                        y={annotation.y}
                        width={annotation.width || 100}
                        height={annotation.height || 40}
                        fill="white"
                        stroke={color}
                        strokeWidth={2}
                        rx={4}
                        opacity={0.95}
                    />
                    {annotation.text && (
                        <text
                            x={annotation.x + (annotation.width || 100) / 2}
                            y={annotation.y + (annotation.height || 40) / 2}
                            fontSize={fontSize}
                            fontWeight={600}
                            fill={color}
                            textAnchor="middle"
                            alignmentBaseline="middle"
                        >
                            {annotation.text}
                        </text>
                    )}
                </g>
            );

        case 'circle':
            return (
                <g key={index}>
                    <circle
                        cx={annotation.x}
                        cy={annotation.y}
                        r={20}
                        fill="none"
                        stroke={color}
                        strokeWidth={2}
                        strokeDasharray="4,2"
                    />
                    {annotation.text && (
                        <text
                            x={annotation.x}
                            y={annotation.y - 30}
                            fontSize={fontSize}
                            fontWeight={600}
                            fill={color}
                            textAnchor="middle"
                        >
                            {annotation.text}
                        </text>
                    )}
                </g>
            );

        default:
            return null;
    }
}
