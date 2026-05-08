import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  defaultProfile,
  getProfile,
  ProfileData,
} from "../utils/profileStore";

export default function ProfileHeaderButton() {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        const savedProfile = await getProfile();
        setProfile(savedProfile);
      };

      loadProfile();
    }, [])
  );

  const initials = profile.name.trim().slice(0, 2).toUpperCase() || "EL";

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => router.push("/profile" as any)}
      activeOpacity={0.85}
    >
      {profile.imageUri ? (
        <Image source={{ uri: profile.imageUri }} style={styles.image} />
      ) : (
        <View style={styles.initialsBox}>
          <Text style={styles.initialsText}>{initials}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginLeft: 14,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  image: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },

  initialsBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#8499DC",
    alignItems: "center",
    justifyContent: "center",
  },

  initialsText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
});