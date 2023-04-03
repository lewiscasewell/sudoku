/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {Session} from '@supabase/supabase-js';
import React, {useEffect, useState} from 'react';
import DatabaseProvider from '@nozbe/watermelondb/DatabaseProvider';
// import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {supabase} from './src/supabase';
import HomeScreen from './src/screens/home';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {LeaderboardScreen} from './src/screens/leaderboard';
import {ProfileScreen} from './src/screens/profile';
import Feather from 'react-native-vector-icons/Feather';
import {LoginScreen} from './src/screens/login';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {db} from './src/watermelondb';
import SudokuDetailScreen from './src/screens/sudoku-detail';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#000000',
    primary: '#fff',
    text: '#faf5ff',
    border: '#000000',
    notification: 'red',
    card: '#000000',
  },
};

const TabStack = createBottomTabNavigator();
const LoginStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const HomeStackRoot = () => (
  <HomeStack.Navigator initialRouteName="home">
    <HomeStack.Screen
      name="home"
      component={HomeScreen}
      options={{headerShown: false}}
    />
    <HomeStack.Screen
      name="SudokuDetail"
      component={SudokuDetailScreen}
      options={{
        headerBackTitleVisible: false,
        headerTitleStyle: {fontWeight: '900', fontSize: 24},
      }}
    />
  </HomeStack.Navigator>
);

const getMessages = async () => {
  const response = await fetch('http://localhost:8080');

  console.log('response', response);

  return response.json();
};

function App(): JSX.Element {
  const [userSession, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({data: {session}}) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    getMessages().then(response => {
      setMessage(response.message);
    });
  }, []);

  console.log('message', message);

  return (
    <DatabaseProvider database={db}>
      <GestureHandlerRootView style={{flex: 1}}>
        <NavigationContainer theme={theme}>
          <SafeAreaProvider>
            <StatusBar barStyle="light-content" />
            {userSession ? (
              <TabStack.Navigator
                initialRouteName="Home"
                screenOptions={{
                  headerShown: false,
                }}>
                <TabStack.Screen
                  name="Home"
                  component={HomeStackRoot}
                  options={{
                    tabBarIcon: item => (
                      <Feather
                        name="grid"
                        color={item.color}
                        size={item.size}
                      />
                    ),
                  }}
                />
                <TabStack.Screen
                  name="Wall of fame"
                  component={LeaderboardScreen}
                  options={{
                    tabBarIcon: item => (
                      <Feather
                        name="users"
                        color={item.color}
                        size={item.size}
                      />
                    ),
                  }}
                />
                <TabStack.Screen
                  name="Profile"
                  component={ProfileScreen}
                  options={{
                    tabBarIcon: item => (
                      <Feather
                        name="user"
                        color={item.color}
                        size={item.size}
                      />
                    ),
                  }}
                />
              </TabStack.Navigator>
            ) : (
              <LoginStack.Navigator screenOptions={{headerShown: false}}>
                <LoginStack.Screen name="Login" component={LoginScreen} />
              </LoginStack.Navigator>
            )}
          </SafeAreaProvider>
        </NavigationContainer>
      </GestureHandlerRootView>
    </DatabaseProvider>
  );
}

export default App;
