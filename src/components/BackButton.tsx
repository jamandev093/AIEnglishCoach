import { TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import Animated, { FadeInLeft } from "react-native-reanimated";

export default function BackButton() {
  const router = useRouter();

  return (
    <Animated.View
      entering={FadeInLeft.duration(300)}
      style={styles.wrapper}
    >
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <MaterialIcons name="arrow-back" size={22} color="#000" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 60,
    left: 15,
    zIndex: 10,
  },

  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },

    elevation: 5,
  },
});