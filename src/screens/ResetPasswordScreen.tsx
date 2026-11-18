import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

const { width: windowWidth } = Dimensions.get('window');

export function ResetPasswordScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const panelRadius = Math.min(86, windowWidth * 0.22);
  const horizontalPadding = Math.max(28, windowWidth * 0.085);

  useEffect(() => {
    let cancelled = false;

    void supabase.auth.getUser().then(({ data, error }) => {
      if (cancelled) {
        return;
      }
      if (error || !data.user) {
        Alert.alert(
          'El enlace expiró',
          'Pedí un correo nuevo para recuperar la contraseña.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [navigation]);

  async function save() {
    if (saving) {
      return;
    }

    const next = password.trim();
    const confirm = confirmPassword.trim();
    if (!next || !confirm) {
      Alert.alert('Datos incompletos', 'Completá los dos campos.');
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

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) {
        Alert.alert('No se pudo guardar', error.message);
        return;
      }

      await supabase.auth.signOut();
      Alert.alert('Listo', 'Ya podés iniciar sesión con la nueva contraseña.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <SafeAreaView
        style={[
          styles.headerSafeArea,
          Platform.OS === 'android' && {
            paddingTop: RNStatusBar.currentHeight ?? 0,
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <View style={styles.backIcon}>
              <FontAwesome5 name="arrow-left" size={20} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.panel,
            {
              borderTopLeftRadius: panelRadius,
              borderTopRightRadius: 0,
            },
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: horizontalPadding },
            ]}
          >
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Nueva contraseña</Text>
              <Text style={styles.copy}>
                Elegí una contraseña nueva para tu cuenta.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>NUEVA CONTRASEÑA</Text>
              <TextInput
                style={styles.input}
                placeholder="•••••••"
                placeholderTextColor={colors.inputText}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>CONFIRMAR CONTRASEÑA</Text>
              <TextInput
                style={styles.input}
                placeholder="•••••••"
                placeholderTextColor={colors.inputText}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <Pressable
              style={[styles.button, saving && styles.buttonDisabled]}
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
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.header,
  },
  headerSafeArea: {
    backgroundColor: colors.header,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  backIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  panel: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 28,
    paddingBottom: 28,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  copy: {
    marginTop: 12,
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    marginLeft: 4,
    color: colors.label,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  input: {
    height: 52,
    paddingHorizontal: 20,
    backgroundColor: colors.inputBackground,
    borderRadius: 18,
    color: colors.inputText,
    fontSize: 16,
  },
  button: {
    height: 54,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.button,
    borderRadius: 27,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '700',
  },
});
