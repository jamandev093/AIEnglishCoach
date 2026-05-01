import { Tabs, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { TouchableOpacity, Image } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  subscribeProfileUpdate,
  unsubscribeProfileUpdate,
} from "../../src/utils/eventBus";
export default function TabLayout() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
  loadProfile();

  const refresh = () => loadProfile();

  subscribeProfileUpdate(refresh);

  return () => {
    unsubscribeProfileUpdate(refresh);
  };
}, []);

  const loadProfile = async () => {
    const img = await AsyncStorage.getItem("profileImage");
    if (img) setProfileImage(img);
    else setProfileImage("");
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2a9d8f",
        headerTitleAlign: "center",

        // 🔥 PROFILE (LEFT)
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.push("/profile")}
            style={{ marginLeft: 15 }}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 20,
                }}
              />
            ) : (
              <MaterialIcons name="account-circle" size={30} color="#000" />
            )}
          </TouchableOpacity>
        ),

        // 🔥 SETTINGS (RIGHT)
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            style={{ marginRight: 15 }}
          >
            <MaterialIcons name="settings" size={26} color="#000" />
          </TouchableOpacity>
        ),
      }}
    >
      {/* 🏠 Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={24} color={color} />
          ),
        }}
      />

      {/* 🎤 Speaking */}
      <Tabs.Screen
        name="speaking"
        options={{
          title: "Speaking",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="keyboard-voice" size={24} color={color} />
          ),
        }}
      />

      {/* 📊 Progress */}
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="bar-chart" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}