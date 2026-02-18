import { useState } from 'react';
import { BookOpen, Moon, Sun } from 'lucide-react';
import { type ThemeConfig } from '../utils/themePresets';
import PreviewEmojiPattern from './PreviewEmojiPattern';

interface ThemePreviewProps {
  config: ThemeConfig;
  courseName?: string;
}

export default function ThemePreview({ config, courseName = 'Название курса' }: ThemePreviewProps) {
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');

  const getShadowStyle = (shadow: string): string => {
    const isDark = previewTheme === 'dark';
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
    return config.posts.style === 'glass' ? 'blur(20px)' : 'none';
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const getBgColor = (bg: string, bgOpacity?: number): string => {
    if (bg.startsWith('rgba') || bg.startsWith('linear-gradient')) {
      return bg;
    }
    const rgb = hexToRgb(bg);
    if (rgb && bgOpacity !== undefined) {
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${bgOpacity})`;
    }
    return bg;
  };

  const getHeaderBgColor = (bg: string, opacity: number): string => {
    if (bg.startsWith('rgba')) {
      return bg;
    }
    const rgb = hexToRgb(bg);
    if (rgb) {
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    }
    return `rgba(255, 255, 255, ${opacity})`;
  };

  const postTheme = previewTheme === 'dark' ? config.posts.dark : config.posts.light;
  const headerTheme = previewTheme === 'dark' ? config.header.dark : config.header.light;
  const backgroundGradient = previewTheme === 'dark' ? config.background.dark : config.background.light;
  const isAnimatedGradient = config.background.type === 'animated-gradient';

  const samplePosts = [
    {
      id: 1,
      title: 'Урок 1: Введение',
      content: 'Добро пожаловать в курс! В этом уроке мы познакомимся с основными концепциями.',
      hasMedia: true
    },
    {
      id: 2,
      title: 'Урок 2: Практика',
      content: 'Применим полученные знания на практике. Разберем несколько примеров.',
      hasMedia: false
    },
    {
      id: 3,
      title: 'Урок 3: Углубленное изучение',
      content: 'Погрузимся глубже в материал и изучим продвинутые техники.',
      hasMedia: true
    }
  ];

  return (
    <div
      className="relative overflow-hidden rounded-lg border"
      style={{
        minHeight: '600px',
        borderColor: previewTheme === 'dark' ? '#374151' : '#e5e7eb'
      }}
    >
      <div
        className={`absolute inset-0 ${isAnimatedGradient ? 'animate-gradient' : ''}`}
        style={{
          background: backgroundGradient,
          backgroundSize: isAnimatedGradient ? '200% 200%' : 'auto'
        }}
      />

      {config.posts.emojiPattern?.enabled && (
        <PreviewEmojiPattern pattern={config.posts.emojiPattern} />
      )}

      <div className="relative z-10">
        <div
          className="sticky top-0 z-10 backdrop-blur-md border-b transition-colors"
          style={{
            backgroundColor: getHeaderBgColor(headerTheme.bg, headerTheme.bgOpacity),
            borderColor: previewTheme === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.05)',
            color: headerTheme.text
          }}
        >
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: headerTheme.text,
                  opacity: 0.1
                }}
              >
                <BookOpen
                  className="w-5 h-5"
                  style={{ color: headerTheme.text }}
                />
              </div>
              <div>
                <h1
                  className="text-sm font-bold"
                  style={{ color: headerTheme.text }}
                >
                  {courseName}
                </h1>
              </div>
            </div>
            <button
              onClick={() => setPreviewTheme(prev => prev === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-lg hover:opacity-70 transition-opacity"
              style={{ opacity: 0.8 }}
            >
              {previewTheme === 'dark' ? (
                <Sun className="w-4 h-4" style={{ color: headerTheme.text }} />
              ) : (
                <Moon className="w-4 h-4" style={{ color: headerTheme.text }} />
              )}
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {samplePosts.map((post) => (
            <div
              key={post.id}
              className="relative overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: getBgColor(postTheme.bg, postTheme.bgOpacity),
                borderRadius: `${config.posts.borderRadius}px`,
                border: postTheme.border !== 'transparent' ? `1px solid ${postTheme.border}` : 'none',
                boxShadow: getShadowStyle(postTheme.shadow),
                backdropFilter: getBackdropFilter(),
                WebkitBackdropFilter: getBackdropFilter(),
                color: postTheme.text
              }}
            >
              <div className="p-4">
                <div className="text-sm leading-relaxed opacity-90 mb-3">
                  {post.content}
                </div>
                {post.hasMedia && (
                  <div
                    className="w-full h-32 rounded-lg"
                    style={{
                      background: previewTheme === 'dark'
                        ? 'linear-gradient(135deg, #434343 0%, #000000 100%)'
                        : 'linear-gradient(135deg, #e0e0e0 0%, #c0c0c0 100%)'
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
