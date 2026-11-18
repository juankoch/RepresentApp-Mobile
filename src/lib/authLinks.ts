import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

import { AuthStackParamList } from '../navigation/types';
import { supabase } from './supabase';

type AuthNavigation = {
  isReady: () => boolean;
  navigate: (name: keyof AuthStackParamList) => void;
};

export const AUTH_RESET_REDIRECT = 'representapp://auth/reset-password';
export const AUTH_CONFIRM_REDIRECT = 'representapp://auth/confirm';

type AuthLinkKind = 'none' | 'recovery' | 'signup' | 'session';

function paramsFromRedirectUrl(url: string) {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const parts: string[] = [];

  if (queryIndex >= 0) {
    const queryEnd = hashIndex >= 0 ? hashIndex : url.length;
    parts.push(url.slice(queryIndex + 1, queryEnd));
  }
  if (hashIndex >= 0) {
    parts.push(url.slice(hashIndex + 1));
  }

  return new URLSearchParams(parts.join('&'));
}

function authPath(url: string) {
  return url
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .split(/[?#]/)[0]
    .toLowerCase();
}

export function isAuthDeepLink(url: string) {
  if (!url.startsWith('representapp://')) {
    return false;
  }
  const path = authPath(url);
  return path.startsWith('auth/') || path.includes('reset-password');
}

export function emailSendErrorMessage(error: { message?: string; status?: number } | null) {
  const message = error?.message?.trim() || '';
  if (/rate limit|over_email_send_rate_limit/i.test(message)) {
    return 'Supabase limitó el envío de emails. Esperá un rato e intentá de nuevo.';
  }
  if (
    error?.status === 500 ||
    /error sending (recovery|confirmation|magic link) email/i.test(message)
  ) {
    return 'Supabase no pudo enviar el correo. En el dashboard: Authentication → Logs (Auth). Suele ser el límite del mailer gratis o falta SMTP.';
  }
  return message || 'No se pudo enviar el correo.';
}

export async function completeAuthDeepLink(
  url: string,
): Promise<{ kind: AuthLinkKind; message?: string }> {
  if (!isAuthDeepLink(url)) {
    return { kind: 'none' };
  }

  const params = paramsFromRedirectUrl(url);
  const errorCode =
    params.get('error_description') ||
    params.get('error') ||
    params.get('error_code');
  if (errorCode) {
    return { kind: 'none', message: errorCode };
  }

  const code = params.get('code');
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const type = (params.get('type') || '').toLowerCase();
  const path = authPath(url);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return { kind: 'none', message: error.message };
    }
  } else if (accessToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken ?? '',
    });
    if (error) {
      return { kind: 'none', message: error.message };
    }
  } else {
    return { kind: 'none' };
  }

  if (type === 'recovery' || path.includes('reset-password')) {
    return { kind: 'recovery' };
  }
  if (
    type === 'signup' ||
    type === 'email' ||
    type === 'magiclink' ||
    path.includes('confirm')
  ) {
    return { kind: 'signup' };
  }
  return { kind: 'session' };
}

export function bindAuthDeepLinks(navigationRef: AuthNavigation) {
  let queuedUrl: string | null = null;

  async function handleUrl(url: string | null) {
    if (!url || !isAuthDeepLink(url)) {
      return;
    }
    if (!navigationRef.isReady()) {
      queuedUrl = url;
      return;
    }

    const result = await completeAuthDeepLink(url);
    if (result.message && result.kind === 'none') {
      Alert.alert('No se pudo abrir el enlace', result.message);
      return;
    }
    if (result.kind === 'recovery') {
      navigationRef.navigate('ResetPassword');
      return;
    }
    if (result.kind === 'signup' || result.kind === 'session') {
      navigationRef.navigate('CreateProfile');
    }
  }

  const subscription = Linking.addEventListener('url', (event) => {
    void handleUrl(event.url);
  });
  void Linking.getInitialURL().then((url) => {
    void handleUrl(url);
  });

  return {
    flushQueued: () => {
      if (!queuedUrl) {
        return;
      }
      const url = queuedUrl;
      queuedUrl = null;
      void handleUrl(url);
    },
    remove: () => {
      subscription.remove();
    },
  };
}
