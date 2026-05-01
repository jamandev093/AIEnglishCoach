import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SpeakingScreen from '../screens/SpeakingScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Speaking" component={SpeakingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;