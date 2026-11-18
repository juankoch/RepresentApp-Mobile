import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
import { supabase } from '../lib/supabase';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

export function ChangePasswordScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) {
      return;
    }

    const current = currentPassword.trim();
    const next = nextPassword.trim();
    const confirm = confirmPassword.trim();

    if (!current || !next || !confirm) {
      Alert.alert('Datos incompletos', 'Completá los tres campos.');
      return;
    }
    if (next.length < 6) {
      Alert.alert(
        'Contraseña corta',
        'La nueva contraseña tiene que tener al menos 6 caracteres.',
      );
      return;
    }
    if (next !== confirm) {
      Alert.alert(
        'No coinciden',
        'La nueva contraseña y la confirmación no son iguales.',
      );
      return;
    }
    if (next === current) {
      Alert.alert(
        'Misma contraseña',
        'Elegí una contraseña distinta a la actual.',
      );
      return;
    }

    setSaving(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const email = userData.user?.email?.trim() ?? '';
      if (userError || !email) {
        Alert.alert(
          'No se pudo cambiar',
          'No hay un usuario autenticado. Volvé a iniciar sesión.',
        );
        return;
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (verifyError) {
        Alert.alert(
          'Contraseña actual incorrecta',
          'Revisá la contraseña actual e intentá de nuevo.',
        );
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: next,
      });
      if (updateError) {
        Alert.alert('No se pudo cambiar', updateError.message);
        return;
      }

      setCurrentPassword('');
      setNextPassword('');
      setConfirmPassword('');
      Alert.alert('Listo', 'Tu contraseña se actualizó.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setSaving(false);
    }
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
        <Text style={styles.headerTitle}>Cambiar contraseña</Text>
        <View style={styles.headerSide} />
      </View>

      <KeyboardAvoidingView
        style={styles.panel}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Contraseña actual</Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Tu contraseña de ahora"
            placeholderTextColor="#8A8A8A"
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={styles.label}>Nueva contraseña</Text>
          <TextInput
            value={nextPassword}
            onChangeText={setNextPassword}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#8A8A8A"
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={styles.label}>Confirmar nueva</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repetí la nueva contraseña"
            placeholderTextColor="#8A8A8A"
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
          />

          <Pressable
            style={[
              styles.button,
              { backgroundColor: brand.header },
              saving && { opacity: 0.6 },
            ]}
            disabled={saving}
            onPress={() => {
              void save();
            }}
          >
            <Text style={styles.buttonText}>
              {saving ? 'Guardando...' : 'Guardar contraseña'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

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
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  label: {
    marginBottom: 8,
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    height: 48,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F3F6F4',
    borderRadius: 16,
    color: colors.text,
    fontSize: 15,
  },
  button: {
    height: 52,
    marginTop: 8,
    borderRadius: 26,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
