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
import { usePublicProfile } from '../hooks/usePublicProfile';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

export function BlockUserScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const route = useRoute<RouteProp<AuthStackParamList, 'BlockUser'>>();
  const { isBlocked, blockUser, unblockUser } = usePlayerProfile();
  const profile = usePublicProfile(route.params.userId);
  const blocked = profile ? isBlocked(profile.id) : false;

  function confirm() {
    if (!profile) {
      return;
    }
    if (blocked) {
      unblockUser(profile.id);
    } else {
      blockUser(profile.id);
    }
    navigation.navigate('Profile', { userId: profile.id });
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
        <Pressable style={styles.headerSide} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={16} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {blocked ? 'Desbloquear' : 'Bloquear'}
        </Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.panel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.card}>
            {profile ? (
              <>
                {profile.photoUrl ? (
                  <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar} />
                )}
                <Text style={styles.title}>
                  {blocked
                    ? `¿Desbloquear a ${profile.name}?`
                    : `¿Bloquear a ${profile.name}?`}
                </Text>
                <Text style={styles.copy}>
                  {blocked
                    ? 'Vas a volver a ver su perfil y podrás interactuar con esta cuenta.'
                    : 'No vas a poder enviarle solicitudes ni mensajes desde este prototipo. Podés desbloquearlo después.'}
                </Text>
              </>
            ) : (
              <Text style={styles.copy}>No encontramos este perfil.</Text>
            )}
          </View>

          <Pressable
            style={[styles.button, blocked ? styles.buttonDark : styles.buttonDanger]}
            onPress={confirm}
          >
            <Text style={styles.buttonText}>
              {blocked ? 'Desbloquear' : 'Bloquear'}
            </Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancelar</Text>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  card: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#F3F6F4',
    borderRadius: 22,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 14,
    backgroundColor: colors.inputBackground,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  copy: {
    marginTop: 10,
    color: '#4A4A4A',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  button: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDanger: {
    backgroundColor: '#E53935',
  },
  buttonDark: {
    backgroundColor: colors.homeHeader,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    height: 48,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.homeHeader,
    fontSize: 15,
    fontWeight: '700',
  },
});
