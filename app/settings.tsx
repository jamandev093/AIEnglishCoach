import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
  Linking,
} from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BackButton from "../src/components/BackButton";
import { MaterialIcons } from "@expo/vector-icons";

const languages = [
  "Hindi",
  "Bengali (India)",
  "Marathi",
  "Tamil",
  "Telugu",
  "Urdu (India)",
  "Gujarati",
];

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [nativeLang, setNativeLang] = useState("Hindi");
  const [showLangList, setShowLangList] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const notif = await AsyncStorage.getItem("notifications");
    const theme = await AsyncStorage.getItem("darkMode");
    const lang = await AsyncStorage.getItem("nativeLang");

    if (notif) setNotifications(JSON.parse(notif));
    if (theme) setDarkMode(JSON.parse(theme));
    if (lang) setNativeLang(lang);
  };

  const saveSettings = async () => {
    await AsyncStorage.setItem("notifications", JSON.stringify(notifications));
    await AsyncStorage.setItem("darkMode", JSON.stringify(darkMode));
    await AsyncStorage.setItem("nativeLang", nativeLang);

    Alert.alert("Saved", "Settings updated");
  };

  const resetProgress = async () => {
    await AsyncStorage.removeItem("analytics");
    Alert.alert("Reset", "Progress cleared");
  };

  const shareApp = async () => {
    await Share.share({
      message: "Try this AI English Coach app!",
    });
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  const deleteAccount = () => {
    Alert.alert("Delete Account", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: async () => {
          await AsyncStorage.clear();
          Alert.alert("Deleted");
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <BackButton />

      <View style={styles.container}>

        <Text style={styles.title}>Settings</Text>

        {/* 🔔 Notifications */}
        <View style={styles.card}>
          <Text style={styles.label}>Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
          />
        </View>

        {/* 🌐 Language */}
        <View style={styles.card}>
          <Text style={styles.label}>Language</Text>

          <Text style={styles.fixedLang}>✔ English (Default)</Text>

          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => setShowLangList(!showLangList)}
          >
            <Text>{nativeLang}</Text>
          </TouchableOpacity>

          {showLangList && (
            <View style={styles.langList}>
              {languages.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.langItem}
                  onPress={() => {
                    setNativeLang(item);
                    setShowLangList(false);
                  }}
                >
                  <Text>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 🌙 Dark Mode */}
        <View style={styles.card}>
          <Text style={styles.label}>Dark Mode</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>

        {/* 🔐 Permissions */}
        <TouchableOpacity style={styles.actionCard} onPress={openSettings}>
          <MaterialIcons name="security" size={20} />
          <Text style={styles.actionText}>Enable Mic & Bluetooth</Text>
        </TouchableOpacity>

        {/* 💾 Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
          <Text style={styles.saveText}>Save Settings</Text>
        </TouchableOpacity>

        {/* 🔁 Reset */}
        <TouchableOpacity style={styles.actionCard} onPress={resetProgress}>
          <MaterialIcons name="refresh" size={20} />
          <Text style={styles.actionText}>Reset Progress</Text>
        </TouchableOpacity>

        {/* 📤 Share */}
        <TouchableOpacity style={styles.actionCard} onPress={shareApp}>
          <MaterialIcons name="share" size={20} />
          <Text style={styles.actionText}>Share App</Text>
        </TouchableOpacity>

        {/* 🚪 Logout */}
        <TouchableOpacity style={styles.actionCard}>
          <MaterialIcons name="logout" size={20} />
          <Text style={styles.actionText}>Logout</Text>
        </TouchableOpacity>

        {/* ❌ Delete */}
        <TouchableOpacity style={styles.deleteCard} onPress={deleteAccount}>
          <MaterialIcons name="delete" size={20} color="red" />
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  label: {
    fontSize: 15,
  },

  fixedLang: {
    marginTop: 5,
    color: "#777",
  },

  selectBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 6,
  },

  langList: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 5,
  },

  langItem: {
    padding: 8,
  },

  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f3f3f3",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },

  actionText: {
    fontSize: 15,
  },

  deleteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffe5e5",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },

  deleteText: {
    color: "red",
    fontWeight: "bold",
  },

  saveBtn: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },

  saveText: {
    color: "#fff",
  },
});