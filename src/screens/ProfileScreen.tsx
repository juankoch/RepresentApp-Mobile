import { FontAwesome5 } from '@expo/vector-icons';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PlayerTabBar } from '../components/PlayerTabBar';
import { PremiumBadge } from '../components/PremiumBadge';
import { ProfileContent } from '../components/ProfileContent';
import { useConexiones } from '../context/ConexionesContext';
import { usePlayerProfile } from '../context/PlayerProfileContext';
import { useRepresentaciones } from '../context/RepresentacionesContext';
import { OWN_PROFILE_ID, ProfileField, UserProfile } from '../data/playerProfiles';
import { getOrCreateConversation } from '../lib/mensajes';
import { fetchHighlights, HighlightVideo } from '../lib/highlights';
import {
  fetchProfileByUserId,
  profileToUserProfile,
} from '../lib/perfil';
import { supabase } from '../lib/supabase';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    return error.message;
  }
  return 'No pudimos cargar tu perfil.';
}

function overlayOwnProfile(
  current: UserProfile | undefined,
  session: UserProfile,
): UserProfile | undefined {
  const sessionName = session.name.trim();
  if (!current && !sessionName) {
    return current;
  }

  const base = current ?? session;
  const sessionFields = new Map(session.fields.map((field) => [field.label, field]));
  const fields = base.fields.map((field) => {
    const incoming = sessionFields.get(field.label);
    if (!incoming) {
      return field;
    }
    if (field.label === 'Representante') {
      return field.value && field.value !== '—' ? field : incoming;
    }
    const incomingValue = incoming.value.trim();
    if (!incomingValue || incomingValue === 'Sin datos') {
      return field;
    }
    return { ...field, value: incoming.value };
  });
  const missingFromBase = session.fields.filter(
    (field) => !base.fields.some((item) => item.label === field.label),
  );

  return {
    ...base,
    kind: session.kind || base.kind,
    name: sessionName || base.name,
    email: session.email || base.email,
    photoUrl: session.photoUrl ?? base.photoUrl,
    location: session.location.trim() ? session.location : base.location,
    about:
      session.about.trim() && session.about !== 'Sin datos'
        ? session.about
        : base.about,
    birthDate: session.birthDate || base.birthDate,
    stats: overlayOwnStats(base, session),
    fields: [...fields, ...missingFromBase],
    representativeId: current?.representativeId ?? session.representativeId,
  };
}

function overlayOwnStats(base: UserProfile, session: UserProfile) {
  const kind = session.kind || base.kind;
  const conexiones =
    session.stats.find((stat) => stat.label === 'Conexiones')?.value ||
    base.stats.find((stat) => stat.label === 'Conexiones')?.value ||
    '—';
  const edad =
    session.stats.find((stat) => stat.label === 'Edad')?.value ||
    base.stats.find((stat) => stat.label === 'Edad')?.value ||
    '—';

  if (kind === 'agent') {
    const represented =
      base.stats.find((stat) => stat.label === 'Representados')?.value ||
      session.stats.find((stat) => stat.label === 'Representados')?.value ||
      '—';
    return [
      { label: 'Conexiones', value: conexiones },
      { label: 'Edad', value: edad },
      { label: 'Representados', value: represented },
    ];
  }

  const representative =
    base.stats.find((stat) => stat.label === 'Representante')?.value ||
    session.stats.find((stat) => stat.label === 'Representante')?.value ||
    '✕';
  return [
    { label: 'Conexiones', value: conexiones },
    { label: 'Edad', value: edad },
    { label: 'Representante', value: representative },
  ];
}

function sameUserId(left?: string | null, right?: string | null) {
  const a = left?.trim().toLowerCase();
  const b = right?.trim().toLowerCase();
  return Boolean(a && b && a !== 'me' && a === b);
}

function goBackFromProfile(
  navigation: NativeStackNavigationProp<AuthStackParamList>,
) {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }
  navigation.navigate('Home');
}

