import { FontAwesome5 } from '@expo/vector-icons';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import { usePlayerProfile } from '../context/PlayerProfileContext';
import { UserProfile } from '../data/playerProfiles';
import {
  attachApplicantProfiles,
  attachPublisherProfiles,
  createPostulacion,
  fetchMisPostulaciones,
  fetchOportunidadById,
  fetchPostulacionesForOportunidad,
  formatFechaEvento,
  formatFechaPublicacion,
  formatOportunidadEstado,
  formatOportunidadTipo,
  formatPostulacionEstado,
  Oportunidad,
  Postulacion,
  updatePostulacionEstado,
} from '../lib/oportunidades';
import { supabase } from '../lib/supabase';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

type ApplicantRow = {
  postulacion: Postulacion;
  profile: UserProfile | null;
};

export function TrialDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'TrialDetail'>>();
  const { role } = usePlayerProfile();
  const brand = useBrandColors();
  const isAgent = role === 'agent';
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [oportunidad, setOportunidad] = useState<Oportunidad | null>(null);
  const [representativeName, setRepresentativeName] = useState('Representante');
  const [representativePhotoUrl, setRepresentativePhotoUrl] = useState<
    string | undefined
  >(undefined);
  const [currentUserId, setCurrentUserId] = useState('');
  const [applied, setApplied] = useState(false);
  const [applyNotice, setApplyNotice] = useState('');
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [respondingId, setRespondingId] = useState<number | null>(null);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data: authData, error: authError } = await supabase.auth.getUser();
    const userId = authData.user?.id?.trim() || '';
    if (authError || !userId || userId === 'me') {
      setOportunidad(null);
      setError(authError?.message || 'No hay un usuario autenticado.');
      setLoading(false);
      return;
    }
    setCurrentUserId(userId);

    const result = await fetchOportunidadById(route.params.trialId);
    if (!result.ok) {
      setOportunidad(null);
      setError(result.message);
      setLoading(false);
      return;
    }
    if (!result.data) {
      setOportunidad(null);
      setLoading(false);
      return;
    }

    const next = result.data;
    setOportunidad(next);

    const [withPublisher] = await attachPublisherProfiles([next]);
    setRepresentativeName(withPublisher?.representativeName || 'Representante');
    setRepresentativePhotoUrl(withPublisher?.representativePhotoUrl);

    const isOwner = next.fk_representante === userId;
    if (isOwner) {
      const postulaciones = await fetchPostulacionesForOportunidad(
        next.id_oportunidad,
      );
      if (!postulaciones.ok) {
        setApplicants([]);
        setError(postulaciones.message);
        setLoading(false);
        return;
      }
      setApplicants(await attachApplicantProfiles(postulaciones.data));
      setLoading(false);
      return;
    }

    if (!isAgent) {
      const mine = await fetchMisPostulaciones();
      if (!mine.ok) {
        setError(mine.message);
        setLoading(false);
        return;
      }
      setApplied(
        mine.data.some((row) => row.fk_oportunidad === next.id_oportunidad),
      );
    }

    setLoading(false);
  }, [isAgent, route.params.trialId]);

  useFocusEffect(
    useCallback(() => {
      void loadDetail();
    }, [loadDetail]),
  );

  async function handleApply() {
    if (!oportunidad || applying || applied) {
      return;
    }

    setApplying(true);
    setApplyNotice('');
    const result = await createPostulacion(oportunidad.id_oportunidad);
    setApplying(false);

    if (!result.ok) {
      Alert.alert('No se pudo postular', result.message);
      return;
    }

    setApplied(true);
    if (result.data.alreadyApplied) {
      setApplyNotice('Ya estás postulado');
      Alert.alert('Ya estás postulado', 'Ya enviaste una postulación a esta prueba.');
      return;
    }

    setApplyNotice('Postulación realizada');
    Alert.alert('Postulación realizada', 'Tu postulación fue enviada.');
  }

  async function handleRespond(
    postulacionId: number,
    estado: 'aceptada' | 'rechazada',
  ) {
    if (respondingId != null) {
      return;
    }

    setRespondingId(postulacionId);
    const result = await updatePostulacionEstado(postulacionId, estado);
    setRespondingId(null);

    if (!result.ok) {
      Alert.alert(
        estado === 'aceptada'
          ? 'No se pudo aceptar'
          : 'No se pudo rechazar',
        result.message,
      );
      return;
    }

    setApplicants((current) =>
      current.map((item) =>
        item.postulacion.id_postulacion === postulacionId
          ? { ...item, postulacion: result.data }
          : item,
      ),
    );
  }

  function openProfile(userId: string) {
    const id = userId.trim();
    if (!id || id === 'me') {
      return;
    }
    navigation.push('Profile', { userId: id });
  }

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: brand.header }]}>
        <StatusBar style="light" />
        <View style={styles.missing}>
          <ActivityIndicator color={brand.header} />
          <Text style={styles.missingText}>Cargando prueba...</Text>
        </View>
        <PlayerTabBar />
      </View>
    );
  }

  if (!oportunidad) {
    return (
      <View style={[styles.root, { backgroundColor: brand.header }]}>
        <StatusBar style="light" />
        <View style={styles.missing}>
          <Text style={styles.missingText}>
            {error || 'No encontramos esta prueba.'}
          </Text>
          <Pressable onPress={() => navigation.navigate('Trials')}>
            <Text style={[styles.seeMore, { color: brand.header }]}>
              Volver a Pruebas
            </Text>
          </Pressable>
        </View>
        <PlayerTabBar />
      </View>
    );
  }

  const isOwner =
    isAgent &&
    Boolean(currentUserId) &&
    oportunidad.fk_representante === currentUserId;
  const publishedLabel = formatFechaPublicacion(oportunidad.fecha_publicacion);

  return (
    <View style={[styles.root, { backgroundColor: brand.header }]}>
      <StatusBar style="light" />

      <View
        style={[
          styles.topBar,
          { backgroundColor: brand.header },
          Platform.OS === 'ios'
            ? { paddingTop: 58 }
            : { paddingTop: (RNStatusBar.currentHeight ?? 0) + 8 },
        ]}
      >
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={16} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Pruebas</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.hero, { backgroundColor: brand.headerAlt }]} />

        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            {representativePhotoUrl ? (
              <Image
                source={{ uri: representativePhotoUrl }}
                style={styles.crest}
              />
            ) : (
              <View style={styles.crest} />
            )}
            <View style={styles.titleCopy}>
              <Text style={styles.trialName}>{oportunidad.titulo}</Text>
              <Pressable
                onPress={() => openProfile(oportunidad.fk_representante)}
              >
                <Text style={styles.clubName}>{representativeName}</Text>
              </Pressable>
              <View style={styles.locationRow}>
                <FontAwesome5 name="map-marker-alt" size={11} color="#8A8A8A" />
                <Text style={styles.locationText}>
                  {oportunidad.ubicacion || 'A confirmar'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <FontAwesome5
                name="calendar-alt"
                size={14}
                color={brand.header}
              />
              <Text style={styles.infoText}>
                {formatFechaEvento(oportunidad.fecha_evento)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome5
                name="clipboard"
                size={14}
                color={brand.header}
              />
              <Text style={styles.infoText}>
                {formatOportunidadTipo(oportunidad.tipo) || 'Prueba'}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <FontAwesome5 name="info-circle" size={14} color={brand.header} />
            <Text style={styles.infoText}>
              {formatOportunidadEstado(oportunidad.estado)}
              {publishedLabel ? ` · Publicada el ${publishedLabel}` : ''}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Sobre la prueba</Text>
          <Text style={styles.description}>
            {oportunidad.descripcion || 'Sin descripción.'}
          </Text>

          <Text style={styles.sectionTitle}>Requisitos</Text>
          <Text style={styles.description}>
            {oportunidad.requisitos || 'Sin requisitos.'}
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {isOwner ? (
            <View>
              <View
                style={[
                  styles.appliedButton,
                  {
                    backgroundColor:
                      formatOportunidadEstado(oportunidad.estado) === 'Finalizada'
                        ? '#9BB8AE'
                        : brand.header,
                  },
                ]}
              >
                <Text style={styles.appliedButtonText}>
                  {formatOportunidadEstado(oportunidad.estado) === 'Finalizada'
                    ? 'Prueba finalizada'
                    : 'Prueba activa'}
                </Text>
              </View>
              <Text style={styles.sectionTitle}>Postulantes</Text>
              {applicants.length === 0 ? (
                <Text style={styles.description}>
                  Todavía no hay postulantes.
                </Text>
              ) : (
                applicants.map((item) => {
                  const playerId = item.postulacion.fk_jugador;
                  const name = item.profile?.name || 'Jugador';
                  const isPending = item.postulacion.estado === 'pendiente';
                  const busy =
                    respondingId === item.postulacion.id_postulacion;
                  const meta = [
                    item.profile?.location,
                    item.profile?.fields?.[0]?.value,
                    formatPostulacionEstado(item.postulacion.estado),
                  ]
                    .filter(Boolean)
                    .join(' · ');
                  return (
                    <View
                      key={String(item.postulacion.id_postulacion || playerId)}
                      style={styles.applicantRow}
                    >
                      <Pressable
                        style={styles.applicantMain}
                        onPress={() => openProfile(playerId)}
                      >
                        {item.profile?.photoUrl ? (
                          <Image
                            source={{ uri: item.profile.photoUrl }}
                            style={styles.applicantPhoto}
                          />
                        ) : (
                          <View style={styles.applicantPhoto} />
                        )}
                        <View style={styles.applicantCopy}>
                          <Text style={styles.applicantName}>{name}</Text>
                          <Text style={styles.applicantMeta}>{meta}</Text>
                        </View>
                      </Pressable>
                      {isPending ? (
                        <View style={styles.applicantActions}>
                          <Pressable
                            style={[
                              styles.acceptButton,
                              busy ? { opacity: 0.6 } : null,
                            ]}
                            onPress={() => {
                              void handleRespond(
                                item.postulacion.id_postulacion,
                                'aceptada',
                              );
                            }}
                          >
                            <FontAwesome5 name="check" size={14} color="#FFFFFF" />
                          </Pressable>
                          <Pressable
                            style={[
                              styles.rejectButton,
                              busy ? { opacity: 0.6 } : null,
                            ]}
                            onPress={() => {
                              void handleRespond(
                                item.postulacion.id_postulacion,
                                'rechazada',
                              );
                            }}
                          >
                            <FontAwesome5 name="times" size={14} color="#FFFFFF" />
                          </Pressable>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.statusChip,
                            item.postulacion.estado === 'aceptada'
                              ? styles.statusAccepted
                              : styles.statusRejected,
                          ]}
                        >
                          <Text style={styles.statusChipText}>
                            {formatPostulacionEstado(item.postulacion.estado)}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          ) : !isAgent ? (
            applied ? (
              <View style={styles.appliedBlock}>
                <View style={styles.appliedButton}>
                  <FontAwesome5 name="check" size={14} color="#FFFFFF" />
                  <Text style={styles.appliedButtonText}>Ya estás postulado</Text>
                </View>
                <Text style={styles.reviewText}>
                  {applyNotice || 'Tu postulación está en revisión.'}
                </Text>
              </View>
            ) : (
              <Pressable
                style={[
                  styles.applyButton,
                  { backgroundColor: brand.header, opacity: applying ? 0.7 : 1 },
                ]}
                onPress={() => {
                  void handleApply();
                }}
              >
                <Text style={styles.applyButtonText}>
                  {applying ? 'Enviando...' : 'Postularme'}
                </Text>
              </Pressable>
            )
          ) : null}
        </View>
      </ScrollView>

      <PlayerTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.homeHeader,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
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
  scrollContent: {
    backgroundColor: colors.background,
    paddingBottom: 24,
  },
  hero: {
    width: '100%',
    height: 180,
    backgroundColor: colors.homeHeaderAlt,
  },
  sheet: {
    marginTop: -28,
    marginHorizontal: 16,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
  },
  titleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  crest: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.inputBackground,
  },
  titleCopy: {
    flex: 1,
  },
  trialName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  clubName: {
    marginTop: 2,
    color: '#4A4A4A',
    fontSize: 13,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  locationText: {
    color: '#8A8A8A',
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 10,
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  description: {
    color: '#4A4A4A',
    fontSize: 14,
    lineHeight: 21,
  },
  errorText: {
    marginTop: 12,
    color: '#B42318',
    fontSize: 13,
  },
  applyButton: {
    marginTop: 22,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  appliedBlock: {
    marginTop: 22,
    alignItems: 'center',
  },
  appliedButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#9BB8AE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  appliedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  reviewText: {
    marginTop: 10,
    color: '#8A8A8A',
    fontSize: 13,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  missingText: {
    marginTop: 12,
    marginBottom: 12,
    color: colors.text,
    fontSize: 16,
  },
  seeMore: {
    color: colors.homeHeader,
    fontSize: 14,
    fontWeight: '700',
  },
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    gap: 12,
  },
  applicantMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  applicantActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusAccepted: {
    backgroundColor: '#D7F4E3',
  },
  statusRejected: {
    backgroundColor: '#F8D7DA',
  },
  statusChipText: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '700',
  },
  applicantPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.inputBackground,
  },
  applicantCopy: {
    flex: 1,
  },
  applicantName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  applicantMeta: {
    marginTop: 2,
    color: '#8A8A8A',
    fontSize: 12,
  },
});
