import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PlayerMessagesProvider } from '../context/PlayerMessagesContext';
import { PlayerTrialsProvider } from '../context/PlayerTrialsContext';
import { ChatScreen } from '../screens/ChatScreen';
import { CreateProfileScreen } from '../screens/CreateProfileScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { TrialDetailScreen } from '../screens/TrialDetailScreen';
import { TrialsScreen } from '../screens/TrialsScreen';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <PlayerTrialsProvider>
      <PlayerMessagesProvider>
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
          <Stack.Screen name="Messages" component={MessagesScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
        </Stack.Navigator>
      </PlayerMessagesProvider>
    </PlayerTrialsProvider>
  );
}
