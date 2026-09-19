import { FontAwesome5 } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

type PremiumBadgeProps = {
  size?: 'sm' | 'md';
  onPress?: () => void;
};

export function PremiumBadge({ size = 'sm', onPress }: PremiumBadgeProps) {
  const brand = useBrandColors();
  const dimension = size === 'sm' ? 16 : 22;
  const iconSize = size === 'sm' ? 7 : 10;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={[
        styles.badge,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: brand.header,
        },
      ]}
    >
      <FontAwesome5 name="crown" solid size={iconSize} color={colors.homeStar} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.homeHeader,
    borderWidth: 1,
    borderColor: colors.homeStar,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
