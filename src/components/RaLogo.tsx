import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type RaLogoProps = {
  size?: number;
};

export function RaLogo({ size = 88 }: RaLogoProps) {
  const borderWidth = Math.max(5, size * 0.07);
  const borderRadius = size * 0.28;
  const fontSize = size * 0.32;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          borderWidth,
        },
      ]}
    >
      <Text style={[styles.label, { fontSize }]}>RA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.header,
    borderColor: '#FFFFFF',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
