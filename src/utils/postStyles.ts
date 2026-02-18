import type { CSSProperties } from 'react';
import { PostTheme, PostStyle, Shadow } from './themePresets';

export function getShadowStyle(shadow: Shadow, isDark: boolean): string {
  switch (shadow) {
    case 'none':
      return 'none';
    case 'light':
      return isDark
        ? '0 2px 8px rgba(0, 0, 0, 0.3)'
        : '0 2px 8px rgba(0, 0, 0, 0.1)';
    case 'medium':
      return isDark
        ? '0 4px 12px rgba(0, 0, 0, 0.4)'
        : '0 4px 12px rgba(0, 0, 0, 0.15)';
    case 'strong':
      return isDark
        ? '8px 8px 16px rgba(0, 0, 0, 0.5), -8px -8px 16px rgba(255, 255, 255, 0.02)'
        : '8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff';
    default:
      return 'none';
  }
}

export function getBackdropFilter(style: PostStyle): string {
  return style === 'glass' ? 'blur(20px)' : 'none';
}

export function getGlassEffect(intensity: 'light' | 'medium' | 'strong' = 'medium'): CSSProperties {
  const blurValues = {
    light: '10px',
    medium: '16px',
    strong: '24px'
  };

  return {
    backdropFilter: `blur(${blurValues[intensity]}) saturate(180%)`,
    WebkitBackdropFilter: `blur(${blurValues[intensity]}) saturate(180%)`,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
  };
}

export function getGlassEffectDark(intensity: 'light' | 'medium' | 'strong' = 'medium'): CSSProperties {
  const blurValues = {
    light: '10px',
    medium: '16px',
    strong: '24px'
  };

  return {
    backdropFilter: `blur(${blurValues[intensity]}) saturate(180%)`,
    WebkitBackdropFilter: `blur(${blurValues[intensity]}) saturate(180%)`,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
  };
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (hex.startsWith('rgba')) {
    return null;
  }
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function getBgColorWithOpacity(bg: string, opacity: number): string {
  // If already rgba, return as is
  if (bg.startsWith('rgba')) {
    return bg;
  }

  // If it's a gradient, we can't directly apply opacity to it
  // Instead, we'll return the gradient and handle opacity differently
  if (bg.includes('gradient')) {
    // For gradients, we should keep them opaque or handle them separately
    // Return the gradient as-is since CSS doesn't support gradient opacity directly
    return bg;
  }

  // For hex colors, convert to rgba
  const rgb = hexToRgb(bg);
  if (rgb) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
  }

  return bg;
}

// Helper to determine if background should use backgroundImage or backgroundColor
export function getBackgroundStyleProperty(bg: string, opacity: number): { backgroundColor?: string; backgroundImage?: string } {
  // If it's a gradient, use backgroundImage
  if (bg.includes('gradient')) {
    return {
      backgroundImage: bg
    };
  }

  // For solid colors, use backgroundColor with opacity
  return {
    backgroundColor: getBgColorWithOpacity(bg, opacity)
  };
}

// Wrapper function that always returns backgroundColor (for gradients, returns as-is since CSS needs it)
export function getBackgroundColor(bg: string, opacity: number): string {
  // For gradients, return the gradient string (will be used in backgroundImage)
  // For solid colors, apply opacity
  if (bg.includes('gradient')) {
    return 'transparent'; // Use transparent backgroundColor and set backgroundImage separately
  }

  return getBgColorWithOpacity(bg, opacity);
}

export function getPostStyles(
  theme: PostTheme,
  style: PostStyle,
  borderRadius: number,
  isDark: boolean
) {
  const backgroundStyles = getBackgroundStyleProperty(theme.bg, theme.bgOpacity);

  return {
    ...backgroundStyles,
    borderRadius: `${borderRadius}px`,
    border: theme.border !== 'transparent' ? `1px solid ${theme.border}` : 'none',
    boxShadow: getShadowStyle(theme.shadow, isDark),
    backdropFilter: getBackdropFilter(style),
    WebkitBackdropFilter: getBackdropFilter(style),
    color: theme.text
  };
}

export function getHoverStyles(hoverEffect: string): CSSProperties {
  switch (hoverEffect) {
    case 'lift':
      return {
        transform: 'translateY(-4px)',
        transition: 'all 0.3s ease'
      };
    case 'glow':
      return {
        filter: 'brightness(1.05)',
        transition: 'all 0.3s ease'
      };
    case 'scale':
      return {
        transform: 'scale(1.02)',
        transition: 'all 0.3s ease'
      };
    case 'none':
    default:
      return {};
  }
}

export function getAnimationClass(animation: string, index: number): string {
  switch (animation) {
    case 'fade-slide':
      return `animate-fade-slide-${Math.min(index, 4)}`;
    case 'fade':
      return `animate-fade-${Math.min(index, 4)}`;
    case 'slide':
      return `animate-slide-${Math.min(index, 4)}`;
    case 'none':
    default:
      return '';
  }
}
