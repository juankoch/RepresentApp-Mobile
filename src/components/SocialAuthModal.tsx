import { useRef } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { isOAuthCallbackUrl } from '../lib/socialAuth';
import { colors } from '../theme/colors';

type SocialAuthModalProps = {
  url: string | null;
  onClose: () => void;
  onCallback: (url: string) => void;
};

export function SocialAuthModal({
  url,
  onClose,
  onCallback,
}: SocialAuthModalProps) {
  const handledRef = useRef(false);

  function handleUrl(nextUrl?: string) {
    if (!nextUrl || handledRef.current || !isOAuthCallbackUrl(nextUrl)) {
      return;
    }

    handledRef.current = true;
    onCallback(nextUrl);
  }

  return (
    <Modal
      visible={Boolean(url)}
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => {
        handledRef.current = false;
      }}
    >
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={16}>
            <Text style={styles.close}>Cerrar</Text>
          </Pressable>
        </View>
        {url ? (
          <WebView
            source={{ uri: url }}
            originWhitelist={['*']}
            startInLoadingState
            setSupportMultipleWindows={false}
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.text} />
              </View>
            )}
            onShouldStartLoadWithRequest={(request) => {
              if (isOAuthCallbackUrl(request.url)) {
                handleUrl(request.url);
                return false;
              }
              return true;
            }}
            onNavigationStateChange={(navState) => {
              handleUrl(navState.url);
            }}
            onError={(event) => {
              handleUrl(event.nativeEvent.url);
            }}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  close: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
