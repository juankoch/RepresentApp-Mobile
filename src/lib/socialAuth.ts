import { supabase } from './supabase';

export type SocialProvider = 'google';

function oauthRedirectUri() {
  // Expo Go cannot intercept exp:// in Safari. The in-app WebView catches
  // this localhost callback instead of trying to open the system browser.
  return 'http://localhost:3000/auth/callback';
}

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

function hostFromUrl(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    const match = /^(?:[a-z][a-z0-9+.-]*):\/\/([^/:?#]+)/i.exec(url);
    return match?.[1] ?? '';
  }
}

export function isOAuthCallbackUrl(url: string) {
  if (!url) {
    return false;
  }

  if (url.startsWith('exp://') || url.startsWith('representapp://')) {
    return true;
  }

  const host = hostFromUrl(url);
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)
  );
}

export async function getSocialAuthUrl(provider: SocialProvider) {
  const redirectTo = oauthRedirectUri();
  console.log('[auth] oauth redirectTo', provider, redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    throw error;
  }
  if (!data.url) {
    throw new Error('No se pudo iniciar el login social.');
  }

  console.log('[auth] oauth url', data.url.split('?')[0]);
  return data.url;
}

export async function completeSocialAuthFromUrl(url: string) {
  const host = hostFromUrl(url) || url.split('#')[0]?.split('?')[0];
  console.log('[auth] oauth callback', host);
  const params = paramsFromRedirectUrl(url);
  const errorCode =
    params.get('error_description') ||
    params.get('error') ||
    params.get('error_code');

  if (errorCode) {
    throw new Error(errorCode);
  }

  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw error;
    }
    return;
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken) {
    throw new Error('No se recibió el token de acceso.');
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken ?? '',
  });
  if (error) {
    throw error;
  }
}
