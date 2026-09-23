import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  Dimensions,
  Image,
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
import { PremiumBadge } from '../components/PremiumBadge';
import {
  fetchAuthenticatedUserIdentity,
  fetchAuthenticatedUserPremium,
  usePlayerProfile,
} from '../context/PlayerProfileContext';
import { usePlayerTrials } from '../context/PlayerTrialsContext';
import { OWN_PROFILE_ID } from '../data/playerProfiles';
import {
  DirectoryPerson,
  fetchDirectoryAgents,
  fetchDirectoryPlayers,
} from '../lib/directory';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

const { width: windowWidth } = Dimensions.get('window');
const horizontalPadding = 20;
const cardWidth = Math.min(118, (windowWidth - horizontalPadding * 2 - 24) / 3.15);

const mockImages = {
  banner: require('../../assets/mock/banner.png'),
};

const quickAccess = [
  {
    icon: 'futbol',
    title: 'Pruebas',
    subtitle: 'Nuevas oportunidades',
  },
  {
    icon: 'share-alt',
    title: 'Solicitudes de conexión',
    subtitle: 'Personas que quieren conectarse',
  },
  {
    icon: 'users',
    title: 'Mis conexiones',
    subtitle: 'Tu red en RepresentApp',
  },
  {
    icon: 'comment-dots',
    title: 'Solicitudes de mensajes',
    subtitle: 'Nuevos mensajes pendientes',
  },
] as const;

function firstNameFrom(fullName: string) {
  return fullName.trim().split(/\s+/).filter(Boolean)[0] ?? '';
}

