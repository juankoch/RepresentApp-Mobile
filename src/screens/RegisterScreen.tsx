import { FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
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

import { colors } from '../theme/colors';

const { width: windowWidth } = Dimensions.get('window');

export function RegisterScreen() {
  const panelRadius = Math.min(86, windowWidth * 0.22);
  const horizontalPadding = Math.max(28, windowWidth * 0.085);

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
          <View style={styles.backIcon}>
            <FontAwesome5 name="arrow-left" size={20} color="#FFFFFF" />
          </View>
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
              borderTopLeftRadius: 0,
              borderTopRightRadius: panelRadius,
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
              <Text style={styles.title}>Crea tu cuenta</Text>
              <Text style={styles.subtitle}>Ya tenes una cuenta? Inicia sesion</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>NOMBRE</Text>
              <TextInput
                style={styles.input}
                placeholder="Juan Gonzales"
                placeholderTextColor={colors.inputText}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="juangonzales@gmail.com"
                placeholderTextColor={colors.inputText}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
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
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>FECHA DE NACIMIENTO</Text>
              <TextInput
                style={styles.input}
                placeholder="Selecciona"
                placeholderTextColor={colors.inputText}
                editable={false}
              />
            </View>

            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Registrate</Text>
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
    paddingTop: 8,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  backIcon: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
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
  subtitle: {
    marginTop: 10,
    color: colors.text,
    fontSize: 14,
    textDecorationLine: 'underline',
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
