import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
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
import { SwipeableRow } from '../components/SwipeableRow';
import { Conversation } from '../data/playerMessages';
import { getProfileRoleLabel } from '../data/playerProfiles';
import { fetchPublicUserProfile } from '../lib/directory';
import { deleteConversation, getUserConversations } from '../lib/mensajes';
import { supabase } from '../lib/supabase';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';
import { matchesSearch } from '../utils/search';

export function MessagesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  const visibleConversations = conversations.filter((conversation) =>
    matchesSearch(conversation.name, searchQuery),
  );

  const loadConversations = useCallback(async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setConversations([]);
      Alert.alert('No se pudieron cargar los mensajes', 'No hay un usuario autenticado.');
      return;
    }

    const result = await getUserConversations(userData.user.id);
    if (!result.ok) {
      setConversations([]);
      Alert.alert('No se pudieron cargar los mensajes', result.message);
      return;
    }

    const hydrated = await Promise.all(
      result.data.map(async (item) => {
        const profile = item.profileId
          ? await fetchPublicUserProfile(item.profileId)
          : null;
        return {
          id: item.id,
          profileId: item.profileId,
          name: profile?.name || 'Sin datos',
          role: profile ? getProfileRoleLabel(profile.kind) : '',
          preview: item.preview,
          time: item.time,
          unread: item.unread,
          avatarUrl: profile?.photoUrl,
          messages: [],
        } satisfies Conversation;
      }),
    );

    setConversations(hydrated);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setOpenRowId(null);
      void loadConversations();
    }, [loadConversations]),
  );

  async function handleDelete(conversationId: string) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      Alert.alert('No se pudo eliminar la conversación', 'No hay un usuario autenticado.');
      return;
    }

    const result = await deleteConversation(conversationId, userData.user.id);
    if (!result.ok) {
      Alert.alert('No se pudo eliminar la conversación', result.message);
      return;
    }

    setConversations((current) =>
      current.filter((conversation) => conversation.id !== conversationId),
    );
    setOpenRowId(null);
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
        <View style={styles.headerTitleRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.navigate('Home')}
          >
            <FontAwesome5 name="arrow-left" size={16} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Mensajes</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.searchBox}>
          <FontAwesome5 name="search" size={14} color="#8A8A8A" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar conversaciones..."
            placeholderTextColor="#8A8A8A"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setOpenRowId(null);
            }}
            onFocus={() => setOpenRowId(null)}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => setOpenRowId(null)}
        >
          {visibleConversations.length === 0 ? (
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? 'No encontramos conversaciones para esa búsqueda.'
                : 'Todavía no tenés conversaciones.'}
            </Text>
          ) : (
            visibleConversations.map((conversation) => (
              <SwipeableRow
                key={conversation.id}
                isOpen={openRowId === conversation.id}
                onOpen={() => setOpenRowId(conversation.id)}
                onClose={() =>
                  setOpenRowId((current) =>
                    current === conversation.id ? null : current,
                  )
                }
                onDelete={() => {
                  void handleDelete(conversation.id);
                }}
              >
                <Pressable
                  style={styles.conversationRow}
                  onPress={() => {
                    setOpenRowId(null);
                    navigation.navigate('Chat', {
                      conversationId: conversation.id,
                    });
                  }}
                >
                  {conversation.avatarUrl ? (
                    <Image source={{ uri: conversation.avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatar} />
                  )}
                  <View style={styles.conversationBody}>
                    <View style={styles.conversationTop}>
                      <Text style={styles.conversationName} numberOfLines={1}>
                        {conversation.name}
                      </Text>
                      <Text style={styles.conversationTime}>{conversation.time}</Text>
                    </View>
                    <View style={styles.conversationBottom}>
                      <Text style={styles.conversationPreview} numberOfLines={1}>
                        {conversation.preview}
                      </Text>
                      {conversation.unread > 0 ? (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{conversation.unread}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              </SwipeableRow>
            ))
          )}
        </ScrollView>
      </View>

      <PlayerTabBar activeTab="messages" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.homeHeader,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  panel: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 14,
    backgroundColor: '#F3F3F3',
    borderRadius: 22,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  emptyText: {
    marginTop: 32,
    marginHorizontal: 16,
    color: '#8A8A8A',
    fontSize: 14,
    textAlign: 'center',
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.inputBackground,
  },
  conversationBody: {
    flex: 1,
  },
  conversationTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  conversationName: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  conversationTime: {
    color: '#8A8A8A',
    fontSize: 12,
  },
  conversationBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  conversationPreview: {
    flex: 1,
    color: '#8A8A8A',
    fontSize: 13,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
