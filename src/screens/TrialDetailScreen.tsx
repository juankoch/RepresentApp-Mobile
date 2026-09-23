import { FontAwesome5 } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import {
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
import { usePlayerTrials } from '../context/PlayerTrialsContext';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

export function TrialDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'TrialDetail'>>();
  const { applyToTrial, hasApplied, getTrial } = usePlayerTrials();
  const { role, getProfile } = usePlayerProfile();
  const brand = useBrandColors();
  const trial = getTrial(route.params.trialId);
  const isAgent = role === 'agent';

  if (!trial) {
    return (
      <View style={[styles.root, { backgroundColor: brand.header }]}>
        <StatusBar style="light" />
        <View style={styles.missing}>
          <Text style={styles.missingText}>No encontramos esta prueba.</Text>
          <Pressable onPress={() => navigation.navigate('Trials')}>
            <Text style={styles.seeMore}>Volver a Pruebas</Text>
          </Pressable>
        </View>
        <PlayerTabBar />
      </View>
    );
  }

  const applied = hasApplied(trial.id);

  return (
    <View style={[styles.root, { backgroundColor: brand.header }]}>
      <StatusBar style="light" />

      <View
        style={[
          styles.topBar,
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
        {trial.hero ? (
          <Image source={trial.hero} style={styles.hero} />
        ) : (
          <View style={styles.hero} />
        )}

        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            {trial.crest ? (
              <Image source={trial.crest} style={styles.crest} />
            ) : (
              <View style={styles.crest} />
            )}
            <View style={styles.titleCopy}>
              <Text style={styles.trialName}>{trial.name}</Text>
              <Text style={styles.clubName}>{trial.club}</Text>
              <View style={styles.locationRow}>
                <FontAwesome5 name="map-marker-alt" size={11} color="#8A8A8A" />
                <Text style={styles.locationText}>{trial.location}</Text>
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
              <Text style={styles.infoText}>{trial.date}</Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome5
                name="user-friends"
                size={14}
                color={brand.header}
              />
              <Text style={styles.infoText}>{trial.ageRange}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <FontAwesome5 name="clipboard" size={14} color={brand.header} />
            <Text style={styles.infoText}>{trial.evaluationType}</Text>
          </View>

          <Text style={styles.sectionTitle}>Sobre la prueba</Text>
          <Text style={styles.description}>{trial.description}</Text>

          {isAgent ? (
            <View>
              <View
                style={[
                  styles.appliedButton,
                  {
                    backgroundColor: trial.status === 'finished' ? '#9BB8AE' : brand.header,
                  },
                ]}
              >
                <Text style={styles.appliedButtonText}>
                  {trial.status === 'finished' ? 'Prueba finalizada' : 'Prueba activa'}
                </Text>
              </View>
              <Text style={styles.sectionTitle}>Postulantes</Text>
              <Text style={styles.description}>
                {trial.applicants ?? 0} jugadores se postularon a esta prueba.
              </Text>
              {(trial.applicantIds ?? []).map((userId) => {
                const applicant = getProfile(userId);
                if (!applicant) {
                  return null;
                }
                return (
                  <Pressable
                    key={userId}
                    style={styles.applicantRow}
                    onPress={() =>
                      navigation.push('Profile', { userId: applicant.id })
                    }
                  >
                    <Image source={applicant.photo} style={styles.applicantPhoto} />
                    <View style={styles.applicantCopy}>
                      <Text style={styles.applicantName}>{applicant.name}</Text>
                      <Text style={styles.applicantMeta}>{applicant.location}</Text>
                    </View>
                    <FontAwesome5 name="chevron-right" size={12} color="#B0B0B0" />
                  </Pressable>
                );
              })}
            </View>
          ) : applied ? (
            <View style={styles.appliedBlock}>
              <View style={styles.appliedButton}>
                <FontAwesome5 name="check" size={14} color="#FFFFFF" />
                <Text style={styles.appliedButtonText}>Postulación enviada</Text>
              </View>
              <Text style={styles.reviewText}>
                Tu postulación está en revisión.
              </Text>
            </View>
          ) : (
            <Pressable
              style={[styles.applyButton, { backgroundColor: brand.header }]}
              onPress={() => applyToTrial(trial.id)}
            >
              <Text style={styles.applyButtonText}>Postularse</Text>
            </Pressable>
          )}
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
