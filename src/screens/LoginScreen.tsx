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

import { RaLogo } from '../components/RaLogo';
import { supabase } from '../lib/supabase';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

const { width: windowWidth } = Dimensions.get('window');

export function LoginScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const logoSize = Math.min(92, Math.max(72, windowWidth * 0.22));
  const panelRadius = Math.min(86, windowWidth * 0.22);
  const horizontalPadding = Math.max(28, windowWidth * 0.085);

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      Alert.alert("Error", "El email o la contraseña son incorrectos.");
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      Alert.alert(
        'No pudimos verificar tu perfil',
        userError?.message ?? 'No hay un usuario autenticado.',
      );
      return;
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id_usuario')
      .eq('id_usuario', userData.user.id)
      .maybeSingle();

    if (usuarioError) {
      Alert.alert('No pudimos verificar tu perfil', usuarioError.message);
      return;
    }

    if (usuario) {
      navigation.navigate('Home');
      return;
    }

    navigation.navigate('CreateProfile');
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
          <RaLogo size={logoSize} />
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
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: horizontalPadding },
            ]}
          >
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Login</Text>
              <Text style={styles.subtitle}>Inicia Sesion</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="Jiaramartins@gmail.com"
                placeholderTextColor={colors.inputText}
                autoCapitalize="words"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>CONTRASEÑA</Text>
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

            <Pressable
              style={styles.button}
              onPress={() => {
                void handleLogin();
              }}
            >
              <Text style={styles.buttonText}>Ingresa</Text>
            </Pressable>

            <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.link}>Olvidaste tu contraseña?</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={styles.register}>Registrate!</Text>
            </Pressable>

            <View style={styles.socialSpacer} />

            <View style={styles.socialRow}>
              <Pressable
                style={[styles.socialCircle, styles.instagramCircle]}
                onPress={() => navigation.navigate('CreateProfile')}
              >
                <FontAwesome5 name="instagram" size={20} color="#FFFFFF" brand />
              </Pressable>
              <Pressable
                style={[styles.socialCircle, styles.googleCircle]}
                onPress={() => navigation.navigate('CreateProfile')}
              >
                <FontAwesome5 name="google" size={18} color="#DB4437" brand />
              </Pressable>
              <Pressable
                style={[styles.socialCircle, styles.facebookCircle]}
                onPress={() => navigation.navigate('CreateProfile')}
              >
                <FontAwesome5 name="facebook" size={20} color="#FFFFFF" brand />
              </Pressable>
            </View>
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
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 36,
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
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 14,
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
  buttonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '700',
  },
  link: {
    marginTop: 18,
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
  },
  register: {
    marginTop: 10,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  socialSpacer: {
    flexGrow: 1,
    minHeight: 28,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    paddingBottom: 8,
  },
  socialCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instagramCircle: {
    backgroundColor: '#E1306C',
  },
  googleCircle: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  facebookCircle: {
    backgroundColor: '#1877F2',
  },
});
