import { useMemo } from 'react';
import { EmojiPattern as EmojiPatternType, generateEmojiPositions, getDensityCount } from '../utils/themePresets';

interface PreviewEmojiPatternProps {
  pattern: EmojiPatternType;
  width?: number;
  height?: number;
}

export default function PreviewEmojiPattern({
  pattern,
  width = 800,
  height = 600
}: PreviewEmojiPatternProps) {
  const emojiPositions = useMemo(() => {
    if (!pattern.enabled) return [];

    const count = getDensityCount(pattern.density, 30);
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
  }, [pattern, width, height]);

  if (!pattern.enabled) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <svg
        width="100%"
        height="100%"
        className="absolute inset-0"
        style={{ opacity: pattern.opacity }}
      >
        <defs>
          <filter id={`preview-emoji-blur-${pattern.set}`}>
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
            filter={`url(#preview-emoji-blur-${pattern.set})`}
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
