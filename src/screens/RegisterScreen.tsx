import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
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

import { supabase } from '../lib/supabase';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

const { width: windowWidth } = Dimensions.get('window');

function formatBirthDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

export function RegisterScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [today] = useState(() => new Date());
  const panelRadius = Math.min(86, windowWidth * 0.22);
  const horizontalPadding = Math.max(28, windowWidth * 0.085);

  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    setBirthDate(selectedDate);
  }

  async function handleRegister() {
    if (password !== confirmPassword) {
      Alert.alert(
        'Las contraseñas no coinciden. Verificá que ambas sean iguales.',
      );
      return;
    }

    const firstName = name.trim();
    const lastNameValue = lastName.trim();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastNameValue,
          full_name: `${firstName} ${lastNameValue}`.trim(),
          birth_date: birthDate ? formatBirthDate(birthDate) : '',
        },
      },
    });

    if (error) {
      Alert.alert('Error al registrarse', error.message);
      return;
    }

    if (!data.session) {
      Alert.alert(
        'Confirmá tu email',
        'Te enviamos un correo para confirmar tu cuenta. Después de confirmarlo, iniciá sesión.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ],
      );
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
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={styles.subtitle}>Ya tenes una cuenta? Inicia sesion</Text>
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>NOMBRE</Text>
              <TextInput
                style={styles.input}
                placeholder="Juan Gonzales"
                placeholderTextColor={colors.inputText}
                autoCapitalize="words"
                autoCorrect={false}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>APELLIDO</Text>
              <TextInput
                style={styles.input}
                placeholder="Gonzales"
                placeholderTextColor={colors.inputText}
                autoCapitalize="words"
                autoCorrect={false}
                value={lastName}
                onChangeText={setLastName}
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

            <View style={styles.field}>
              <Text style={styles.label}>FECHA DE NACIMIENTO</Text>
              <Pressable
                style={[styles.input, styles.dateField]}
                onPress={() => setShowDatePicker((visible) => !visible)}
              >
                <Text style={styles.dateText}>
                  {birthDate ? formatBirthDate(birthDate) : 'Selecciona'}
                </Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={birthDate ?? today}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={today}
                  onChange={handleDateChange}
                />
              )}
            </View>

            <Pressable
              style={styles.button}
              onPress={() => {
                void handleRegister();
              }}
            >
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
  dateField: {
    justifyContent: 'center',
  },
  dateText: {
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
