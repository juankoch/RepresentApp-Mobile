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
import { usePlayerProfile } from '../context/PlayerProfileContext';

const { width: windowWidth } = Dimensions.get('window');

type ProfileRole = 'player' | 'agent' | null;

export function CreateProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { startSession } = usePlayerProfile();
  const [role, setRole] = useState<ProfileRole>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [position, setPosition] = useState('');
  const [club, setClub] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const horizontalPadding = Math.max(28, windowWidth * 0.085);

  function createProfile() {
    if (!role) {
      return;
    }

    if (role === 'agent') {
      startSession('agent', {
        name: name.trim(),
        about: description.trim(),
      });
    } else {
      startSession('player', {
        name: name.trim(),
        fields: [
          {
            icon: 'futbol',
            label: 'Posición',
            value: position.trim() || 'Delantero',
          },
          {
            icon: 'calendar-alt',
            label: 'Edad',
            value: age.trim()
              ? age.trim().includes('año')
                ? age.trim()
                : `${age.trim()} años`
              : '21 años',
          },
          { icon: 'arrows-alt-v', label: 'Altura', value: '1,83 m' },
          { icon: 'walking', label: 'Pierna hábil', value: 'Derecha' },
          {
            icon: 'shield-alt',
            label: 'Club actual',
            value: club.trim() || 'Racing Club',
          },
          {
            icon: 'user-tie',
            label: 'Representante',
            value: 'Sin representante',
          },
        ],
      });
    }

    navigation.navigate('Home');
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <SafeAreaView
        style={[
          styles.safeArea,
          Platform.OS === 'android' && {
            paddingTop: RNStatusBar.currentHeight ?? 0,
          },
        ]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
            <View style={styles.header}>
              <View style={styles.menuIcon}>
                <FontAwesome5 name="bars" size={20} color={colors.text} />
              </View>
            </View>

            <Text style={styles.title}>Crea tu perfil</Text>

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
              <Text style={styles.label}>EDAD</Text>
              <TextInput
                style={styles.input}
                placeholder="17"
                placeholderTextColor={colors.inputText}
                keyboardType="number-pad"
                value={age}
                onChangeText={setAge}
              />
            </View>

            {role === 'agent' ? (
              <View style={styles.field}>
                <Text style={styles.label}>DESCRIPCIÓN</Text>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Contanos tu experiencia..."
                  placeholderTextColor={colors.inputText}
                  multiline
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            ) : (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>POSICIÓN</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Delantero"
                    placeholderTextColor={colors.inputText}
                    autoCapitalize="sentences"
                    autoCorrect={false}
                    value={position}
                    onChangeText={setPosition}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>CLUB ACTUAL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Racing"
                    placeholderTextColor={colors.inputText}
                    autoCapitalize="words"
                    autoCorrect={false}
                    value={club}
                    onChangeText={setClub}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>CATEGORÍA</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Sub 20"
                    placeholderTextColor={colors.inputText}
                    autoCapitalize="sentences"
                    autoCorrect={false}
                    value={category}
                    onChangeText={setCategory}
                  />
                </View>
              </>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>ROL</Text>
              <View style={styles.roleRow}>
                <Pressable
                  style={[
                    styles.roleButton,
                    role === 'player' && styles.rolePlayerSelected,
                  ]}
                  onPress={() => setRole('player')}
                >
                  <Text style={styles.roleText}>Jugador</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.roleButton,
                    role === 'agent' && styles.roleAgentSelected,
                  ]}
                  onPress={() => setRole('agent')}
                >
                  <Text style={styles.roleText}>Representante</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[styles.button, !role && styles.buttonDisabled]}
              onPress={createProfile}
            >
              <Text style={styles.buttonText}>Crear</Text>
            </Pressable>
            {role ? null : (
              <Text style={styles.roleHint}>
                Seleccioná si sos Jugador o Representante para continuar.
              </Text>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  menuIcon: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    marginBottom: 28,
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  field: {
    marginBottom: 18,
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
  descriptionInput: {
    minHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.descriptionBorder,
    borderRadius: 12,
    color: colors.inputText,
    fontSize: 14,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.roleIdle,
    borderRadius: 20,
  },
  rolePlayerSelected: {
    backgroundColor: colors.rolePlayer,
  },
  roleAgentSelected: {
    backgroundColor: colors.roleAgent,
  },
  roleText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
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
    opacity: 0.4,
  },
  buttonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '700',
  },
  roleHint: {
    marginTop: 12,
    color: colors.inputText,
    fontSize: 13,
    textAlign: 'center',
  },
});
