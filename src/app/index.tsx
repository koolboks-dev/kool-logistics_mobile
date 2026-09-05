import { Redirect } from 'expo-router';

import { useApp } from '@/store/app';

export default function Entry() {
  const { rider } = useApp();
  return <Redirect href={rider ? '/(tabs)/home' : '/(auth)/welcome'} />;
}
