import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { OWN_PROFILE_ID } from '../data/playerProfiles';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

type PlayerTabBarProps = {
  activeTab?: 'home' | 'messages' | 'search' | 'profile';
};

export function PlayerTabBar({ activeTab = 'home' }: PlayerTabBarProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();

  return (
    <View style={[styles.tabBar, { backgroundColor: brand.header }]}>
      <Pressable
        style={styles.tabItem}
        onPress={() => navigation.navigate('Home')}
      >
        <FontAwesome5
          name="home"
          solid
          size={18}
          color={activeTab === 'home' ? brand.accent : brand.muted}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'home' ? brand.accent : brand.muted },
            activeTab === 'home' && styles.tabLabelActive,
          ]}
        >
          Inicio
        </Text>
      </Pressable>
      <Pressable
        style={styles.tabItem}
        onPress={() => navigation.navigate('Messages', { initialTab: 'all' })}
      >
        <View>
          <FontAwesome5
            name="comment"
            solid={activeTab === 'messages'}
            size={18}
            color={activeTab === 'messages' ? brand.accent : brand.muted}
          />
          <View style={styles.tabBadge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
        </View>
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'messages' ? brand.accent : brand.muted },
            activeTab === 'messages' && styles.tabLabelActive,
          ]}
        >
          Mensajes
        </Text>
      </Pressable>
      <Pressable
        style={styles.tabItem}
        onPress={() => navigation.navigate('Search')}
      >
        <FontAwesome5
          name="search"
          solid={activeTab === 'search'}
          size={18}
          color={activeTab === 'search' ? brand.accent : brand.muted}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'search' ? brand.accent : brand.muted },
            activeTab === 'search' && styles.tabLabelActive,
          ]}
        >
          Buscar
        </Text>
      </Pressable>
      <Pressable
        style={styles.tabItem}
        onPress={() => navigation.navigate('Profile', { userId: OWN_PROFILE_ID })}
      >
        <FontAwesome5
          name="user"
          solid={activeTab === 'profile'}
          size={18}
          color={activeTab === 'profile' ? brand.accent : brand.muted}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'profile' ? brand.accent : brand.muted },
            activeTab === 'profile' && styles.tabLabelActive,
          ]}
        >
          Perfil
        </Text>
      </Pressable>
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
