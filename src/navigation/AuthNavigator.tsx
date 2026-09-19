import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PlayerMessagesProvider } from '../context/PlayerMessagesContext';
import { PlayerProfileProvider } from '../context/PlayerProfileContext';
import { PlayerTrialsProvider } from '../context/PlayerTrialsContext';
import { BlockUserScreen } from '../screens/BlockUserScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ConnectionRequestsScreen } from '../screens/ConnectionRequestsScreen';
import { ConnectionsScreen } from '../screens/ConnectionsScreen';
import { CreateProfileScreen } from '../screens/CreateProfileScreen';
import { DeleteAccountScreen } from '../screens/DeleteAccountScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { HighlightsScreen } from '../screens/HighlightsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { PeopleListScreen } from '../screens/PeopleListScreen';
import { PremiumScreen } from '../screens/PremiumScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RateUserScreen } from '../screens/RateUserScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ReportUserScreen } from '../screens/ReportUserScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TrialDetailScreen } from '../screens/TrialDetailScreen';
import { TrialsScreen } from '../screens/TrialsScreen';
import { UserOptionsScreen } from '../screens/UserOptionsScreen';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <PlayerProfileProvider>
      <PlayerTrialsProvider>
        <PlayerMessagesProvider>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
            />
            <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Trials" component={TrialsScreen} />
            <Stack.Screen name="TrialDetail" component={TrialDetailScreen} />
            <Stack.Screen name="Messages" component={MessagesScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen
              name="ConnectionRequests"
              component={ConnectionRequestsScreen}
            />
            <Stack.Screen name="Connections" component={ConnectionsScreen} />
            <Stack.Screen name="PeopleList" component={PeopleListScreen} />
            <Stack.Screen name="Premium" component={PremiumScreen} />
            <Stack.Screen name="UserOptions" component={UserOptionsScreen} />
            <Stack.Screen name="RateUser" component={RateUserScreen} />
            <Stack.Screen name="ReportUser" component={ReportUserScreen} />
            <Stack.Screen name="BlockUser" component={BlockUserScreen} />
            <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
            <Stack.Screen name="Highlights" component={HighlightsScreen} />
          </Stack.Navigator>
        </PlayerMessagesProvider>
      </PlayerTrialsProvider>
    </PlayerProfileProvider>
  );
}
