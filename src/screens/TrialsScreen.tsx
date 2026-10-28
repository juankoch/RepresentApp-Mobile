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
  TextInput,
  View,
} from 'react-native';

import { PlayerTabBar } from '../components/PlayerTabBar';
import { usePlayerProfile } from '../context/PlayerProfileContext';
import {
  attachPublisherProfiles,
  createOportunidad,
  fetchMisOportunidades,
  fetchMisPostulaciones,
  fetchOportunidadesByIds,
  fetchPostulacionCounts,
  fetchPublishedOportunidades,
  formatFechaEvento,
  formatOportunidadEstado,
  formatOportunidadTipo,
  formatPostulacionEstado,
  Oportunidad,
  OportunidadTipo,
  OPORTUNIDAD_TIPOS,
  parseFechaEvento,
  Postulacion,
} from '../lib/oportunidades';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';
import { matchesSearch } from '../utils/search';

type TrialsTab = 'all' | 'pending' | 'publish' | 'mine';
const categories = ['Sub 15', 'Sub 17', 'Sub 20', 'Libre'];
const tipoOptions: { value: OportunidadTipo; label: string }[] = OPORTUNIDAD_TIPOS.map(
  (value) => ({
    value,
    label: formatOportunidadTipo(value),
  }),
);

type TrialListItem = {
  oportunidad: Oportunidad;
  representativeName: string;
  representativePhotoUrl?: string;
  applicantCount: number;
  applied: boolean;
  postulacionEstado: string;
};

function buildRequisitos(
  category: string,
  quantity: string,
  dateText: string,
  parsedDate: string | null,
) {
  const parts: string[] = [];
  if (category.trim()) {
    parts.push(`Categoría: ${category.trim()}`);
  }
  if (quantity.trim()) {
    parts.push(`Cantidad de jugadores: ${quantity.trim()}`);
  }
  if (!parsedDate && dateText.trim()) {
    parts.push(`Fecha: ${dateText.trim()}`);
  }
  return parts.join('\n');
}

