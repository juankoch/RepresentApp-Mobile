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
import { getProfileRoleLabel } from '../data/playerProfiles';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

export function UserOptionsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const route = useRoute<RouteProp<AuthStackParamList, 'UserOptions'>>();
  const { getProfile, isBlocked, getRating, hasReported } = usePlayerProfile();
  const profile = getProfile(route.params.userId);
  const blocked = profile ? isBlocked(profile.id) : false;
  const rated = profile ? Boolean(getRating(profile.id)) : false;
  const reported = profile ? hasReported(profile.id) : false;
  const canRate = profile?.kind === 'player' || profile?.kind === 'agent';

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
        <Text style={styles.headerTitle}>Opciones</Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.panel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {profile ? (
            <View style={styles.identity}>
              <Image source={profile.photo} style={styles.avatar} />
              <View style={styles.identityBody}>
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.role}>
                  {getProfileRoleLabel(profile.kind)}
                </Text>
              </View>
            </View>
          ) : null}

          {canRate ? (
            <Pressable
              style={styles.row}
              onPress={() =>
                navigation.push('RateUser', { userId: route.params.userId })
              }
            >
              <View style={styles.iconWrap}>
                <FontAwesome5 name="star" solid size={14} color={colors.homeHeader} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>
                  {rated ? 'Ver calificación' : 'Calificar usuario'}
                </Text>
                <Text style={styles.rowSubtitle}>
                  {rated
                    ? 'Ya calificaste a este usuario'
                    : 'Dejá una puntuación de 1 a 5'}
                </Text>
              </View>
              <FontAwesome5 name="chevron-right" size={12} color="#B0B0B0" />
            </Pressable>
          ) : null}

          <Pressable
            style={styles.row}
            onPress={() =>
              navigation.push('ReportUser', { userId: route.params.userId })
            }
          >
            <View style={styles.iconWrap}>
              <FontAwesome5 name="flag" size={14} color={colors.homeHeader} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>
                {reported ? 'Cuenta reportada' : 'Reportar usuario'}
              </Text>
              <Text style={styles.rowSubtitle}>
                {reported
                  ? 'El reporte quedó guardado en esta sesión'
                  : 'Informá un perfil falso o contenido inadecuado'}
              </Text>
            </View>
            <FontAwesome5 name="chevron-right" size={12} color="#B0B0B0" />
          </Pressable>

          <Pressable
            style={styles.row}
            onPress={() =>
              navigation.push('BlockUser', { userId: route.params.userId })
            }
          >
            <View style={[styles.iconWrap, styles.iconWrapDanger]}>
              <FontAwesome5
                name={blocked ? 'unlock' : 'ban'}
                size={14}
                color="#E53935"
              />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, styles.dangerText]}>
                {blocked ? 'Desbloquear usuario' : 'Bloquear usuario'}
              </Text>
              <Text style={styles.rowSubtitle}>
                {blocked
                  ? 'Volvé a permitir la interacción con esta cuenta'
                  : 'Ocultá a esta persona de tu actividad'}
              </Text>
            </View>
            <FontAwesome5 name="chevron-right" size={12} color="#B0B0B0" />
          </Pressable>
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
  list: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.inputBackground,
  },
  identityBody: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  role: {
    marginTop: 2,
    color: '#8A8A8A',
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F6F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDanger: {
    backgroundColor: '#FDECEA',
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  rowSubtitle: {
    marginTop: 2,
    color: '#8A8A8A',
    fontSize: 12,
  },
  dangerText: {
    color: '#E53935',
  },
});
