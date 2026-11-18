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
  Image,
  KeyboardAvoidingView,
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
import {
  CRM_TAGS,
  CrmPlayer,
  CrmTag,
  fetchCrmRoster,
  formatCrmDate,
} from '../lib/crm';
import {
  emptyCrmEntry,
  loadCrmWorkspace,
  saveCrmPlayerEntry,
} from '../lib/crmWorkspace';
import { getOrCreateConversation } from '../lib/mensajes';
import { supabase } from '../lib/supabase';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

export function CrmPlayerScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'CrmPlayer'>>();
  const brand = useBrandColors();
  const { isPremium, role } = usePlayerProfile();
  const { end: endRepresentation } = useRepresentaciones();
  const playerId = route.params.playerId.trim();
  const [player, setPlayer] = useState<CrmPlayer | null>(null);
  const [note, setNote] = useState('');
  const [tag, setTag] = useState<CrmTag>('activo');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const canUseCrm = role === 'agent' && isPremium;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadPlayer() {
        const { data } = await supabase.auth.getUser();
        const myId = data.user?.id?.trim() || '';
        if (!myId || myId === 'me' || !playerId || playerId === 'me') {
          if (!cancelled) {
            setPlayer(null);
            setLoaded(true);
          }
          return;
        }

        try {
          const [roster, workspace] = await Promise.all([
            fetchCrmRoster(myId),
            loadCrmWorkspace(myId),
          ]);
          const found = roster.find((item) => item.id === playerId) ?? null;
          const entry = workspace[playerId] ?? emptyCrmEntry();
          if (!cancelled) {
            setPlayer(found);
            setNote(entry.note);
            setTag(entry.tag);
            setLoaded(true);
          }
        } catch {
          if (!cancelled) {
            setPlayer(null);
            setLoaded(true);
          }
        }
      }

      void loadPlayer();
      return () => {
        cancelled = true;
      };
    }, [playerId]),
  );

  async function saveNotes() {
    if (saving) {
      return;
    }
    const { data } = await supabase.auth.getUser();
    const myId = data.user?.id?.trim() || '';
    if (!myId || !player) {
      return;
    }
    setSaving(true);
    try {
      await saveCrmPlayerEntry(myId, player.id, { note, tag });
    } catch {
      Alert.alert('No se pudo guardar', 'Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function openChat() {
    if (!player) {
      return;
    }
    const { data } = await supabase.auth.getUser();
    const myId = data.user?.id?.trim();
    if (!myId) {
      Alert.alert('No se pudo abrir el chat', 'No hay un usuario autenticado.');
      return;
    }
    const result = await getOrCreateConversation(myId, player.id);
    if (!result.ok) {
      Alert.alert('No se pudo abrir el chat', result.message);
      return;
    }
    navigation.push('Chat', { conversationId: result.data });
  }

  const facts = player
    ? [
        { label: 'Posición', value: player.position },
        {
          label: 'Edad',
          value: player.age != null ? `${player.age} años` : '',
        },
        { label: 'Club', value: player.club },
        { label: 'Categoría', value: player.category },
        { label: 'Ubicación', value: player.location },
        {
          label: 'Representado desde',
          value: formatCrmDate(player.representedAt),
        },
      ].filter((item) => item.value)
    : [];

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
        <Text style={styles.headerTitle}>Ficha</Text>
        <View style={styles.headerSide} />
      </View>

      <KeyboardAvoidingView
        style={styles.panel}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {!canUseCrm ? (
            <View style={styles.lockCard}>
              <View style={[styles.lockIcon, { backgroundColor: brand.soft }]}>
                <FontAwesome5 name="lock" size={18} color={brand.header} />
              </View>
              <Text style={styles.lockTitle}>Función exclusiva de Premium</Text>
              <Text style={styles.lockCopy}>
                La ficha CRM está disponible para representantes Premium.
              </Text>
              <Pressable
                style={[styles.button, { backgroundColor: brand.header }]}
                onPress={() => navigation.push('Premium')}
              >
                <Text style={styles.buttonText}>Conocé Premium</Text>
              </Pressable>
            </View>
          ) : !loaded ? (
            <Text style={styles.emptyText}>Cargando ficha...</Text>
          ) : !player ? (
            <View style={styles.lockCard}>
              <View style={[styles.lockIcon, { backgroundColor: brand.soft }]}>
                <FontAwesome5 name="user" size={18} color={brand.header} />
              </View>
              <Text style={styles.lockTitle}>Jugador no encontrado</Text>
              <Text style={styles.lockCopy}>
                Este jugador no está en tu plantel de representados.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.identity}>
                {player.photoUrl ? (
                  <Image source={{ uri: player.photoUrl }} style={styles.photo} />
                ) : (
                  <View style={styles.photo} />
                )}
                <Text style={styles.name}>{player.name}</Text>
                <Text style={styles.subtitle}>
                  {[player.position, player.club].filter(Boolean).join(' · ') ||
                    'Jugador representado'}
                </Text>
              </View>

              <View style={styles.factsCard}>
                {facts.map((fact) => (
                  <View key={fact.label} style={styles.factRow}>
                    <Text style={styles.factLabel}>{fact.label}</Text>
                    <Text style={styles.factValue}>{fact.value}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Estado</Text>
              <View style={styles.tags}>
                {CRM_TAGS.map((item) => {
                  const active = tag === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.tagChip,
                        active && { backgroundColor: brand.soft },
                      ]}
                      onPress={() => setTag(item.id)}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          active && { color: brand.header },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.sectionLabel}>Notas privadas</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Observaciones, llamadas, próximos pasos..."
                placeholderTextColor="#8A8A8A"
                style={styles.noteInput}
                multiline
                textAlignVertical="top"
              />
              <Pressable
                style={[
                  styles.button,
                  { backgroundColor: brand.header },
                  saving && { opacity: 0.6 },
                ]}
                disabled={saving}
                onPress={() => {
                  void saveNotes();
                }}
              >
                <Text style={styles.buttonText}>
                  {saving ? 'Guardando...' : 'Guardar ficha'}
                </Text>
              </Pressable>

              <View style={styles.actions}>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => {
                    void openChat();
                  }}
                >
                  <FontAwesome5 name="comment" size={13} color={colors.homeHeader} />
                  <Text style={styles.secondaryButtonText}>Chat</Text>
                </Pressable>
                <Pressable
                  style={[styles.darkButton, { backgroundColor: brand.header }]}
                  onPress={() => navigation.push('Profile', { userId: player.id })}
                >
                  <FontAwesome5 name="user" size={13} color="#FFFFFF" />
                  <Text style={styles.darkButtonText}>Ver perfil</Text>
                </Pressable>
              </View>
              <Pressable
                style={styles.endButton}
                onPress={() => {
                  Alert.alert(
                    'Cortar representación',
                    'Vas a dejar de representar a este jugador. ¿Confirmás?',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Cortar',
                        style: 'destructive',
                        onPress: () => {
                          void endRepresentation(player.representationId).then(
                            (result) => {
                              if (!result.ok) {
                                Alert.alert(
                                  'No se pudo cortar la representación',
                                  result.message,
                                );
                                return;
                              }
                              navigation.goBack();
                            },
                          );
                        },
                      },
                    ],
                  );
                }}
              >
                <Text style={styles.endButtonText}>Cortar representación</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <PlayerTabBar activeTab="profile" />
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  lockCard: {
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
  emptyText: {
    marginTop: 24,
    color: '#8A8A8A',
    fontSize: 14,
    textAlign: 'center',
  },
  identity: {
    alignItems: 'center',
    marginBottom: 18,
  },
  photo: {
    width: 84,
    height: 84,
    borderRadius: 22,
    marginBottom: 12,
    backgroundColor: colors.inputBackground,
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    color: '#8A8A8A',
    fontSize: 13,
  },
  factsCard: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#F3F6F4',
    borderRadius: 18,
    marginBottom: 18,
  },
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  factLabel: {
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '700',
  },
  factValue: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  sectionLabel: {
    marginBottom: 8,
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '700',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  tagChip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F3F6F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: {
    color: '#4A4A4A',
    fontSize: 12,
    fontWeight: '700',
  },
  noteInput: {
    minHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#F3F6F4',
    borderRadius: 18,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    height: 48,
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
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E7F8DC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: colors.homeHeader,
    fontSize: 15,
    fontWeight: '700',
  },
  darkButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.homeHeader,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  darkButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  endButton: {
    height: 48,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endButtonText: {
    color: '#E53935',
    fontSize: 15,
    fontWeight: '700',
  },
});
