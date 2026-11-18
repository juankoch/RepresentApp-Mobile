import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import {
  Alert,
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
import {
  deleteHighlight,
  fetchHighlights,
  HighlightVideo,
  MAX_HIGHLIGHTS,
  uploadHighlight,
} from '../lib/highlights';
import { supabase } from '../lib/supabase';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

type PendingVideo = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

export function HighlightsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const { isPremium, role } = usePlayerProfile();
  const [videos, setVideos] = useState<HighlightVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState<PendingVideo | null>(null);
  const [title, setTitle] = useState('');
  const canUpload = isPremium && role === 'player';
  const canAdd = videos.length < MAX_HIGHLIGHTS;

  const reload = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const result = await fetchHighlights(data.user?.id?.trim() ?? '');
    if (result.ok) {
      setVideos(result.data);
      return;
    }
    setVideos([]);
    Alert.alert('No se pudieron cargar los highlights', result.message);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setLoading(true);
        const { data } = await supabase.auth.getUser();
        const result = await fetchHighlights(data.user?.id?.trim() ?? '');
        if (cancelled) {
          return;
        }
        if (result.ok) {
          setVideos(result.data);
        } else {
          setVideos([]);
          Alert.alert('No se pudieron cargar los highlights', result.message);
        }
        setLoading(false);
      }

      void load();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  async function pickVideo() {
    if (!canUpload) {
      navigation.push('Premium');
      return;
    }
    if (!canAdd) {
      Alert.alert(
        'Límite alcanzado',
        `Podés subir hasta ${MAX_HIGHLIGHTS} highlights.`,
      );
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'No se pudo abrir la galería',
        'Necesitamos acceso a tus videos para subir highlights.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      videoMaxDuration: 60,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    if (!asset?.uri) {
      return;
    }

    setPending({
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
    });
    setTitle('');
  }

  async function submitPending() {
    if (!pending || uploading) {
      return;
    }
    setUploading(true);
    try {
      const result = await uploadHighlight({
        uri: pending.uri,
        mimeType: pending.mimeType,
        fileName: pending.fileName,
        title,
      });
      if (!result.ok) {
        Alert.alert('No se pudo subir el video', result.message);
        return;
      }
      setPending(null);
      setTitle('');
      await reload();
    } finally {
      setUploading(false);
    }
  }

  function confirmDelete(video: HighlightVideo) {
    Alert.alert('Borrar highlight', '¿Querés sacar este video de tu perfil?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const result = await deleteHighlight(video);
            if (!result.ok) {
              Alert.alert('No se pudo borrar', result.message);
              return;
            }
            setVideos((current) => current.filter((item) => item.id !== video.id));
          })();
        },
      },
    ]);
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
        <Text style={styles.headerTitle}>Mis highlights</Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.panel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {!canUpload ? (
            <View style={styles.lockCard}>
              <View style={styles.lockIcon}>
                <FontAwesome5 name="lock" size={18} color={colors.homeHeader} />
              </View>
              <Text style={styles.lockTitle}>Función exclusiva de Premium</Text>
              <Text style={styles.lockCopy}>
                Subí tus mejores jugadas y destacá frente a representantes y
                clubes.
              </Text>
              <Pressable
                style={styles.button}
                onPress={() => navigation.push('Premium')}
              >
                <Text style={styles.buttonText}>Conocé Premium</Text>
              </Pressable>
            </View>
          ) : pending ? (
            <View style={styles.pendingCard}>
              <Text style={styles.lockTitle}>Nuevo highlight</Text>
              <Text style={styles.lockCopy}>
                Poné un título corto para que se vea en tu perfil.
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Gol, asistencia, jugada..."
                placeholderTextColor="#8A8A8A"
                style={styles.titleInput}
              />
              <Pressable
                style={[styles.button, uploading && { opacity: 0.6 }]}
                disabled={uploading}
                onPress={() => {
                  void submitPending();
                }}
              >
                <FontAwesome5 name="cloud-upload-alt" size={13} color="#FFFFFF" />
                <Text style={styles.buttonText}>
                  {uploading ? 'Subiendo...' : 'Subir video'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                disabled={uploading}
                onPress={() => {
                  setPending(null);
                  setTitle('');
                }}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
            </View>
          ) : loading ? (
            <Text style={styles.emptyText}>Cargando highlights...</Text>
          ) : videos.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.lockIcon}>
                <FontAwesome5 name="video" size={18} color={colors.homeHeader} />
              </View>
              <Text style={styles.lockTitle}>Mostrá tu talento</Text>
              <Text style={styles.lockCopy}>
                Subí un video de hasta 60 segundos. Queda visible en tu perfil.
              </Text>
              <Pressable style={styles.button} onPress={() => void pickVideo()}>
                <FontAwesome5 name="plus" size={13} color="#FFFFFF" />
                <Text style={styles.buttonText}>Subir video</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Pressable
                style={[styles.addRow, !canAdd && styles.addRowDisabled]}
                onPress={() => {
                  if (canAdd) {
                    void pickVideo();
                  }
                }}
              >
                <View style={styles.addIcon}>
                  <FontAwesome5 name="plus" size={14} color={colors.homeHeader} />
                </View>
                <View style={styles.addCopy}>
                  <Text style={styles.addTitle}>Subir video</Text>
                  <Text style={styles.addSubtitle}>
                    {canAdd
                      ? `${videos.length} de ${MAX_HIGHLIGHTS} highlights`
                      : `Ya cargaste ${MAX_HIGHLIGHTS} highlights`}
                  </Text>
                </View>
              </Pressable>

              <View style={styles.grid}>
                {videos.map((video) => (
                  <View key={video.id} style={styles.card}>
                    <Pressable
                      onPress={() =>
                        navigation.push('HighlightPlayer', {
                          url: video.url,
                          title: video.title,
                        })
                      }
                    >
                      <View style={styles.thumbnail}>
                        <View style={styles.playBadge}>
                          <FontAwesome5 name="play" size={11} color="#FFFFFF" />
                        </View>
                      </View>
                    </Pressable>
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {video.title}
                      </Text>
                      <Pressable
                        style={styles.deleteButton}
                        onPress={() => confirmDelete(video)}
                      >
                        <FontAwesome5 name="trash-alt" size={12} color="#E53935" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>

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
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  lockCard: {
    alignItems: 'center',
    padding: 22,
    backgroundColor: '#F3F6F4',
    borderRadius: 22,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 22,
    backgroundColor: '#F3F6F4',
    borderRadius: 22,
  },
  pendingCard: {
    padding: 22,
    backgroundColor: '#F3F6F4',
    borderRadius: 22,
    alignItems: 'center',
  },
  lockIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginBottom: 14,
    backgroundColor: '#E7F8DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  lockCopy: {
    marginTop: 8,
    marginBottom: 18,
    color: '#4A4A4A',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  titleInput: {
    width: '100%',
    height: 44,
    marginBottom: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    color: colors.text,
    fontSize: 14,
  },
  button: {
    minWidth: 180,
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: colors.homeHeader,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#8A8A8A',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 24,
    color: '#8A8A8A',
    fontSize: 14,
    textAlign: 'center',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    padding: 14,
    backgroundColor: '#E7F8DC',
    borderRadius: 18,
    gap: 12,
  },
  addRowDisabled: {
    backgroundColor: '#F3F6F4',
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCopy: {
    flex: 1,
  },
  addTitle: {
    color: colors.homeHeader,
    fontSize: 15,
    fontWeight: '700',
  },
  addSubtitle: {
    marginTop: 2,
    color: '#4A4A4A',
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: '48%',
  },
  thumbnail: {
    width: '100%',
    height: 110,
    borderRadius: 16,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(7, 54, 44, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  deleteButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
