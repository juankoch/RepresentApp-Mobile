import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

type PlayerTabBarProps = {
  homeActive?: boolean;
};

export function PlayerTabBar({ homeActive = true }: PlayerTabBarProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  return (
    <View style={styles.tabBar}>
      <Pressable
        style={styles.tabItem}
        onPress={() => navigation.navigate('Home')}
      >
        <FontAwesome5
          name="home"
          solid
          size={18}
          color={homeActive ? colors.homeAccent : colors.homeMuted}
        />
        <Text style={homeActive ? styles.tabLabelActive : styles.tabLabel}>
          Inicio
        </Text>
      </Pressable>
      <View style={styles.tabItem}>
        <View>
          <FontAwesome5 name="comment" size={18} color={colors.homeMuted} />
          <View style={styles.tabBadge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
        </View>
        <Text style={styles.tabLabel}>Mensajes</Text>
      </View>
      <View style={styles.tabItem}>
        <FontAwesome5 name="search" size={18} color={colors.homeMuted} />
        <Text style={styles.tabLabel}>Buscar</Text>
      </View>
      <View style={styles.tabItem}>
        <FontAwesome5 name="user" size={18} color={colors.homeMuted} />
        <Text style={styles.tabLabel}>Perfil</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.homeHeader,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    color: colors.homeMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.homeAccent,
    fontSize: 11,
    fontWeight: '700',
  },
  tabBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.homeBadge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});
