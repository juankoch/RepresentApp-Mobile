import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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

import {
  AUTH_RESET_REDIRECT,
  emailSendErrorMessage,
} from '../lib/authLinks';
import { supabase } from '../lib/supabase';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

const { width: windowWidth } = Dimensions.get('window');

export function ForgotPasswordScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const panelRadius = Math.min(86, windowWidth * 0.22);
  const horizontalPadding = Math.max(28, windowWidth * 0.085);

  async function sendLink() {
    if (sending) {
      return;
    }

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Alert.alert('Email requerido', 'Ingresá tu email para recuperar la contraseña.');
      return;
    }
    if (!trimmedEmail.includes('@')) {
      Alert.alert('Email inválido', 'Revisá el email e intentá de nuevo.');
      return;
    }

    setSending(true);
    try {
      let { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: AUTH_RESET_REDIRECT,
      });

      if (error) {
        console.log('[auth] reset with redirect failed', {
          message: error.message,
          status: error.status,
          code: error.code,
        });
        const retry = await supabase.auth.resetPasswordForEmail(trimmedEmail);
        error = retry.error;
      }

      if (error) {
        console.log('[auth] resetPasswordForEmail', {
          message: error.message,
          status: error.status,
          code: error.code,
        });
        Alert.alert('Error de recuperación', emailSendErrorMessage(error));
        return;
      }

      setSent(true);
    } finally {
      setSending(false);
    }
  }

  async function saveWithCode() {
    if (saving) {
      return;
    }

    const token = code.trim();
    const next = password.trim();
    const confirm = confirmPassword.trim();
    if (!token || !next || !confirm) {
      Alert.alert('Datos incompletos', 'Completá el código y las dos contraseñas.');
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
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: 'recovery',
      });
      if (otpError) {
        Alert.alert(
          'Código inválido',
          'Revisá el código del mail. Si expiró, pedí uno nuevo.',
        );
        return;
      }

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
          <Pressable
            onPress={() => {
              if (sent) {
                navigation.navigate('Login');
                return;
              }
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }
              navigation.navigate('Login');
            }}
          >
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
            {sent ? (
              <>
                <View style={styles.titleBlock}>
                  <Text style={styles.title}>Código del mail</Text>
                  <Text style={styles.copy}>
                    Te mandamos un código a {email.trim()}. No toques el
                    enlace: copiá el código y cargalo acá.
                  </Text>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>CÓDIGO</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123456"
                    placeholderTextColor={colors.inputText}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={code}
                    onChangeText={setCode}
                  />
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
                    void saveWithCode();
                  }}
                >
                  <Text style={styles.buttonText}>
                    {saving ? 'Guardando...' : 'Guardar contraseña'}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.titleBlock}>
                  <Text style={styles.title}>Recuperar contraseña</Text>
                  <Text style={styles.copy}>
                    Ingresá el email con el que te registraste y te mandamos un
                    código para elegir una contraseña nueva.
                  </Text>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>EMAIL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="tu@email.com"
                    placeholderTextColor={colors.inputText}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <Pressable
                  style={[styles.button, sending && styles.buttonDisabled]}
                  disabled={sending}
                  onPress={() => {
                    void sendLink();
                  }}
                >
                  <Text style={styles.buttonText}>
                    {sending ? 'Enviando...' : 'Enviar código'}
                  </Text>
                </Pressable>
              </>
            )}
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
  note: {
    marginTop: 10,
    color: colors.inputText,
    fontSize: 12,
    textAlign: 'center',
  },
  iconCircle: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 18,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
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
