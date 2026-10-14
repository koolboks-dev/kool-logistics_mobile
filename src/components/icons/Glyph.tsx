import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { FILL_OPACITY, GLYPHS, type GlyphName, type GlyphPart } from './glyph-data';

export type { GlyphName };

/**
 * The app's small icons (buttons, inputs, rows, banners, empty states) —
 * custom SVG like the tab icons, so iOS and Android draw them identically.
 * Replaces Ionicons (DESIGN.md §9).
 *
 * Grid 24×24, stroke 1.8, round caps and joins. Names keep the Ionicons
 * spelling the app already used; `-outline` names are line icons, the rest
 * (e.g. `checkmark-circle`) add a soft filled shape for emphasis.
 *
 *   <Glyph name="call-outline" size={18} color={c.brand} />
 */


export function Glyph({ name, size = 24, color = '#000' }: { name: GlyphName; size?: number; color?: string }) {
  const parts: readonly GlyphPart[] = GLYPHS[name];
  const s = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {parts.map((p, i) => {
        const fill = 'fill' in p && p.fill ? color : 'none';
        const fillOpacity = 'fill' in p && p.fill ? FILL_OPACITY : 0;
        if ('circle' in p) {
          const [cx, cy, r] = p.circle;
          if ('solid' in p && p.solid) return <Circle key={i} cx={cx} cy={cy} r={r + 0.4} fill={color} />;
          return <Circle key={i} cx={cx} cy={cy} r={r} {...s} fill={fill} fillOpacity={fillOpacity} />;
        }
        if ('rect' in p) {
          const [x, y, w, h, r] = p.rect;
          return <Rect key={i} x={x} y={y} width={w} height={h} rx={r} {...s} fill={fill} fillOpacity={fillOpacity} />;
        }
        return <Path key={i} d={p.d} {...s} fill={fill} fillOpacity={fillOpacity} />;
      })}
    </Svg>
  );
}
