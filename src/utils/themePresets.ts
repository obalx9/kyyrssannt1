export type PostStyle = 'classic' | 'soft' | 'glass' | 'neomorphism' | 'minimal';
export type EmojiSet = 'love' | 'business' | 'fitness' | 'creative' | 'finance' | 'education' | 'health' | 'tech' | 'inspiration' | 'ocean';
export type Density = 'low' | 'medium' | 'high';
export type Shadow = 'none' | 'light' | 'medium' | 'strong';
export type Animation = 'fade-slide' | 'fade' | 'slide' | 'none';
export type HoverEffect = 'lift' | 'glow' | 'scale' | 'none';

export interface EmojiPattern {
  enabled: boolean;
  set: EmojiSet;
  emojis: string[];
  size: number;
  opacity: number;
  blur: number;
  density: Density;
  rotation: boolean;
}

export interface PostTheme {
  bg: string;
  bgOpacity: number;
  text: string;
  border: string;
  shadow: Shadow;
}

export interface PostSettings {
  style: PostStyle;
  borderRadius: number;
  light: PostTheme;
  dark: PostTheme;
  emojiPattern: EmojiPattern;
}

export interface ThemeConfig {
  background: {
    type: 'solid' | 'gradient' | 'animated-gradient';
    light: string;
    dark: string;
  };
  header: {
    light: {
      bg: string;
      text: string;
      bgOpacity: number;
    };
    dark: {
      bg: string;
      text: string;
      bgOpacity: number;
    };
  };
  posts: PostSettings;
  animations: {
    enabled: boolean;
    postAppear: Animation;
    hoverEffect: HoverEffect;
  };
}

export interface ThemePreset {
  id: string;
  name: string;
  nameRu: string;
  description: string;
  descriptionRu: string;
  config: ThemeConfig;
  preview: string;
}

export const emojiSets: Record<EmojiSet, { emojis: string[]; name: string; nameRu: string }> = {
  love: {
    emojis: ['❤️', '💕', '💖', '💗', '💓', '💝'],
    name: 'Love',
    nameRu: 'Любовь'
  },
  business: {
    emojis: ['💼', '📊', '💰', '📈', '💵', '🎯'],
    name: 'Business',
    nameRu: 'Бизнес'
  },
  fitness: {
    emojis: ['💪', '🔥', '⚡', '🏃', '🏋️', '⭐'],
    name: 'Fitness',
    nameRu: 'Фитнес'
  },
  creative: {
    emojis: ['🎨', '✨', '🌈', '🎭', '🖌️', '💫'],
    name: 'Creative',
    nameRu: 'Творчество'
  },
  finance: {
    emojis: ['💰', '💎', '📈', '💵', '🏆', '🌟'],
    name: 'Finance',
    nameRu: 'Финансы'
  },
  education: {
    emojis: ['📚', '🧠', '💡', '📖', '✏️', '🎓'],
    name: 'Education',
    nameRu: 'Образование'
  },
  health: {
    emojis: ['🌱', '🌿', '🍃', '🌸', '🌺', '🍀'],
    name: 'Health',
    nameRu: 'Здоровье'
  },
  tech: {
    emojis: ['🚀', '💻', '⚡', '🔧', '⚙️', '🤖'],
    name: 'Technology',
    nameRu: 'Технологии'
  },
  inspiration: {
    emojis: ['⭐', '✨', '🌟', '💫', '🌠', '⚡'],
    name: 'Inspiration',
    nameRu: 'Вдохновение'
  },
  ocean: {
    emojis: ['🌊', '💧', '🐋', '🐬', '🐠', '🌀'],
    name: 'Ocean',
    nameRu: 'Океан'
  }
};

