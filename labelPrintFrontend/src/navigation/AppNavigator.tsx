import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { colors, typography } from '../theme';
import { RootStackParamList } from '../types';

import SearchScreen from '../screens/SearchScreen';
import PrintPreviewScreen from '../screens/PrintPreviewScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          ...typography.h3,
          color: colors.white,
        },
        headerBackTitle: 'Volver',
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Buscar artículo' }}
      />
      <Stack.Screen
        name="PrintPreview"
        component={PrintPreviewScreen}
        options={{ title: 'Imprimir etiqueta' }}
      />
    </Stack.Navigator>
  );
}
