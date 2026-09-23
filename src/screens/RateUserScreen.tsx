import { FontAwesome5 } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
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
import { getProfileRoleLabel } from '../data/playerProfiles';
import { usePublicProfile } from '../hooks/usePublicProfile';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

export function RateUserScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const route = useRoute<RouteProp<AuthStackParamList, 'RateUser'>>();
  const { getRating, rateUser } = usePlayerProfile();
  const profile = usePublicProfile(route.params.userId);
  const existing = profile ? getRating(profile.id) : undefined;
  const [stars, setStars] = useState(existing?.stars ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? '');
  const [submitted, setSubmitted] = useState(Boolean(existing));

  function submit() {
    if (!profile || stars < 1) {
      return;
    }
    rateUser(profile.id, stars, comment.trim());
    setSubmitted(true);
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
        <Text style={styles.headerTitle}>Calificar</Text>
        <View style={styles.headerSide} />
      </View>

      <KeyboardAvoidingView
        style={styles.panel}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {profile ? (
            <View style={styles.identity}>
              {profile.photoUrl ? (
                <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar} />
              )}
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.role}>
                {getProfileRoleLabel(profile.kind)}
              </Text>
            </View>
          ) : (
            <Text style={styles.empty}>No encontramos este perfil.</Text>
          )}

          {submitted ? (
            <View style={styles.doneCard}>
              <FontAwesome5 name="check" size={16} color={colors.homeHeader} />
              <Text style={styles.doneTitle}>Calificación enviada</Text>
              <Text style={styles.doneCopy}>
                Tu puntuación quedó guardada en esta sesión.
              </Text>
            </View>
          ) : null}

          <Text style={styles.label}>Tu calificación</Text>
          <View style={styles.starsRow}>
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;
              const active = value <= stars;
              return (
                <Pressable
                  key={value}
                  onPress={() => {
                    if (!submitted) {
                      setStars(value);
                    }
                  }}
                  hitSlop={6}
                >
                  <FontAwesome5
                    name="star"
                    solid
                    size={28}
                    color={active ? colors.homeStar : '#E8E8E8'}
                  />
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Comentario (opcional)</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={comment}
            onChangeText={setComment}
            editable={!submitted}
            placeholder="Contá tu experiencia..."
            placeholderTextColor="#8A8A8A"
            multiline
          />

          {submitted ? (
            <View style={[styles.button, styles.buttonDone]}>
              <Text style={styles.buttonDoneText}>Ya calificaste</Text>
            </View>
          ) : (
            <Pressable
              style={[styles.button, stars < 1 && styles.buttonDisabled]}
              onPress={submit}
            >
              <Text style={styles.buttonText}>Enviar calificación</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <PlayerTabBar />
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  identity: {
    alignItems: 'center',
    marginBottom: 22,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.inputBackground,
  },
  name: {
    marginTop: 12,
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  role: {
    marginTop: 4,
    color: '#8A8A8A',
    fontSize: 13,
  },
  empty: {
    marginBottom: 18,
    color: '#8A8A8A',
    textAlign: 'center',
  },
  doneCard: {
    alignItems: 'center',
    marginBottom: 18,
    padding: 16,
    backgroundColor: '#E7F8DC',
    borderRadius: 18,
    gap: 6,
  },
  doneTitle: {
    color: colors.homeHeader,
    fontSize: 15,
    fontWeight: '700',
  },
  doneCopy: {
    color: '#4A4A4A',
    fontSize: 12,
    textAlign: 'center',
  },
  label: {
    marginBottom: 8,
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '700',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 18,
  },
  input: {
    height: 46,
    marginBottom: 18,
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
  button: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonDone: {
    backgroundColor: '#E7F8DC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDoneText: {
    color: colors.homeHeader,
    fontSize: 16,
    fontWeight: '700',
  },
});
