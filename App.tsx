import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { useEffect, useRef } from 'react';

import { bindAuthDeepLinks } from './src/lib/authLinks';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { AuthStackParamList } from './src/navigation/types';

const navigationRef = createNavigationContainerRef<AuthStackParamList>();

export default function App() {
  const bindingRef = useRef<ReturnType<typeof bindAuthDeepLinks> | null>(null);

  useEffect(() => {
    const binding = bindAuthDeepLinks(navigationRef);
    bindingRef.current = binding;
    binding.flushQueued();
    return () => {
      binding.remove();
      bindingRef.current = null;
    };
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        bindingRef.current?.flushQueued();
      }}
    >
      <AuthNavigator />
    </NavigationContainer>
  );
}