function OtherProfileSkeleton({
  onBack,
  title,
}: {
  onBack: () => void;
  title: string;
}) {
  const brand = useBrandColors();
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
        <Pressable style={styles.headerSide} onPress={onBack}>
          <FontAwesome5 name="arrow-left" size={16} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSide} />
      </View>
      <View style={styles.panel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={false}
        >
          <View style={styles.skeletonWrap}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonName} />
            <View style={styles.skeletonBadge} />
            <View style={styles.skeletonLocation} />
            <View style={styles.skeletonStats}>
              <View style={styles.skeletonStatBlock}>
                <View style={styles.skeletonStatValue} />
                <View style={styles.skeletonStatLabel} />
              </View>
              <View style={styles.skeletonStatBlock}>
                <View style={styles.skeletonStatValue} />
                <View style={styles.skeletonStatLabel} />
              </View>
              <View style={styles.skeletonStatBlock}>
                <View style={styles.skeletonStatValue} />
                <View style={styles.skeletonStatLabel} />
              </View>
            </View>
            <View style={styles.skeletonField} />
            <View style={styles.skeletonField} />
            <View style={styles.skeletonField} />
            <View style={styles.skeletonField} />
            <View style={styles.skeletonField} />
            <View style={styles.skeletonAboutTitle} />
            <View style={styles.skeletonAbout} />
          </View>
        </ScrollView>
      </View>
      <PlayerTabBar />
    </View>
  );
}

