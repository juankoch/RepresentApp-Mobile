import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
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
import { useConexiones } from '../context/ConexionesContext';
import { getProfileRoleLabel, UserProfile } from '../data/playerProfiles';
import { fetchPublicUserProfile } from '../lib/directory';
import { otherUserId } from '../lib/conexiones';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

export function ConnectionsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const { refresh } = useConexiones();
  const [connections, setConnections] = useState<UserProfile[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadConnections() {
        const { myId, rows } = await refresh();
        if (!myId) {
          if (!cancelled) {
            setConnections([]);
          }
          return;
        }

        const ids = rows
          .filter((row) => row.estado === 'aceptada')
          .map((row) => otherUserId(row, myId));
        const profiles = await Promise.all(
          ids.map((id) => fetchPublicUserProfile(id)),
        );
        if (!cancelled) {
          setConnections(
            profiles.filter((profile): profile is UserProfile => Boolean(profile)),
          );
        }
      }

      void loadConnections();
      return () => {
        cancelled = true;
      };
    }, [refresh]),
  );

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
                {profile.photoUrl ? (
                  <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar} />
                )}
                <View style={styles.body}>
                  <Text style={styles.name}>{profile.name}</Text>
                  <Text style={styles.role}>
                    {getProfileRoleLabel(profile.kind)}
                  </Text>
                  <Text style={styles.subtitle}>
                    {profile.fields.find((field) => field.label === 'Posición' || field.label === 'Agencia')?.value || profile.location}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  emptyText: {
    marginTop: 24,
    color: '#8A8A8A',
    fontSize: 14,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: colors.homeHeader,
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 2,
    color: '#8A8A8A',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#E7F8DC',
  },
  statusText: {
    color: colors.homeHeader,
    fontSize: 11,
    fontWeight: '700',
  },
});

