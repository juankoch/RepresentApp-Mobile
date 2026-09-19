import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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
import { usePlayerMessages } from '../context/PlayerMessagesContext';
import { usePlayerProfile } from '../context/PlayerProfileContext';
import { usePlayerTrials } from '../context/PlayerTrialsContext';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

export function DeleteAccountScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const { resetSession } = usePlayerProfile();
  const { resetSession: resetTrials } = usePlayerTrials();
  const { resetSession: resetMessages } = usePlayerMessages();
  const [deleted, setDeleted] = useState(false);

  function confirmDelete() {
    resetSession();
    resetTrials();
    resetMessages();
    setDeleted(true);
  }

  function goToLogin() {
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
            if (deleted) {
              goToLogin();
              return;
            }
            navigation.goBack();
          }}
        >
          <FontAwesome5 name="arrow-left" size={16} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Eliminar cuenta</Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.panel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {deleted ? (
            <>
              <View style={styles.iconCircle}>
                <FontAwesome5 name="check" size={22} color={colors.homeHeader} />
              </View>
              <Text style={styles.title}>Tu cuenta ha sido eliminada</Text>
              <Text style={styles.copy}>
                En el prototipo no se borra ninguna base de datos. Los estados
                mock volvieron a su valor inicial.
              </Text>
              <Pressable style={styles.button} onPress={goToLogin}>
                <Text style={styles.buttonText}>Volver al login</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={[styles.iconCircle, styles.iconCircleDanger]}>
                <FontAwesome5 name="trash-alt" size={22} color="#E53935" />
              </View>
              <Text style={styles.title}>¿Estás seguro?</Text>
              <Text style={styles.copy}>
                Esta acción no se puede deshacer. Se eliminarán tu perfil, tus
                conexiones y tu actividad en RepresentApp.
              </Text>
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  El perfil dejará de ser visible. Perderás tus conexiones. No
                  podrás recuperar tu cuenta.
                </Text>
              </View>
              <Pressable style={styles.dangerButton} onPress={confirmDelete}>
                <Text style={styles.buttonText}>Eliminar cuenta</Text>
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>

      {deleted ? null : <PlayerTabBar activeTab="profile" />}
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
    paddingTop: 28,
    paddingBottom: 28,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 18,
    backgroundColor: '#E7F8DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleDanger: {
    backgroundColor: '#FDECEA',
  },
  title: {
    color: colors.text,
    fontSize: 22,
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
  warningBox: {
    width: '100%',
    marginTop: 18,
    marginBottom: 22,
    padding: 14,
    backgroundColor: '#FDECEA',
    borderRadius: 16,
  },
  warningText: {
    color: '#E53935',
    fontSize: 13,
    lineHeight: 19,
  },
  button: {
    width: '100%',
    height: 52,
    marginTop: 22,
    borderRadius: 26,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
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
