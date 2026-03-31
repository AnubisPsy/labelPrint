import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';

import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        {splashDone ? (
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        ) : (
          <SplashScreen onFinish={() => setSplashDone(true)} />
        )}
      </SafeAreaProvider>
    </Provider>
  );
}
