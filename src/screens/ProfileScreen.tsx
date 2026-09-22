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
import { usePlayerProfile } from '../context/PlayerProfileContext';
import { OWN_PROFILE_ID, ProfileField, UserProfile } from '../data/playerProfiles';
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

function textValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatBirthDateDisplay(value: unknown) {
  const raw = textValue(value);
  if (!raw) {
    return undefined;
  }

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (iso) {
    return `${iso[3]}/${iso[2]}/${iso[1]}`;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    return raw;
  }

  return undefined;
}

function ageFromBirthDate(value: unknown) {
  const raw = textValue(value);
  if (!raw) {
    return undefined;
  }

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  const year = iso ? Number(iso[1]) : dmy ? Number(dmy[3]) : NaN;
  const month = iso ? Number(iso[2]) : dmy ? Number(dmy[2]) : NaN;
  const day = iso ? Number(iso[3]) : dmy ? Number(dmy[1]) : NaN;

  if (!year || !month || !day) {
    return undefined;
  }

  const birth = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  if (age < 0 || age > 120) {
    return undefined;
  }

  return `${age} años`;
}

function withFieldValue(fields: ProfileField[], label: string, value?: string) {
  if (!value) {
    return fields;
  }

  return fields.map((field) =>
    field.label === label ? { ...field, value } : field,
  );
}

