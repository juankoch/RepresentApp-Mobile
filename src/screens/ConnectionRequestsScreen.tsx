import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  Alert,
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
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

export function ConnectionRequestsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const { refresh, acceptIncomingRequest, rejectIncomingRequest } = useConexiones();
  const [requests, setRequests] = useState<UserProfile[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadRequests() {
        const { myId, rows } = await refresh();
        if (!myId) {
          if (!cancelled) {
            setRequests([]);
          }
          return;
        }

        const ids = rows
          .filter(
            (row) => row.estado === 'pendiente' && row.fk_receptor === myId,
          )
          .map((row) => row.fk_solicitante);
        const profiles = await Promise.all(
          ids.map((id) => fetchPublicUserProfile(id)),
        );
        if (!cancelled) {
          setRequests(
            profiles.filter((profile): profile is UserProfile => Boolean(profile)),
          );
        }
      }

      void loadRequests();
      return () => {
        cancelled = true;
      };
    }, [refresh]),
  );

  async function handleAccept(userId: string) {
    const result = await acceptIncomingRequest(userId);
    if (!result.ok) {
      Alert.alert('No se pudo aceptar la solicitud', result.message);
      return;
    }
    setRequests((current) => current.filter((profile) => profile.id !== userId));
  }

  async function handleReject(userId: string) {
    const result = await rejectIncomingRequest(userId);
    if (!result.ok) {
      Alert.alert('No se pudo rechazar la solicitud', result.message);
      return;
    }
    setRequests((current) => current.filter((profile) => profile.id !== userId));
  }

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
        <Text style={styles.headerTitle}>Solicitudes</Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.panel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {requests.length === 0 ? (
            <Text style={styles.emptyText}>
              No tenés solicitudes de conexión pendientes.
            </Text>
          ) : (
            requests.map((profile) => (
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
                    {profile.location}
                  </Text>
                </View>
                <Pressable
                  style={styles.acceptButton}
                  onPress={() => {
                    void handleAccept(profile.id);
                  }}
                >
                  <FontAwesome5 name="check" size={14} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  style={styles.rejectButton}
                  onPress={() => {
                    void handleReject(profile.id);
                  }}
                >
                  <FontAwesome5 name="times" size={14} color="#FFFFFF" />
                </Pressable>
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
    gap: 10,
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
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E8B57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
