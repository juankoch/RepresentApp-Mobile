import { FontAwesome5 } from '@expo/vector-icons';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
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
  TextInput,
  View,
} from 'react-native';

import { PlayerTabBar } from '../components/PlayerTabBar';
import { usePlayerProfile } from '../context/PlayerProfileContext';
import { usePlayerTrials } from '../context/PlayerTrialsContext';
import { playerTrials } from '../data/playerTrials';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';
import { matchesSearch } from '../utils/search';

type TrialsTab = 'all' | 'pending' | 'publish' | 'mine';
const categories = ['Sub 15', 'Sub 17', 'Sub 20', 'Libre'];

export function TrialsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'Trials'>>();
  const { appliedTrialIds, hasApplied, publishedTrials, publishTrial } =
    usePlayerTrials();
  const { role } = usePlayerProfile();
  const brand = useBrandColors();
  const isAgent = role === 'agent';
  const [tab, setTab] = useState<TrialsTab>(
    route.params?.initialTab ?? (isAgent ? 'publish' : 'all'),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trialType, setTrialType] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('Sub 20');
  const [publishedNotice, setPublishedNotice] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const nextTab = route.params?.initialTab;
      if (!nextTab) {
        return;
      }

      setTab(nextTab);
      navigation.setParams({ initialTab: undefined });
    }, [navigation, route.params?.initialTab]),
  );

  const visibleTrials = playerTrials.filter((trial) => {
    const matchesTab =
      tab === 'all' || appliedTrialIds.includes(trial.id);
    const matchesQuery =
      matchesSearch(trial.name, searchQuery) ||
      matchesSearch(trial.club, searchQuery);

    return matchesTab && matchesQuery;
  });

  const emptyMessage = searchQuery.trim()
    ? 'No encontramos pruebas para esa búsqueda.'
    : tab === 'pending'
      ? 'Todavía no te postulaste a ninguna prueba.'
      : 'No hay pruebas disponibles.';

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
            <TextInput
              style={styles.formInput}
              value={trialType}
              onChangeText={setTrialType}
              placeholder="Evaluación presencial"
              placeholderTextColor="#8A8A8A"
            />
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
              style={[styles.publishButton, { backgroundColor: brand.header }]}
              onPress={() => {
                if (!title.trim()) {
                  return;
                }
                publishTrial({
                  name: title.trim(),
                  club: 'Agencia Fútbol Global',
                  date: date.trim() || 'A confirmar',
                  ageRange: category,
                  location: location.trim() || 'A confirmar',
                  evaluationType: trialType.trim() || 'Evaluación presencial',
                  description:
                    description.trim() ||
                    'Prueba publicada desde el prototipo del representante.',
                });
                setTitle('');
                setDescription('');
                setTrialType('');
                setDate('');
                setLocation('');
                setQuantity('');
                setPublishedNotice(true);
                setTab('mine');
              }}
            >
              <Text style={styles.publishButtonText}>Publicar prueba</Text>
            </Pressable>
            {publishedNotice ? (
              <Text style={styles.publishNote}>
                Publicación mock: la prueba aparece en Mis pruebas.
              </Text>
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
              {(isAgent ? publishedTrials : visibleTrials).length === 0 ? (
                <Text style={styles.emptyText}>
                  {isAgent
                    ? 'Todavía no publicaste pruebas.'
                    : emptyMessage}
                </Text>
              ) : (
                (isAgent ? publishedTrials : visibleTrials).map((trial) => {
                  const applied = hasApplied(trial.id);
                  const statusLabel =
                    trial.status === 'finished' ? 'Finalizada' : 'Activa';
                  return (
                    <Pressable
                      key={trial.id}
                      style={styles.card}
                      onPress={() =>
                        navigation.navigate('TrialDetail', { trialId: trial.id })
                      }
                    >
                      {trial.crest ? (
                        <Image source={trial.crest} style={styles.crest} />
                      ) : (
                        <View style={styles.crest} />
                      )}
                      <View style={styles.cardBody}>
                        <View style={styles.cardTitleRow}>
                          <Text style={styles.cardTitle}>{trial.name}</Text>
                          {isAgent ? (
                            <View
                              style={[
                                styles.pendingBadge,
                                { backgroundColor: brand.soft },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.pendingBadgeText,
                                  { color: brand.header },
                                ]}
                              >
                                {statusLabel}
                              </Text>
                            </View>
                          ) : applied && tab === 'pending' ? (
                            <View style={styles.pendingBadge}>
                              <Text style={styles.pendingBadgeText}>Pendiente</Text>
                            </View>
                          ) : (
                            <FontAwesome5
                              name="chevron-right"
                              size={12}
                              color="#B0B0B0"
                            />
                          )}
                        </View>
                        <View style={styles.metaRow}>
                          <FontAwesome5
                            name="calendar-alt"
                            size={11}
                            color={brand.header}
                          />
                          <Text style={styles.metaText}>{trial.date}</Text>
                          <Text style={styles.metaDot}>·</Text>
                          <FontAwesome5
                            name="user-friends"
                            size={11}
                            color={brand.header}
                          />
                          <Text style={styles.metaText}>
                            {isAgent
                              ? `${trial.applicants ?? 0} postulantes`
                              : trial.ageRange}
                          </Text>
                        </View>
                        <View style={styles.cardFooter}>
                          <View style={styles.locationRow}>
                            <FontAwesome5
                              name="map-marker-alt"
                              size={11}
                              color="#8A8A8A"
                            />
                            <Text style={styles.locationText}>{trial.location}</Text>
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
  emptyText: {
    marginTop: 32,
    color: '#8A8A8A',
    fontSize: 14,
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
