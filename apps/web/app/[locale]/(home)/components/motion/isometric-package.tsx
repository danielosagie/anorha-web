import { pointString } from './geometry';

export type IsometricPackageProps = {
  accent: string;
  clipId: string;
  packageLeft: string;
  packageRight: string;
  packageTop: string;
};

const TOP_FACE = [
  [-112, -36],
  [0, -102],
  [112, -36],
  [0, 30],
] as const;

export function IsometricPackage({
  accent,
  clipId,
  packageLeft,
  packageRight,
  packageTop,
}: IsometricPackageProps) {
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <polygon points={pointString(TOP_FACE)} />
        </clipPath>
      </defs>

      <polygon
        fill={packageTop}
        points={pointString(TOP_FACE)}
        stroke="#6D4429"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
      <polygon
        fill={packageLeft}
        points={pointString([
          [-112, -36],
          [0, 30],
          [0, 138],
          [-112, 72],
        ])}
        stroke="#6D4429"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
      <polygon
        fill={packageRight}
        points={pointString([
          [0, 30],
          [112, -36],
          [112, 72],
          [0, 138],
        ])}
        stroke="#6D4429"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />

      <g clipPath={`url(#${clipId})`}>
        <rect
          fill="#F3D9B5"
          height="24"
          opacity="0.95"
          rx="3"
          width="284"
          x="-142"
          y="-50"
        />
        <line
          opacity="0.65"
          stroke="#D7A56B"
          strokeWidth="2"
          x1="-142"
          x2="142"
          y1="-38"
          y2="-38"
        />
      </g>

      <path
        d="M -112 -36 L 0 30 L 112 -36"
        fill="none"
        opacity="0.62"
        stroke="#8B5A35"
        strokeWidth="2"
      />
      <path
        d="M 0 30 L 0 138"
        fill="none"
        opacity="0.52"
        stroke="#8B5A35"
        strokeWidth="2"
      />

      <g transform="translate(-78 8) skewY(30)">
        <rect fill="#FCFAF2" height="48" rx="6" width="64" />
        <rect fill={accent} height="8" rx="4" width="44" x="9" y="9" />
        <rect
          fill="#82735F"
          height="4"
          opacity="0.64"
          rx="2"
          width="32"
          x="9"
          y="23"
        />
        <rect
          fill="#82735F"
          height="4"
          opacity="0.44"
          rx="2"
          width="40"
          x="9"
          y="32"
        />
      </g>

      <g transform="translate(20 10) skewY(-30)">
        <rect fill="#FFF8ED" height="62" rx="6" width="76" />
        <path
          d="M 28 9 L 44 9 L 42 23 C 41 29 31 29 30 23 Z M 36 29 L 36 37 M 28 38 L 44 38"
          fill="none"
          stroke="#D65B4A"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3.5"
        />
        <text
          fill="#B84336"
          fontSize="12"
          fontWeight="700"
          letterSpacing="0.08em"
          textAnchor="middle"
          x="38"
          y="53"
        >
          FRAGILE
        </text>
      </g>
    </g>
  );
}
