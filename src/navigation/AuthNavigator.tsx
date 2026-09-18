import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PlayerTrialsProvider } from '../context/PlayerTrialsContext';
import { CreateProfileScreen } from '../screens/CreateProfileScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { TrialDetailScreen } from '../screens/TrialDetailScreen';
import { TrialsScreen } from '../screens/TrialsScreen';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <PlayerTrialsProvider>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Trials" component={TrialsScreen} />
        <Stack.Screen name="TrialDetail" component={TrialDetailScreen} />
      </Stack.Navigator>
    </PlayerTrialsProvider>
  );
}
