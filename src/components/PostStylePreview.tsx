import { PostStyle, PostTheme } from '../utils/themePresets';

interface PostStylePreviewProps {
  style: PostStyle;
  theme: PostTheme;
  borderRadius: number;
  isDark: boolean;
}

export default function PostStylePreview({ style, theme, borderRadius, isDark }: PostStylePreviewProps) {
  const getShadowStyle = (shadow: string): string => {
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
  };

  const getBackdropFilter = (): string => {
    return style === 'glass' ? 'blur(20px)' : 'none';
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const getBgColor = (): string => {
    if (theme.bg.startsWith('rgba')) {
      return theme.bg;
    }
    const rgb = hexToRgb(theme.bg);
    if (rgb) {
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${theme.bgOpacity})`;
    }
    return theme.bg;
  };

  return (
    <div
      className="relative overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: getBgColor(),
        borderRadius: `${borderRadius}px`,
        border: theme.border !== 'transparent' ? `1px solid ${theme.border}` : 'none',
        boxShadow: getShadowStyle(theme.shadow),
        backdropFilter: getBackdropFilter(),
        WebkitBackdropFilter: getBackdropFilter(),
        color: theme.text
      }}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-full"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
            }}
          />
          <div className="text-sm font-medium">Preview Post</div>
        </div>
        <div className="text-sm opacity-75">
          This is how your posts will look with this style
        </div>
      </div>
    </div>
  );
}
