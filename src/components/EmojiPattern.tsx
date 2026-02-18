import { useEffect, useState, useMemo, useRef } from 'react';
import { EmojiPattern as EmojiPatternType, generateEmojiPositions, getDensityCount } from '../utils/themePresets';

interface EmojiPatternProps {
  pattern: EmojiPatternType;
}

export default function EmojiPattern({ pattern }: EmojiPatternProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width || 600,
          height: rect.height || 400
        });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const emojiPositions = useMemo(() => {
    if (!pattern.enabled) return [];

    const count = getDensityCount(pattern.density, 12);
    const positions = generateEmojiPositions(
      count,
      dimensions.width,
      dimensions.height,
      pattern.size
    );

    return positions.map((pos, index) => ({
      ...pos,
      emoji: pattern.emojis[index % pattern.emojis.length]
    }));
  }, [pattern, dimensions]);

  if (!pattern.enabled) {
    return null;
  }

  return (
    <div
      ref={containerRef}
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
          <filter id={`emoji-blur-${pattern.set}`}>
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
            filter={`url(#emoji-blur-${pattern.set})`}
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
