import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PlayerTabBar } from '../components/PlayerTabBar';
import { usePlayerProfile } from '../context/PlayerProfileContext';
import {
  getProfileRoleLabel,
  getProfileSecondary,
} from '../data/playerProfiles';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

export function ConnectionsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const { connectedIds, getProfile } = usePlayerProfile();

  const connections = connectedIds
    .map((id) => getProfile(id))
    .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));

  return (
    <View style={[styles.root, { backgroundColor: brand.header }]}>
      <StatusBar style="light" />

      <View
        style={[
          styles.header,
          Platform.OS === 'ios'
            ? { paddingTop: 58 }
            : { paddingTop: (RNStatusBar.currentHeight ?? 0) + 8 },
        ]}
      >
        <Pressable style={styles.headerSide} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={16} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Mis conexiones</Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.panel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {connections.length === 0 ? (
            <Text style={styles.emptyText}>
              Todavía no tenés conexiones.
            </Text>
          ) : (
            connections.map((profile) => (
              <Pressable
                key={profile.id}
                style={styles.row}
                onPress={() =>
                  navigation.push('Profile', { userId: profile.id })
                }
              >
                <Image source={profile.photo} style={styles.avatar} />
                <View style={styles.body}>
                  <Text style={styles.name}>{profile.name}</Text>
                  <Text style={styles.role}>
                    {getProfileRoleLabel(profile.kind)}
                  </Text>
                  <Text style={styles.subtitle}>
                    {getProfileSecondary(profile)}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Conectado</Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>

      <PlayerTabBar activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.homeHeader,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerSide: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  panel: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  list: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyText: {
    marginTop: 32,
    marginHorizontal: 16,
    color: '#8A8A8A',
    fontSize: 14,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.inputBackground,
  },
  body: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  role: {
    marginTop: 2,
    color: '#4A4A4A',
    fontSize: 12,
  },
  subtitle: {
    marginTop: 1,
    color: '#8A8A8A',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E7F8DC',
  },
  statusText: {
    color: colors.homeHeader,
    fontSize: 11,
    fontWeight: '700',
  },
});
