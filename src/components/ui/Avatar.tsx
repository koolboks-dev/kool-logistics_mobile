import { Image } from 'expo-image';
import { View } from 'react-native';

import { FontFamily, Radius, useColors } from '@/theme';
import { GlassSurface } from './GlassSurface';
import { Text } from './Text';

export function Avatar({
  name,
  uri,
  size = 40,
  variant = 'glass',
}: {
  name?: string;
  uri?: string;
  size?: number;
  /** 'glass' frosts the initials disc; 'soft' is a flat brand tint. */
  variant?: 'glass' | 'soft';
}) {
  const c = useColors();
  const initials = (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: 999 }}
        contentFit="cover"
      />
    );
  }

  const label = (
    <Text style={{ color: c.brand, fontFamily: FontFamily.semibold, fontSize: size * 0.36 }}>
      {initials || '?'}
    </Text>
  );

  if (variant === 'glass') {
    return (
      <GlassSurface
        radius={Radius.pill}
        tint={c.brandSoft}
        style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      >
        {label}
      </GlassSurface>
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        backgroundColor: c.brandSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {label}
    </View>
  );
}
