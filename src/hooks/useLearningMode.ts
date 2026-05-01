import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLearningMode } from "../config/learningConfig";

export const useLearningMode = () => {
  const [mode, setMode] = useState<any>(null);

  useEffect(() => {
    loadMode();
  }, []);

  const loadMode = async () => {
    const level = (await AsyncStorage.getItem("level")) || "Beginner";
    const isAdvanced =
      JSON.parse((await AsyncStorage.getItem("advanced")) || "false");

    const result = getLearningMode(level, isAdvanced);

    setMode(result);
  };

  return mode;
};