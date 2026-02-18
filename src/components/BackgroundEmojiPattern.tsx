import { useMemo } from 'react';
import { EmojiPattern as EmojiPatternType, generateEmojiPositions, getDensityCount } from '../utils/themePresets';

interface BackgroundEmojiPatternProps {
  pattern: EmojiPatternType;
}

export default function BackgroundEmojiPattern({ pattern }: BackgroundEmojiPatternProps) {
  const emojiPositions = useMemo(() => {
    if (!pattern.enabled) return [];

    const width = window.innerWidth;
    const height = Math.max(window.innerHeight * 2, 2000);
    const count = getDensityCount(pattern.density, 80);
    const positions = generateEmojiPositions(
      count,
      width,
      height,
      pattern.size
    );

    return positions.map((pos, index) => ({
      ...pos,
      emoji: pattern.emojis[index % pattern.emojis.length]
    }));
  }, [pattern]);

  if (!pattern.enabled) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <svg
        width="100%"
        height="200%"
        className="absolute inset-0"
        style={{ opacity: pattern.opacity }}
      >
        <defs>
          <filter id={`bg-emoji-blur-${pattern.set}`}>
            <feGaussianBlur stdDeviation={pattern.blur} />
          </filter>
        </defs>
        {emojiPositions.map((pos, index) => (
          <text
            key={index}
            x={pos.x}
            y={pos.y}
            fontSize={pos.size}
            transform={pattern.rotation ? `rotate(${pos.rotation} ${pos.x} ${pos.y})` : undefined}
            filter={`url(#bg-emoji-blur-${pattern.set})`}
            style={{
              userSelect: 'none',
              pointerEvents: 'none'
            }}
          >
            {pos.emoji}
          </text>
        ))}
      </svg>
    </div>
  );
}
