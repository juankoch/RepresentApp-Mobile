import * as WebBrowser from 'expo-web-browser';

import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const PREMIUM_PRICE_ARS = 5;

type PreferenceResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  message?: string;
  error?: string;
};

type PaymentSearchResponse = {
  results?: Array<{
    id?: number;
    status?: string;
    external_reference?: string;
  }>;
};

export type MercadoPagoCheckoutResult =
  | { status: 'approved' }
  | { status: 'rejected' }
  | { status: 'pending' }
  | { status: 'cancelled' };

function mercadoPagoAccessToken() {
  const token = process.env.EXPO_PUBLIC_MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error(
      'Falta EXPO_PUBLIC_MERCADOPAGO_ACCESS_TOKEN en el archivo .env. Reiniciá Expo después de agregarlo.',
    );
  }
  return token;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function createPremiumPreference(userId: string) {
  const token = mercadoPagoAccessToken();
  const response = await fetch(
    'https://api.mercadopago.com/checkout/preferences',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${userId}-${Date.now()}`,
      },
      body: JSON.stringify({
        items: [
          {
            title: 'RepresentApp Premium',
            description: 'Suscripción mensual',
            quantity: 1,
            currency_id: 'ARS',
            unit_price: PREMIUM_PRICE_ARS,
          },
        ],
        external_reference: userId,
        statement_descriptor: 'REPRESENTAPP',
      }),
    },
  );

  const payload = (await response.json()) as PreferenceResponse;
  if (!response.ok) {
    throw new Error(
      payload.message ||
        payload.error ||
        `No se pudo crear el pago en Mercado Pago (${response.status}).`,
    );
  }

  const checkoutUrl = payload.init_point;
  if (!checkoutUrl) {
    throw new Error('Mercado Pago no devolvió la URL de checkout.');
  }

  console.log('[mercadopago] preference', payload.id, checkoutUrl.split('?')[0]);
  return checkoutUrl;
}

async function findLatestPaymentStatus(userId: string) {
  const token = mercadoPagoAccessToken();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (attempt > 0) {
      await wait(1500);
    }

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&external_reference=${encodeURIComponent(userId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      continue;
    }

    const payload = (await response.json()) as PaymentSearchResponse;
    const results = payload.results ?? [];
    console.log(
      '[mercadopago] payments',
      results.map((payment) => payment.status),
    );

    if (results.some((payment) => payment.status === 'approved')) {
      return 'approved' as const;
    }
    if (
      results.some(
        (payment) =>
          payment.status === 'pending' || payment.status === 'in_process',
      )
    ) {
      if (attempt === 3) {
        return 'pending' as const;
      }
      continue;
    }
    if (results.some((payment) => payment.status === 'rejected')) {
      if (attempt === 3) {
        return 'rejected' as const;
      }
    }
  }

  return 'cancelled' as const;
}

export async function payPremiumWithMercadoPago(): Promise<MercadoPagoCheckoutResult> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error(
      'No hay un usuario autenticado. Iniciá sesión e intentá de nuevo.',
    );
  }

  const userId = userData.user.id;
  const checkoutUrl = await createPremiumPreference(userId);

  await WebBrowser.openBrowserAsync(checkoutUrl, {
    showInRecents: true,
  });

  const status = await findLatestPaymentStatus(userId);
  console.log('[mercadopago] result', status);
  return { status };
}
