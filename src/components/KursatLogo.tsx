interface KursatLogoProps {
  size?: number;
  className?: string;
  color?: string;
}

export default function KursatLogo({ size = 40, className = '', color = 'currentColor' }: KursatLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="4" y="14" width="56" height="46" rx="8" fill={color} opacity="0.12" />

      <path
        d="M32 4L6 18v4l26 14 26-14v-4L32 4z"
        fill={color}
      />
      <path
        d="M12 22v18c0 8 9 16 20 16s20-8 20-16V22L32 36 12 22z"
        fill={color}
        opacity="0.7"
      />

      <rect x="50" y="26" width="3" height="24" rx="1.5" fill={color} />
      <ellipse cx="51.5" cy="52" rx="5" ry="2.5" fill={color} opacity="0.5" />

      <path
        d="M24 30v16M24 38l8-8 8 8"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
