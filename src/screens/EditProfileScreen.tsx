import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  Alert,
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
import { supabase } from '../lib/supabase';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
}

function textValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatBirthDateDisplay(value: unknown) {
  const raw = textValue(value);
  if (!raw) {
    return '';
  }

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (iso) {
    return `${iso[3]}/${iso[2]}/${iso[1]}`;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    return raw;
  }

  return '';
}

function birthDateToIso(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (dmy) {
    return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }

  return null;
}

function ageFromBirthDate(value: unknown) {
  const raw = textValue(value);
  if (!raw) {
    return '';
  }

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  const year = iso ? Number(iso[1]) : dmy ? Number(dmy[3]) : NaN;
  const month = iso ? Number(iso[2]) : dmy ? Number(dmy[2]) : NaN;
  const day = iso ? Number(iso[3]) : dmy ? Number(dmy[1]) : NaN;

  if (!year || !month || !day) {
    return '';
  }

  const birth = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  if (age < 0 || age > 120) {
    return '';
  }

  return `${age} años`;
}

function splitFullName(fullName: string, fallbackLastName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { nombre: '', apellido: fallbackLastName };
  }
  if (parts.length === 1) {
    return { nombre: parts[0], apellido: fallbackLastName };
  }
  return { nombre: parts[0], apellido: parts.slice(1).join(' ') };
}

async function findIdByName(
  table: 'posiciones' | 'clubes',
  idField: 'id_posicion' | 'id_club',
  nombre: string,
) {
  const { data, error } = await supabase
    .from(table)
    .select(idField)
    .ilike('nombre', nombre)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const id = (data as Record<string, string | number>)[idField];
  return id ?? null;
}

