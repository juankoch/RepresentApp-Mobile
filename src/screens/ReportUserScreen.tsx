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
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

const reasons = [
  'Perfil falso',
  'Comportamiento inapropiado',
  'Spam',
  'Información engañosa',
  'Otro',
];

export function ReportUserScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const route = useRoute<RouteProp<AuthStackParamList, 'ReportUser'>>();
  const { getProfile, hasReported, reportUser } = usePlayerProfile();
  const profile = getProfile(route.params.userId);
  const alreadyReported = profile ? hasReported(profile.id) : false;
  const [reason, setReason] = useState(reasons[0]);
  const [detail, setDetail] = useState('');
  const [submitted, setSubmitted] = useState(alreadyReported);

  function submit() {
    if (!profile) {
      return;
    }
    reportUser(profile.id);
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
        <Text style={styles.headerTitle}>Reportar</Text>
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
              <Image source={profile.photo} style={styles.avatar} />
              <View>
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.role}>
                  {getProfileRoleLabel(profile.kind)}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.empty}>No encontramos este perfil.</Text>
          )}

          {submitted ? (
            <View style={styles.doneCard}>
              <FontAwesome5 name="check" size={16} color={colors.homeHeader} />
              <Text style={styles.doneTitle}>Reporte enviado</Text>
              <Text style={styles.doneCopy}>
                Gracias. El reporte quedó registrado en esta sesión. No se envía
                a ningún backend todavía.
              </Text>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.secondaryButtonText}>Volver</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Motivo del reporte</Text>
              {reasons.map((item) => {
                const selected = item === reason;
                return (
                  <Pressable
                    key={item}
                    style={styles.reasonRow}
                    onPress={() => setReason(item)}
                  >
                    <View
                      style={[styles.radio, selected && styles.radioSelected]}
                    >
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                    <Text style={styles.reasonText}>{item}</Text>
                  </Pressable>
                );
              })}

              <Text style={[styles.label, styles.detailLabel]}>
                Detalle (opcional)
              </Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={detail}
                onChangeText={setDetail}
                placeholder="Agregá más información..."
                placeholderTextColor="#8A8A8A"
                multiline
              />

              <Pressable style={styles.button} onPress={submit}>
                <Text style={styles.buttonText}>Enviar reporte</Text>
              </Pressable>
            </>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.inputBackground,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  role: {
    marginTop: 2,
    color: '#8A8A8A',
    fontSize: 12,
  },
  empty: {
    marginBottom: 18,
    color: '#8A8A8A',
    textAlign: 'center',
  },
  label: {
    marginBottom: 10,
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '700',
  },
  detailLabel: {
    marginTop: 12,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C8C8C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.homeHeader,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.homeHeader,
  },
  reasonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  doneCard: {
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#E7F8DC',
    borderRadius: 18,
    gap: 8,
  },
  doneTitle: {
    color: colors.homeHeader,
    fontSize: 16,
    fontWeight: '700',
  },
  doneCopy: {
    color: '#4A4A4A',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  secondaryButton: {
    height: 44,
    marginTop: 8,
    paddingHorizontal: 22,
    borderRadius: 22,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
