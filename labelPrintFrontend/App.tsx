import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    </SafeAreaProvider>
  );
}
