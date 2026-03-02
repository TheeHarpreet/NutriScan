import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ScanScreen from "./src/screens/ScanScreen";
import SearchScreen from "./src/screens/SearchScreen";
import FavouritesScreen from "./src/screens/FavouritesScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import ProductScreen from "./src/screens/ProductScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { initDb } from "./src/services/database";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#22c55e",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          backgroundColor: "#020617",
          borderTopColor: "#1f2937",
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Scan") iconName = "barcode-outline";
          else if (route.name === "History") iconName = "time-outline";
          else if (route.name === "Search") iconName = "search-outline";
          else if (route.name === "Favourites") iconName = "heart-outline";
          else if (route.name === "Settings") iconName = "settings-outline";
          else iconName = "ellipse-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Favourites" component={FavouritesScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    initDb();
  }, []);
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Product" component={ProductScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
