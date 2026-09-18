import { FontAwesome5 } from '@expo/vector-icons';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
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
import { usePlayerMessages } from '../context/PlayerMessagesContext';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { matchesSearch } from '../utils/search';

type MessagesTab = 'all' | 'requests';

export function MessagesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'Messages'>>();
  const { conversations, requests, deleteConversation, acceptRequest, rejectRequest } =
    usePlayerMessages();
  const [tab, setTab] = useState<MessagesTab>(route.params?.initialTab ?? 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  const visibleConversations = conversations.filter((conversation) =>
    matchesSearch(conversation.name, searchQuery),
  );
  const visibleRequests = requests.filter(
    (request) =>
      matchesSearch(request.name, searchQuery) ||
      matchesSearch(request.subtitle, searchQuery),
  );

  useFocusEffect(
    useCallback(() => {
      setTab(route.params?.initialTab ?? 'all');
      setOpenRowId(null);
    }, [route.params?.initialTab]),
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View
        style={[
          styles.header,
          Platform.OS === 'ios'
            ? { paddingTop: 58 }
            : { paddingTop: (RNStatusBar.currentHeight ?? 0) + 8 },
        ]}
      >
        <Text style={styles.headerTitle}>Mensajes</Text>
        <View style={styles.tabs}>
          <Pressable style={styles.tab} onPress={() => { setTab('all'); setOpenRowId(null); }}>
            <Text style={[styles.tabLabel, tab === 'all' && styles.tabLabelActive]}>
              Todas
            </Text>
            {tab === 'all' ? <View style={styles.tabUnderline} /> : <View style={styles.tabSpacer} />}
          </Pressable>
          <Pressable style={styles.tab} onPress={() => { setTab('requests'); setOpenRowId(null); }}>
            <Text
              style={[styles.tabLabel, tab === 'requests' && styles.tabLabelActive]}
            >
              Solicitudes
            </Text>
            {tab === 'requests' ? (
              <View style={styles.tabUnderline} />
            ) : (
              <View style={styles.tabSpacer} />
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.searchBox}>
          <FontAwesome5 name="search" size={14} color="#8A8A8A" />
          <TextInput
            style={styles.searchInput}
            placeholder={
              tab === 'all' ? 'Buscar conversaciones...' : 'Buscar solicitudes...'
            }
            placeholderTextColor="#8A8A8A"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setOpenRowId(null);
            }}
            onFocus={() => setOpenRowId(null)}
          />
        </View>

        {tab === 'all' ? (
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
                    deleteConversation(conversation.id);
                    setOpenRowId(null);
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
                    <Image source={conversation.avatar} style={styles.avatar} />
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
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.requestsList}
          >
            {visibleRequests.length === 0 ? (
              <Text style={styles.emptyText}>
                {searchQuery.trim()
                  ? 'No encontramos solicitudes para esa búsqueda.'
                  : 'No tenés solicitudes pendientes.'}
              </Text>
            ) : (
              visibleRequests.map((request) => (
                <View key={request.id} style={styles.requestRow}>
                  <Image source={request.avatar} style={styles.avatar} />
                  <View style={styles.requestBody}>
                    <Text style={styles.conversationName}>{request.name}</Text>
                    <Text style={styles.requestRole}>{request.role}</Text>
                    <Text style={styles.requestSubtitle}>{request.subtitle}</Text>
                  </View>
                  <Pressable
                    style={styles.acceptButton}
                    onPress={() => acceptRequest(request.id)}
                  >
                    <FontAwesome5 name="check" size={14} color="#FFFFFF" />
                  </Pressable>
                  <Pressable
                    style={styles.rejectButton}
                    onPress={() => rejectRequest(request.id)}
                  >
                    <FontAwesome5 name="times" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))
            )}
            <View style={styles.infoBox}>
              <FontAwesome5 name="user-plus" size={16} color={colors.homeHeader} />
              <Text style={styles.infoText}>
                Aceptá solicitudes para poder empezar a chatear.
              </Text>
            </View>
          </ScrollView>
        )}
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
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabLabel: {
    color: colors.homeMuted,
    fontSize: 15,
    fontWeight: '600',
    paddingBottom: 8,
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  tabUnderline: {
    width: '100%',
    height: 3,
    backgroundColor: colors.homeAccent,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  tabSpacer: {
    height: 3,
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
  requestsList: {
    paddingBottom: 20,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  requestBody: {
    flex: 1,
  },
  requestRole: {
    marginTop: 2,
    color: '#4A4A4A',
    fontSize: 12,
  },
  requestSubtitle: {
    marginTop: 1,
    color: '#8A8A8A',
    fontSize: 12,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E8B57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#F3F6F4',
    borderRadius: 16,
  },
  infoText: {
    flex: 1,
    color: '#4A4A4A',
    fontSize: 13,
  },
});
