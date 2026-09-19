import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
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

import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

const { width: windowWidth } = Dimensions.get('window');

export function ForgotPasswordScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const panelRadius = Math.min(86, windowWidth * 0.22);
  const horizontalPadding = Math.max(28, windowWidth * 0.085);

  function sendLink() {
    if (!email.trim()) {
      return;
    }
    setSent(true);
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
                <View style={styles.iconCircle}>
                  <FontAwesome5 name="envelope" size={22} color={colors.button} />
                </View>
                <View style={styles.titleBlock}>
                  <Text style={styles.title}>¡Listo!</Text>
                  <Text style={styles.copy}>
                    Te enviamos un enlace a {email.trim()} para que puedas
                    restablecer tu contraseña.
                  </Text>
                  <Text style={styles.note}>
                    En el prototipo no se envía ningún email real.
                  </Text>
                </View>
                <Pressable
                  style={styles.button}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.buttonText}>Volver al login</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.titleBlock}>
                  <Text style={styles.title}>Recuperar contraseña</Text>
                  <Text style={styles.copy}>
                    Ingresá el email con el que te registraste y te enviaremos un
                    enlace para restablecer tu contraseña.
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

                <Pressable style={styles.button} onPress={sendLink}>
                  <Text style={styles.buttonText}>Enviar enlace</Text>
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
  buttonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '700',
  },
});
