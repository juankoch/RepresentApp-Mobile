export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  CreateProfile: undefined;
  Home: undefined;
  Trials: { initialTab?: 'all' } | undefined;
  TrialDetail: { trialId: string };
  Messages: { initialTab?: 'all' | 'requests' };
  Chat: { conversationId: string };
};