async function fetchNombreById(
  table: 'posiciones' | 'clubes',
  idField: 'id_posicion' | 'id_club',
  id: string | number | null,
) {
  if (id == null) {
    return undefined;
  }

  const { data, error } = await supabase
    .from(table)
    .select('nombre')
    .eq(idField, id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const nombre = textValue((data as { nombre?: unknown } | null)?.nombre);
  return nombre || undefined;
}

export function ProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const route = useRoute<RouteProp<AuthStackParamList, 'Profile'>>();
  const {
    role,
    getProfile,
    isOwnProfile,
    sendRequest,
    hasSentRequest,
    isConnected,
    incomingRequestIds,
    acceptIncomingRequest,
    isPremium,
    isBlocked,
    unblockUser,
    getRating,
  } = usePlayerProfile();

  const userId = route.params?.userId ?? OWN_PROFILE_ID;
  const ownProfile = isOwnProfile(userId);
  const profile = getProfile(userId);
  const [liveOwnProfile, setLiveOwnProfile] = useState<UserProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!ownProfile || !profile) {
        return;
      }

      let cancelled = false;

      async function loadOwnProfile() {
        try {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) {
            throw userError;
          }

          const user = userData.user;
          if (!user) {
            return;
          }

          const { data: usuario, error: usuarioError } = await supabase
            .from('usuarios')
            .select('id_usuario, nombre, apellido, email, fecha_nacimiento, fk_rol')
            .eq('id_usuario', user.id)
            .maybeSingle();

          if (usuarioError) {
            throw usuarioError;
          }
          if (!usuario || cancelled) {
            return;
          }

          const usuarioRow = usuario as {
            nombre?: unknown;
            apellido?: unknown;
            email?: unknown;
            fecha_nacimiento?: unknown;
            fk_rol?: string | number | null;
          };

          let roleName = '';
          if (usuarioRow.fk_rol != null) {
            const { data: roleRow, error: roleError } = await supabase
              .from('roles')
              .select('nombre')
              .eq('id_rol', usuarioRow.fk_rol)
              .maybeSingle();

            if (roleError) {
              throw roleError;
            }
            roleName = textValue((roleRow as { nombre?: unknown } | null)?.nombre);
          }

          const isAgent = roleName === 'Representante';
          const fullName = `${textValue(usuarioRow.nombre)} ${textValue(usuarioRow.apellido)}`.trim();
          const email = textValue(usuarioRow.email);
          const birthDate = formatBirthDateDisplay(usuarioRow.fecha_nacimiento);
          const age = ageFromBirthDate(usuarioRow.fecha_nacimiento);

          let fields = withFieldValue(profile.fields, 'Edad', age);
          let about = profile.about;

          if (isAgent) {
            const { data: agente, error: agenteError } = await supabase
              .from('perfiles_representante')
              .select('descripcion')
              .eq('id_usuario', user.id)
              .maybeSingle();

            if (agenteError) {
              throw agenteError;
            }

            const descripcion = textValue(
              (agente as { descripcion?: unknown } | null)?.descripcion,
            );
            if (descripcion) {
              about = descripcion;
            }
          } else {
            const { data: jugador, error: jugadorError } = await supabase
              .from('perfiles_jugador')
              .select('categoria, fk_posicion, fk_club_actual')
              .eq('id_usuario', user.id)
              .maybeSingle();

            if (jugadorError) {
              throw jugadorError;
            }

            const jugadorRow = jugador as {
              categoria?: unknown;
              fk_posicion?: string | number | null;
              fk_club_actual?: string | number | null;
            } | null;

            const posicionNombre = await fetchNombreById(
              'posiciones',
              'id_posicion',
              jugadorRow?.fk_posicion ?? null,
            );
            const clubNombre = await fetchNombreById(
              'clubes',
              'id_club',
              jugadorRow?.fk_club_actual ?? null,
            );

            fields = withFieldValue(fields, 'Posición', posicionNombre);
            fields = withFieldValue(fields, 'Club actual', clubNombre);

            const categoria = textValue(jugadorRow?.categoria);
            if (categoria && !fields.some((field) => field.label === 'Categoría')) {
              const posicionIndex = fields.findIndex((field) => field.label === 'Posición');
              const categoriaField: ProfileField = {
                icon: 'flag',
                label: 'Categoría',
                value: categoria,
              };
              fields =
                posicionIndex >= 0
                  ? [
                      ...fields.slice(0, posicionIndex + 1),
                      categoriaField,
                      ...fields.slice(posicionIndex + 1),
                    ]
                  : [...fields, categoriaField];
            } else {
              fields = withFieldValue(fields, 'Categoría', categoria);
            }
          }

          if (cancelled) {
            return;
          }

          setLiveOwnProfile({
            ...profile,
            kind: isAgent ? 'agent' : roleName === 'Jugador' ? 'player' : profile.kind,
            name: fullName || profile.name,
            email: email || profile.email,
            birthDate: birthDate ?? profile.birthDate,
            fields,
            about,
          });
        } catch (error) {
          if (!cancelled) {
            Alert.alert('No pudimos cargar tu perfil', errorMessage(error));
          }
        }
      }

      void loadOwnProfile();

      return () => {
        cancelled = true;
      };
    }, [ownProfile, profile]),
  );

  const displayedProfile = ownProfile ? liveOwnProfile ?? profile : profile;
  const requested = displayedProfile ? hasSentRequest(displayedProfile.id) : false;
  const connected = displayedProfile ? isConnected(displayedProfile.id) : false;
  const incoming = displayedProfile
    ? incomingRequestIds.includes(displayedProfile.id)
    : false;
  const blocked = displayedProfile ? isBlocked(displayedProfile.id) : false;
  const rating = displayedProfile ? getRating(displayedProfile.id) : undefined;

  if (!displayedProfile) {
    return (
      <View style={[styles.root, { backgroundColor: brand.header }]}>
        <StatusBar style="light" />
        <View style={styles.missing}>
          <Text style={styles.missingText}>No encontramos este perfil.</Text>
          <Pressable onPress={() => navigation.goBack()}>
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
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
              return;
            }
            navigation.navigate('Home');
          }}
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
            photoBadge={
              ownProfile ? (
                <View style={styles.photoBadge}>
                  <FontAwesome5 name="pen" size={10} color={colors.homeHeader} />
                </View>
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
            footer={
              ownProfile ? (
                <View>
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
                  <View style={[styles.actions, rating ? styles.actionsAfterRating : null]}>
                  {connected ? (
                    <View style={[styles.requestButton, styles.connectedButton]}>
                      <FontAwesome5 name="check" size={14} color="#FFFFFF" />
                      <Text style={styles.requestButtonText}>Conectado</Text>
                    </View>
                  ) : incoming ? (
                    <Pressable
                      style={[styles.requestButton, { backgroundColor: brand.header }]}
                      onPress={() => acceptIncomingRequest(displayedProfile.id)}
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
                      onPress={() => sendRequest(displayedProfile.id)}
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
                      if (displayedProfile.conversationId) {
                        navigation.navigate('Chat', {
                          conversationId: displayedProfile.conversationId,
                        });
                      }
                    }}
                  >
                    <FontAwesome5 name="paper-plane" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
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
});