export const postStyleInfo: Record<PostStyle, { name: string; nameRu: string; description: string; descriptionRu: string }> = {
  classic: {
    name: 'Classic',
    nameRu: 'Классический',
    description: 'Traditional cards with subtle shadow',
    descriptionRu: 'Традиционные карточки с легкой тенью'
  },
  soft: {
    name: 'Soft',
    nameRu: 'Мягкий',
    description: 'Rounded corners with gentle shadows',
    descriptionRu: 'Скругленные углы с мягкими тенями'
  },
  glass: {
    name: 'Glass',
    nameRu: 'Стеклянный',
    description: 'Modern glassmorphism effect',
    descriptionRu: 'Современный эффект стекла'
  },
  neomorphism: {
    name: 'Neomorphism',
    nameRu: 'Неоморфизм',
    description: 'Soft 3D embossed look',
    descriptionRu: 'Мягкий объемный эффект'
  },
  minimal: {
    name: 'Minimal',
    nameRu: 'Минималистичный',
    description: 'Clean with border only',
    descriptionRu: 'Чистый стиль с границей'
  }
};

export const themePresets: ThemePreset[] = [
  {
    id: 'pure-light',
    name: 'Pure Light',
    nameRu: 'Чистый светлый',
    description: 'Clean white theme',
    descriptionRu: 'Чистая белая тема',
    preview: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    config: {
      background: {
        type: 'solid',
        light: '#ffffff',
        dark: '#0f172a'
      },
      header: {
        light: {
          bg: '#ffffff',
          text: '#0f172a',
          bgOpacity: 0.95
        },
        dark: {
          bg: '#1e293b',
          text: '#f1f5f9',
          bgOpacity: 0.95
        }
      },
      posts: {
        style: 'minimal',
        borderRadius: 12,
        light: {
          bg: '#ffffff',
          bgOpacity: 1,
          text: '#0f172a',
          border: 'transparent',
          shadow: 'light'
        },
        dark: {
          bg: '#1e293b',
          bgOpacity: 1,
          text: '#f1f5f9',
          border: 'transparent',
          shadow: 'light'
        },
        emojiPattern: {
          enabled: false,
          set: 'inspiration',
          emojis: ['⭐', '✨', '🌟', '💫', '🌠', '⚡'],
          size: 48,
          opacity: 0.05,
          blur: 2,
          density: 'low',
          rotation: true
        }
      },
      animations: {
        enabled: true,
        postAppear: 'fade',
        hoverEffect: 'none'
      }
    }
  },
  {
    id: 'pure-dark',
    name: 'Pure Dark',
    nameRu: 'Чистый темный',
    description: 'Clean dark theme',
    descriptionRu: 'Чистая темная тема',
    preview: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    config: {
      background: {
        type: 'solid',
        light: '#ffffff',
        dark: '#0a0a0a'
      },
      header: {
        light: {
          bg: '#ffffff',
          text: '#0f172a',
          bgOpacity: 0.95
        },
        dark: {
          bg: '#171717',
          text: '#fafafa',
          bgOpacity: 0.95
        }
      },
      posts: {
        style: 'minimal',
        borderRadius: 12,
        light: {
          bg: '#ffffff',
          bgOpacity: 1,
          text: '#0f172a',
          border: 'transparent',
          shadow: 'light'
        },
        dark: {
          bg: '#1c1c1c',
          bgOpacity: 1,
          text: '#fafafa',
          border: 'transparent',
          shadow: 'light'
        },
        emojiPattern: {
          enabled: false,
          set: 'inspiration',
          emojis: ['⭐', '✨', '🌟', '💫', '🌠', '⚡'],
          size: 48,
          opacity: 0.05,
          blur: 2,
          density: 'low',
          rotation: true
        }
      },
      animations: {
        enabled: true,
        postAppear: 'fade',
        hoverEffect: 'none'
      }
    }
  },
  {
    id: 'peach-dream',
    name: 'Peach Dream',
    nameRu: 'Персиковая мечта',
    description: 'Soft peach pastels',
    descriptionRu: 'Мягкие персиковые тона',
    preview: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    config: {
      background: {
        type: 'gradient',
        light: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        dark: 'linear-gradient(135deg, #2d1b1b 0%, #3d2525 100%)'
      },
      header: {
        light: {
          bg: '#fff5ee',
          text: '#7c2d12',
          bgOpacity: 0.95
        },
        dark: {
          bg: '#3d2525',
          text: '#fed7aa',
          bgOpacity: 0.95
        }
      },
      posts: {
        style: 'soft',
        borderRadius: 20,
        light: {
          bg: 'linear-gradient(135deg, #ffffff 0%, #fff5ee 100%)',
          bgOpacity: 0.9,
          text: '#7c2d12',
          border: 'transparent',
          shadow: 'medium'
        },
        dark: {
          bg: 'linear-gradient(135deg, #3d2525 0%, #4a2f2f 100%)',
          bgOpacity: 0.9,
          text: '#fed7aa',
          border: 'transparent',
          shadow: 'medium'
        },
        emojiPattern: {
          enabled: true,
          set: 'love',
          emojis: ['🌸', '🌺', '💖', '✨', '🌼', '💫'],
          size: 50,
          opacity: 0.08,
          blur: 3,
          density: 'medium',
          rotation: true
        }
      },
      animations: {
        enabled: true,
        postAppear: 'fade-slide',
        hoverEffect: 'lift'
      }
    }
  },
  {
    id: 'lavender-mist',
    name: 'Lavender Mist',
    nameRu: 'Лавандовый туман',
    description: 'Gentle lavender tones',
    descriptionRu: 'Нежные лавандовые оттенки',
    preview: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    config: {
      background: {
        type: 'gradient',
        light: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
        dark: 'linear-gradient(135deg, #1e1b2e 0%, #2a2540 100%)'
      },
      header: {
        light: {
          bg: '#f3e8ff',
          text: '#581c87',
          bgOpacity: 0.95
        },
        dark: {
          bg: '#2a2540',
          text: '#e9d5ff',
          bgOpacity: 0.95
        }
      },
      posts: {
        style: 'soft',
        borderRadius: 18,
        light: {
          bg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
          bgOpacity: 0.9,
          text: '#581c87',
          border: 'transparent',
          shadow: 'medium'
        },
        dark: {
          bg: 'linear-gradient(135deg, #2a2540 0%, #352d4f 100%)',
          bgOpacity: 0.9,
          text: '#e9d5ff',
          border: 'transparent',
          shadow: 'medium'
        },
        emojiPattern: {
          enabled: true,
          set: 'creative',
          emojis: ['✨', '💫', '🌟', '⭐', '🌙', '💜'],
          size: 48,
          opacity: 0.08,
          blur: 3,
          density: 'medium',
          rotation: true
        }
      },
      animations: {
        enabled: true,
        postAppear: 'fade-slide',
        hoverEffect: 'glow'
      }
    }
  },
  {
    id: 'mint-fresh',
    name: 'Mint Fresh',
    nameRu: 'Свежая мята',
    description: 'Cool mint greens',
    descriptionRu: 'Прохладные мятные оттенки',
    preview: 'linear-gradient(135deg, #a1ffce 0%, #faffd1 100%)',
    config: {
      background: {
        type: 'gradient',
        light: 'linear-gradient(135deg, #a1ffce 0%, #faffd1 100%)',
        dark: 'linear-gradient(135deg, #0a1f1a 0%, #14291e 100%)'
      },
      header: {
        light: {
          bg: '#f0fdf4',
          text: '#14532d',
          bgOpacity: 0.95
        },
        dark: {
          bg: '#14291e',
          text: '#d1fae5',
          bgOpacity: 0.95
        }
      },
      posts: {
        style: 'soft',
        borderRadius: 16,
        light: {
          bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          bgOpacity: 0.9,
          text: '#14532d',
          border: 'transparent',
          shadow: 'medium'
        },
        dark: {
          bg: 'linear-gradient(135deg, #14291e 0%, #1a3328 100%)',
          bgOpacity: 0.9,
          text: '#d1fae5',
          border: 'transparent',
          shadow: 'medium'
        },
        emojiPattern: {
          enabled: true,
          set: 'health',
          emojis: ['🌱', '🌿', '🍃', '🌸', '🌺', '🍀'],
          size: 50,
          opacity: 0.08,
          blur: 3,
          density: 'high',
          rotation: true
        }
      },
      animations: {
        enabled: true,
        postAppear: 'fade-slide',
        hoverEffect: 'lift'
      }
    }
  },
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    nameRu: 'Океанские волны',
    description: 'Animated ocean gradient',
    descriptionRu: 'Анимированный океанский градиент',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    config: {
      background: {
        type: 'animated-gradient',
        light: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        dark: 'linear-gradient(135deg, #0a1929 0%, #0c2d48 50%, #1a3a52 100%)'
      },
      header: {
        light: {
          bg: '#eef2ff',
          text: '#312e81',
          bgOpacity: 0.95
        },
        dark: {
          bg: '#0c2d48',
          text: '#e0f2fe',
          bgOpacity: 0.95
        }
      },
      posts: {
        style: 'glass',
        borderRadius: 16,
        light: {
          bg: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(238,242,255,0.9) 100%)',
          bgOpacity: 0.9,
          text: '#312e81',
          border: 'transparent',
          shadow: 'medium'
        },
        dark: {
          bg: 'linear-gradient(135deg, rgba(12,45,72,0.9) 0%, rgba(26,58,82,0.9) 100%)',
          bgOpacity: 0.9,
          text: '#e0f2fe',
          border: 'transparent',
          shadow: 'medium'
        },
        emojiPattern: {
          enabled: true,
          set: 'ocean',
          emojis: ['🌊', '💧', '🐋', '🐬', '🐠', '🌀'],
          size: 50,
          opacity: 0.08,
          blur: 3,
          density: 'high',
          rotation: true
        }
      },
      animations: {
        enabled: true,
        postAppear: 'fade-slide',
        hoverEffect: 'glow'
      }
    }
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    nameRu: 'Закатное сияние',
    description: 'Animated sunset gradient',
    descriptionRu: 'Анимированный закатный градиент',
    preview: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    config: {
      background: {
        type: 'animated-gradient',
        light: 'linear-gradient(135deg, #fa709a 0%, #fee140 50%, #ffa07a 100%)',
        dark: 'linear-gradient(135deg, #1a0a0f 0%, #2d1419 50%, #3d1e24 100%)'
      },
      header: {
        light: {
          bg: '#fff7ed',
          text: '#7c2d12',
          bgOpacity: 0.95
        },
        dark: {
          bg: '#2d1419',
          text: '#fef3c7',
          bgOpacity: 0.95
        }
      },
      posts: {
        style: 'soft',
        borderRadius: 20,
        light: {
          bg: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,247,237,0.9) 100%)',
          bgOpacity: 0.9,
          text: '#7c2d12',
          border: 'transparent',
          shadow: 'strong'
        },
        dark: {
          bg: 'linear-gradient(135deg, rgba(45,20,25,0.9) 0%, rgba(61,30,36,0.9) 100%)',
          bgOpacity: 0.9,
          text: '#fef3c7',
          border: 'transparent',
          shadow: 'strong'
        },
        emojiPattern: {
          enabled: true,
          set: 'inspiration',
          emojis: ['🌅', '✨', '🌟', '💫', '🔥', '⭐'],
          size: 52,
          opacity: 0.08,
          blur: 3,
          density: 'medium',
          rotation: true
        }
      },
      animations: {
        enabled: true,
        postAppear: 'fade-slide',
        hoverEffect: 'scale'
      }
    }
  },
  {
    id: 'aurora',
    name: 'Aurora',
    nameRu: 'Северное сияние',
    description: 'Magical aurora gradient',
    descriptionRu: 'Волшебный градиент сияния',
    preview: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    config: {
      background: {
        type: 'animated-gradient',
        light: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #d299c2 100%)',
        dark: 'linear-gradient(135deg, #0a1a1f 0%, #1e2a3d 50%, #2d1b3d 100%)'
      },
      header: {
        light: {
          bg: '#f0fdfa',
          text: '#134e4a',
          bgOpacity: 0.95
        },
        dark: {
          bg: '#1e2a3d',
          text: '#ccfbf1',
          bgOpacity: 0.95
        }
      },
      posts: {
        style: 'glass',
        borderRadius: 18,
        light: {
          bg: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,253,250,0.9) 100%)',
          bgOpacity: 0.9,
          text: '#134e4a',
          border: 'transparent',
          shadow: 'medium'
        },
        dark: {
          bg: 'linear-gradient(135deg, rgba(30,42,61,0.9) 0%, rgba(45,27,61,0.9) 100%)',
          bgOpacity: 0.9,
          text: '#ccfbf1',
          border: 'transparent',
          shadow: 'medium'
        },
        emojiPattern: {
          enabled: true,
          set: 'creative',
          emojis: ['🌈', '✨', '💫', '🌟', '⭐', '💎'],
          size: 50,
          opacity: 0.08,
          blur: 3,
          density: 'high',
          rotation: true
        }
      },
      animations: {
        enabled: true,
        postAppear: 'fade-slide',
        hoverEffect: 'glow'
      }
    }
  },
  {
    id: 'neon-night',
    name: 'Neon Night',
    nameRu: 'Неоновая ночь',
    description: 'Vibrant neon gradient',
    descriptionRu: 'Яркий неоновый градиент',
    preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    config: {
      background: {
        type: 'animated-gradient',
        light: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #4facfe 100%)',
        dark: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1f 50%, #0a1a2f 100%)'
      },
      header: {
        light: {
          bg: '#fef2f2',
          text: '#881337',
          bgOpacity: 0.95
        },
        dark: {
          bg: '#1a0a1f',
          text: '#fce7f3',
          bgOpacity: 0.95
        }
      },
      posts: {
        style: 'glass',
        borderRadius: 16,
        light: {
          bg: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(254,242,242,0.9) 100%)',
          bgOpacity: 0.9,
          text: '#881337',
          border: 'transparent',
          shadow: 'strong'
        },
        dark: {
          bg: 'linear-gradient(135deg, rgba(26,10,31,0.9) 0%, rgba(10,26,47,0.9) 100%)',
          bgOpacity: 0.9,
          text: '#fce7f3',
          border: 'transparent',
          shadow: 'strong'
        },
        emojiPattern: {
          enabled: true,
          set: 'tech',
          emojis: ['⚡', '🚀', '💫', '✨', '🔥', '💎'],
          size: 52,
          opacity: 0.1,
          blur: 2,
          density: 'high',
          rotation: true
        }
      },
      animations: {
        enabled: true,
        postAppear: 'fade-slide',
        hoverEffect: 'glow'
      }
    }
  },
  {
    id: 'cloud-white',
    name: 'Cloud White',
    nameRu: 'Облачный белый',
    description: 'Soft white clouds',
    descriptionRu: 'Мягкие белые облака',
    preview: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
    config: {
      background: {
        type: 'gradient',
        light: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
        dark: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
      },
      header: {
        light: {
          bg: '#ffffff',
          text: '#0f172a',
          bgOpacity: 0.95
        },
        dark: {
          bg: '#1e293b',
          text: '#f1f5f9',
          bgOpacity: 0.95
        }
      },
      posts: {
        style: 'soft',
        borderRadius: 16,
        light: {
          bg: '#ffffff',
          bgOpacity: 0.9,
          text: '#0f172a',
          border: 'transparent',
          shadow: 'light'
        },
        dark: {
          bg: '#1e293b',
          bgOpacity: 0.9,
          text: '#f1f5f9',
          border: 'transparent',
          shadow: 'light'
        },
        emojiPattern: {
          enabled: true,
          set: 'inspiration',
          emojis: ['☁️', '✨', '🌟', '💫', '⭐', '🌙'],
          size: 48,
          opacity: 0.06,
          blur: 3,
          density: 'medium',
          rotation: true
        }
      },
      animations: {
        enabled: true,
        postAppear: 'fade',
        hoverEffect: 'lift'
      }
    }
  },
  {
    id: 'midnight',
    name: 'Midnight',
    nameRu: 'Полночь',
    description: 'Deep midnight blue',
    descriptionRu: 'Глубокий полуночный синий',
    preview: 'linear-gradient(135deg, #000428 0%, #004e92 100%)',
    config: {
      background: {
        type: 'gradient',
        light: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
        dark: 'linear-gradient(135deg, #000428 0%, #004e92 100%)'
      },
      header: {
        light: {
          bg: '#f8fafc',
          text: '#1e3a8a',
          bgOpacity: 0.95
        },
        dark: {
          bg: '#001840',
          text: '#dbeafe',
          bgOpacity: 0.95
        }
      },
      posts: {
        style: 'glass',
        borderRadius: 14,
        light: {
          bg: '#ffffff',
          bgOpacity: 0.9,
          text: '#1e3a8a',
          border: 'transparent',
          shadow: 'medium'
        },
        dark: {
          bg: 'linear-gradient(135deg, rgba(0,24,64,0.8) 0%, rgba(0,56,120,0.8) 100%)',
          bgOpacity: 0.9,
          text: '#dbeafe',
          border: 'transparent',
          shadow: 'medium'
        },
        emojiPattern: {
          enabled: true,
          set: 'inspiration',
          emojis: ['🌙', '⭐', '✨', '💫', '🌟', '🌠'],
          size: 50,
          opacity: 0.1,
          blur: 2,
          density: 'high',
          rotation: true
        }
      },
      animations: {
        enabled: true,
        postAppear: 'fade-slide',
        hoverEffect: 'glow'
      }
    }
  }
];

