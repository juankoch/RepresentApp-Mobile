import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

import { UserProfile } from '../data/playerProfiles';
import { fetchPublicUserProfile } from '../lib/directory';

export function usePublicProfile(userId?: string) {
  const [profile, setProfile] = useState<UserProfile | undefined>();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!userId || userId === 'me') {
        setProfile(undefined);
        return;
      }

      void fetchPublicUserProfile(userId).then((next) => {
        if (!cancelled) {
          setProfile(next ?? undefined);
        }
      });

      return () => {
        cancelled = true;
      };
    }, [userId]),
  );

  return profile;
}
