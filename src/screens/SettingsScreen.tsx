import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ComponentProps, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { PlayerTabBar } from '../components/PlayerTabBar';
import { usePlayerMessages } from '../context/PlayerMessagesContext';
import { usePlayerProfile } from '../context/PlayerProfileContext';
import { usePlayerTrials } from '../context/PlayerTrialsContext';
import { OWN_PROFILE_ID } from '../data/playerProfiles';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

type IconName = ComponentProps<typeof FontAwesome5>['name'];

const profileItems: {
  icon: IconName;
  title: string;
  subtitle: string;
  accent?: boolean;
  route: 'EditProfile' | 'Highlights' | 'Premium';
}[] = [
  {
    icon: 'user-edit',
    title: 'Editar perfil',
    subtitle: 'Modificá tu información personal',
    route: 'EditProfile',
  },
  {
    icon: 'video',
    title: 'Mis highlights',
    subtitle: 'Mostrá tus mejores jugadas',
    route: 'Highlights',
  },
  {
    icon: 'crown',
    title: 'Hacerse Premium',
    subtitle: 'Accedé a más funciones',
    accent: true,
    route: 'Premium',
  },
];

const generalItems: {
  icon: IconName;
  title: string;
  subtitle: string;
}[] = [
  {
    icon: 'lock',
    title: 'Cambiar contraseña',
    subtitle: 'Actualizá tu contraseña',
  },
  {
    icon: 'globe',
    title: 'Idioma',
    subtitle: 'Español',
  },
];

export function SettingsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const [darkMode, setDarkMode] = useState(false);
  const { resetSession, role } = usePlayerProfile();
  const { resetSession: resetTrials } = usePlayerTrials();
  const { resetSession: resetMessages } = usePlayerMessages();

  function logout() {
    resetSession();
    resetTrials();
    resetMessages();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
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
        <Pressable
          style={styles.headerSide}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
              return;
            }
            navigation.navigate('Profile', { userId: OWN_PROFILE_ID });
          }}
        >
          <FontAwesome5 name="arrow-left" size={16} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.panel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          <Text style={styles.sectionLabel}>Perfil</Text>
          {profileItems
            .filter((item) => role === 'player' || item.route !== 'Highlights')
            .map((item) => (
            <Pressable
              key={item.title}
              style={styles.row}
              onPress={() => {
                if (item.route === 'EditProfile') {
                  navigation.navigate('EditProfile');
                  return;
                }
                navigation.push(item.route);
              }}
            >
              <View
                style={[styles.iconWrap, item.accent && styles.iconWrapAccent]}
              >
                <FontAwesome5
                  name={item.icon}
                  solid
                  size={14}
                  color={item.accent ? colors.homeAccent : colors.homeHeader}
                />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
              </View>
              <FontAwesome5 name="chevron-right" size={12} color="#B0B0B0" />
            </Pressable>
          ))}

          <Text style={styles.sectionLabel}>General</Text>
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <FontAwesome5 name="moon" solid size={14} color={colors.homeHeader} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Modo oscuro</Text>
              <Text style={styles.rowSubtitle}>Apariencia de la app</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#E8E8E8', true: colors.homeAccent }}
              thumbColor="#FFFFFF"
            />
          </View>
          {generalItems.map((item) => (
            <View key={item.title} style={styles.row}>
              <View style={styles.iconWrap}>
                <FontAwesome5
                  name={item.icon}
                  solid
                  size={14}
                  color={colors.homeHeader}
                />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
              </View>
              <FontAwesome5 name="chevron-right" size={12} color="#B0B0B0" />
            </View>
          ))}

          <Pressable
            style={styles.logoutRow}
            onPress={() => navigation.push('DeleteAccount')}
          >
            <View style={styles.iconWrap}>
              <FontAwesome5 name="trash-alt" size={14} color="#E53935" />
            </View>
            <Text style={styles.logoutText}>Eliminar cuenta</Text>
          </Pressable>
          <Pressable style={styles.logoutRow} onPress={logout}>
            <View style={styles.iconWrap}>
              <FontAwesome5 name="sign-out-alt" size={14} color="#E53935" />
            </View>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </Pressable>
        </ScrollView>
      </View>

      <PlayerTabBar activeTab="profile" />
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
  sectionLabel: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '700',
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
  iconWrapAccent: {
    backgroundColor: '#E7F8DC',
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
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginTop: 4,
    gap: 12,
  },
  logoutText: {
    color: '#E53935',
    fontSize: 15,
    fontWeight: '700',
  },
});
