import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
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
import {
  fetchCreatedProfileKind,
  usePlayerProfile,
} from '../context/PlayerProfileContext';
import { OWN_PROFILE_ID } from '../data/playerProfiles';
import { findOrCreateClubId } from '../lib/clubes';
import { piernaHabilToDb, piernaHabilToDisplay } from '../lib/piernaHabil';
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

function experienceFromDb(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value.replace(/[^\d-]/g, ''), 10);
    return Number.isFinite(parsed) ? String(parsed) : '';
  }
  return '';
}

function experienceToDb(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const match = trimmed.match(/-?\d+/);
  if (!match) {
    return null;
  }
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function alturaFromDb(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value.replace(/[^\d-]/g, ''), 10);
    return Number.isFinite(parsed) ? String(parsed) : '';
  }
  return '';
}

function alturaToDb(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const match = trimmed.match(/\d+/);
  if (!match) {
    return null;
  }
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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
  const [height, setHeight] = useState('');
  const [foot, setFoot] = useState('');
  const [club, setClub] = useState('');
  const [category, setCategory] = useState('');
  const [agent, setAgent] = useState('');
  const [agency, setAgency] = useState('');
  const [experience, setExperience] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [zone, setZone] = useState('');
  const [represented, setRepresented] = useState('');
  const [focus, setFocus] = useState('');
  const [about, setAbout] = useState('');
  const agencyRef = useRef('');
  const aboutRef = useRef('');
  const experienceRef = useRef('');
  const specialtyRef = useRef('');
  const zoneRef = useRef('');
  const focusRef = useRef('');
  const positionRef = useRef('');
  const categoryRef = useRef('');
  const heightRef = useRef('');
  const footRef = useRef('');
  const clubRef = useRef('');
  const agencyDirtyRef = useRef(false);
  const aboutDirtyRef = useRef(false);
  const experienceDirtyRef = useRef(false);
  const specialtyDirtyRef = useRef(false);
  const zoneDirtyRef = useRef(false);
  const focusDirtyRef = useRef(false);
  const positionDirtyRef = useRef(false);
  const categoryDirtyRef = useRef(false);
  const heightDirtyRef = useRef(false);
  const footDirtyRef = useRef(false);
  const clubDirtyRef = useRef(false);

  function bindDirtyField(
    setter: (value: string) => void,
    valueRef: { current: string },
    dirtyRef: { current: boolean },
  ) {
    return (value: string) => {
      dirtyRef.current = true;
      valueRef.current = value;
      setter(value);
    };
  }

  const handleAgencyChange = bindDirtyField(setAgency, agencyRef, agencyDirtyRef);
  const handleAboutChange = bindDirtyField(setAbout, aboutRef, aboutDirtyRef);
  const handleExperienceChange = bindDirtyField(
    setExperience,
    experienceRef,
    experienceDirtyRef,
  );
  const handleSpecialtyChange = bindDirtyField(
    setSpecialty,
    specialtyRef,
    specialtyDirtyRef,
  );
  const handleZoneChange = bindDirtyField(setZone, zoneRef, zoneDirtyRef);
  const handleFocusChange = bindDirtyField(setFocus, focusRef, focusDirtyRef);
  const handlePositionChange = bindDirtyField(
    setPosition,
    positionRef,
    positionDirtyRef,
  );
  const handleCategoryChange = bindDirtyField(
    setCategory,
    categoryRef,
    categoryDirtyRef,
  );
  const handleHeightChange = bindDirtyField(setHeight, heightRef, heightDirtyRef);
  const handleFootChange = bindDirtyField(setFoot, footRef, footDirtyRef);
  const handleClubChange = bindDirtyField(setClub, clubRef, clubDirtyRef);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      agencyDirtyRef.current = false;
      aboutDirtyRef.current = false;
      experienceDirtyRef.current = false;
      specialtyDirtyRef.current = false;
      zoneDirtyRef.current = false;
      focusDirtyRef.current = false;
      positionDirtyRef.current = false;
      categoryDirtyRef.current = false;
      heightDirtyRef.current = false;
      footDirtyRef.current = false;
      clubDirtyRef.current = false;

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

          const { kind, error: kindError } = await fetchCreatedProfileKind(user.id);
          if (kindError) {
            throw kindError;
          }

          const { data: usuario, error: usuarioError } = await supabase
            .from('usuarios')
            .select('id_usuario, nombre, apellido, email, fecha_nacimiento')
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
          };

          const agentRole = kind === 'agent';
          const loadedLastName = textValue(usuarioRow.apellido);
          const fullName = `${textValue(usuarioRow.nombre)} ${loadedLastName}`.trim();

          let loadedAbout = '';
          let loadedPosition = '';
          let loadedClub = '';
          let loadedFoot = '';
          let loadedCategory = '';
          let loadedHeight = '';
          let loadedAgency = '';
          let loadedExperience = '';
          let loadedSpecialty = '';
          let loadedZone = '';
          let loadedFocus = '';

          if (agentRole) {
            const { data: agente, error: agenteError } = await supabase
              .from('perfiles_representante')
              .select(
                'descripcion, empresa, anios_experiencia, especialidad, zona, enfoque',
              )
              .eq('id_usuario', user.id)
              .maybeSingle();

            if (agenteError) {
              throw agenteError;
            }

            const agenteRow = agente as {
              descripcion?: unknown;
              empresa?: unknown;
              anios_experiencia?: unknown;
              especialidad?: unknown;
              zona?: unknown;
              enfoque?: unknown;
            } | null;
            loadedAbout = textValue(agenteRow?.descripcion);
            loadedAgency = textValue(agenteRow?.empresa);
            loadedExperience = experienceFromDb(agenteRow?.anios_experiencia);
            loadedSpecialty = textValue(agenteRow?.especialidad);
            loadedZone = textValue(agenteRow?.zona);
            loadedFocus = textValue(agenteRow?.enfoque);
          } else if (kind === 'player') {
            const { data: jugador, error: jugadorError } = await supabase
              .from('perfiles_jugador')
              .select(
                'fk_posicion, fk_club_actual, pierna_habil, descripcion, categoria, altura_cm',
              )
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
              categoria?: unknown;
              altura_cm?: unknown;
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
            loadedFoot = piernaHabilToDisplay(jugadorRow?.pierna_habil);
            loadedAbout = textValue(jugadorRow?.descripcion);
            loadedCategory = textValue(jugadorRow?.categoria);
            loadedHeight = alturaFromDb(jugadorRow?.altura_cm);
          }

          if (cancelled) {
            return;
          }

          setIsAgent(agentRole);
          setLastName(loadedLastName);
          setName(fullName);
          setEmail(textValue(usuarioRow.email));
          setBirthDate(formatBirthDateDisplay(usuarioRow.fecha_nacimiento));
          if (!positionDirtyRef.current) {
            positionRef.current = loadedPosition;
            setPosition(loadedPosition);
          }
          if (!clubDirtyRef.current) {
            clubRef.current = loadedClub;
            setClub(loadedClub);
          }
          if (!footDirtyRef.current) {
            footRef.current = loadedFoot;
            setFoot(loadedFoot);
          }
          if (!categoryDirtyRef.current) {
            categoryRef.current = loadedCategory;
            setCategory(loadedCategory);
          }
          if (!heightDirtyRef.current) {
            heightRef.current = loadedHeight;
            setHeight(loadedHeight);
          }
          if (!agencyDirtyRef.current) {
            agencyRef.current = loadedAgency;
            setAgency(loadedAgency);
          }
          if (!aboutDirtyRef.current) {
            aboutRef.current = loadedAbout;
            setAbout(loadedAbout);
          }
          if (!experienceDirtyRef.current) {
            experienceRef.current = loadedExperience;
            setExperience(loadedExperience);
          }
          if (!specialtyDirtyRef.current) {
            specialtyRef.current = loadedSpecialty;
            setSpecialty(loadedSpecialty);
          }
          if (!zoneDirtyRef.current) {
            zoneRef.current = loadedZone;
            setZone(loadedZone);
          }
          if (!focusDirtyRef.current) {
            focusRef.current = loadedFocus;
            setFocus(loadedFocus);
          }
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
        const { data: updatedAgent, error: agenteError } = await supabase
          .from('perfiles_representante')
          .update({
            descripcion: aboutRef.current.trim(),
            empresa: agencyRef.current.trim(),
            anios_experiencia: experienceToDb(experienceRef.current),
            especialidad: specialtyRef.current.trim(),
            zona: zoneRef.current.trim(),
            enfoque: focusRef.current.trim(),
          })
          .eq('id_usuario', user.id)
          .select('id_usuario')
          .maybeSingle();

        if (agenteError) {
          throw agenteError;
        }
        if (!updatedAgent) {
          Alert.alert(
            'No se pudo guardar',
            'No encontramos tu perfil de representante para actualizar.',
          );
          return;
        }
      } else {
        const trimmedPosition = positionRef.current.trim();
        let positionId: string | number | null = null;
        if (trimmedPosition) {
          positionId = await findIdByName(
            'posiciones',
            'id_posicion',
            trimmedPosition,
          );
          if (positionId == null) {
            Alert.alert(
              'No se pudo guardar',
              'La posición no es válida. Escribí una posición existente.',
            );
            return;
          }
        }

        const trimmedClub = clubRef.current.trim();
        const clubId = trimmedClub ? await findOrCreateClubId(trimmedClub) : null;

        const trimmedFoot = footRef.current.trim();
        const piernaHabil = trimmedFoot ? piernaHabilToDb(trimmedFoot) : null;
        if (trimmedFoot && !piernaHabil) {
          Alert.alert(
            'No se pudo guardar',
            'La pierna hábil debe ser Derecha, Izquierda o Ambidiestra.',
          );
          return;
        }

        const trimmedHeight = heightRef.current.trim();
        const alturaCm = alturaToDb(trimmedHeight);
        if (trimmedHeight && alturaCm == null) {
          Alert.alert(
            'No se pudo guardar',
            'La altura debe ser un número en centímetros, por ejemplo 183.',
          );
          return;
        }

        const { data: updatedPlayer, error: jugadorError } = await supabase
          .from('perfiles_jugador')
          .update({
            fk_posicion: positionId,
            fk_club_actual: clubId,
            pierna_habil: piernaHabil,
            descripcion: aboutRef.current.trim(),
            categoria: categoryRef.current.trim() || null,
            altura_cm: alturaCm,
          })
          .eq('id_usuario', user.id)
          .select('id_usuario')
          .maybeSingle();

        if (jugadorError) {
          throw jugadorError;
        }
        if (!updatedPlayer) {
          Alert.alert(
            'No se pudo guardar',
            'No encontramos tu perfil de jugador para actualizar.',
          );
          return;
        }
      }

      updateProfile({
        name: name.trim(),
        email: email.trim(),
        birthDate: birthDate.trim(),
        about: aboutRef.current.trim(),
        kind: isAgent ? 'agent' : 'player',
        fields: isAgent
          ? [
              { icon: 'building', label: 'Agencia', value: agencyRef.current.trim() },
              {
                icon: 'briefcase',
                label: 'Experiencia',
                value: experienceRef.current.trim(),
              },
              {
                icon: 'star',
                label: 'Especialidad',
                value: specialtyRef.current.trim(),
              },
              { icon: 'map-marker-alt', label: 'Zona', value: zoneRef.current.trim() },
              { icon: 'users', label: 'Representados', value: represented.trim() },
              {
                icon: 'user-friends',
                label: 'Enfoque',
                value: focusRef.current.trim(),
              },
            ]
          : [
              { icon: 'futbol', label: 'Posición', value: positionRef.current.trim() },
              {
                icon: 'flag',
                label: 'Categoría',
                value: categoryRef.current.trim(),
              },
              { icon: 'calendar-alt', label: 'Edad', value: ageFromBirthDate(birthDate) },
              { icon: 'arrows-alt-v', label: 'Altura', value: heightRef.current.trim() },
              { icon: 'walking', label: 'Pierna hábil', value: footRef.current.trim() },
              { icon: 'shield-alt', label: 'Club actual', value: clubRef.current.trim() },
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
              <TextInput style={styles.input} value={agency} onChangeText={handleAgencyChange} />
              <Text style={styles.label}>Experiencia</Text>
              <TextInput
                style={styles.input}
                value={experience}
                onChangeText={handleExperienceChange}
              />
              <Text style={styles.label}>Especialidad</Text>
              <TextInput
                style={styles.input}
                value={specialty}
                onChangeText={handleSpecialtyChange}
              />
              <Text style={styles.label}>Zona</Text>
              <TextInput style={styles.input} value={zone} onChangeText={handleZoneChange} />
              <Text style={styles.label}>Representados</Text>
              <TextInput
                style={styles.input}
                value={represented}
                onChangeText={setRepresented}
              />
              <Text style={styles.label}>Enfoque</Text>
              <TextInput style={styles.input} value={focus} onChangeText={handleFocusChange} />
            </>
          ) : (
            <>
              <Text style={styles.label}>Posición</Text>
              <TextInput
                style={styles.input}
                value={position}
                onChangeText={handlePositionChange}
              />
              <Text style={styles.label}>Categoría</Text>
              <TextInput
                style={styles.input}
                value={category}
                onChangeText={handleCategoryChange}
              />
              <Text style={styles.label}>Edad</Text>
              <TextInput
                style={styles.input}
                value={ageFromBirthDate(birthDate)}
                editable={false}
              />
              <Text style={styles.label}>Altura</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={handleHeightChange}
              />
              <Text style={styles.label}>Pierna hábil</Text>
              <TextInput
                style={styles.input}
                value={foot}
                onChangeText={handleFootChange}
              />
              <Text style={styles.label}>Club actual</Text>
              <TextInput
                style={styles.input}
                value={club}
                onChangeText={handleClubChange}
              />
              <Text style={styles.label}>Representante</Text>
              <TextInput style={styles.input} value={agent} onChangeText={setAgent} />
            </>
          )}

          <Text style={styles.label}>Sobre mí</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={about}
            onChangeText={handleAboutChange}
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
