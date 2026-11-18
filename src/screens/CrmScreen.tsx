import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PlayerTabBar } from '../components/PlayerTabBar';
import { usePlayerProfile } from '../context/PlayerProfileContext';
import { useRepresentaciones } from '../context/RepresentacionesContext';
import { UserProfile } from '../data/playerProfiles';
import {
  CrmPlayer,
  CrmTag,
  crmTagLabel,
  fetchCrmRoster,
  formatCrmDate,
} from '../lib/crm';
import { CrmWorkspace, emptyCrmEntry, loadCrmWorkspace } from '../lib/crmWorkspace';
import { fetchPublicPeopleByIds } from '../lib/directory';
import { getOrCreateConversation } from '../lib/mensajes';
import { fetchIncomingRepresentationRequests } from '../lib/representaciones';
import { supabase } from '../lib/supabase';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';
import { matchesSearch } from '../utils/search';

type CrmTab = 'roster' | 'requests';

export function CrmScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const { isPremium, role } = usePlayerProfile();
  const { incomingRequests, incomingCount, accept, reject, refresh } =
    useRepresentaciones();
  const isAgent = role === 'agent';
  const [tab, setTab] = useState<CrmTab>('roster');
  const [query, setQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('Todos');
  const [roster, setRoster] = useState<CrmPlayer[]>([]);
  const [workspace, setWorkspace] = useState<CrmWorkspace>({});
  const [incomingPeople, setIncomingPeople] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const canUseCrm = isAgent && isPremium;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadCrm() {
        if (!isAgent) {
          if (!cancelled) {
            setRoster([]);
            setIncomingPeople([]);
            setLoading(false);
          }
          return;
        }

        setLoading(true);
        const { data } = await supabase.auth.getUser();
        const myId = data.user?.id?.trim() || '';
        if (!myId || myId === 'me') {
          if (!cancelled) {
            setRoster([]);
            setIncomingPeople([]);
            setLoading(false);
          }
          return;
        }

        try {
          await refresh();
          const incoming = await fetchIncomingRepresentationRequests();
          const incomingIds = incoming.ok
            ? incoming.data.map((row) => row.fk_solicitante)
            : [];
          const [nextRoster, nextWorkspace, people] = await Promise.all([
            fetchCrmRoster(myId),
            loadCrmWorkspace(myId),
            fetchPublicPeopleByIds(incomingIds),
          ]);
          if (!cancelled) {
            setRoster(nextRoster);
            setWorkspace(nextWorkspace);
            setIncomingPeople(people);
          }
        } catch {
          if (!cancelled) {
            setRoster([]);
            setIncomingPeople([]);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      }

      void loadCrm();
      return () => {
        cancelled = true;
      };
    }, [isAgent, refresh]),
  );

  const positions = useMemo(() => {
    const unique = new Set<string>();
    for (const player of roster) {
      if (player.position) {
        unique.add(player.position);
      }
    }
    return ['Todos', ...[...unique].sort((a, b) => a.localeCompare(b, 'es'))];
  }, [roster]);

  const filteredRoster = useMemo(() => {
    return roster.filter((player) => {
      if (positionFilter !== 'Todos' && player.position !== positionFilter) {
        return false;
      }
      const entry = workspace[player.id] ?? emptyCrmEntry();
      return matchesSearch(
        [
          player.name,
          player.position,
          player.club,
          player.category,
          player.location,
          crmTagLabel(entry.tag),
          entry.note,
        ].join(' '),
        query,
      );
    });
  }, [positionFilter, query, roster, workspace]);

  const notesCount = roster.filter((player) =>
    (workspace[player.id]?.note ?? '').trim(),
  ).length;

  async function openChat(playerId: string) {
    const { data } = await supabase.auth.getUser();
    const myId = data.user?.id?.trim();
    if (!myId) {
      Alert.alert('No se pudo abrir el chat', 'No hay un usuario autenticado.');
      return;
    }
    const result = await getOrCreateConversation(myId, playerId);
    if (!result.ok) {
      Alert.alert('No se pudo abrir el chat', result.message);
      return;
    }
    navigation.push('Chat', { conversationId: result.data });
  }

  async function reloadRoster() {
    const { data } = await supabase.auth.getUser();
    const myId = data.user?.id?.trim() || '';
    if (!myId || myId === 'me') {
      return;
    }
    const [nextRoster, nextWorkspace] = await Promise.all([
      fetchCrmRoster(myId),
      loadCrmWorkspace(myId),
    ]);
    setRoster(nextRoster);
    setWorkspace(nextWorkspace);
  }

  async function handleAccept(idRepresentacion: number) {
    const result = await accept(idRepresentacion);
    if (!result.ok) {
      Alert.alert('No se pudo aceptar', result.message);
      return;
    }
    await reloadRoster();
  }

  async function handleReject(idRepresentacion: number) {
    const result = await reject(idRepresentacion);
    if (!result.ok) {
      Alert.alert('No se pudo rechazar', result.message);
    }
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
        <View style={styles.headerRow}>
          <Pressable style={styles.headerSide} onPress={() => navigation.goBack()}>
            <FontAwesome5 name="arrow-left" size={16} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>CRM</Text>
          <View style={styles.headerSide} />
        </View>
        {canUseCrm ? (
          <View style={styles.tabs}>
            <Pressable
              style={[
                styles.tab,
                tab === 'roster' && [styles.tabActive, { backgroundColor: brand.soft }],
              ]}
              onPress={() => setTab('roster')}
            >
              <Text
                style={[
                  styles.tabLabel,
                  tab === 'roster' && [styles.tabLabelActive, { color: brand.header }],
                ]}
              >
                Plantel
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                tab === 'requests' && [styles.tabActive, { backgroundColor: brand.soft }],
              ]}
              onPress={() => setTab('requests')}
            >
              <Text
                style={[
                  styles.tabLabel,
                  tab === 'requests' && [styles.tabLabelActive, { color: brand.header }],
                ]}
              >
                {incomingCount > 0 ? `Solicitudes (${incomingCount})` : 'Solicitudes'}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.panel}>
        {!isAgent ? (
          <View style={styles.lockCard}>
            <View style={[styles.lockIcon, { backgroundColor: brand.soft }]}>
              <FontAwesome5 name="briefcase" size={18} color={brand.header} />
            </View>
            <Text style={styles.lockTitle}>CRM para representantes</Text>
            <Text style={styles.lockCopy}>
              Esta herramienta es para gestionar a tus jugadores representados.
            </Text>
          </View>
        ) : !isPremium ? (
          <View style={styles.lockCard}>
            <View style={[styles.lockIcon, { backgroundColor: brand.soft }]}>
              <FontAwesome5 name="lock" size={18} color={brand.header} />
            </View>
            <Text style={styles.lockTitle}>Función exclusiva de Premium</Text>
            <Text style={styles.lockCopy}>
              Gestioná a tus jugadores representados, dejá notas y seguí
              solicitudes en un mismo lugar.
            </Text>
            <Pressable
              style={[styles.button, { backgroundColor: brand.header }]}
              onPress={() => navigation.push('Premium')}
            >
              <Text style={styles.buttonText}>Conocé Premium</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {tab === 'roster' ? (
              <>
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{roster.length}</Text>
                    <Text style={styles.statLabel}>Plantel</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{incomingCount}</Text>
                    <Text style={styles.statLabel}>Solicitudes</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{notesCount}</Text>
                    <Text style={styles.statLabel}>Con notas</Text>
                  </View>
                </View>

                <View style={styles.searchBox}>
                  <FontAwesome5 name="search" size={14} color="#8A8A8A" />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Buscar por nombre, posición o club"
                    placeholderTextColor="#8A8A8A"
                    style={styles.searchInput}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                </View>

                {positions.length > 1 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chips}
                  >
                    {positions.map((position) => {
                      const active = positionFilter === position;
                      return (
                        <Pressable
                          key={position}
                          style={[
                            styles.chip,
                            active && {
                              backgroundColor: brand.soft,
                            },
                          ]}
                          onPress={() => setPositionFilter(position)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              active && { color: brand.header },
                            ]}
                          >
                            {position}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : null}

                {loading ? (
                  <Text style={styles.emptyText}>Cargando plantel...</Text>
                ) : roster.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <View style={[styles.lockIcon, { backgroundColor: brand.soft }]}>
                      <FontAwesome5 name="users" size={18} color={brand.header} />
                    </View>
                    <Text style={styles.lockTitle}>Todavía no hay plantel</Text>
                    <Text style={styles.lockCopy}>
                      Cuando aceptes una solicitud de representación, tus
                      jugadores aparecen acá.
                    </Text>
                  </View>
                ) : filteredRoster.length === 0 ? (
                  <Text style={styles.emptyText}>
                    No hay jugadores que coincidan con la búsqueda.
                  </Text>
                ) : (
                  filteredRoster.map((player) => {
                    const entry = workspace[player.id] ?? emptyCrmEntry();
                    return (
                      <CrmPlayerCard
                        key={player.id}
                        player={player}
                        tag={entry.tag}
                        note={entry.note}
                        onOpen={() =>
                          navigation.push('CrmPlayer', { playerId: player.id })
                        }
                        onChat={() => {
                          void openChat(player.id);
                        }}
                      />
                    );
                  })
                )}
              </>
            ) : loading ? (
              <Text style={styles.emptyText}>Cargando solicitudes...</Text>
            ) : incomingRequests.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={[styles.lockIcon, { backgroundColor: brand.soft }]}>
                  <FontAwesome5 name="inbox" size={18} color={brand.header} />
                </View>
                <Text style={styles.lockTitle}>Sin solicitudes</Text>
                <Text style={styles.lockCopy}>
                  Acá vas a ver quién quiere que lo representes.
                </Text>
              </View>
            ) : (
              incomingRequests.map((row) => {
                const person =
                  incomingPeople.find((item) => item.id === row.fk_solicitante) ??
                  null;
                const name = person?.name || 'Jugador';
                const subtitle =
                  person?.fields.find((field) => field.label === 'Posición')
                    ?.value ||
                  person?.location ||
                  'Solicitud de representación';
                return (
                  <View key={row.id_representacion} style={styles.requestCard}>
                    <Pressable
                      style={styles.requestMain}
                      onPress={() =>
                        navigation.push('Profile', { userId: row.fk_solicitante })
                      }
                    >
                      {person?.photoUrl ? (
                        <Image
                          source={{ uri: person.photoUrl }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={styles.avatar} />
                      )}
                      <View style={styles.requestBody}>
                        <Text style={styles.name}>{name}</Text>
                        <Text style={styles.meta}>{subtitle}</Text>
                        <Text style={styles.since}>
                          Recibida {formatCrmDate(row.fecha_solicitud)}
                        </Text>
                      </View>
                    </Pressable>
                    <View style={styles.requestActions}>
                      <Pressable
                        style={styles.rejectButton}
                        onPress={() => {
                          void handleReject(row.id_representacion);
                        }}
                      >
                        <Text style={styles.rejectText}>Rechazar</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.acceptButton, { backgroundColor: brand.header }]}
                        onPress={() => {
                          void handleAccept(row.id_representacion);
                        }}
                      >
                        <Text style={styles.acceptText}>Aceptar</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>

      <PlayerTabBar activeTab="profile" />
    </View>
  );
}

function CrmPlayerCard({
  player,
  tag,
  note,
  onOpen,
  onChat,
}: {
  player: CrmPlayer;
  tag: CrmTag;
  note: string;
  onOpen: () => void;
  onChat: () => void;
}) {
  const facts = [
    player.position,
    player.age != null ? `${player.age} años` : '',
    player.club,
  ]
    .filter(Boolean)
    .join(' · ');
  const since = formatCrmDate(player.representedAt);

  return (
    <Pressable style={styles.playerCard} onPress={onOpen}>
      {player.photoUrl ? (
        <Image source={{ uri: player.photoUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatar} />
      )}
      <View style={styles.playerBody}>
        <View style={styles.playerTop}>
          <Text style={styles.name} numberOfLines={1}>
            {player.name}
          </Text>
          {player.isPremium ? (
            <FontAwesome5 name="crown" solid size={9} color={colors.homeStar} />
          ) : null}
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{crmTagLabel(tag)}</Text>
          </View>
        </View>
        {facts ? <Text style={styles.meta}>{facts}</Text> : null}
        {player.location ? (
          <Text style={styles.location} numberOfLines={1}>
            {player.location}
          </Text>
        ) : null}
        {since ? <Text style={styles.since}>Desde {since}</Text> : null}
        {note.trim() ? (
          <Text style={styles.notePreview} numberOfLines={2}>
            {note.trim()}
          </Text>
        ) : null}
        <View style={styles.cardActions}>
          <Pressable
            style={styles.cardAction}
            onPress={(event) => {
              event.stopPropagation();
              onChat();
            }}
          >
            <FontAwesome5 name="comment" size={11} color={colors.homeHeader} />
            <Text style={styles.cardActionText}>Chat</Text>
          </Pressable>
          <Pressable
            style={styles.cardAction}
            onPress={(event) => {
              event.stopPropagation();
              onOpen();
            }}
          >
            <FontAwesome5 name="clipboard" size={11} color={colors.homeHeader} />
            <Text style={styles.cardActionText}>Ficha</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.homeHeader,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  tabs: {
    flexDirection: 'row',
    gap: 10,
  },
  tab: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabActive: {
    backgroundColor: '#E7F8DC',
  },
  tabLabel: {
    color: colors.homeMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: colors.homeHeader,
  },
  panel: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  lockCard: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 22,
    backgroundColor: '#F3F6F4',
    borderRadius: 22,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 22,
    backgroundColor: '#F3F6F4',
    borderRadius: 22,
  },
  lockIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginBottom: 14,
    backgroundColor: '#E7F8DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  lockCopy: {
    marginTop: 8,
    marginBottom: 18,
    color: '#4A4A4A',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  button: {
    minWidth: 180,
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#F3F6F4',
    borderRadius: 18,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 2,
    color: '#8A8A8A',
    fontSize: 11,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    marginBottom: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F3F3F3',
    borderRadius: 22,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  chips: {
    gap: 8,
    paddingBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F6F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    color: '#4A4A4A',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 24,
    color: '#8A8A8A',
    fontSize: 14,
    textAlign: 'center',
  },
  playerCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 18,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.inputBackground,
  },
  playerBody: {
    flex: 1,
  },
  playerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#E7F8DC',
  },
  tagText: {
    color: colors.homeHeader,
    fontSize: 10,
    fontWeight: '700',
  },
  meta: {
    marginTop: 3,
    color: '#4A4A4A',
    fontSize: 12,
    fontWeight: '600',
  },
  location: {
    marginTop: 2,
    color: '#8A8A8A',
    fontSize: 12,
  },
  since: {
    marginTop: 2,
    color: '#8A8A8A',
    fontSize: 11,
  },
  notePreview: {
    marginTop: 6,
    color: '#4A4A4A',
    fontSize: 12,
    lineHeight: 17,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#E7F8DC',
    gap: 6,
  },
  cardActionText: {
    color: colors.homeHeader,
    fontSize: 12,
    fontWeight: '700',
  },
  requestCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 18,
  },
  requestMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestBody: {
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  rejectButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F6F4',
  },
  rejectText: {
    color: '#8A8A8A',
    fontSize: 13,
    fontWeight: '700',
  },
  acceptButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.homeHeader,
  },
  acceptText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
