import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import {
  Dimensions,
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
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

const { width: windowWidth } = Dimensions.get('window');
const horizontalPadding = 20;
const cardWidth = Math.min(118, (windowWidth - horizontalPadding * 2 - 24) / 3.15);

const mockImages = {
  juan: require('../../assets/mock/juan.png'),
  banner: require('../../assets/mock/banner.png'),
};

const agents = [
  {
    name: 'Marco Gómez',
    agency: 'Elite Sports',
    rating: '4.8',
    photo: require('../../assets/mock/agent-marco.png'),
  },
  {
    name: 'Teo Pérez',
    agency: 'NextGen Agency',
    rating: '4.7',
    photo: require('../../assets/mock/agent-teo.png'),
  },
  {
    name: 'John Kennedy',
    agency: 'Global Sports',
    rating: '4.6',
    photo: require('../../assets/mock/agent-john.png'),
  },
  {
    name: 'Lucas Moretti',
    agency: 'ProTalent',
    rating: '4.5',
    photo: require('../../assets/mock/agent-lucas.png'),
  },
];

const players = [
  {
    name: 'Mateo Ruiz',
    meta: 'Delantero · 2006',
    photo: require('../../assets/mock/player-mateo.png'),
  },
  {
    name: 'Santiago López',
    meta: 'Mediocampista · 2005',
    photo: require('../../assets/mock/player-santiago.png'),
  },
  {
    name: 'Valentín Díaz',
    meta: 'Defensor · 2006',
    photo: require('../../assets/mock/player-valentin.png'),
  },
  {
    name: 'Tobías Fernández',
    meta: 'Arquero · 2007',
    photo: require('../../assets/mock/player-tobias.png'),
  },
];

const quickAccess = [
  {
    icon: 'futbol',
    title: 'Pruebas',
    subtitle: 'Nuevas oportunidades',
  },
  {
    icon: 'share-alt',
    title: 'Solicitudes de conexión',
    subtitle: 'Personas que quieren conectarse',
    badge: 2,
  },
  {
    icon: 'users',
    title: 'Mis conexiones',
    subtitle: 'Tu red en RepresentApp',
  },
  {
    icon: 'comment-dots',
    title: 'Solicitudes de mensajes',
    subtitle: 'Nuevos mensajes pendientes',
    badge: 1,
  },
] as const;

export function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.header,
            Platform.OS === 'ios'
              ? { paddingTop: 58 }
              : { paddingTop: (RNStatusBar.currentHeight ?? 0) + 8 },
          ]}
        >
          <View style={styles.brandRow}>
            <View>
              <Text style={styles.brand}>
                Represent<Text style={styles.brandAccent}>App</Text>
              </Text>
              <Text style={styles.tagline}>CONECTA TALENTO</Text>
            </View>
            <View style={styles.brandActions}>
              <View style={styles.bellWrap}>
                <FontAwesome5 name="bell" size={18} color="#FFFFFF" />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>3</Text>
                </View>
              </View>
              <Image source={mockImages.juan} style={styles.headerAvatar} />
            </View>
          </View>

          <View style={styles.searchBox}>
            <FontAwesome5 name="search" size={14} color="#8A8A8A" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar jugadores, representantes, clubes..."
              placeholderTextColor="#8A8A8A"
            />
          </View>

          <View style={styles.welcomeRow}>
            <View style={styles.welcomeUser}>
              <Image source={mockImages.juan} style={styles.welcomeAvatar} />
              <View style={styles.welcomeTextWrap}>
                <Text style={styles.welcomeTitle}>Bienvenido Juan</Text>
                <Text style={styles.welcomeSubtitle}>
                  Seguí construyendo tu futuro
                </Text>
              </View>
            </View>
            <View style={styles.profileCard}>
              <FontAwesome5 name="chart-line" size={14} color={colors.homeAccent} />
              <View style={styles.profileCardText}>
                <Text style={styles.profileCardTitle}>Tu perfil</Text>
                <Text style={styles.profileCardMeta}>85% completo</Text>
              </View>
              <FontAwesome5 name="chevron-right" size={12} color="#FFFFFF" />
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accesos rápidos</Text>
            <Text style={styles.seeAll}>Ver todos  ›</Text>
          </View>

          <View style={styles.quickRow}>
            {quickAccess.map((item) => {
              const inner = (
                <>
                  <View style={styles.quickIconWrap}>
                    <View style={styles.quickIcon}>
                      <FontAwesome5
                        name={item.icon}
                        size={18}
                        color={colors.homeAccent}
                      />
                    </View>
                    {'badge' in item && item.badge ? (
                      <View style={styles.quickBadge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.quickTitle}>{item.title}</Text>
                  <Text style={styles.quickSubtitle}>{item.subtitle}</Text>
                </>
              );

              if (item.title === 'Pruebas') {
                return (
                  <Pressable
                    key={item.title}
                    style={styles.quickItem}
                    onPress={() => navigation.navigate('Trials')}
                  >
                    {inner}
                  </Pressable>
                );
              }

              return (
                <View key={item.title} style={styles.quickItem}>
                  {inner}
                </View>
              );
            })}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Representantes mejor calificados</Text>
            <Text style={styles.seeAll}>Ver todos  ›</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
          >
            {agents.map((agent) => (
              <View key={agent.name} style={styles.personCard}>
                <View>
                  <Image source={agent.photo} style={styles.personPhoto} />
                  <View style={styles.photoUserBadge}>
                    <FontAwesome5 name="user" size={9} color="#4A4A4A" />
                  </View>
                </View>
                <Text style={styles.personName} numberOfLines={1}>
                  {agent.name}
                </Text>
                <Text style={styles.personMeta} numberOfLines={1}>
                  {agent.agency}
                </Text>
                <View style={styles.ratingRow}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <FontAwesome5
                      key={index}
                      name="star"
                      solid
                      size={9}
                      color={colors.homeStar}
                    />
                  ))}
                  <Text style={styles.ratingText}>{agent.rating}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Encontrá futbolistas</Text>
            <Text style={styles.seeAll}>Ver todos  ›</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
          >
            {players.map((player) => (
              <View key={player.name} style={styles.personCard}>
                <View>
                  <Image source={player.photo} style={styles.personPhoto} />
                  <View style={styles.plusBadge}>
                    <FontAwesome5 name="plus" size={11} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={styles.personName} numberOfLines={1}>
                  {player.name}
                </Text>
                <Text style={styles.personMeta} numberOfLines={1}>
                  {player.meta}
                </Text>
                <Text style={styles.country}>🇦🇷  Argentina</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.banner}>
            <Image source={mockImages.banner} style={styles.bannerImage} />
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerContent}>
              <View style={styles.bannerCopy}>
                <Text style={styles.bannerTitle}>
                  Las oportunidades también se entrenan
                </Text>
                <Text style={styles.bannerSubtitle}>
                  Conectá. Crecé. Llegá más lejos.
                </Text>
              </View>
              <View style={styles.bannerButton}>
                <Text style={styles.bannerButtonText}>Explorar pruebas  ›</Text>
              </View>
            </View>
          </View>
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
  scrollContent: {
    paddingBottom: 18,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.homeHeader,
    paddingHorizontal: horizontalPadding,
    paddingBottom: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  brandAccent: {
    color: colors.homeAccent,
  },
  tagline: {
    marginTop: 2,
    color: colors.homeMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2.4,
  },
  brandActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.homeBadge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.homeHeaderAlt,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  welcomeUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  welcomeAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.homeHeaderAlt,
  },
  welcomeTextWrap: {
    flex: 1,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  welcomeSubtitle: {
    marginTop: 2,
    color: colors.homeMuted,
    fontSize: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.homeHeaderAlt,
    borderRadius: 16,
  },
  profileCardText: {
    marginRight: 2,
  },
  profileCardTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  profileCardMeta: {
    color: colors.homeMuted,
    fontSize: 10,
  },
  body: {
    backgroundColor: colors.background,
    paddingHorizontal: horizontalPadding,
    paddingTop: 22,
    paddingBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    flex: 1,
    marginRight: 8,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  seeAll: {
    color: '#8A8A8A',
    fontSize: 13,
    fontWeight: '600',
  },
  quickRow: {
    flexDirection: 'row',
    marginBottom: 26,
    gap: 8,
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickIconWrap: {
    marginBottom: 8,
  },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.homeBadge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  quickSubtitle: {
    marginTop: 2,
    color: '#8A8A8A',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
  cardsRow: {
    paddingRight: 8,
    marginBottom: 24,
    gap: 12,
  },
  personCard: {
    width: cardWidth,
  },
  personPhoto: {
    width: cardWidth,
    height: cardWidth,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: colors.inputBackground,
  },
  photoUserBadge: {
    position: 'absolute',
    right: 6,
    bottom: 14,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBadge: {
    position: 'absolute',
    right: 6,
    bottom: 14,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  personMeta: {
    marginTop: 2,
    color: '#8A8A8A',
    fontSize: 11,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  ratingText: {
    marginLeft: 4,
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  country: {
    marginTop: 4,
    color: '#4A4A4A',
    fontSize: 11,
  },
  banner: {
    height: 132,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 8,
    justifyContent: 'center',
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(7, 54, 44, 0.72)',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    gap: 12,
  },
  bannerCopy: {
    flex: 1,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  bannerSubtitle: {
    marginTop: 6,
    color: colors.homeMuted,
    fontSize: 12,
  },
  bannerButton: {
    backgroundColor: colors.homeAccent,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bannerButtonText: {
    color: colors.homeHeader,
    fontSize: 12,
    fontWeight: '800',
  },
});
