import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { useColors } from '@/theme';

/**
 * Empty-state scenes, hand-drawn on a 160x120 grid so they look the same on
 * iOS, Android and web. Theme-aware: a soft grey stage, white objects with a
 * charcoal-grey outline, and one orange accent (the CRM's "orange is the
 * accent" rule).
 */
export type EmptyArtName =
  | 'deliveries'
  | 'completed'
  | 'history'
  | 'search'
  | 'notifications'
  | 'offline'
  | 'unassigned'
  | 'camera';

export function EmptyArt({ name, size = 148 }: { name: EmptyArtName; size?: number }) {
  const c = useColors();
  const ink = c.textMuted;
  const line = { stroke: ink, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paper = c.surface;
  const accent = c.brand;
  const accentSoft = c.brandSoft;

  const stage = (
    <>
      <Circle cx={80} cy={58} r={50} fill={c.surfaceSunken} />
      <Ellipse cx={80} cy={104} rx={44} ry={5} fill={c.border} opacity={0.7} />
    </>
  );

  const box = (x: number, y: number, w: number, h: number, tape = true) => (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={4} fill={paper} {...line} />
      {tape ? <Rect x={x + w / 2 - 6} y={y} width={12} height={h * 0.42} fill={accentSoft} stroke={accent} strokeWidth={1.6} /> : null}
    </G>
  );

  const scenes: Record<EmptyArtName, React.ReactNode> = {
    // An empty, open parcel waiting by a map pin — nothing to deliver yet.
    deliveries: (
      <>
        {stage}
        <Path d="M38 100c10-14 30-6 42-16s20-20 34-18" stroke={ink} strokeWidth={2} strokeDasharray="2 6" strokeLinecap="round" fill="none" opacity={0.6} />
        <Path d="M50 62h44v36H50z" fill={paper} {...line} />
        <Path d="M50 62l-8-12h44l8 12M94 62l10-10" fill={c.surfaceAlt} {...line} />
        <Path d="M66 80h12" {...line} />
        <Path d="M118 30c-7 0-12 5-12 11.5C106 50 118 62 118 62s12-12 12-20.5C130 35 125 30 118 30z" fill={accent} />
        <Circle cx={118} cy={41.5} r={4.5} fill={paper} />
      </>
    ),
    // Delivered parcels with a check badge and a little confetti.
    completed: (
      <>
        {stage}
        {box(46, 66, 40, 32)}
        {box(56, 40, 30, 26)}
        <Circle cx={104} cy={48} r={17} fill={c.success} />
        <Path d="m96 48 6 6 11-12" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Circle cx={40} cy={34} r={3} fill={accent} />
        <Rect x={118} y={76} width={6} height={6} rx={1.5} fill={accent} transform="rotate(20 121 79)" />
        <Circle cx={124} cy={26} r={2.5} fill={ink} opacity={0.5} />
      </>
    ),
    // A clipboard of past runs with a clock.
    history: (
      <>
        {stage}
        <Rect x={50} y={22} width={52} height={74} rx={6} fill={paper} {...line} />
        <Rect x={64} y={16} width={24} height={12} rx={4} fill={c.surfaceAlt} {...line} />
        <Path d="M60 44h8M74 44h18M60 58h8M74 58h14M60 72h8M74 72h16" {...line} />
        <Circle cx={108} cy={80} r={16} fill={accent} />
        <Path d="M108 71v9l6 4" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
    // A magnifier over a parcel — nothing matched.
    search: (
      <>
        {stage}
        {box(44, 54, 42, 40)}
        <Circle cx={100} cy={50} r={20} fill={paper} fillOpacity={0.85} stroke={accent} strokeWidth={4} />
        <Path d="m114 64 14 14" stroke={accent} strokeWidth={6} strokeLinecap="round" />
        <Path d="M93 47h14" {...line} />
      </>
    ),
    // A resting bell — nothing new.
    notifications: (
      <>
        {stage}
        <Path d="M80 26c-14 0-24 10-24 24v16l-7 12h62l-7-12V50c0-14-10-24-24-24z" fill={paper} {...line} />
        <Path d="M72 84a8 8 0 0 0 16 0" fill={accent} />
        <Circle cx={80} cy={23} r={3.5} fill={ink} />
        <Path d="M106 26h9l-9 10h9M118 14h6l-6 7h6" stroke={accent} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
    // A cloud with a slash — no connection.
    offline: (
      <>
        {stage}
        <Path d="M54 84h56a16 16 0 0 0 0-32 24 24 0 0 0-45-6 16 16 0 0 0-11 38z" fill={paper} {...line} />
        <Path d="M50 30l62 62" stroke={accent} strokeWidth={4} strokeLinecap="round" />
      </>
    ),
    // A parcel with swap arrows — reassigned / not yours.
    unassigned: (
      <>
        {stage}
        {box(58, 50, 44, 40)}
        <Path d="M40 40h22l-6-6M62 40l-6 6" stroke={accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M120 100H98l6-6M98 100l6 6" stroke={ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
    // A phone camera framing a QR code.
    camera: (
      <>
        {stage}
        <Rect x={56} y={18} width={48} height={84} rx={8} fill={paper} {...line} />
        <Path d="M74 25h12" {...line} />
        <Path d="M64 44v-6h6M90 38h6v6M96 70v6h-6M70 76h-6v-6" stroke={accent} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Rect x={70} y={48} width={8} height={8} rx={1} fill={ink} />
        <Rect x={82} y={48} width={8} height={8} rx={1} fill={ink} />
        <Rect x={70} y={60} width={8} height={8} rx={1} fill={ink} />
        <Rect x={84} y={62} width={4} height={4} fill={accent} />
        <Path d="M60 57h40" stroke={accent} strokeWidth={1.6} strokeLinecap="round" opacity={0.8} />
      </>
    ),
  };

  return (
    <Svg width={size} height={(size * 120) / 160} viewBox="0 0 160 120" fill="none">
      {scenes[name]}
    </Svg>
  );
}