export function getThemePreset(id: string): ThemePreset | undefined {
  return themePresets.find(preset => preset.id === id);
}

export function getDefaultTheme(): ThemePreset {
  return themePresets[0];
}

export function mergeThemeConfig(partial: Partial<ThemeConfig>): ThemeConfig {
  const def = getDefaultTheme().config;
  return {
    ...def,
    ...partial,
    posts: {
      ...def.posts,
      ...(partial.posts || {}),
      emojiPattern: {
        ...def.posts.emojiPattern,
        ...((partial.posts as any)?.emojiPattern || {})
      }
    },
    animations: {
      ...def.animations,
      ...(partial.animations || {})
    }
  };
}

export function generateEmojiPositions(
  count: number,
  containerWidth: number,
  containerHeight: number,
  emojiSize: number
): Array<{ x: number; y: number; rotation: number; emoji: string; size: number }> {
  const positions: Array<{ x: number; y: number; rotation: number; emoji: string; size: number }> = [];

  for (let i = 0; i < count; i++) {
    positions.push({
      x: Math.random() * (containerWidth - emojiSize),
      y: Math.random() * (containerHeight - emojiSize),
      rotation: Math.random() * 60 - 30,
      emoji: '',
      size: emojiSize + Math.random() * 12 - 6
    });
  }

  return positions;
}

export function getDensityCount(density: Density, baseCount: number = 12): number {
  switch (density) {
    case 'low':
      return Math.floor(baseCount * 0.5);
    case 'medium':
      return baseCount;
    case 'high':
      return Math.floor(baseCount * 1.5);
    default:
      return baseCount;
  }
}
