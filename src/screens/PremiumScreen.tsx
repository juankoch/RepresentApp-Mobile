import { FontAwesome5 } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import {
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
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

type IconName = ComponentProps<typeof FontAwesome5>['name'];

const benefits: {
  icon: IconName;
  title: string;
  subtitle: string;
}[] = [
  {
    icon: 'video',
    title: 'Highlights de video',
    subtitle: 'Subí tus mejores jugadas y destacá tu perfil.',
  },
  {
    icon: 'eye',
    title: 'Mayor visibilidad de tu perfil',
    subtitle: 'Aparecé primero en búsquedas y recomendaciones.',
  },
  {
    icon: 'filter',
    title: 'Filtros avanzados de búsqueda',
    subtitle: 'Encontrá clubes, representantes y pruebas más rápido.',
  },
  {
    icon: 'bolt',
    title: 'Soporte prioritario',
    subtitle: 'Atención preferencial cuando más lo necesités.',
  },
  {
    icon: 'chart-line',
    title: 'Estadísticas de tu perfil',
    subtitle: 'Mirá quién te visitó y cómo crece tu red.',
  },
];

export function PremiumScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const { isPremium, activatePremium } = usePlayerProfile();

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
        <Text style={styles.headerTitle}>Premium</Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.panel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={[styles.hero, { backgroundColor: brand.header }]}>
            <FontAwesome5 name="crown" solid size={22} color={brand.accent} />
            <Text style={styles.heroKicker}>RepresentApp Premium</Text>
            <Text style={styles.heroTitle}>Llevá tu carrera a otro nivel</Text>
            <Text style={styles.heroSubtitle}>
              Accedé a más oportunidades y conectate con el mercado.
            </Text>
          </View>

          {benefits.map((benefit) => (
            <View key={benefit.title} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <FontAwesome5
                  name={benefit.icon}
                  size={14}
                  color={colors.homeHeader}
                />
              </View>
              <View style={styles.benefitCopy}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitSubtitle}>{benefit.subtitle}</Text>
              </View>
            </View>
          ))}

          <View style={styles.planCard}>
            <Text style={styles.planLabel}>Plan mensual</Text>
            <Text style={styles.planPrice}>$ 4.999</Text>
            <Text style={styles.planNote}>Precio mock · 12 meses gratis de ejemplo</Text>
          </View>

          {isPremium ? (
            <>
              <View style={[styles.cta, styles.ctaDone]}>
                <FontAwesome5 name="check" size={14} color={colors.homeHeader} />
                <Text style={styles.ctaDoneText}>Premium activado</Text>
              </View>
              <Pressable
                style={styles.secondaryCta}
                onPress={() => navigation.push('Highlights')}
              >
                <FontAwesome5 name="video" size={14} color="#FFFFFF" />
                <Text style={styles.ctaText}>Ver mis highlights</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={[styles.cta, { backgroundColor: brand.header }]} onPress={activatePremium}>
              <Text style={styles.ctaText}>Activar Premium</Text>
            </Pressable>
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
  hero: {
    padding: 18,
    marginBottom: 18,
    backgroundColor: colors.homeHeader,
    borderRadius: 22,
  },
  heroKicker: {
    marginTop: 10,
    color: colors.homeAccent,
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  heroSubtitle: {
    marginTop: 8,
    color: colors.homeMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  benefitRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E7F8DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitCopy: {
    flex: 1,
  },
  benefitTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  benefitSubtitle: {
    marginTop: 2,
    color: '#8A8A8A',
    fontSize: 12,
    lineHeight: 17,
  },
  planCard: {
    marginTop: 8,
    marginBottom: 18,
    padding: 16,
    backgroundColor: '#F3F6F4',
    borderRadius: 18,
  },
  planLabel: {
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '700',
  },
  planPrice: {
    marginTop: 4,
    color: colors.homeHeader,
    fontSize: 28,
    fontWeight: '800',
  },
  planNote: {
    marginTop: 4,
    color: '#8A8A8A',
    fontSize: 12,
  },
  cta: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  ctaDone: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#E7F8DC',
  },
  ctaDoneText: {
    color: colors.homeHeader,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryCta: {
    height: 52,
    marginTop: 10,
    borderRadius: 26,
    backgroundColor: colors.homeHeader,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
