import { FontAwesome5 } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PlayerTabBar } from '../components/PlayerTabBar';
import { PremiumBadge } from '../components/PremiumBadge';
import { ProfileContent } from '../components/ProfileContent';
import { usePlayerProfile } from '../context/PlayerProfileContext';
import { OWN_PROFILE_ID } from '../data/playerProfiles';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

export function ProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const route = useRoute<RouteProp<AuthStackParamList, 'Profile'>>();
  const {
    role,
    getProfile,
    isOwnProfile,
    sendRequest,
    hasSentRequest,
    isConnected,
    incomingRequestIds,
    acceptIncomingRequest,
    isPremium,
    isBlocked,
    unblockUser,
    getRating,
  } = usePlayerProfile();

  const userId = route.params?.userId ?? OWN_PROFILE_ID;
  const ownProfile = isOwnProfile(userId);
  const profile = getProfile(userId);
  const requested = profile ? hasSentRequest(profile.id) : false;
  const connected = profile ? isConnected(profile.id) : false;
  const incoming = profile ? incomingRequestIds.includes(profile.id) : false;
  const blocked = profile ? isBlocked(profile.id) : false;
  const rating = profile ? getRating(profile.id) : undefined;

  if (!profile) {
    return (
      <View style={[styles.root, { backgroundColor: brand.header }]}>
        <StatusBar style="light" />
        <View style={styles.missing}>
          <Text style={styles.missingText}>No encontramos este perfil.</Text>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>Volver</Text>
          </Pressable>
        </View>
        <PlayerTabBar />
      </View>
    );
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
        <Pressable
          style={styles.headerSide}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
              return;
            }
            navigation.navigate('Home');
          }}
        >
          <FontAwesome5 name="arrow-left" size={16} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {ownProfile ? 'Mi perfil' : 'Perfil'}
        </Text>
        {ownProfile ? (
          <Pressable
            style={styles.headerSide}
            onPress={() => navigation.navigate('Settings')}
          >
            <FontAwesome5 name="cog" size={18} color="#FFFFFF" />
          </Pressable>
        ) : (
          <Pressable
            style={styles.headerSide}
            onPress={() =>
              navigation.push('UserOptions', { userId: profile.id })
            }
          >
            <FontAwesome5 name="ellipsis-v" size={16} color="#FFFFFF" />
          </Pressable>
        )}
      </View>

      <View style={styles.panel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <ProfileContent
            profile={profile}
            photoBadge={
              ownProfile ? (
                <View style={styles.photoBadge}>
                  <FontAwesome5 name="pen" size={10} color={colors.homeHeader} />
                </View>
              ) : null
            }
            nameAccessory={
              ownProfile && isPremium ? (
                <PremiumBadge
                  size="md"
                  onPress={() => navigation.push('Premium')}
                />
              ) : null
            }
            footer={
              ownProfile ? (
                <View>
                  <Pressable
                    style={styles.editButton}
                    onPress={() => navigation.navigate('EditProfile')}
                  >
                    <FontAwesome5 name="pen" size={13} color={colors.homeHeader} />
                    <Text style={styles.editButtonText}>Editar perfil</Text>
                  </Pressable>
                  {role === 'player' ? (
                    <Pressable
                      style={styles.highlightsButton}
                      onPress={() => navigation.push('Highlights')}
                    >
                      <FontAwesome5 name="video" size={13} color="#FFFFFF" />
                      <Text style={styles.highlightsButtonText}>
                        Mis highlights
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : blocked ? (
                <View style={styles.blockedCard}>
                  <FontAwesome5 name="ban" size={16} color="#E53935" />
                  <Text style={styles.blockedTitle}>Usuario bloqueado</Text>
                  <Text style={styles.blockedCopy}>
                    No vas a interactuar con esta cuenta hasta que la
                    desbloquees.
                  </Text>
                  <Pressable
                    style={styles.unblockButton}
                    onPress={() => unblockUser(profile.id)}
                  >
                    <Text style={styles.unblockButtonText}>Desbloquear</Text>
                  </Pressable>
                </View>
              ) : (
                <View>
                  {rating ? (
                    <View style={styles.ratedRow}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <FontAwesome5
                          key={index}
                          name="star"
                          solid
                          size={12}
                          color={
                            index < rating.stars ? colors.homeStar : '#E8E8E8'
                          }
                        />
                      ))}
                      <Text style={styles.ratedText}>Calificado</Text>
                    </View>
                  ) : null}
                  <View style={[styles.actions, rating ? styles.actionsAfterRating : null]}>
                  {connected ? (
                    <View style={[styles.requestButton, styles.connectedButton]}>
                      <FontAwesome5 name="check" size={14} color="#FFFFFF" />
                      <Text style={styles.requestButtonText}>Conectado</Text>
                    </View>
                  ) : incoming ? (
                    <Pressable
                      style={[styles.requestButton, { backgroundColor: brand.header }]}
                      onPress={() => acceptIncomingRequest(profile.id)}
                    >
                      <FontAwesome5 name="check" size={14} color="#FFFFFF" />
                      <Text style={styles.requestButtonText}>Aceptar solicitud</Text>
                    </Pressable>
                  ) : requested ? (
                    <View style={[styles.requestButton, styles.requestButtonSent]}>
                      <FontAwesome5 name="clock" size={14} color="#8A8A8A" />
                      <Text style={styles.requestButtonSentText}>Pendiente</Text>
                    </View>
                  ) : (
                    <Pressable
                      style={[styles.requestButton, { backgroundColor: brand.header }]}
                      onPress={() => sendRequest(profile.id)}
                    >
                      <FontAwesome5 name="user-plus" size={14} color="#FFFFFF" />
                      <Text style={styles.requestButtonText}>
                        Enviar solicitud
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={[styles.messageButton, { backgroundColor: brand.header }]}
                    onPress={() => {
                      if (profile.conversationId) {
                        navigation.navigate('Chat', {
                          conversationId: profile.conversationId,
                        });
                      }
                    }}
                  >
                    <FontAwesome5 name="paper-plane" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
                </View>
              )
            }
          />
        </ScrollView>
      </View>

      <PlayerTabBar activeTab={ownProfile ? 'profile' : undefined} />
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
  scrollContent: {
    paddingTop: 18,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: 12,
  },
  missingText: {
    color: '#8A8A8A',
    fontSize: 14,
  },
  backLink: {
    color: colors.homeHeader,
    fontSize: 14,
    fontWeight: '700',
  },
  photoBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.homeAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginTop: 22,
    borderRadius: 24,
    backgroundColor: '#E7F8DC',
    gap: 8,
  },
  editButtonText: {
    color: colors.homeHeader,
    fontSize: 15,
    fontWeight: '700',
  },
  highlightsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginTop: 10,
    borderRadius: 24,
    backgroundColor: colors.homeHeader,
    gap: 8,
  },
  highlightsButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  blockedCard: {
    alignItems: 'center',
    marginTop: 22,
    padding: 16,
    backgroundColor: '#FDECEA',
    borderRadius: 18,
    gap: 8,
  },
  blockedTitle: {
    color: '#E53935',
    fontSize: 15,
    fontWeight: '700',
  },
  blockedCopy: {
    color: '#4A4A4A',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  unblockButton: {
    height: 40,
    marginTop: 4,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unblockButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  ratedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    gap: 4,
  },
  ratedText: {
    marginLeft: 6,
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    gap: 10,
  },
  actionsAfterRating: {
    marginTop: 10,
  },
  requestButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.homeHeader,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  requestButtonSent: {
    backgroundColor: '#E8E8E8',
  },
  connectedButton: {
    backgroundColor: '#2E8B57',
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  requestButtonSentText: {
    color: '#8A8A8A',
    fontSize: 15,
    fontWeight: '700',
  },
  messageButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
