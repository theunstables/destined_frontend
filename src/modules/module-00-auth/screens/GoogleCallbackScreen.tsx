import { useEffect, useState } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import * as SplashScreen from 'expo-splash-screen'
import { googleFlowActive } from '@/services/auth/google'

export function GoogleCallbackScreen() {
  const router = useRouter()
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    void SplashScreen.hideAsync()
    if (Platform.OS === 'web') {
      try { setFailed(WebBrowser.maybeCompleteAuthSession().type === 'failed') }
      catch { setFailed(true) }
    } else setFailed(!googleFlowActive())
  }, [])
  return (
    <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Text accessibilityRole="header">Google sign-in</Text>
      <Text accessibilityRole={failed ? 'alert' : undefined}>{failed ? 'This sign-in session has expired. Please start again.' : 'Completing sign-in...'}</Text>
      {failed ? <Pressable accessibilityRole="link" onPress={() => {
        if (Platform.OS === 'web') window.location.assign('/sign-in')
        else router.replace('/(auth)/sign-in')
      }}><Text>Back to sign in</Text></Pressable> : null}
    </View>
  )
}