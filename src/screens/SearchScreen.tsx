import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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
import {
  initialRecentSearches,
  playerSearchResults,
} from '../data/playerSearch';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';
import { matchesSearch } from '../utils/search';

export function SearchScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const { role } = usePlayerProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(initialRecentSearches);

  const visibleResults = playerSearchResults.filter(
    (result) =>
      matchesSearch(result.name, searchQuery) ||
      matchesSearch(result.subtitle, searchQuery),
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
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backButton}
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
          <Text style={styles.headerTitle}>Buscar</Text>
          <View style={styles.backButton} />
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.searchBox}>
          <FontAwesome5 name="search" size={14} color="#8A8A8A" />
          <TextInput
            style={styles.searchInput}
            placeholder={
              role === 'agent'
                ? 'Buscar jugadores, clubes o representantes...'
                : 'Buscar jugadores, representantes o clubes...'
            }
            placeholderTextColor="#8A8A8A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        >
          {recentSearches.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Búsquedas recientes</Text>
                <Pressable onPress={() => setRecentSearches([])}>
                  <Text style={styles.clearAll}>Borrar todo</Text>
                </Pressable>
              </View>
              {recentSearches.map((recent) => (
                <Pressable
                  key={recent}
                  style={styles.recentRow}
                  onPress={() => setSearchQuery(recent)}
                >
                  <FontAwesome5 name="clock" size={13} color="#8A8A8A" />
                  <Text style={styles.recentText} numberOfLines={1}>
                    {recent}
                  </Text>
                  <Pressable
                    style={styles.removeRecent}
                    hitSlop={8}
                    onPress={() =>
                      setRecentSearches((current) =>
                        current.filter((item) => item !== recent),
                      )
                    }
                  >
                    <FontAwesome5 name="times" size={13} color="#8A8A8A" />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.resultsTitle]}>
              Resultados
            </Text>
            {visibleResults.length === 0 ? (
              <Text style={styles.emptyText}>
                No encontramos resultados para esa búsqueda.
              </Text>
            ) : (
              visibleResults.map((result) => (
                <Pressable
                  key={result.id}
                  style={styles.resultRow}
                  onPress={() =>
                    navigation.push('Profile', { userId: result.id })
                  }
                >
                  <Image source={result.photo} style={styles.avatar} />
                  <View style={styles.resultBody}>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {result.name}
                    </Text>
                    <View style={styles.kindBadge}>
                      <Text style={styles.kindBadgeText}>
                        {result.kind === 'player'
                          ? 'Jugador'
                          : result.kind === 'club'
                            ? 'Club'
                            : 'Representante'}
                      </Text>
                    </View>
                    <Text style={styles.resultSubtitle} numberOfLines={1}>
                      {result.subtitle}
                    </Text>
                  </View>
                  <FontAwesome5 name="chevron-right" size={12} color="#B0B0B0" />
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      <PlayerTabBar activeTab="search" />
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
  panel: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    marginHorizontal: 16,
    marginBottom: 8,
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
  list: {
    paddingBottom: 20,
  },
  section: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  resultsTitle: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  clearAll: {
    color: colors.homeHeader,
    fontSize: 13,
    fontWeight: '700',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  recentText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  removeRecent: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.inputBackground,
  },
  resultBody: {
    flex: 1,
  },
  resultName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  kindBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E7F8DC',
  },
  kindBadgeText: {
    color: colors.homeHeader,
    fontSize: 11,
    fontWeight: '700',
  },
  resultSubtitle: {
    marginTop: 4,
    color: '#8A8A8A',
    fontSize: 12,
  },
  emptyText: {
    marginTop: 24,
    marginHorizontal: 16,
    color: '#8A8A8A',
    fontSize: 14,
    textAlign: 'center',
  },
});