export function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const {
    sendRequest,
    hasSentRequest,
    isConnected,
    incomingRequestIds,
    role,
    currentProfile,
    updateProfile,
  } = usePlayerProfile();
  const { publishedTrials } = usePlayerTrials();
  const brand = useBrandColors();
  const isAgent = role === 'agent';
  const [fetchedFirstName, setFetchedFirstName] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [isPremium, setIsPremium] = useState(false);
  const [players, setPlayers] = useState<DirectoryPerson[]>([]);
  const [agents, setAgents] = useState<DirectoryPerson[]>([]);
  const firstName = fetchedFirstName || firstNameFrom(currentProfile.name);
  const upcomingTrials = publishedTrials;
  const previewPlayers = players.slice(0, 8);
  const previewAgents = agents.slice(0, 8);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadIdentity() {
        const { identity, error } = await fetchAuthenticatedUserIdentity();
        if (cancelled) {
          return;
        }
        if (error || !identity) {
          return;
        }

        const nextFirstName =
          identity.firstName || firstNameFrom(identity.name);
        if (nextFirstName) {
          setFetchedFirstName(nextFirstName);
        }
        setPhotoUrl(identity.photoUrl);
        updateProfile({
          name: identity.name || currentProfile.name,
          email: identity.email,
          photoUrl: identity.photoUrl,
        });
      }

      async function loadPremium() {
        const { isPremium: nextIsPremium } = await fetchAuthenticatedUserPremium();
        if (!cancelled) {
          setIsPremium(nextIsPremium);
        }
      }

      async function loadDirectory() {
        const [nextPlayers, nextAgents] = await Promise.all([
          fetchDirectoryPlayers().catch(() => [] as DirectoryPerson[]),
          fetchDirectoryAgents().catch(() => [] as DirectoryPerson[]),
        ]);
        if (!cancelled) {
          setPlayers(nextPlayers);
          setAgents(nextAgents);
        }
      }

      void loadIdentity();
      void loadPremium();
      void loadDirectory();

      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <View style={[styles.root, { backgroundColor: brand.header }]}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: brand.header },
            Platform.OS === 'ios'
              ? { paddingTop: 58 }
              : { paddingTop: (RNStatusBar.currentHeight ?? 0) + 8 },
          ]}
        >
          <View style={styles.brandRow}>
            <View>
              <Text style={styles.brand}>
                Represent<Text style={[styles.brandAccent, { color: brand.accent }]}>App</Text>
              </Text>
              <Text style={styles.tagline}>CONECTA TALENTO</Text>
            </View>
            <View style={styles.brandActions}>
              <View style={styles.bellWrap}>
                <FontAwesome5 name="bell" size={18} color="#FFFFFF" />
              </View>
              <Pressable
                onPress={() =>
                  navigation.navigate('Profile', { userId: OWN_PROFILE_ID })
                }
              >
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.headerAvatar} />
                ) : (
                  <View style={styles.headerAvatar} />
                )}
                {isPremium ? (
                  <View style={styles.headerPremiumBadge} pointerEvents="none">
                    <PremiumBadge size="sm" />
                  </View>
                ) : null}
              </Pressable>
            </View>
          </View>

          <Pressable
            style={styles.searchBox}
            onPress={() => navigation.push('Search')}
          >
            <FontAwesome5 name="search" size={14} color="#8A8A8A" />
            <Text style={styles.searchPlaceholder}>
              Buscar jugadores, representantes, clubes...
            </Text>
          </Pressable>

          <View style={styles.welcomeRow}>
            <Pressable
              style={styles.welcomeUser}
              onPress={() =>
                navigation.navigate('Profile', { userId: OWN_PROFILE_ID })
              }
            >
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.welcomeAvatar} />
              ) : (
                <View style={styles.welcomeAvatar} />
              )}
              <View style={styles.welcomeTextWrap}>
                <Text style={styles.welcomeTitle}>Bienvenido {firstName}</Text>
                <Text style={styles.welcomeSubtitle}>
                  Seguí construyendo tu futuro
                </Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.profileCard}
              onPress={() =>
                navigation.navigate('Profile', { userId: OWN_PROFILE_ID })
              }
            >
              <FontAwesome5 name="chart-line" size={14} color={brand.accent} />
              <View style={styles.profileCardText}>
                <Text style={styles.profileCardTitle}>Tu perfil</Text>
                <Text style={styles.profileCardMeta}>85% completo</Text>
              </View>
              <FontAwesome5 name="chevron-right" size={12} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accesos rápidos</Text>
          </View>

          <View style={styles.quickRow}>
            {quickAccess.map((item) => {
              const inner = (
                <>
                  <View style={styles.quickIconWrap}>
                    <View style={styles.quickIcon}>
                      <FontAwesome5
                        name={item.icon}
                        size={18}
                        color={brand.accent}
                      />
                    </View>
                    {item.title === 'Solicitudes de conexión' &&
                    incomingRequestIds.length > 0 ? (
                      <View style={styles.quickBadge}>
                        <Text style={styles.badgeText}>
                          {incomingRequestIds.length}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.quickTitle}>{item.title}</Text>
                  <Text style={styles.quickSubtitle}>{item.subtitle}</Text>
                </>
              );

              if (item.title === 'Pruebas') {
                return (
                  <Pressable
                    key={item.title}
                    style={styles.quickItem}
                    onPress={() =>
                      navigation.navigate('Trials', {
                        initialTab: isAgent ? 'publish' : 'all',
                      })
                    }
                  >
                    {inner}
                  </Pressable>
                );
              }

              if (item.title === 'Solicitudes de conexión') {
                return (
                  <Pressable
                    key={item.title}
                    style={styles.quickItem}
                    onPress={() => navigation.push('ConnectionRequests')}
                  >
                    {inner}
                  </Pressable>
                );
              }

              if (item.title === 'Mis conexiones') {
                return (
                  <Pressable
                    key={item.title}
                    style={styles.quickItem}
                    onPress={() => navigation.push('Connections')}
                  >
                    {inner}
                  </Pressable>
                );
              }

              if (item.title === 'Solicitudes de mensajes') {
                return (
                  <Pressable
                    key={item.title}
                    style={styles.quickItem}
                    onPress={() =>
                      navigation.navigate('Messages', { initialTab: 'requests' })
                    }
                  >
                    {inner}
                  </Pressable>
                );
              }

              return null;
            })}
          </View>

          {isAgent ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Jugadores mejor calificados</Text>
                <Pressable
                  onPress={() => navigation.push('PeopleList', { kind: 'player' })}
                >
                  <Text style={styles.seeAll}>Ver todos  ›</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsRow}
              >
                {previewPlayers.length === 0 ? (
                  <Text style={styles.emptyDirectory}>
                    Todavía no hay futbolistas para mostrar.
                  </Text>
                ) : (
                  previewPlayers.map((player) => (
                    <PersonCard
                      key={player.id}
                      name={player.name}
                      photoUrl={player.photoUrl}
                      subtitle={player.subtitle}
                      country={player.location || undefined}
                      isPremium={player.isPremium}
                      badge="plus"
                      pending={hasSentRequest(player.id)}
                      connected={isConnected(player.id)}
                      onPress={() => navigation.push('Profile', { userId: player.id })}
                      onRequest={() => sendRequest(player.id)}
                    />
                  ))
                )}
              </ScrollView>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Próximas pruebas</Text>
                <Pressable
                  onPress={() =>
                    navigation.navigate('Trials', { initialTab: 'mine' })
                  }
                >
                  <Text style={styles.seeAll}>Ver todos  ›</Text>
                </Pressable>
              </View>

              {upcomingTrials.length === 0 ? (
                <Text style={styles.emptyDirectory}>
                  Todavía no hay pruebas publicadas.
                </Text>
              ) : (
                upcomingTrials.slice(0, 3).map((trial) => (
                <Pressable
                  key={trial.id}
                  style={styles.homeTrialCard}
                  onPress={() =>
                    navigation.navigate('TrialDetail', { trialId: trial.id })
                  }
                >
                  {trial.crest ? (
                    <Image source={trial.crest} style={styles.homeTrialCrest} />
                  ) : (
                    <View style={styles.homeTrialCrest} />
                  )}
                  <View style={styles.homeTrialBody}>
                    <Text style={styles.homeTrialTitle}>{trial.name}</Text>
                    <Text style={styles.homeTrialMeta}>
                      {trial.location} · {trial.date}
                    </Text>
                  </View>
                  <FontAwesome5 name="chevron-right" size={12} color="#B0B0B0" />
                </Pressable>
                ))
              )}
            </>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Representantes mejor calificados</Text>
                <Pressable
                  onPress={() => navigation.push('PeopleList', { kind: 'agent' })}
                >
                  <Text style={styles.seeAll}>Ver todos  ›</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsRow}
              >
                {previewAgents.length === 0 ? (
                  <Text style={styles.emptyDirectory}>
                    Todavía no hay representantes para mostrar.
                  </Text>
                ) : (
                  previewAgents.map((agent) => (
                    <PersonCard
                      key={agent.id}
                      name={agent.name}
                      photoUrl={agent.photoUrl}
                      subtitle={agent.subtitle}
                      isPremium={agent.isPremium}
                      badge="user"
                      pending={hasSentRequest(agent.id)}
                      connected={isConnected(agent.id)}
                      onPress={() => navigation.push('Profile', { userId: agent.id })}
                      onRequest={() => sendRequest(agent.id)}
                    />
                  ))
                )}
              </ScrollView>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Encontrá futbolistas</Text>
                <Pressable
                  onPress={() => navigation.push('PeopleList', { kind: 'player' })}
                >
                  <Text style={styles.seeAll}>Ver todos  ›</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsRow}
              >
                {previewPlayers.length === 0 ? (
                  <Text style={styles.emptyDirectory}>
                    Todavía no hay futbolistas para mostrar.
                  </Text>
                ) : (
                  previewPlayers.map((player) => (
                    <PersonCard
                      key={player.id}
                      name={player.name}
                      photoUrl={player.photoUrl}
                      subtitle={player.subtitle}
                      country={player.location || undefined}
                      isPremium={player.isPremium}
                      badge="plus"
                      pending={hasSentRequest(player.id)}
                      connected={isConnected(player.id)}
                      onPress={() => navigation.push('Profile', { userId: player.id })}
                      onRequest={() => sendRequest(player.id)}
                    />
                  ))
                )}
              </ScrollView>
            </>
          )}

          <View style={styles.banner}>
            <Image source={mockImages.banner} style={styles.bannerImage} />
            <View style={[styles.bannerOverlay, isAgent && { backgroundColor: 'rgba(107, 79, 18, 0.72)' }]} />
            <View style={styles.bannerDecor} pointerEvents="none">
              <FontAwesome5
                name="crown"
                solid
                size={58}
                color={brand.accent}
              />
            </View>
            <View style={styles.bannerContent}>
              <View style={styles.bannerCopy}>
                <View style={styles.bannerKickerRow}>
                  <FontAwesome5
                    name="crown"
                    solid
                    size={11}
                    color={brand.accent}
                  />
                  <Text style={[styles.bannerKicker, { color: brand.accent }]}>RepresentApp Premium</Text>
                </View>
                <Text style={styles.bannerTitle}>
                  ¿Querés destacar tu perfil?
                </Text>
                <Text style={styles.bannerSubtitle}>
                  Accedé a beneficios exclusivos y aumentá tus oportunidades.
                </Text>
              </View>
              <Pressable
                style={[styles.bannerButton, { backgroundColor: brand.accent }]}
                onPress={() => navigation.push('Premium')}
              >
                <Text style={[styles.bannerButtonText, { color: brand.header }]}>Conocé Premium  ›</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <PlayerTabBar activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.homeHeader,
  },
  scrollContent: {
    paddingBottom: 18,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.homeHeader,
    paddingHorizontal: horizontalPadding,
    paddingBottom: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  brandAccent: {
    color: colors.homeAccent,
  },
  tagline: {
    marginTop: 2,
    color: colors.homeMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2.4,
  },
  brandActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
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
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.homeHeaderAlt,
  },
  headerPremiumBadge: {
    position: 'absolute',
    right: -3,
    top: -3,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    gap: 10,
  },
  searchPlaceholder: {
    flex: 1,
    color: '#8A8A8A',
    fontSize: 14,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  welcomeUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  welcomeAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.homeHeaderAlt,
  },
  welcomeTextWrap: {
    flex: 1,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  welcomeSubtitle: {
    marginTop: 2,
    color: colors.homeMuted,
    fontSize: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.homeHeaderAlt,
    borderRadius: 16,
  },
  profileCardText: {
    marginRight: 2,
  },
  profileCardTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  profileCardMeta: {
    color: colors.homeMuted,
    fontSize: 10,
  },
  body: {
    backgroundColor: colors.background,
    paddingHorizontal: horizontalPadding,
    paddingTop: 22,
    paddingBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    flex: 1,
    marginRight: 8,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  seeAll: {
    color: '#8A8A8A',
    fontSize: 13,
    fontWeight: '600',
  },
  quickRow: {
    flexDirection: 'row',
    marginBottom: 26,
    gap: 8,
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickIconWrap: {
    marginBottom: 8,
  },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.homeBadge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  quickSubtitle: {
    marginTop: 2,
    color: '#8A8A8A',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
  cardsRow: {
    paddingRight: 8,
    marginBottom: 24,
    gap: 12,
  },
  emptyDirectory: {
    color: '#8A8A8A',
    fontSize: 13,
    paddingVertical: 12,
  },
  personCard: {
    width: cardWidth,
  },
  personPhoto: {
    width: cardWidth,
    height: cardWidth,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: colors.inputBackground,
  },
  photoUserBadge: {
    position: 'absolute',
    right: 6,
    bottom: 14,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoUserBadgePending: {
    backgroundColor: '#E8E8E8',
  },
  plusBadge: {
    position: 'absolute',
    right: 6,
    bottom: 14,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBadgePending: {
    backgroundColor: '#E8E8E8',
  },
  personName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  personMeta: {
    marginTop: 2,
    color: '#8A8A8A',
    fontSize: 11,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  ratingText: {
    marginLeft: 4,
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  country: {
    marginTop: 4,
    color: '#4A4A4A',
    fontSize: 11,
  },
  banner: {
    height: 132,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 8,
    justifyContent: 'center',
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(7, 54, 44, 0.72)',
  },
  bannerDecor: {
    position: 'absolute',
    right: 14,
    top: 10,
    opacity: 0.18,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    gap: 12,
  },
  bannerCopy: {
    flex: 1,
  },
  bannerKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  bannerKicker: {
    color: colors.homeAccent,
    fontSize: 12,
    fontWeight: '700',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  bannerSubtitle: {
    marginTop: 6,
    color: colors.homeMuted,
    fontSize: 12,
  },
  bannerButton: {
    backgroundColor: colors.homeAccent,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bannerButtonText: {
    color: colors.homeHeader,
    fontSize: 12,
    fontWeight: '800',
  },
  homeTrialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    gap: 12,
  },
  homeTrialCrest: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.inputBackground,
  },
  homeTrialBody: {
    flex: 1,
  },
  homeTrialTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  homeTrialMeta: {
    marginTop: 4,
    color: '#8A8A8A',
    fontSize: 12,
  },
});
