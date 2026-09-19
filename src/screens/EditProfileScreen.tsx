import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Image,
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
import { usePlayerProfile } from '../context/PlayerProfileContext';
import { OWN_PROFILE_ID } from '../data/playerProfiles';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

function fieldValue(
  fields: { label: string; value: string }[],
  label: string,
) {
  return fields.find((field) => field.label === label)?.value ?? '';
}

export function EditProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const { currentProfile, updateProfile } = usePlayerProfile();
  const isAgent = currentProfile.kind === 'agent';
  const [name, setName] = useState(currentProfile.name);
  const [email, setEmail] = useState(currentProfile.email ?? '');
  const [location, setLocation] = useState(currentProfile.location);
  const [birthDate, setBirthDate] = useState(currentProfile.birthDate ?? '');
  const [position, setPosition] = useState(
    fieldValue(currentProfile.fields, 'Posición'),
  );
  const [age, setAge] = useState(fieldValue(currentProfile.fields, 'Edad'));
  const [height, setHeight] = useState(fieldValue(currentProfile.fields, 'Altura'));
  const [foot, setFoot] = useState(fieldValue(currentProfile.fields, 'Pierna hábil'));
  const [club, setClub] = useState(fieldValue(currentProfile.fields, 'Club actual'));
  const [agent, setAgent] = useState(
    fieldValue(currentProfile.fields, 'Representante'),
  );
  const [agency, setAgency] = useState(fieldValue(currentProfile.fields, 'Agencia'));
  const [experience, setExperience] = useState(
    fieldValue(currentProfile.fields, 'Experiencia'),
  );
  const [specialty, setSpecialty] = useState(
    fieldValue(currentProfile.fields, 'Especialidad'),
  );
  const [zone, setZone] = useState(fieldValue(currentProfile.fields, 'Zona'));
  const [represented, setRepresented] = useState(
    fieldValue(currentProfile.fields, 'Representados'),
  );
  const [focus, setFocus] = useState(fieldValue(currentProfile.fields, 'Enfoque'));
  const [about, setAbout] = useState(currentProfile.about);

  function save() {
    updateProfile({
      name: name.trim() || currentProfile.name,
      email: email.trim(),
      location: location.trim() || currentProfile.location,
      birthDate: birthDate.trim(),
      about: about.trim() || currentProfile.about,
      fields: isAgent
        ? [
            { icon: 'building', label: 'Agencia', value: agency.trim() || 'Agencia Fútbol Global' },
            { icon: 'briefcase', label: 'Experiencia', value: experience.trim() || '6 años' },
            {
              icon: 'star',
              label: 'Especialidad',
              value: specialty.trim() || 'Juveniles y primer contrato',
            },
            { icon: 'map-marker-alt', label: 'Zona', value: zone.trim() || 'Argentina' },
            {
              icon: 'users',
              label: 'Representados',
              value: represented.trim() || '28 jugadores',
            },
            { icon: 'user-friends', label: 'Enfoque', value: focus.trim() || 'Carrera formativa' },
          ]
        : [
            { icon: 'futbol', label: 'Posición', value: position.trim() || 'Delantero' },
            { icon: 'calendar-alt', label: 'Edad', value: age.trim() || '21 años' },
            { icon: 'arrows-alt-v', label: 'Altura', value: height.trim() || '1,83 m' },
            { icon: 'walking', label: 'Pierna hábil', value: foot.trim() || 'Derecha' },
            {
              icon: 'shield-alt',
              label: 'Club actual',
              value: club.trim() || 'Racing Club',
            },
            {
              icon: 'user-tie',
              label: 'Representante',
              value: agent.trim() || 'Sin representante',
            },
          ],
    });
    navigation.navigate('Profile', { userId: OWN_PROFILE_ID });
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
        <Text style={styles.headerTitle}>Editar perfil</Text>
        <View style={styles.headerSide} />
      </View>

      <KeyboardAvoidingView
        style={styles.panel}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          <Image source={currentProfile.photo} style={styles.avatar} />

          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Ubicación</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.label}>Fecha de nacimiento</Text>
          <TextInput
            style={styles.input}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="DD/MM/AAAA"
            placeholderTextColor="#8A8A8A"
          />

          {isAgent ? (
            <>
              <Text style={styles.label}>Agencia</Text>
              <TextInput style={styles.input} value={agency} onChangeText={setAgency} />
              <Text style={styles.label}>Experiencia</Text>
              <TextInput
                style={styles.input}
                value={experience}
                onChangeText={setExperience}
              />
              <Text style={styles.label}>Especialidad</Text>
              <TextInput
                style={styles.input}
                value={specialty}
                onChangeText={setSpecialty}
              />
              <Text style={styles.label}>Zona</Text>
              <TextInput style={styles.input} value={zone} onChangeText={setZone} />
              <Text style={styles.label}>Representados</Text>
              <TextInput
                style={styles.input}
                value={represented}
                onChangeText={setRepresented}
              />
              <Text style={styles.label}>Enfoque</Text>
              <TextInput style={styles.input} value={focus} onChangeText={setFocus} />
            </>
          ) : (
            <>
              <Text style={styles.label}>Posición</Text>
              <TextInput
                style={styles.input}
                value={position}
                onChangeText={setPosition}
              />
              <Text style={styles.label}>Edad</Text>
              <TextInput style={styles.input} value={age} onChangeText={setAge} />
              <Text style={styles.label}>Altura</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
              />
              <Text style={styles.label}>Pierna hábil</Text>
              <TextInput style={styles.input} value={foot} onChangeText={setFoot} />
              <Text style={styles.label}>Club actual</Text>
              <TextInput style={styles.input} value={club} onChangeText={setClub} />
              <Text style={styles.label}>Representante</Text>
              <TextInput style={styles.input} value={agent} onChangeText={setAgent} />
            </>
          )}

          <Text style={styles.label}>Sobre mí</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={about}
            onChangeText={setAbout}
            multiline
          />

          <Pressable style={[styles.saveButton, { backgroundColor: brand.header }]} onPress={save}>
            <Text style={styles.saveButtonText}>Guardar cambios</Text>
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
  form: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  avatar: {
    alignSelf: 'center',
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 18,
    backgroundColor: colors.inputBackground,
  },
  label: {
    marginBottom: 6,
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    height: 46,
    marginBottom: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F3F3F3',
    color: colors.text,
    fontSize: 14,
  },
  multiline: {
    height: 110,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  saveButton: {
    height: 52,
    marginTop: 8,
    borderRadius: 26,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