export function TrialsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'Trials'>>();
  const { role } = usePlayerProfile();
  const brand = useBrandColors();
  const isAgent = role === 'agent';
  const [tab, setTab] = useState<TrialsTab>(
    route.params?.initialTab ?? (isAgent ? 'publish' : 'all'),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trialType, setTrialType] = useState<OportunidadTipo>('prueba');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('Sub 20');
  const [publishedNotice, setPublishedNotice] = useState('');
  const [formError, setFormError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [publishedItems, setPublishedItems] = useState<TrialListItem[]>([]);
  const [mineItems, setMineItems] = useState<TrialListItem[]>([]);
  const [pendingItems, setPendingItems] = useState<TrialListItem[]>([]);

  const loadLists = useCallback(async () => {
    setLoading(true);
    setListError('');

    if (isAgent) {
      const mine = await fetchMisOportunidades();
      if (!mine.ok) {
        setMineItems([]);
        setListError(mine.message);
        setLoading(false);
        return;
      }

      const mineIds = mine.data.map((row) => row.id_oportunidad);
      console.log('[oportunidades] mis oportunidades count:', mine.data.length);
      console.log('[oportunidades] mis oportunidades ids:', mineIds);
      const counts = await fetchPostulacionCounts(mineIds);
      const withPublishers = await attachPublisherProfiles(mine.data);
      setMineItems(
        withPublishers.map((item) => ({
          ...item,
          applicantCount: counts.ok
            ? counts.data.get(item.oportunidad.id_oportunidad) ?? 0
            : 0,
          applied: false,
          postulacionEstado: '',
        })),
      );
      if (!counts.ok) {
        setListError(`fetchPostulacionCounts: ${counts.message}`);
      }
      setLoading(false);
      return;
    }

    const [published, applications] = await Promise.all([
      fetchPublishedOportunidades(),
      fetchMisPostulaciones(),
    ]);

    if (!published.ok) {
      setPublishedItems([]);
      setPendingItems([]);
      setListError(published.message);
      setLoading(false);
      return;
    }
    if (!applications.ok) {
      const publishedWithPeople = await attachPublisherProfiles(published.data);
      setPublishedItems(
        publishedWithPeople.map((item) => ({
          ...item,
          applicantCount: 0,
          applied: false,
          postulacionEstado: '',
        })),
      );
      setPendingItems([]);
      setListError(`fetchMisPostulaciones: ${applications.message}`);
      setLoading(false);
      return;
    }

    const applicationByOpportunity = new Map<number, Postulacion>();
    for (const row of applications.data) {
      if (!applicationByOpportunity.has(row.fk_oportunidad)) {
        applicationByOpportunity.set(row.fk_oportunidad, row);
      }
    }

    const publishedWithPeople = await attachPublisherProfiles(published.data);
    const publishedCards = publishedWithPeople.map((item) => {
      const application = applicationByOpportunity.get(
        item.oportunidad.id_oportunidad,
      );
      return {
        ...item,
        applicantCount: 0,
        applied: Boolean(application),
        postulacionEstado: application
          ? formatPostulacionEstado(application.estado)
          : '',
      };
    });
    setPublishedItems(publishedCards);

    const missingIds = applications.data
      .map((row) => row.fk_oportunidad)
      .filter(
        (id) =>
          !published.data.some((oportunidad) => oportunidad.id_oportunidad === id),
      );
    const extra = await fetchOportunidadesByIds(missingIds);
    if (!extra.ok) {
      setPendingItems(
        publishedCards.filter((item) => item.applied),
      );
      setListError(extra.message);
      setLoading(false);
      return;
    }

    const extraWithPeople = await attachPublisherProfiles(extra.data);
    const pendingCards = [...publishedWithPeople, ...extraWithPeople]
      .filter((item) => applicationByOpportunity.has(item.oportunidad.id_oportunidad))
      .map((item) => {
        const application = applicationByOpportunity.get(
          item.oportunidad.id_oportunidad,
        );
        return {
          ...item,
          applicantCount: 0,
          applied: true,
          postulacionEstado: application
            ? formatPostulacionEstado(application.estado)
            : 'Pendiente',
        };
      })
      .sort((a, b) => {
        const left = a.oportunidad.fecha_publicacion || '';
        const right = b.oportunidad.fecha_publicacion || '';
        return right.localeCompare(left);
      });
    setPendingItems(pendingCards);
    setLoading(false);
  }, [isAgent]);

  useFocusEffect(
    useCallback(() => {
      const nextTab = route.params?.initialTab;
      if (nextTab) {
        setTab(nextTab);
        navigation.setParams({ initialTab: undefined });
      }
      void loadLists();
    }, [loadLists, navigation, route.params?.initialTab]),
  );

  const sourceItems = isAgent
    ? mineItems
    : tab === 'pending'
      ? pendingItems
      : publishedItems;

  const visibleTrials = sourceItems.filter((item) => {
    if (isAgent) {
      return true;
    }
    const matchesQuery =
      matchesSearch(item.oportunidad.titulo, searchQuery) ||
      matchesSearch(item.representativeName, searchQuery) ||
      matchesSearch(formatOportunidadTipo(item.oportunidad.tipo), searchQuery) ||
      matchesSearch(item.oportunidad.tipo, searchQuery) ||
      matchesSearch(item.oportunidad.ubicacion, searchQuery);
    return matchesQuery;
  });

  const emptyMessage = searchQuery.trim()
    ? 'No encontramos pruebas para esa búsqueda.'
    : tab === 'pending'
      ? 'Todavía no te postulaste a ninguna prueba.'
      : isAgent
        ? 'Todavía no publicaste pruebas.'
        : 'No hay pruebas disponibles.';

  async function handlePublish() {
    const nextTitle = title.trim();
    if (!nextTitle) {
      setFormError('El título es obligatorio.');
      Alert.alert('No se pudo publicar', 'El título es obligatorio.');
      return;
    }

    const parsedDate = parseFechaEvento(date);
    setPublishing(true);
    setFormError('');
    setPublishedNotice('');

    try {
      const result = await createOportunidad({
        tipo: trialType,
        titulo: nextTitle,
        descripcion: description.trim(),
        fecha_evento: parsedDate,
        ubicacion: location.trim(),
        requisitos: buildRequisitos(category, quantity, date, parsedDate),
      });

      if (!result.ok) {
        setFormError(result.message);
        Alert.alert('No se pudo publicar', result.message);
        return;
      }

      setTitle('');
      setDescription('');
      setTrialType('prueba');
      setDate('');
      setLocation('');
      setQuantity('');
      setCategory('Sub 20');
      setPublishedNotice('Prueba publicada correctamente.');
      setTab('mine');
      Alert.alert('Prueba publicada', 'La oportunidad ya está disponible.');
      await loadLists();
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'No se pudo publicar la oportunidad.';
      setFormError(message);
      Alert.alert('No se pudo publicar', message);
    } finally {
      setPublishing(false);
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
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.navigate('Home')}
          >
            <FontAwesome5 name="arrow-left" size={16} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Pruebas</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.tabs}>
          <Pressable
            style={[
              styles.tab,
              (isAgent ? tab === 'publish' : tab === 'all') && [
                styles.tabActive,
                { backgroundColor: brand.soft },
              ],
            ]}
            onPress={() => setTab(isAgent ? 'publish' : 'all')}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: brand.muted },
                (isAgent ? tab === 'publish' : tab === 'all') && {
                  color: brand.header,
                },
              ]}
            >
              {isAgent ? 'Publicar' : 'Todos'}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              (isAgent ? tab === 'mine' : tab === 'pending') && [
                styles.tabActive,
                { backgroundColor: brand.soft },
              ],
            ]}
            onPress={() => setTab(isAgent ? 'mine' : 'pending')}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: brand.muted },
                (isAgent ? tab === 'mine' : tab === 'pending') && {
                  color: brand.header,
                },
              ]}
            >
              {isAgent ? 'Mis pruebas' : 'Pendientes'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.panel}>
        {isAgent && tab === 'publish' ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.formLabel}>Título de la prueba</Text>
            <TextInput
              style={styles.formInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Prueba de jugadores Sub 20"
              placeholderTextColor="#8A8A8A"
            />
            <Text style={styles.formLabel}>Descripción</Text>
            <TextInput
              style={[styles.formInput, styles.formMultiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="Contá los detalles de la prueba..."
              placeholderTextColor="#8A8A8A"
              multiline
            />
            <Text style={styles.formLabel}>Tipo de prueba</Text>
            <View style={styles.categoryRow}>
              {tipoOptions.map((item) => (
                <Pressable
                  key={item.value}
                  style={[
                    styles.categoryChip,
                    item.value === trialType && { backgroundColor: brand.soft },
                  ]}
                  onPress={() => setTrialType(item.value)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      item.value === trialType && { color: brand.header },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.formLabel}>Fecha</Text>
            <TextInput
              style={styles.formInput}
              value={date}
              onChangeText={setDate}
              placeholder="15 de julio"
              placeholderTextColor="#8A8A8A"
            />
            <Text style={styles.formLabel}>Ubicación</Text>
            <TextInput
              style={styles.formInput}
              value={location}
              onChangeText={setLocation}
              placeholder="Buenos Aires"
              placeholderTextColor="#8A8A8A"
            />
            <Text style={styles.formLabel}>Cantidad de jugadores</Text>
            <TextInput
              style={styles.formInput}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Ej: 30"
              placeholderTextColor="#8A8A8A"
              keyboardType="number-pad"
            />
            <Text style={styles.formLabel}>Categoría</Text>
            <View style={styles.categoryRow}>
              {categories.map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.categoryChip,
                    item === category && { backgroundColor: brand.soft },
                  ]}
                  onPress={() => setCategory(item)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      item === category && { color: brand.header },
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={[
                styles.publishButton,
                { backgroundColor: brand.header, opacity: publishing ? 0.7 : 1 },
              ]}
              onPress={() => {
                if (!publishing) {
                  void handlePublish();
                }
              }}
            >
              <Text style={styles.publishButtonText}>
                {publishing ? 'Publicando...' : 'Publicar prueba'}
              </Text>
            </Pressable>
            {formError ? (
              <Text style={styles.errorText}>{formError}</Text>
            ) : null}
            {publishedNotice ? (
              <Text style={styles.publishNote}>{publishedNotice}</Text>
            ) : null}
          </ScrollView>
        ) : (
          <>
            {isAgent ? null : (
              <View style={styles.searchBox}>
                <FontAwesome5 name="search" size={14} color="#8A8A8A" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar pruebas..."
                  placeholderTextColor="#8A8A8A"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <FontAwesome5 name="sliders-h" size={14} color="#8A8A8A" />
              </View>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
            >
              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator color={brand.header} />
                  <Text style={styles.emptyText}>Cargando pruebas...</Text>
                </View>
              ) : (
                <>
                  {listError ? (
                    <Text style={styles.errorText}>{listError}</Text>
                  ) : null}
                  {visibleTrials.length === 0 ? (
                    listError ? null : (
                      <Text style={styles.emptyText}>{emptyMessage}</Text>
                    )
                  ) : (
                    visibleTrials.map((item) => {
                  const trial = item.oportunidad;
                  const statusLabel = isAgent
                    ? formatOportunidadEstado(trial.estado)
                    : item.applied
                      ? item.postulacionEstado || 'Pendiente'
                      : formatOportunidadEstado(trial.estado);
                  return (
                    <Pressable
                      key={String(trial.id_oportunidad)}
                      style={styles.card}
                      onPress={() =>
                        navigation.navigate('TrialDetail', {
                          trialId: String(trial.id_oportunidad),
                        })
                      }
                    >
                      {item.representativePhotoUrl ? (
                        <Image
                          source={{ uri: item.representativePhotoUrl }}
                          style={styles.crest}
                        />
                      ) : (
                        <View style={styles.crest} />
                      )}
                      <View style={styles.cardBody}>
                        <View style={styles.cardTitleRow}>
                          <Text style={styles.cardTitle}>{trial.titulo}</Text>
                          {isAgent || (item.applied && tab === 'pending') ? (
                            <View
                              style={[
                                styles.pendingBadge,
                                isAgent ? { backgroundColor: brand.soft } : null,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.pendingBadgeText,
                                  isAgent ? { color: brand.header } : null,
                                ]}
                              >
                                {statusLabel}
                              </Text>
                            </View>
                          ) : (
                            <FontAwesome5
                              name="chevron-right"
                              size={12}
                              color="#B0B0B0"
                            />
                          )}
                        </View>
                        <Text style={styles.publisherText}>
                          {item.representativeName}
                          {trial.tipo
                            ? ` · ${formatOportunidadTipo(trial.tipo)}`
                            : ''}
                        </Text>
                        <View style={styles.metaRow}>
                          <FontAwesome5
                            name="calendar-alt"
                            size={11}
                            color={brand.header}
                          />
                          <Text style={styles.metaText}>
                            {formatFechaEvento(trial.fecha_evento)}
                          </Text>
                          <Text style={styles.metaDot}>·</Text>
                          <FontAwesome5
                            name="user-friends"
                            size={11}
                            color={brand.header}
                          />
                          <Text style={styles.metaText}>
                            {isAgent
                              ? `${item.applicantCount} postulantes`
                              : trial.requisitos.split('\n')[0] ||
                                formatOportunidadEstado(trial.estado)}
                          </Text>
                        </View>
                        <View style={styles.cardFooter}>
                          <View style={styles.locationRow}>
                            <FontAwesome5
                              name="map-marker-alt"
                              size={11}
                              color="#8A8A8A"
                            />
                            <Text style={styles.locationText}>
                              {trial.ubicacion || 'A confirmar'}
                            </Text>
                          </View>
                          <Text style={[styles.seeMore, { color: brand.header }]}>
                            {isAgent ? 'Ver info' : 'Ver más'}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })
                  )}
                </>
              )}
            </ScrollView>
          </>
        )}
      </View>

      <PlayerTabBar />
    </View>
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 14,
    marginBottom: 14,
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
  list: {
    paddingBottom: 16,
    gap: 12,
  },
  loadingWrap: {
    marginTop: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    marginTop: 32,
    color: '#8A8A8A',
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 16,
    color: '#B42318',
    fontSize: 13,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    gap: 12,
  },
  crest: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.inputBackground,
  },
  cardBody: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  publisherText: {
    marginTop: 4,
    color: '#4A4A4A',
    fontSize: 12,
  },
  pendingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E7F8DC',
  },
  pendingBadgeText: {
    color: colors.homeHeader,
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  metaText: {
    color: '#4A4A4A',
    fontSize: 12,
  },
  metaDot: {
    color: '#B0B0B0',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  locationRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    flex: 1,
    color: '#8A8A8A',
    fontSize: 12,
  },
  seeMore: {
    color: colors.homeHeader,
    fontSize: 13,
    fontWeight: '700',
  },
  form: {
    paddingBottom: 24,
  },
  formLabel: {
    marginBottom: 6,
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '700',
  },
  formInput: {
    height: 46,
    marginBottom: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F3F3F3',
    color: colors.text,
    fontSize: 14,
  },
  formMultiline: {
    height: 110,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F3F3',
  },
  categoryText: {
    color: '#4A4A4A',
    fontSize: 12,
    fontWeight: '700',
  },
  publishButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  publishNote: {
    marginTop: 12,
    color: '#8A8A8A',
    fontSize: 12,
    textAlign: 'center',
  },
});
