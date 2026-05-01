import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Switch,
  Linking,
} from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import BackButton from "../src/components/BackButton";
import { emitProfileUpdate } from "../src/utils/eventBus";

export default function ProfileScreen() {
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gmail, setGmail] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [level, setLevel] = useState("Beginner");
  const [isAdvanced, setIsAdvanced] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  // 🔥 LOAD PROFILE
  const loadProfile = async () => {
    const savedName = await AsyncStorage.getItem("name");
    const savedPhone = await AsyncStorage.getItem("phone");
    const savedGmail = await AsyncStorage.getItem("gmail");
    const savedImage = await AsyncStorage.getItem("profileImage");
    const savedLevel = await AsyncStorage.getItem("level");
    const savedMode = await AsyncStorage.getItem("advanced");

    if (savedName) setName(savedName);
    if (savedPhone) setPhone(savedPhone);
    if (savedGmail) setGmail(savedGmail);
    if (savedImage) setImage(savedImage);
    if (savedLevel) setLevel(savedLevel);
    if (savedMode) setIsAdvanced(JSON.parse(savedMode));
  };

  // 🔥 SAVE PROFILE
  const handleSave = async () => {
    await AsyncStorage.setItem("name", name);
    await AsyncStorage.setItem("phone", phone);
    await AsyncStorage.setItem("gmail", gmail);
    await AsyncStorage.setItem("level", level);
    await AsyncStorage.setItem("advanced", JSON.stringify(isAdvanced));

    if (image) {
      await AsyncStorage.setItem("profileImage", image);
      emitProfileUpdate();
    }

    setIsEditing(false);
  };

  // 🔥 IMAGE PICKER
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      setImage(uri);
      await AsyncStorage.setItem("profileImage", uri);
      emitProfileUpdate();
    }
  };

  // 🔥 WHATSAPP CONTACT
  const openWhatsApp = () => {
    const phone = "91XXXXXXXXXX"; // 👉 replace with your number
    const message = "Hi, I need help with AI English Coach";

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    Linking.openURL(url);
  };

  return (
    <View style={{ flex: 1 }}>
      <BackButton />

      <View style={styles.container}>

        {/* Profile Image */}
        <TouchableOpacity onPress={pickImage}>
          <Image
            source={{
              uri: image || "https://via.placeholder.com/150",
            }}
            style={styles.image}
          />
        </TouchableOpacity>

        {/* Name */}
        {!isEditing && (
          <Text style={styles.name}>{name || "Enter Name"}</Text>
        )}

        {/* Info */}
        <View style={styles.infoBox}>

          {isEditing && (
            <>
              <Text style={styles.label}>Name</Text>
              <TextInput value={name} onChangeText={setName} style={styles.input} />
            </>
          )}

          <Text style={styles.label}>Phone</Text>
          {isEditing ? (
            <TextInput value={phone} onChangeText={setPhone} style={styles.input} />
          ) : (
            <Text style={styles.value}>{phone || "Enter Phone"}</Text>
          )}

          <Text style={styles.label}>Gmail</Text>
          {isEditing ? (
            <TextInput value={gmail} onChangeText={setGmail} style={styles.input} />
          ) : (
            <Text style={styles.value}>{gmail || "Enter Gmail"}</Text>
          )}

          {/* Level */}
          <Text style={styles.label}>Learning Level</Text>
          <View style={styles.levelRow}>
            {["Beginner", "Intermediate", "Pro"].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.levelBtn,
                  level === item && styles.levelActive,
                ]}
                onPress={() => setLevel(item)}
              >
                <Text
                  style={[
                    styles.levelText,
                    level === item && { color: "#fff" },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Edit / Save */}
        {!isEditing ? (
          <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        )}

        {/* Advanced Mode */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Advanced Mode</Text>
          <Switch value={isAdvanced} onValueChange={setIsAdvanced} />
        </View>

        {/* Subscription */}
        <View style={styles.paymentBox}>
          <Text style={styles.paymentTitle}>Subscription</Text>
          <Text style={styles.paymentStatus}>Free Plan</Text>

          <TouchableOpacity style={styles.upgradeBtn}>
            <Text style={styles.upgradeText}>Upgrade</Text>
          </TouchableOpacity>
        </View>

        {/* 🔥 CONTACT US */}
        <TouchableOpacity style={styles.contactBtn} onPress={openWhatsApp}>
          <Text style={styles.contactText}>💬 Contact Us (WhatsApp)</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 70,
    backgroundColor: "#fff",
  },

  image: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: "#ddd",
    marginBottom: 15,
  },

  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },

  infoBox: {
    width: "85%",
  },

  label: {
    fontSize: 13,
    color: "#888",
    marginTop: 12,
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
  },

  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 4,
    fontSize: 16,
  },

  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  levelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#eee",
  },

  levelActive: {
    backgroundColor: "#000",
  },

  levelText: {
    fontSize: 14,
  },

  editBtn: {
    marginTop: 20,
    backgroundColor: "#ddd",
    padding: 10,
    borderRadius: 6,
  },

  editText: {
    fontWeight: "600",
  },

  saveBtn: {
    marginTop: 20,
    backgroundColor: "#000",
    padding: 10,
    borderRadius: 6,
  },

  saveText: {
    color: "#fff",
  },

  switchRow: {
    width: "85%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },

  switchText: {
    fontSize: 16,
  },

  paymentBox: {
    width: "85%",
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f3f3f3",
    borderRadius: 10,
  },

  paymentTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  paymentStatus: {
    marginTop: 5,
  },

  upgradeBtn: {
    marginTop: 10,
    backgroundColor: "#000",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },

  upgradeText: {
    color: "#fff",
  },

  contactBtn: {
    marginTop: 20,
    backgroundColor: "#25D366",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  contactText: {
    color: "#fff",
    fontWeight: "600",
  },
});