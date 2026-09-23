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
import { usePlayerMessages } from '../context/PlayerMessagesContext';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

export function ChatScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const route = useRoute<RouteProp<AuthStackParamList, 'Chat'>>();
  const { conversations, sendMessage } = usePlayerMessages();
  const [draft, setDraft] = useState('');
  const conversation = conversations.find(
    (item) => item.id === route.params.conversationId,
  );

  if (!conversation) {
    return (
      <View style={[styles.root, { backgroundColor: brand.header }]}>
        <StatusBar style="light" />
        <View style={styles.missing}>
          <Text style={styles.missingText}>Esta conversación ya no está disponible.</Text>
          <Pressable
            onPress={() => navigation.navigate('Messages', { initialTab: 'all' })}
          >
            <Text style={styles.backLink}>Volver a Mensajes</Text>
          </Pressable>
        </View>
        <PlayerTabBar activeTab="messages" />
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
          onPress={() => navigation.navigate('Messages', { initialTab: 'all' })}
        >
          <FontAwesome5 name="arrow-left" size={16} color="#FFFFFF" />
        </Pressable>
        <Pressable
          style={styles.headerCenter}
          onPress={() => {
            if (conversation.profileId) {
              navigation.push('Profile', { userId: conversation.profileId });
            }
          }}
        >
          {conversation.avatarUrl ? (
            <Image source={{ uri: conversation.avatarUrl }} style={styles.headerAvatar} />
          ) : conversation.avatar ? (
            <Image source={conversation.avatar} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatar} />
          )}
          <View>
            <Text style={styles.headerName}>{conversation.name}</Text>
            <Text style={styles.headerRole}>{conversation.role}</Text>
          </View>
        </Pressable>
        <View style={styles.headerSide}>
          <FontAwesome5 name="ellipsis-v" size={16} color="#FFFFFF" />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messages}
        >
          <View style={styles.dayPill}>
            <Text style={styles.dayText}>Hoy</Text>
          </View>
          {conversation.messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.bubbleWrap,
                message.fromMe ? styles.bubbleWrapMine : styles.bubbleWrapTheirs,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  message.fromMe ? styles.bubbleMine : styles.bubbleTheirs,
                ]}
              >
                <Text
                  style={message.fromMe ? styles.bubbleTextMine : styles.bubbleTextTheirs}
                >
                  {message.text}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.messageTime}>{message.time}</Text>
                {message.fromMe ? (
                  <FontAwesome5
                    name="check-double"
                    size={10}
                    color={message.status === 'read' ? colors.homeHeader : '#8A8A8A'}
                  />
                ) : null}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.composer}>
          <FontAwesome5 name="paperclip" size={16} color="#8A8A8A" />
          <TextInput
            style={styles.composerInput}
            placeholder="Escribí tu mensaje acá..."
            placeholderTextColor="#8A8A8A"
            value={draft}
            onChangeText={setDraft}
          />
            <Pressable
              style={[styles.sendButton, { backgroundColor: brand.header }]}
            onPress={() => {
              sendMessage(conversation.id, draft);
              setDraft('');
            }}
          >
            <FontAwesome5 name="paper-plane" size={14} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  headerSide: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.homeHeaderAlt,
  },
  headerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerRole: {
    color: colors.homeMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  chatWrap: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messages: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  dayPill: {
    alignSelf: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F3F3',
  },
  dayText: {
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '600',
  },
  bubbleWrap: {
    maxWidth: '78%',
    marginBottom: 12,
  },
  bubbleWrapMine: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubbleWrapTheirs: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: colors.homeHeader,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: '#F3F3F3',
    borderBottomLeftRadius: 4,
  },
  bubbleTextMine: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextTheirs: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  messageTime: {
    color: '#8A8A8A',
    fontSize: 11,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
  },
  composerInput: {
    flex: 1,
    height: 42,
    paddingHorizontal: 14,
    backgroundColor: '#F3F3F3',
    borderRadius: 21,
    color: colors.text,
    fontSize: 14,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  missingText: {
    marginBottom: 12,
    color: colors.text,
    fontSize: 16,
  },
  backLink: {
    color: colors.homeHeader,
    fontSize: 14,
    fontWeight: '700',
  },
});
