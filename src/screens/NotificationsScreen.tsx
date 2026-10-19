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
  View,
} from 'react-native';

import { PlayerTabBar } from '../components/PlayerTabBar';
import { UserProfile } from '../data/playerProfiles';
import { fetchPublicUserProfile } from '../lib/directory';
import {
  fetchMyRepresentationNotifications,
  markAllRepresentationNotificationsAsRead,
  markRepresentationNotificationAsRead,
  NotificacionRepresentacion,
  TipoNotificacionRepresentacion,
} from '../lib/notificaciones';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

type NotificationRow = NotificacionRepresentacion & {
  sender?: UserProfile;
};

function notificationCopy(
  tipo: TipoNotificacionRepresentacion,
  sender: UserProfile | undefined,
) {
  const name = sender?.name?.trim() || 'Un usuario';
  if (tipo === 'solicitud_aceptada') {
    return `${name} aceptó tu solicitud de representación`;
  }
  if (tipo === 'solicitud_rechazada') {
    return `${name} rechazó tu solicitud de representación`;
  }
  if (sender?.kind === 'agent') {
    return `${name} quiere representarte`;
  }
  return `Tenés una nueva solicitud de representación de ${name}`;
}

export function NotificationsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const brand = useBrandColors();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  const loadNotifications = useCallback(async (cancelled?: { current: boolean }) => {
    const result = await fetchMyRepresentationNotifications();
    if (cancelled?.current) {
      return;
    }
    if (!result.ok) {
      setNotifications([]);
      Alert.alert('No se pudieron cargar las notificaciones', result.message);
      return;
    }

    const hydrated = await Promise.all(
      result.data.map(async (item) => {
        const sender = await fetchPublicUserProfile(item.fk_emisor);
        return {
          ...item,
          sender: sender ?? undefined,
        } satisfies NotificationRow;
      }),
    );
    if (!cancelled?.current) {
      setNotifications(hydrated);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const cancelled = { current: false };
      void loadNotifications(cancelled);
      return () => {
        cancelled.current = true;
      };
    }, [loadNotifications]),
  );

  async function handleOpen(notification: NotificationRow) {
    if (!notification.leido) {
      const result = await markRepresentationNotificationAsRead(
        notification.id_notificacion,
      );
      if (result.ok) {
        setNotifications((current) =>
          current.map((item) =>
            item.id_notificacion === notification.id_notificacion
              ? { ...item, leido: true }
              : item,
          ),
        );
      }
    }

    if (!notification.fk_emisor || notification.fk_emisor === 'me') {
      return;
    }
    navigation.push('Profile', { userId: notification.fk_emisor });
  }

  async function handleMarkAllRead() {
    const result = await markAllRepresentationNotificationsAsRead();
    if (!result.ok) {
      Alert.alert('No se pudieron marcar como leídas', result.message);
      return;
    }
    setNotifications((current) =>
      current.map((item) => ({ ...item, leido: true })),
    );
  }

  const hasUnread = notifications.some((item) => !item.leido);

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
        <Text style={styles.headerTitle}>Notificaciones</Text>
        {hasUnread ? (
          <Pressable style={styles.headerSide} onPress={() => void handleMarkAllRead()}>
            <FontAwesome5 name="check-double" size={16} color="#FFFFFF" />
          </Pressable>
        ) : (
          <View style={styles.headerSide} />
        )}
      </View>

      <View style={styles.panel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {notifications.length === 0 ? (
            <Text style={styles.emptyText}>
              Todavía no tenés notificaciones de representación.
            </Text>
          ) : (
            notifications.map((notification) => (
              <Pressable
                key={notification.id_notificacion}
                style={[
                  styles.row,
                  !notification.leido && styles.rowUnread,
                ]}
                onPress={() => {
                  void handleOpen(notification);
                }}
              >
                {notification.sender?.photoUrl ? (
                  <Image
                    source={{ uri: notification.sender.photoUrl }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatar} />
                )}
                <View style={styles.body}>
                  <Text style={styles.copy}>
                    {notificationCopy(notification.tipo, notification.sender)}
                  </Text>
                </View>
                {notification.leido ? null : <View style={styles.unreadDot} />}
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>

      <PlayerTabBar activeTab="home" />
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
  list: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyText: {
    marginTop: 32,
    marginHorizontal: 16,
    color: '#8A8A8A',
    fontSize: 14,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowUnread: {
    backgroundColor: '#F3F6F4',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.inputBackground,
  },
  body: {
    flex: 1,
  },
  copy: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.homeHeader,
  },
});
