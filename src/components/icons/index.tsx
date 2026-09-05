import Svg, { Circle, Path, Rect, type SvgProps } from 'react-native-svg';

/**
 * Hand-drawn SVG icon set for KOOL Logistics.
 *
 * Deliberately not SF Symbols / Material icons: those render differently per
 * platform, and this app must look identical on iOS and Android. Every icon is
 * a 24x24 grid, 1.8 stroke, round caps, and ships an `active` (filled) state
 * for tab selection.
 */

export type IconProps = SvgProps & {
  size?: number;
  color?: string;
  /** Filled treatment used when a tab is selected. */
  active?: boolean;
};

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
});

const stroke = (color: string) => ({
  stroke: color,
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function HomeIcon({ size = 24, color = '#000', active, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M3.6 10.7 12 4.2l8.4 6.5V19a2 2 0 0 1-2 2h-3.6v-5.4H9.2V21H5.6a2 2 0 0 1-2-2z"
        {...stroke(color)}
        fill={active ? color : 'none'}
        fillOpacity={active ? 0.16 : 0}
      />
    </Svg>
  );
}

export function PackageIcon({ size = 24, color = '#000', active, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M12 3.1 20.4 7.5v9L12 20.9 3.6 16.5v-9z"
        {...stroke(color)}
        fill={active ? color : 'none'}
        fillOpacity={active ? 0.16 : 0}
      />
      <Path d="M3.6 7.5 12 12m0 0 8.4-4.5M12 12v8.9" {...stroke(color)} />
      <Path d="M7.8 5.3l8.4 4.5" {...stroke(color)} strokeOpacity={0.55} />
    </Svg>
  );
}

export function ScanIcon({ size = 24, color = '#000', active, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path d="M3.4 8.6V6.4a3 3 0 0 1 3-3h2.2" {...stroke(color)} />
      <Path d="M15.4 3.4h2.2a3 3 0 0 1 3 3v2.2" {...stroke(color)} />
      <Path d="M20.6 15.4v2.2a3 3 0 0 1-3 3h-2.2" {...stroke(color)} />
      <Path d="M8.6 20.6H6.4a3 3 0 0 1-3-3v-2.2" {...stroke(color)} />
      <Path d="M3.4 12h17.2" {...stroke(color)} strokeOpacity={active ? 1 : 0.6} />
    </Svg>
  );
}

export function BellIcon({ size = 24, color = '#000', active, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M18.2 9.1a6.2 6.2 0 1 0-12.4 0c0 5-2 6.6-2 6.6h16.4s-2-1.6-2-6.6Z"
        {...stroke(color)}
        fill={active ? color : 'none'}
        fillOpacity={active ? 0.16 : 0}
      />
      <Path d="M13.8 19.1a2.1 2.1 0 0 1-3.6 0" {...stroke(color)} />
    </Svg>
  );
}

export function UserIcon({ size = 24, color = '#000', active, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Circle
        cx={12}
        cy={8.2}
        r={3.7}
        {...stroke(color)}
        fill={active ? color : 'none'}
        fillOpacity={active ? 0.16 : 0}
      />
      <Path d="M4.9 20.4a7.3 7.3 0 0 1 14.2 0" {...stroke(color)} />
    </Svg>
  );
}

export function TruckIcon({ size = 24, color = '#000', active, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M2.8 6.6h10.6v9.2H2.8z"
        {...stroke(color)}
        fill={active ? color : 'none'}
        fillOpacity={active ? 0.16 : 0}
      />
      <Path d="M13.4 9.8h3.4l3.4 3.2v2.8h-6.8z" {...stroke(color)} />
      <Circle cx={7} cy={17.8} r={1.9} {...stroke(color)} />
      <Circle cx={17.2} cy={17.8} r={1.9} {...stroke(color)} />
    </Svg>
  );
}

/**
 * The official KOOL Logistics mark, traced from the brand artwork on
 * koollogistiks.com — flag, chevron and three speed lines. Real geometry, not
 * an approximation, so it stays exact at any size.
 */
export function ChevronMarkIcon({ size = 24, color = '#F57D1C', ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path d="M5.14 4.04L12.24 4.04L18.61 11.88L17.88 13.10L12.49 13.10L12.00 13.84L12.73 14.57L24.00 14.57L23.76 15.31L10.53 15.55L10.29 16.29L10.78 16.78L20.82 16.78L20.33 17.76L9.31 17.76L8.82 18.24L9.31 18.98L16.41 18.98L15.92 19.96L5.63 19.96L11.51 11.88L5.39 4.29L3.18 7.22L5.39 10.90L5.14 11.63L3.67 13.59L1.22 10.41L0.00 11.88L4.90 4.29Z" fill={color} fillRule="evenodd" clipRule="evenodd" />
    </Svg>
  );
}

export function DeliveriesIcon({ size = 24, color = '#000', ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path d="M4.2 12a7.8 7.8 0 0 1 13.1-5.7l2.5 2.3" {...stroke(color)} />
      <Path d="M19.8 12a7.8 7.8 0 0 1-13.1 5.7l-2.5-2.3" {...stroke(color)} />
      <Path d="M20.4 3.9v4.9h-4.9" {...stroke(color)} />
      <Path d="M3.6 20.1v-4.9h4.9" {...stroke(color)} />
    </Svg>
  );
}

export function NewTaskIcon({ size = 24, color = '#000', ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      <Path
        d="M8.4 4.6H6.6a2 2 0 0 0-2 2v11.8a2 2 0 0 0 2 2h10.8a2 2 0 0 0 2-2V6.6a2 2 0 0 0-2-2h-1.8"
        {...stroke(color)}
      />
      <Rect x={8.4} y={2.8} width={7.2} height={3.6} rx={1.2} {...stroke(color)} />
      <Path d="M8.9 13.4l2 2 4.2-4.2" {...stroke(color)} />
    </Svg>
  );
}

/**
 * Decorative QR illustration for the scanner panel.
 *
 * Not a real encoder — it is a deterministic module grid plus the three finder
 * patterns, so it reads unmistakably as a QR code without pulling in a QR
 * library for what is purely an illustration.
 */
export function QrPatternIcon({ size = 132, color = '#111519', ...rest }: SvgProps & { size?: number; color?: string }) {
  const N = 21;
  const cell = 100 / N;

  const finder = (gx: number, gy: number) => [
    <Rect key={`f${gx}${gy}`} x={gx * cell} y={gy * cell} width={cell * 7} height={cell * 7} fill={color} />,
    <Rect key={`fi${gx}${gy}`} x={(gx + 1) * cell} y={(gy + 1) * cell} width={cell * 5} height={cell * 5} fill="#fff" />,
    <Rect key={`fc${gx}${gy}`} x={(gx + 2) * cell} y={(gy + 2) * cell} width={cell * 3} height={cell * 3} fill={color} />,
  ];

  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);

  // Deterministic pseudo-random fill so the pattern never flickers between renders.
  const modules: React.ReactElement[] = [];
  let seed = 0x2f6e2b1;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      if (inFinder(x, y)) continue;
      if ((seed >> 16) % 100 < 46) {
        modules.push(
          <Rect key={`m${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill={color} />,
        );
      }
    }
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none" {...rest}>
      {modules}
      {finder(0, 0)}
      {finder(N - 7, 0)}
      {finder(0, N - 7)}
    </Svg>
  );
}


export function TrackIcon({ size = 24, color = '#000', active, ...rest }: IconProps) {
  return (
    <Svg {...base(size)} {...rest}>
      {/* Location pin over a route line: "where is my package" */}
      <Path
        d="M12 21.2s6.2-5.3 6.2-10a6.2 6.2 0 1 0-12.4 0c0 4.7 6.2 10 6.2 10Z"
        {...stroke(color)}
        fill={active ? color : 'none'}
        fillOpacity={active ? 0.16 : 0}
      />
      <Circle cx={12} cy={11} r={2.4} {...stroke(color)} />
    </Svg>
  );
}

export const Icons = {
  home: HomeIcon,
  package: PackageIcon,
  scan: ScanIcon,
  bell: BellIcon,
  user: UserIcon,
  truck: TruckIcon,
  chevronMark: ChevronMarkIcon,
  deliveries: DeliveriesIcon,
  newTask: NewTaskIcon,
  track: TrackIcon,
};

export type IconName = keyof typeof Icons;
