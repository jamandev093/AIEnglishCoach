import { useLocalSearchParams } from "expo-router";
import SpeakingScreen from "../../src/screens/SpeakingScreen";


export default function SpeakingTab() {
  const { from } = useLocalSearchParams<{ from?: string }>();

  return <SpeakingScreen fromTopics={from === "topics"} />;
}