async function fetchNombreById(
  table: 'posiciones' | 'clubes',
  idField: 'id_posicion' | 'id_club',
  id: string | number | null,
) {
  if (id == null) {
    return '';
  }

  const { data, error } = await supabase
    .from(table)
    .select('nombre')
    .eq(idField, id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return textValue((data as { nombre?: unknown } | null)?.nombre);
}

export function EditProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const { currentProfile, updateProfile } = usePlayerProfile();
  const [isAgent, setIsAgent] = useState(currentProfile.kind === 'agent');
  const [lastName, setLastName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [position, setPosition] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [foot, setFoot] = useState('');
  const [club, setClub] = useState('');
  const [agent, setAgent] = useState('');
  const [agency, setAgency] = useState('');
  const [experience, setExperience] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [zone, setZone] = useState('');
  const [represented, setRepresented] = useState('');
  const [focus, setFocus] = useState('');
  const [about, setAbout] = useState('');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadProfile() {
        try {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) {
            throw userError;
          }

          const user = userData.user;
          if (!user) {
            return;
          }

          const { data: usuario, error: usuarioError } = await supabase
            .from('usuarios')
            .select('id_usuario, nombre, apellido, email, fecha_nacimiento, fk_rol')
            .eq('id_usuario', user.id)
            .maybeSingle();

          if (usuarioError) {
            throw usuarioError;
          }
          if (!usuario || cancelled) {
            return;
          }

          const usuarioRow = usuario as {
            nombre?: unknown;
            apellido?: unknown;
            email?: unknown;
            fecha_nacimiento?: unknown;
            fk_rol?: string | number | null;
          };

          let roleName = '';
          if (usuarioRow.fk_rol != null) {
            const { data: roleRow, error: roleError } = await supabase
              .from('roles')
              .select('nombre')
              .eq('id_rol', usuarioRow.fk_rol)
              .maybeSingle();

            if (roleError) {
              throw roleError;
            }
            roleName = textValue((roleRow as { nombre?: unknown } | null)?.nombre);
          }

          const agentRole = roleName === 'Representante';
          const loadedLastName = textValue(usuarioRow.apellido);
          const fullName = `${textValue(usuarioRow.nombre)} ${loadedLastName}`.trim();

          let loadedAbout = '';
          let loadedPosition = '';
          let loadedClub = '';
          let loadedFoot = '';
          let loadedAgency = '';

          if (agentRole) {
            const { data: agente, error: agenteError } = await supabase
              .from('perfiles_representante')
              .select('descripcion, empresa')
              .eq('id_usuario', user.id)
              .maybeSingle();

            if (agenteError) {
              throw agenteError;
            }

            loadedAbout = textValue(
              (agente as { descripcion?: unknown } | null)?.descripcion,
            );
            loadedAgency = textValue(
              (agente as { empresa?: unknown } | null)?.empresa,
            );
          } else {
            const { data: jugador, error: jugadorError } = await supabase
              .from('perfiles_jugador')
              .select('fk_posicion, fk_club_actual, pierna_habil, descripcion')
              .eq('id_usuario', user.id)
              .maybeSingle();

            if (jugadorError) {
              throw jugadorError;
            }

            const jugadorRow = jugador as {
              fk_posicion?: string | number | null;
              fk_club_actual?: string | number | null;
              pierna_habil?: unknown;
              descripcion?: unknown;
            } | null;

            loadedPosition = await fetchNombreById(
              'posiciones',
              'id_posicion',
              jugadorRow?.fk_posicion ?? null,
            );
            loadedClub = await fetchNombreById(
              'clubes',
              'id_club',
              jugadorRow?.fk_club_actual ?? null,
            );
            loadedFoot = textValue(jugadorRow?.pierna_habil);
            loadedAbout = textValue(jugadorRow?.descripcion);
          }

          if (cancelled) {
            return;
          }

          setIsAgent(agentRole);
          setLastName(loadedLastName);
          setName(fullName);
          setEmail(textValue(usuarioRow.email));
          setBirthDate(formatBirthDateDisplay(usuarioRow.fecha_nacimiento));
          setAge(ageFromBirthDate(usuarioRow.fecha_nacimiento));
          setPosition(loadedPosition);
          setClub(loadedClub);
          setFoot(loadedFoot);
          setAgency(loadedAgency);
          setAbout(loadedAbout);
        } catch (error) {
          if (!cancelled) {
            Alert.alert('No pudimos cargar tu perfil', errorMessage(error));
          }
        }
      }

      void loadProfile();

      return () => {
        cancelled = true;
      };
    }, []),
  );

  async function save() {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        throw userError;
      }

      const user = userData.user;
      if (!user) {
        Alert.alert(
          'No se pudo guardar',
          'No hay un usuario autenticado. Iniciá sesión e intentá de nuevo.',
        );
        return;
      }

      const trimmedBirthDate = birthDate.trim();
      const fechaNacimiento = trimmedBirthDate
        ? birthDateToIso(trimmedBirthDate)
        : null;
      if (trimmedBirthDate && !fechaNacimiento) {
        Alert.alert(
          'No se pudo guardar',
          'La fecha de nacimiento debe tener el formato DD/MM/AAAA.',
        );
        return;
      }

      const names = splitFullName(name, lastName);

      const { error: usuarioError } = await supabase
        .from('usuarios')
        .update({
          nombre: names.nombre,
          apellido: names.apellido,
          email: email.trim(),
          fecha_nacimiento: fechaNacimiento,
        })
        .eq('id_usuario', user.id);

      if (usuarioError) {
        throw usuarioError;
      }

      if (isAgent) {
        const { error: agenteError } = await supabase
          .from('perfiles_representante')
          .update({
            descripcion: about.trim(),
            empresa: agency.trim(),
          })
          .eq('id_usuario', user.id);

        if (agenteError) {
          throw agenteError;
        }
      } else {
        let positionId: string | number | null = null;
        let clubId: string | number | null = null;

        if (position.trim()) {
          positionId = await findIdByName(
            'posiciones',
            'id_posicion',
            position.trim(),
          );
        }
        if (club.trim()) {
          clubId = await findIdByName('clubes', 'id_club', club.trim());
        }

        const { error: jugadorError } = await supabase
          .from('perfiles_jugador')
          .update({
            fk_posicion: positionId,
            fk_club_actual: clubId,
            pierna_habil: foot.trim() || null,
            descripcion: about.trim(),
          })
          .eq('id_usuario', user.id);

        if (jugadorError) {
          throw jugadorError;
        }
      }

      updateProfile({
        name: name.trim() || currentProfile.name,
        email: email.trim(),
        birthDate: birthDate.trim(),
        about: about.trim(),
        fields: isAgent
          ? [
              { icon: 'building', label: 'Agencia', value: agency.trim() },
              { icon: 'briefcase', label: 'Experiencia', value: experience.trim() },
              { icon: 'star', label: 'Especialidad', value: specialty.trim() },
              { icon: 'map-marker-alt', label: 'Zona', value: zone.trim() },
              { icon: 'users', label: 'Representados', value: represented.trim() },
              { icon: 'user-friends', label: 'Enfoque', value: focus.trim() },
            ]
          : [
              { icon: 'futbol', label: 'Posición', value: position.trim() },
              { icon: 'calendar-alt', label: 'Edad', value: age.trim() },
              { icon: 'arrows-alt-v', label: 'Altura', value: height.trim() },
              { icon: 'walking', label: 'Pierna hábil', value: foot.trim() },
              { icon: 'shield-alt', label: 'Club actual', value: club.trim() },
              { icon: 'user-tie', label: 'Representante', value: agent.trim() },
            ],
      });

      Alert.alert('Perfil actualizado', 'Tus cambios se guardaron correctamente.', [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('Profile', { userId: OWN_PROFILE_ID }),
        },
      ]);
    } catch (error) {
      Alert.alert('No se pudo guardar', errorMessage(error));
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

          <Pressable
            style={[styles.saveButton, { backgroundColor: brand.header }]}
            onPress={() => {
              void save();
            }}
          >
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