export function ProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const route = useRoute<RouteProp<AuthStackParamList, 'Profile'>>();
  const {
    role,
    currentProfile,
    isOwnProfile,
    isPremium,
    isBlocked,
    unblockUser,
    getRating,
  } = usePlayerProfile();
  const {
    sendRequest,
    hasSentRequest,
    isConnected,
    hasIncomingFrom,
    acceptIncomingRequest,
    refresh: refreshConexiones,
  } = useConexiones();
  const {
    representaciones,
    sendRequest: sendRepresentationRequest,
    accept: acceptRepresentation,
    end: endRepresentation,
    refresh: refreshRepresentaciones,
    activeRepresentation,
    error: representacionesError,
  } = useRepresentaciones();

  const userId = route.params?.userId ?? OWN_PROFILE_ID;
  const ownProfile = isOwnProfile(userId);
  const [ownProfileData, setOwnProfileData] = useState<UserProfile | undefined>();
  const [missingPlayerProfile, setMissingPlayerProfile] = useState(false);
  const [otherProfile, setOtherProfile] = useState<UserProfile | undefined>();
  const [loadingOwn, setLoadingOwn] = useState(ownProfile);
  const [loadingOther, setLoadingOther] = useState(!ownProfile);
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(
    null,
  );
  const [actionsLoaded, setActionsLoaded] = useState(false);
  const [otherLoadError, setOtherLoadError] = useState<string | null>(null);
  const [otherRetryNonce, setOtherRetryNonce] = useState(0);
  const [highlights, setHighlights] = useState<HighlightVideo[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (ownProfile) {
        return;
      }

      let isCurrent = true;
      setOtherProfile((current) => (current?.id === userId ? current : undefined));
      setLoadingOther(true);
      setOtherLoadError(null);

      async function loadSecondary() {
        try {
          await Promise.all([refreshConexiones(), refreshRepresentaciones()]);
        } finally {
          if (isCurrent) {
            setActionsLoaded(true);
          }
        }
      }

      async function loadOtherProfile() {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const sessionUserId = userData.user?.id?.trim() || null;
          if (isCurrent) {
            setAuthenticatedUserId(
              sessionUserId && sessionUserId !== 'me' ? sessionUserId : null,
            );
          }

          const loaded = await fetchProfileByUserId(userId);
          if (!isCurrent) {
            return;
          }

          setOtherProfile(loaded ? profileToUserProfile(loaded) : undefined);
          setLoadingOther(false);
          setOtherLoadError(null);
          if (loaded) {
            void loadSecondary();
          }
        } catch (error) {
          if (isCurrent) {
            setLoadingOther(false);
            setOtherLoadError(errorMessage(error));
          }
        }
      }

      void loadOtherProfile();
      return () => {
        isCurrent = false;
      };
    }, [
      otherRetryNonce,
      ownProfile,
      refreshConexiones,
      refreshRepresentaciones,
      userId,
    ]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!ownProfile) {
        return;
      }

      let isCurrent = true;
      setOwnProfileData((current) => overlayOwnProfile(current, currentProfile));

      async function loadOwnProfile() {
        try {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) {
            throw userError;
          }

          const user = userData.user;
          if (!user || user.id === 'me') {
            return;
          }
          if (isCurrent) {
            setAuthenticatedUserId(user.id);
          }

          const loaded = await fetchProfileByUserId(user.id);
          if (!isCurrent) {
            return;
          }
          if (!loaded) {
            setMissingPlayerProfile(true);
            setLoadingOwn(false);
            return;
          }

          setMissingPlayerProfile(
            loaded.kind === 'player' && loaded.missingKindProfile,
          );
          setOwnProfileData(profileToUserProfile(loaded));
          setLoadingOwn(false);
          void Promise.all([refreshConexiones(), refreshRepresentaciones()]);
        } catch (error) {
          if (isCurrent) {
            setLoadingOwn(false);
            Alert.alert('No pudimos cargar tu perfil', errorMessage(error));
          }
        }
      }

      void loadOwnProfile();

      return () => {
        isCurrent = false;
      };
    }, [
      currentProfile,
      ownProfile,
      refreshConexiones,
      refreshRepresentaciones,
    ]),
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadHighlights() {
        const { data } = await supabase.auth.getUser();
        const targetId = ownProfile
          ? data.user?.id?.trim() || ''
          : userId.trim();
        if (!targetId || targetId === 'me') {
          if (!cancelled) {
            setHighlights([]);
          }
          return;
        }

        const result = await fetchHighlights(targetId);
        if (!cancelled) {
          setHighlights(result.ok ? result.data : []);
        }
      }

      void loadHighlights();
      return () => {
        cancelled = true;
      };
    }, [ownProfile, userId]),
  );

  const displayedProfile = ownProfile ? ownProfileData : otherProfile;
  const requested = displayedProfile ? hasSentRequest(displayedProfile.id) : false;
  const connected = displayedProfile ? isConnected(displayedProfile.id) : false;
  const incoming = displayedProfile ? hasIncomingFrom(displayedProfile.id) : false;
  const blocked = displayedProfile ? isBlocked(displayedProfile.id) : false;
  const rating = displayedProfile ? getRating(displayedProfile.id) : undefined;
  const otherProfileKind = displayedProfile?.kind;
  const pairRepresentation = displayedProfile
    ? representaciones.find(
        (row) =>
          row.estado === 'aceptada' &&
          (sameUserId(row.fk_jugador, displayedProfile.id) ||
            sameUserId(row.fk_representante, displayedProfile.id)),
      ) ??
      representaciones.find(
        (row) =>
          row.estado === 'pendiente' &&
          (sameUserId(row.fk_jugador, displayedProfile.id) ||
            sameUserId(row.fk_representante, displayedProfile.id)),
      )
    : undefined;
  const acceptedPair =
    pairRepresentation?.estado === 'aceptada' ? pairRepresentation : undefined;
  const canEndRepresentation = !ownProfile && !blocked && Boolean(acceptedPair);
  const canShowRepresentation =
    canEndRepresentation ||
    (!ownProfile &&
      actionsLoaded &&
      !representacionesError &&
      !blocked &&
      connected &&
      Boolean(displayedProfile) &&
      (otherProfileKind === 'player' || otherProfileKind === 'agent') &&
      role !== otherProfileKind);
  const playerHasActiveRepresentation =
    role === 'player' &&
    (Boolean(
      activeRepresentation &&
        (activeRepresentation.estado === 'pendiente' ||
          activeRepresentation.estado === 'aceptada'),
    ) ||
      representaciones.some(
        (row) => row.estado === 'pendiente' || row.estado === 'aceptada',
      ));

  function confirmEndRepresentation(idRepresentacion: number) {
    Alert.alert(
      'Cortar representación',
      role === 'player'
        ? 'Este representante va a dejar de representarte. ¿Confirmás?'
        : 'Vas a dejar de representar a este jugador. ¿Confirmás?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cortar',
          style: 'destructive',
          onPress: () => {
            void endRepresentation(idRepresentacion).then((result) => {
              if (!result.ok) {
                Alert.alert(
                  'No se pudo cortar la representación',
                  result.message,
                );
                return;
              }
              void refreshRepresentaciones();
              if (ownProfile && authenticatedUserId) {
                void fetchProfileByUserId(authenticatedUserId).then((loaded) => {
                  if (loaded) {
                    setOwnProfileData(profileToUserProfile(loaded));
                  }
                });
              }
            });
          },
        },
      ],
    );
  }

  async function openChatWith(otherUserId: string) {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        Alert.alert('No se pudo abrir el chat', 'No hay un usuario autenticado.');
        return;
      }

      const result = await getOrCreateConversation(userData.user.id, otherUserId);
      if (!result.ok) {
        const needsConnection = /conexión aceptada|conect/i.test(result.message);
        Alert.alert(
          'No se pudo abrir el chat',
          needsConnection
            ? 'Tenés que estar conectado con este usuario para poder chatear.'
            : result.message,
        );
        return;
      }

      navigation.navigate('Chat', { conversationId: result.data });
    } catch (error) {
      Alert.alert('No se pudo abrir el chat', errorMessage(error));
    }
  }

  if (!displayedProfile) {
    if ((ownProfile && loadingOwn) || (!ownProfile && loadingOther)) {
      return (
        <OtherProfileSkeleton
          title={ownProfile ? 'Mi perfil' : 'Perfil'}
          onBack={() => goBackFromProfile(navigation)}
        />
      );
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
          <Pressable
            style={styles.headerSide}
            onPress={() => goBackFromProfile(navigation)}
          >
            <FontAwesome5 name="arrow-left" size={16} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Perfil</Text>
          <View style={styles.headerSide} />
        </View>
        <View style={styles.missing}>
          <Text style={styles.missingText}>
            {otherLoadError
              ? 'No se pudo cargar este perfil.'
              : 'No encontramos este perfil.'}
          </Text>
          {otherLoadError ? (
            <Pressable
              onPress={() => {
                setLoadingOther(true);
                setOtherRetryNonce((current) => current + 1);
              }}
            >
              <Text style={styles.backLink}>Reintentar</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => goBackFromProfile(navigation)}>
            <Text style={styles.backLink}>Volver</Text>
          </Pressable>
        </View>
        <PlayerTabBar />
      </View>
    );
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
        <Pressable
          style={styles.headerSide}
          onPress={() => goBackFromProfile(navigation)}
        >
          <FontAwesome5 name="arrow-left" size={16} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {ownProfile ? 'Mi perfil' : 'Perfil'}
        </Text>
        {ownProfile ? (
          <Pressable
            style={styles.headerSide}
            onPress={() => navigation.navigate('Settings')}
          >
            <FontAwesome5 name="cog" size={18} color="#FFFFFF" />
          </Pressable>
        ) : (
          <Pressable
            style={styles.headerSide}
            onPress={() =>
              navigation.push('UserOptions', { userId: displayedProfile.id })
            }
          >
            <FontAwesome5 name="ellipsis-v" size={16} color="#FFFFFF" />
          </Pressable>
        )}
      </View>

      <View style={styles.panel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <ProfileContent
            profile={displayedProfile}
            onStatPress={(stat) => {
              if (stat.label === 'Conexiones') {
                void (async () => {
                  let userId = ownProfile
                    ? authenticatedUserId
                    : displayedProfile.id;
                  if (ownProfile) {
                    const { data: userData } = await supabase.auth.getUser();
                    userId = userData.user?.id?.trim() || null;
                  }
                  if (!userId || userId === 'me') {
                    return;
                  }
                  navigation.push('ConnectionsList', { userId });
                })();
                return;
              }
              if (stat.label !== 'Representados' && stat.label !== 'Jugadores') {
                return;
              }
              if (displayedProfile.kind !== 'agent') {
                return;
              }
              if (ownProfile) {
                navigation.push('Crm');
                return;
              }
              const representativeId = displayedProfile.id;
              if (!representativeId || representativeId === 'me') {
                return;
              }
              navigation.push('RepresentedPlayers', { representativeId });
            }}
            onFieldPress={(field) => {
              if (field.label === 'Representante') {
                const representativeId = displayedProfile.representativeId;
                if (!representativeId || representativeId === 'me') {
                  return;
                }
                navigation.push('Profile', { userId: representativeId });
                return;
              }
              if (field.label !== 'Representados' || displayedProfile.kind !== 'agent') {
                return;
              }
              if (ownProfile) {
                navigation.push('Crm');
                return;
              }
              const representativeId = displayedProfile.id;
              if (!representativeId || representativeId === 'me') {
                return;
              }
              navigation.push('RepresentedPlayers', { representativeId });
            }}
            photoBadge={
              ownProfile ? (
                <Pressable
                  style={styles.photoBadge}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <FontAwesome5 name="pen" size={10} color={colors.homeHeader} />
                </Pressable>
              ) : null
            }
            nameAccessory={
              ownProfile && isPremium ? (
                <PremiumBadge
                  size="md"
                  onPress={() => navigation.push('Premium')}
                />
              ) : null
            }
            extra={
              displayedProfile.kind === 'player' && highlights.length > 0 ? (
                <View style={styles.highlightsSection}>
                  <Text style={styles.highlightsTitle}>Highlights</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.highlightsRow}
                  >
                    {highlights.map((video) => (
                      <Pressable
                        key={video.id}
                        style={styles.highlightCard}
                        onPress={() =>
                          navigation.push('HighlightPlayer', {
                            url: video.url,
                            title: video.title,
                          })
                        }
                      >
                        <View style={styles.highlightThumb}>
                          <View style={styles.highlightPlay}>
                            <FontAwesome5 name="play" size={11} color="#FFFFFF" />
                          </View>
                        </View>
                        <Text style={styles.highlightName} numberOfLines={1}>
                          {video.title}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null
            }
            footer={
              ownProfile ? (
                <View>
                  {missingPlayerProfile ? (
                    <Pressable
                      style={styles.editButton}
                      onPress={() => navigation.navigate('CreateProfile')}
                    >
                      <FontAwesome5 name="user-plus" size={13} color={colors.homeHeader} />
                      <Text style={styles.editButtonText}>Crear perfil</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    style={styles.editButton}
                    onPress={() => navigation.navigate('EditProfile')}
                  >
                    <FontAwesome5 name="pen" size={13} color={colors.homeHeader} />
                    <Text style={styles.editButtonText}>Editar perfil</Text>
                  </Pressable>
                  {role === 'player' ? (
                    <Pressable
                      style={styles.highlightsButton}
                      onPress={() => navigation.push('Highlights')}
                    >
                      <FontAwesome5 name="video" size={13} color="#FFFFFF" />
                      <Text style={styles.highlightsButtonText}>
                        Mis highlights
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={styles.highlightsButton}
                      onPress={() => navigation.push('Crm')}
                    >
                      <FontAwesome5 name="briefcase" size={13} color="#FFFFFF" />
                      <Text style={styles.highlightsButtonText}>Mi CRM</Text>
                    </Pressable>
                  )}
                  {role === 'player' && activeRepresentation ? (
                    <Pressable
                      style={styles.endRepresentationButton}
                      onPress={() =>
                        confirmEndRepresentation(
                          activeRepresentation.id_representacion,
                        )
                      }
                    >
                      <Text style={styles.endRepresentationText}>
                        Cortar representación
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : blocked ? (
                <View style={styles.blockedCard}>
                  <FontAwesome5 name="ban" size={16} color="#E53935" />
                  <Text style={styles.blockedTitle}>Usuario bloqueado</Text>
                  <Text style={styles.blockedCopy}>
                    No vas a interactuar con esta cuenta hasta que la
                    desbloquees.
                  </Text>
                  <Pressable
                    style={styles.unblockButton}
                    onPress={() => unblockUser(displayedProfile.id)}
                  >
                    <Text style={styles.unblockButtonText}>Desbloquear</Text>
                  </Pressable>
                </View>
              ) : (
                <View>
                  {rating ? (
                    <View style={styles.ratedRow}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <FontAwesome5
                          key={index}
                          name="star"
                          solid
                          size={12}
                          color={
                            index < rating.stars ? colors.homeStar : '#E8E8E8'
                          }
                        />
                      ))}
                      <Text style={styles.ratedText}>Calificado</Text>
                    </View>
                  ) : null}
                  {actionsLoaded ? (
                  <View style={[styles.actions, rating ? styles.actionsAfterRating : null]}>
                  {connected ? (
                    <View style={[styles.requestButton, styles.connectedButton]}>
                      <FontAwesome5 name="check" size={14} color="#FFFFFF" />
                      <Text style={styles.requestButtonText}>Conectado</Text>
                    </View>
                  ) : incoming ? (
                    <Pressable
                      style={[styles.requestButton, { backgroundColor: brand.header }]}
                      onPress={() => {
                        void acceptIncomingRequest(displayedProfile.id).then(
                          (result) => {
                            if (!result.ok) {
                              Alert.alert(
                                'No se pudo aceptar la solicitud',
                                result.message,
                              );
                            }
                          },
                        );
                      }}
                    >
                      <FontAwesome5 name="check" size={14} color="#FFFFFF" />
                      <Text style={styles.requestButtonText}>Aceptar solicitud</Text>
                    </Pressable>
                  ) : requested ? (
                    <View style={[styles.requestButton, styles.requestButtonSent]}>
                      <FontAwesome5 name="clock" size={14} color="#8A8A8A" />
                      <Text style={styles.requestButtonSentText}>Pendiente</Text>
                    </View>
                  ) : (
                    <Pressable
                      style={[styles.requestButton, { backgroundColor: brand.header }]}
                      onPress={() => {
                        void sendRequest(displayedProfile.id).then((result) => {
                          if (!result.ok) {
                            Alert.alert(
                              'No se pudo enviar la solicitud',
                              result.message,
                            );
                          }
                        });
                      }}
                    >
                      <FontAwesome5 name="user-plus" size={14} color="#FFFFFF" />
                      <Text style={styles.requestButtonText}>
                        Enviar solicitud
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={[styles.messageButton, { backgroundColor: brand.header }]}
                    onPress={() => {
                      void openChatWith(displayedProfile.id);
                    }}
                  >
                    <FontAwesome5 name="paper-plane" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
                  ) : null}
                {canShowRepresentation ? (
                  <View style={styles.representationRow}>
                    {acceptedPair ? (
                      <View style={styles.endRepresentationWrap}>
                        <View
                          style={[
                            styles.requestButton,
                            styles.connectedButton,
                            styles.endRepresentationStatus,
                          ]}
                        >
                          <FontAwesome5 name="check" size={14} color="#FFFFFF" />
                          <Text style={styles.requestButtonText}>
                            {role === 'player'
                              ? 'Tu representante'
                              : 'Lo representás'}
                          </Text>
                        </View>
                        <Pressable
                          style={styles.endRepresentationButton}
                          onPress={() =>
                            confirmEndRepresentation(
                              acceptedPair.id_representacion,
                            )
                          }
                        >
                          <Text style={styles.endRepresentationText}>
                            Cortar representación
                          </Text>
                        </Pressable>
                      </View>
                    ) : pairRepresentation?.estado === 'pendiente' &&
                      authenticatedUserId &&
                      pairRepresentation.fk_solicitante ===
                        authenticatedUserId ? (
                      <View
                        style={[
                          styles.requestButton,
                          styles.requestButtonSent,
                        ]}
                      >
                        <FontAwesome5 name="clock" size={14} color="#8A8A8A" />
                        <Text style={styles.requestButtonSentText}>
                          Representación pendiente
                        </Text>
                      </View>
                    ) : pairRepresentation?.estado === 'pendiente' &&
                      authenticatedUserId &&
                      pairRepresentation.fk_solicitante !==
                        authenticatedUserId ? (
                      <Pressable
                        style={[
                          styles.requestButton,
                          { backgroundColor: brand.header },
                        ]}
                        onPress={() => {
                          void acceptRepresentation(
                            pairRepresentation.id_representacion,
                          ).then((result) => {
                            if (!result.ok) {
                              Alert.alert(
                                'No se pudo aceptar la representación',
                                result.message,
                              );
                              return;
                            }
                            void refreshRepresentaciones();
                          });
                        }}
                      >
                        <FontAwesome5 name="check" size={14} color="#FFFFFF" />
                        <Text style={styles.requestButtonText}>
                          Aceptar representación
                        </Text>
                      </Pressable>
                    ) : pairRepresentation?.estado === 'pendiente' ? (
                      <View
                        style={[
                          styles.requestButton,
                          styles.requestButtonSent,
                        ]}
                      >
                        <FontAwesome5 name="clock" size={14} color="#8A8A8A" />
                        <Text style={styles.requestButtonSentText}>
                          Representación pendiente
                        </Text>
                      </View>
                    ) : !pairRepresentation &&
                      !(
                        role === 'player' && playerHasActiveRepresentation
                      ) ? (
                      <Pressable
                        style={[
                          styles.requestButton,
                          { backgroundColor: brand.header },
                        ]}
                        onPress={() => {
                          void sendRepresentationRequest(
                            displayedProfile.id,
                          ).then((result) => {
                            if (!result.ok) {
                              Alert.alert(
                                'No se pudo solicitar la representación',
                                result.message,
                              );
                              return;
                            }
                            void refreshRepresentaciones();
                          });
                        }}
                      >
                        <FontAwesome5
                          name="user-tie"
                          size={14}
                          color="#FFFFFF"
                        />
                        <Text style={styles.requestButtonText}>
                          Solicitar representación
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
                </View>
              )
            }
          />
        </ScrollView>
      </View>

      <PlayerTabBar activeTab={ownProfile ? 'profile' : undefined} />
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
  scrollContent: {
    paddingTop: 18,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: 12,
  },
  missingText: {
    color: '#8A8A8A',
    fontSize: 14,
  },
  backLink: {
    color: colors.homeHeader,
    fontSize: 14,
    fontWeight: '700',
  },
  photoBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.homeAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginTop: 22,
    borderRadius: 24,
    backgroundColor: '#E7F8DC',
    gap: 8,
  },
  editButtonText: {
    color: colors.homeHeader,
    fontSize: 15,
    fontWeight: '700',
  },
  highlightsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginTop: 10,
    borderRadius: 24,
    backgroundColor: colors.homeHeader,
    gap: 8,
  },
  highlightsSection: {
    marginTop: 18,
  },
  highlightsTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  highlightsRow: {
    gap: 10,
  },
  highlightCard: {
    width: 120,
  },
  highlightThumb: {
    width: 120,
    height: 80,
    borderRadius: 16,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightPlay: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(7, 54, 44, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightName: {
    marginTop: 6,
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  highlightsButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  blockedCard: {
    alignItems: 'center',
    marginTop: 22,
    padding: 16,
    backgroundColor: '#FDECEA',
    borderRadius: 18,
    gap: 8,
  },
  blockedTitle: {
    color: '#E53935',
    fontSize: 15,
    fontWeight: '700',
  },
  blockedCopy: {
    color: '#4A4A4A',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  unblockButton: {
    height: 40,
    marginTop: 4,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unblockButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  ratedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    gap: 4,
  },
  ratedText: {
    marginLeft: 6,
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    gap: 10,
  },
  representationRow: {
    marginTop: 10,
  },
  endRepresentationWrap: {
    gap: 10,
  },
  endRepresentationStatus: {
    flex: 0,
  },
  endRepresentationButton: {
    height: 44,
    marginTop: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endRepresentationText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '700',
  },
  actionsAfterRating: {
    marginTop: 10,
  },
  requestButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.homeHeader,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  requestButtonSent: {
    backgroundColor: '#E8E8E8',
  },
  connectedButton: {
    backgroundColor: '#2E8B57',
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  requestButtonSentText: {
    color: '#8A8A8A',
    fontSize: 15,
    fontWeight: '700',
  },
  messageButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.inputBackground,
  },
  skeletonName: {
    width: 180,
    height: 22,
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: colors.inputBackground,
  },
  skeletonBadge: {
    width: 92,
    height: 22,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#F3F6F4',
  },
  skeletonLocation: {
    width: 120,
    height: 12,
    marginTop: 8,
    borderRadius: 6,
    backgroundColor: '#F3F6F4',
  },
  skeletonStats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: 22,
    marginBottom: 18,
    backgroundColor: '#F3F6F4',
    borderRadius: 18,
    paddingVertical: 14,
  },
  skeletonStatBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  skeletonStatValue: {
    width: 28,
    height: 18,
    borderRadius: 6,
    backgroundColor: colors.inputBackground,
  },
  skeletonStatLabel: {
    width: 54,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.inputBackground,
  },
  skeletonField: {
    alignSelf: 'stretch',
    height: 16,
    marginBottom: 22,
    borderRadius: 8,
    backgroundColor: '#F3F6F4',
  },
  skeletonAboutTitle: {
    alignSelf: 'flex-start',
    width: 90,
    height: 16,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: colors.inputBackground,
  },
  skeletonAbout: {
    alignSelf: 'stretch',
    height: 72,
    borderRadius: 16,
    backgroundColor: '#F3F6F4',
  },
});
