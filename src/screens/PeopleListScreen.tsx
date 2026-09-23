import { FontAwesome5 } from '@expo/vector-icons';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PersonCard } from '../components/PersonCard';
import { PlayerTabBar } from '../components/PlayerTabBar';
import { usePlayerProfile } from '../context/PlayerProfileContext';
import {
  DirectoryPerson,
  fetchDirectoryAgents,
  fetchDirectoryPlayers,
} from '../lib/directory';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

export function PeopleListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const route = useRoute<RouteProp<AuthStackParamList, 'PeopleList'>>();
  const { sendRequest, hasSentRequest, isConnected } = usePlayerProfile();
  const kind = route.params.kind;
  const [people, setPeople] = useState<DirectoryPerson[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadPeople() {
        const next =
          kind === 'player'
            ? await fetchDirectoryPlayers().catch(() => [] as DirectoryPerson[])
            : await fetchDirectoryAgents().catch(() => [] as DirectoryPerson[]);
        if (!cancelled) {
          setPeople(next);
        }
      }

      void loadPeople();
      return () => {
        cancelled = true;
      };
    }, [kind]),
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
        <Text style={styles.headerTitle}>
          {kind === 'player' ? 'Futbolistas' : 'Representantes'}
        </Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.panel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
        >
          {people.length === 0 ? (
            <Text style={styles.emptyText}>
              {kind === 'player'
                ? 'Todavía no hay futbolistas para mostrar.'
                : 'Todavía no hay representantes para mostrar.'}
            </Text>
          ) : (
            people.map((profile) => (
              <PersonCard
                key={profile.id}
                name={profile.name}
                photoUrl={profile.photoUrl}
                subtitle={profile.subtitle}
                country={kind === 'player' ? profile.location || undefined : undefined}
                isPremium={profile.isPremium}
                badge={kind === 'player' ? 'plus' : 'user'}
                pending={hasSentRequest(profile.id)}
                connected={isConnected(profile.id)}
                onPress={() => navigation.push('Profile', { userId: profile.id })}
                onRequest={() => sendRequest(profile.id)}
              />
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 12,
  },
  emptyText: {
    width: '100%',
    color: '#8A8A8A',
    fontSize: 13,
    paddingVertical: 12,
  },
});
