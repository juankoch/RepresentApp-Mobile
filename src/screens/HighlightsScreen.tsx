import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PlayerTabBar } from '../components/PlayerTabBar';
import { usePlayerProfile } from '../context/PlayerProfileContext';
import { highlightCatalog } from '../data/playerHighlights';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

export function HighlightsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const { isPremium, highlights, addHighlight } = usePlayerProfile();
  const canAdd = highlights.length < highlightCatalog.length;

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
        >
          {!isPremium ? (
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
          ) : highlights.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.lockIcon}>
                <FontAwesome5 name="video" size={18} color={colors.homeHeader} />
              </View>
              <Text style={styles.lockTitle}>Mostrá tu talento</Text>
              <Text style={styles.lockCopy}>
                Todavía no tenés videos. En el prototipo, el botón agrega un
                highlight mock. La subida real queda para más adelante.
              </Text>
              <Pressable style={styles.button} onPress={addHighlight}>
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
                    addHighlight();
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
                      ? 'Agregá un highlight mock a tu perfil'
                      : 'Ya cargaste los highlights de ejemplo'}
                  </Text>
                </View>
              </Pressable>

              <View style={styles.grid}>
                {highlights.map((highlight) => (
                  <View key={highlight.id} style={styles.card}>
                    <Image
                      source={highlight.thumbnail}
                      style={styles.thumbnail}
                    />
                    <View style={styles.playBadge}>
                      <FontAwesome5 name="play" size={11} color="#FFFFFF" />
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {highlight.title}
                    </Text>
                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                      {highlight.subtitle}
                    </Text>
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
    backgroundColor: colors.inputBackground,
  },
  playBadge: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(7, 54, 44, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    marginTop: 8,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  cardSubtitle: {
    marginTop: 2,
    color: '#8A8A8A',
    fontSize: 11,
  },
});
