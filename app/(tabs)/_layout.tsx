import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import ProfileHeaderButton from "../../src/components/ProfileHeaderButton";

const ACTION_COLOR = "#8499DC";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitle: "AI English Coach",
        headerTitleAlign: "center",
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "900",
          color: "#0F172A",
        },
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerShadowVisible: false,
        headerLeft: () => <ProfileHeaderButton />,
        headerRight: () => (
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push("/settings" as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="settings-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
        ),
        tabBarActiveTintColor: ACTION_COLOR,
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="speaking"
        options={{
          title: "Speaking",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
});