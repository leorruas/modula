
import React from 'react';
import { CHART_THEME } from '@/utils/chartTheme';

interface FilterProps {
    id: string;
}

interface GradientProps {
    id: string;
    color: string;
    direction?: 'vertical' | 'horizontal';
}

/**
 * iOS-style "Liquid Glass" filter
 * Mimics inner glow/rim light using morphology
 */
export const IOSGlassFilter: React.FC<FilterProps> = ({ id }) => (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
        {/* 1. The Rim Light (Top/Left Highlight) */}
        <feMorphology in="SourceAlpha" operator="erode" radius="1.2" result="eroded" />
        <feGaussianBlur in="eroded" stdDeviation="0.8" result="blurredErode" />
        <feComposite in="SourceAlpha" in2="blurredErode" operator="out" result="rimMask" />

        <feFlood floodColor="white" floodOpacity="0.95" result="whiteColor" />
        <feComposite in="whiteColor" in2="rimMask" operator="in" result="rimLight" />

        {/* 2. The Inner Glow (Volume/Gummy feel) */}
        <feMorphology in="SourceAlpha" operator="erode" radius="4" result="deepErode" />
        <feGaussianBlur in="deepErode" stdDeviation="5" result="innerBlur" />
        <feComposite in="SourceAlpha" in2="innerBlur" operator="out" result="innerGlowMask" />
        <feFlood floodColor="white" floodOpacity="0.3" result="glowColor" />
        <feComposite in="glowColor" in2="innerGlowMask" operator="in" result="innerGlow" />

        {/* 3. Soft Drop Shadow (Light transmission) */}
        <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="shadowBlur" />
        <feOffset dx="0" dy="3" in="shadowBlur" result="shadowOffset" />
        <feFlood floodColor="black" floodOpacity="0.1" result="shadowColor" />
        <feComposite in="shadowColor" in2="shadowOffset" operator="in" result="dropShadow" />

        {/* 4. Merge Stack */}
        <feMerge>
            <feMergeNode in="dropShadow" />
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="innerGlow" />
            <feMergeNode in="rimLight" />
        </feMerge>
    </filter>
);

export const GlassGradient: React.FC<GradientProps> = ({ id, color }) => (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.85" />
        <stop offset="100%" stopColor={color} stopOpacity="0.4" />
    </linearGradient>
);

export const MiniIOSGlassFilter: React.FC<FilterProps> = ({ id }) => (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
        {/* Mini Rim Light */}
        <feMorphology in="SourceAlpha" operator="erode" radius="0.5" result="eroded" />
        <feGaussianBlur in="eroded" stdDeviation="0.3" result="blurredErode" />
        <feComposite in="SourceAlpha" in2="blurredErode" operator="out" result="rimMask" />
        <feFlood floodColor="white" floodOpacity="0.9" result="whiteColor" />
        <feComposite in="whiteColor" in2="rimMask" operator="in" result="rimLight" />

        {/* Mini Inner Glow */}
        <feMorphology in="SourceAlpha" operator="erode" radius="1.5" result="deepErode" />
        <feGaussianBlur in="deepErode" stdDeviation="1.5" result="innerBlur" />
        <feComposite in="SourceAlpha" in2="innerBlur" operator="out" result="innerGlowMask" />
        <feFlood floodColor="white" floodOpacity="0.4" result="glowColor" />
        <feComposite in="glowColor" in2="innerGlowMask" operator="in" result="innerGlow" />

        {/* Merge */}
        <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="innerGlow" />
            <feMergeNode in="rimLight" />
        </feMerge>
    </filter>
);

export const IOSGlassLineFilter: React.FC<FilterProps> = ({ id }) => (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
        {/* 1. Rim Light (Gentler Erosion for Lines) */}
        <feMorphology in="SourceAlpha" operator="erode" radius="0.5" result="eroded" />
        <feGaussianBlur in="eroded" stdDeviation="0.4" result="blurredErode" />
        <feComposite in="SourceAlpha" in2="blurredErode" operator="out" result="rimMask" />

        <feFlood floodColor="white" floodOpacity="0.95" result="whiteColor" />
        <feComposite in="whiteColor" in2="rimMask" operator="in" result="rimLight" />

        {/* 2. Inner Glow (Reduced for thinner stroke) */}
        <feMorphology in="SourceAlpha" operator="erode" radius="1" result="deepErode" />
        <feGaussianBlur in="deepErode" stdDeviation="2" result="innerBlur" />
        <feComposite in="SourceAlpha" in2="innerBlur" operator="out" result="innerGlowMask" />
        <feFlood floodColor="white" floodOpacity="0.4" result="glowColor" />
        <feComposite in="glowColor" in2="innerGlowMask" operator="in" result="innerGlow" />

        {/* 3. Soft Drop Shadow */}
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="shadowBlur" />
        <feOffset dx="0" dy="2" in="shadowBlur" result="shadowOffset" />
        <feFlood floodColor="black" floodOpacity="0.15" result="shadowColor" />
        <feComposite in="shadowColor" in2="shadowOffset" operator="in" result="dropShadow" />

        {/* 4. Merge Stack */}
        <feMerge>
            <feMergeNode in="dropShadow" />
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="innerGlow" />
            <feMergeNode in="rimLight" />
        </feMerge>
    </filter>
);

export const ShadowFilter: React.FC<FilterProps> = ({ id }) => (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation={CHART_THEME.effects.shadowBlur} />
        <feOffset dx="0" dy="2" result="offsetblur" />
        <feComponentTransfer>
            <feFuncA type="linear" slope={CHART_THEME.effects.shadowOpacity} />
        </feComponentTransfer>
        <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
        </feMerge>
    </filter>
);
