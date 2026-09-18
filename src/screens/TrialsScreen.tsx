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
import { usePlayerTrials } from '../context/PlayerTrialsContext';
import { playerTrials } from '../data/playerTrials';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

type TrialsTab = 'all' | 'pending';

export function TrialsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { appliedTrialIds, hasApplied } = usePlayerTrials();
  const [tab, setTab] = useState<TrialsTab>('all');

  const visibleTrials =
    tab === 'all'
      ? playerTrials
      : playerTrials.filter((trial) => appliedTrialIds.includes(trial.id));

  return (
    <View style={styles.root}>
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
            style={[styles.tab, tab === 'all' && styles.tabActive]}
            onPress={() => setTab('all')}
          >
            <Text style={[styles.tabLabel, tab === 'all' && styles.tabLabelActive]}>
              Todos
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'pending' && styles.tabActive]}
            onPress={() => setTab('pending')}
          >
            <Text
              style={[styles.tabLabel, tab === 'pending' && styles.tabLabelActive]}
            >
              Pendientes
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.searchBox}>
          <FontAwesome5 name="search" size={14} color="#8A8A8A" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar pruebas..."
            placeholderTextColor="#8A8A8A"
          />
          <FontAwesome5 name="sliders-h" size={14} color="#8A8A8A" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {visibleTrials.length === 0 ? (
            <Text style={styles.emptyText}>
              Todavía no te postulaste a ninguna prueba.
            </Text>
          ) : (
            visibleTrials.map((trial) => {
              const applied = hasApplied(trial.id);
              return (
                <Pressable
                  key={trial.id}
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate('TrialDetail', { trialId: trial.id })
                  }
                >
                  <Image source={trial.crest} style={styles.crest} />
                  <View style={styles.cardBody}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardTitle}>{trial.name}</Text>
                      {applied && tab === 'pending' ? (
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
                        color={colors.homeHeader}
                      />
                      <Text style={styles.metaText}>{trial.date}</Text>
                      <Text style={styles.metaDot}>·</Text>
                      <FontAwesome5
                        name="user-friends"
                        size={11}
                        color={colors.homeHeader}
                      />
                      <Text style={styles.metaText}>{trial.ageRange}</Text>
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
                      {applied && tab === 'pending' ? null : (
                        <Text style={styles.seeMore}>Ver más</Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
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
});
