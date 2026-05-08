import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import React, { useMemo, useState } from "react";
import { addActivity } from "../src/utils/activityHistory";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type FearType = {
  id: string;
  title: string;
  subtitle: string;
  coachLine: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type CourageMission = {
  id: string;
  title: string;
  situation: string;
  userLine: string;
  strongerLine: string;
  level: string;
  focus: string;
};

type RescueLine = {
  line: string;
  use: string;
};

const ACTION_COLOR = "#8499DC";

const fears: FearType[] = [
  {
    id: "mistakes",
    title: "Afraid of mistakes",
    subtitle: "I feel people will judge my English.",
    coachLine: "Mistakes are allowed here. Your job is to speak first.",
    icon: "alert-circle-outline",
  },
  {
    id: "blank",
    title: "Mind goes blank",
    subtitle: "I forget words when someone talks to me.",
    coachLine: "We will train rescue lines so you never fully stop.",
    icon: "flash-outline",
  },
  {
    id: "laugh",
    title: "People may laugh",
    subtitle: "I feel shy speaking in front of others.",
    coachLine: "Confidence grows when you speak safely again and again.",
    icon: "people-outline",
  },
  {
    id: "pressure",
    title: "Pressure speaking",
    subtitle: "I cannot answer quickly.",
    coachLine: "We will start slow, then build speed step by step.",
    icon: "timer-outline",
  },
];

const missions: CourageMission[] = [
  {
    id: "intro",
    title: "Introduce Yourself",
    situation: "Someone asks: Tell me about yourself.",
    userLine: "My name is Rahul. I am learning English.",
    strongerLine: "My name is Rahul, and I am practicing English to speak confidently.",
    level: "Comfort",
    focus: "Start without fear",
  },
  {
    id: "market",
    title: "Ask Price",
    situation: "You are in a market. Ask the shopkeeper the price.",
    userLine: "What is the price?",
    strongerLine: "Excuse me, what is the price of this?",
    level: "Comfort",
    focus: "Speak to stranger",
  },
  {
    id: "repeat",
    title: "Ask to Repeat",
    situation: "Someone speaks fast. You did not understand.",
    userLine: "Please repeat.",
    strongerLine: "Could you repeat that slowly, please?",
    level: "Challenge",
    focus: "Freeze recovery",
  },
  {
    id: "opinion",
    title: "Give Opinion",
    situation: "Your manager asks: What do you think?",
    userLine: "I think this is good.",
    strongerLine: "I think this is a good idea because it can save time.",
    level: "Brave",
    focus: "Speak under pressure",
  },
];

const rescueLines: RescueLine[] = [
  {
    line: "Let me think for a second.",
    use: "Use when your mind goes blank.",
  },
  {
    line: "Could you repeat that slowly, please?",
    use: "Use when someone speaks too fast.",
  },
  {
    line: "I am still learning English.",
    use: "Use when you feel nervous.",
  },
  {
    line: "What I want to say is...",
    use: "Use when you need time to continue.",
  },
  {
    line: "Sorry, I forgot the word.",
    use: "Use when one word is missing.",
  },
];

const ladderSteps = [
  "Repeat one sentence",
  "Say from memory",
  "Answer one question",
  "Speak for 20 seconds",
  "Handle surprise question",
  "Speak with light pressure",
  "Real-world situation",
];

const comingSoonItems = [
  "Real microphone confidence practice",
  "AI teacher feedback after speaking",
  "Freeze detection and rescue suggestions",
  "Pressure timer mode",
  "Internal and external fear history",
  "Personal courage plan from activity history",
  "English-Only Practice Mode support",
];

export default function ConfidenceBuildingScreen() {
  const [selectedFear, setSelectedFear] = useState<FearType>(fears[0]);
  const [selectedMission, setSelectedMission] = useState<CourageMission>(
    missions[0]
  );
  const [practiceState, setPracticeState] = useState<
    "idle" | "speaking" | "done"
  >("idle");

  const couragePercent = 62;

  const coachMessage = useMemo(() => {
    if (practiceState === "idle") {
      return selectedFear.coachLine;
    }

    if (practiceState === "speaking") {
      return "Good. Speak slowly. Your goal is not perfect English. Your goal is to continue.";
    }

    return "You completed the attempt. That is confidence training. Now repeat once more with a calmer voice.";
  }, [practiceState, selectedFear]);

  const speakText = (text: string) => {
    if (!text.trim()) return;

    Speech.stop();
    Speech.speak(text, {
      language: "en-US",
      rate: 0.84,
    });
  };

     
  const handlePractice = async () => {
   if (practiceState === "idle") {
    setPracticeState("speaking");
    return;
  }

   if (practiceState === "speaking") {
    setPracticeState("done");

    await addActivity({
      type: "confidence",
      title: "Confidence mission",
      detail: `Practiced: ${selectedMission.title} — ${selectedMission.strongerLine}`,
      score: selectedMission.level === "Brave" ? 78 : selectedMission.level === "Challenge" ? 72 : 66,
      confidence: selectedMission.level === "Brave" ? 76 : selectedMission.level === "Challenge" ? 70 : 64,
      fluency: selectedMission.level === "Brave" ? 68 : selectedMission.level === "Challenge" ? 64 : 60,
      correctedSentence: selectedMission.strongerLine,
    });

    return;
  }

  setPracticeState("idle");
  };

  const practiceButtonText =
    practiceState === "idle"
      ? "Start Brave Practice"
      : practiceState === "speaking"
      ? "Finish Attempt"
      : "Try Again";

  const practiceButtonIcon =
    practiceState === "idle"
      ? "mic-outline"
      : practiceState === "speaking"
      ? "stop"
      : "refresh-outline";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Confidence Building</Text>

        <View style={styles.emptyBox} />
      </View>

      {/* Hero */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="shield-checkmark-outline" size={27} color={ACTION_COLOR} />
          </View>

          <View style={styles.heroTextBox}>
            <Text style={styles.heroLabel}>Fearless Speaking Coach</Text>
            <Text style={styles.heroTitle}>Speak without fear.</Text>
          </View>
        </View>

        <Text style={styles.heroText}>
          Train your mind and mouth together. Small speaking attempts become real
          confidence.
        </Text>

        <View style={styles.confidenceRow}>
          <View style={styles.confidenceTextBox}>
            <Text style={styles.confidenceLabel}>Current confidence</Text>
            <Text style={styles.confidenceValue}>{couragePercent}%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${couragePercent}%` }]}
            />
          </View>
        </View>
      </View>

      {/* Fear Check */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>What stops you today?</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.fearRow}
      >
        {fears.map((fear) => {
          const active = selectedFear.id === fear.id;

          return (
            <TouchableOpacity
              key={fear.id}
              style={[styles.fearCard, active && styles.fearCardActive]}
              onPress={() => {
                setSelectedFear(fear);
                setPracticeState("idle");
              }}
              activeOpacity={0.85}
            >
              <View style={styles.fearIcon}>
                <Ionicons name={fear.icon} size={22} color={ACTION_COLOR} />
              </View>

              <Text
                numberOfLines={1}
                style={[styles.fearTitle, active && styles.fearTitleActive]}
              >
                {fear.title}
              </Text>

              <Text numberOfLines={2} style={styles.fearSubtitle}>
                {fear.subtitle}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Coach Response */}
      <View style={styles.coachCard}>
        <View style={styles.coachIcon}>
          <MaterialCommunityIcons name="brain" size={23} color={ACTION_COLOR} />
        </View>

        <View style={styles.coachTextBox}>
          <Text style={styles.coachTitle}>Coach Response</Text>
          <Text style={styles.coachText}>{coachMessage}</Text>
        </View>
      </View>

      {/* Courage Mission */}
      <View style={styles.missionCard}>
        <View style={styles.missionTopRow}>
          <View style={styles.missionTitleBox}>
            <Text style={styles.missionLabel}>Today’s Courage Mission</Text>
            <Text style={styles.missionTitle}>{selectedMission.title}</Text>
          </View>

          <View style={styles.levelPill}>
            <Text style={styles.levelPillText}>{selectedMission.level}</Text>
          </View>
        </View>

        <View style={styles.situationBox}>
          <Text style={styles.boxLabel}>Situation</Text>
          <Text style={styles.situationText}>{selectedMission.situation}</Text>
        </View>

        <View style={styles.lineBox}>
          <Text style={styles.boxLabel}>Start with this</Text>
          <Text style={styles.simpleLine}>{selectedMission.userLine}</Text>
        </View>

        <View style={styles.strongerBox}>
          <Text style={styles.strongerLabel}>Stronger sentence</Text>
          <Text style={styles.strongerText}>{selectedMission.strongerLine}</Text>

          <TouchableOpacity
            style={styles.listenMiniButton}
            onPress={() => speakText(selectedMission.strongerLine)}
          >
            <Ionicons name="volume-high-outline" size={17} color={ACTION_COLOR} />
            <Text style={styles.listenMiniText}>Listen</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.practiceBox}>
          <View
            style={[
              styles.micCircle,
              practiceState === "speaking" && styles.micCircleActive,
            ]}
          >
            <Ionicons
              name={practiceState === "speaking" ? "mic" : "mic-outline"}
              size={28}
              color={practiceState === "speaking" ? "#FFFFFF" : ACTION_COLOR}
            />
          </View>

          <View style={styles.practiceTextBox}>
            <Text style={styles.practiceTitle}>
              {practiceState === "idle"
                ? "Ready for courage practice"
                : practiceState === "speaking"
                ? "Speaking attempt active"
                : "Attempt completed"}
            </Text>

            <Text style={styles.practiceText}>
              {practiceState === "idle"
                ? "Speak the stronger sentence aloud."
                : practiceState === "speaking"
                ? "Continue even if you make a mistake."
                : "You did the real work: you spoke."}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.listenButton}
            onPress={() => speakText(selectedMission.strongerLine)}
          >
            <Ionicons name="volume-high-outline" size={18} color={ACTION_COLOR} />
            <Text style={styles.listenButtonText}>Listen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.practiceButton,
              practiceState === "speaking" && styles.practiceButtonActive,
            ]}
            onPress={handlePractice}
            activeOpacity={0.85}
          >
            <Ionicons name={practiceButtonIcon} size={18} color="#FFFFFF" />
            <Text style={styles.practiceButtonText}>{practiceButtonText}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mission Selector */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Choose Fear Situation</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.missionRow}
      >
        {missions.map((mission) => {
          const active = selectedMission.id === mission.id;

          return (
            <TouchableOpacity
              key={mission.id}
              style={[styles.smallMissionCard, active && styles.smallMissionActive]}
              onPress={() => {
                setSelectedMission(mission);
                setPracticeState("idle");
              }}
              activeOpacity={0.85}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.smallMissionTitle,
                  active && styles.smallMissionTitleActive,
                ]}
              >
                {mission.title}
              </Text>

              <Text numberOfLines={2} style={styles.smallMissionText}>
                {mission.focus}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Freeze Recovery */}
      <View style={styles.rescueCard}>
        <View style={styles.rescueTopRow}>
          <View style={styles.rescueIcon}>
            <Ionicons name="flash-outline" size={23} color={ACTION_COLOR} />
          </View>

          <View style={styles.rescueTitleBox}>
            <Text style={styles.rescueTitle}>Freeze Recovery Lines</Text>
            <Text style={styles.rescueSubtitle}>
              Use these when your mind goes blank.
            </Text>
          </View>
        </View>

        {rescueLines.map((item) => (
          <TouchableOpacity
            key={item.line}
            style={styles.rescueLine}
            onPress={() => speakText(item.line)}
            activeOpacity={0.85}
          >
            <View style={styles.rescueTextBox}>
              <Text style={styles.rescueLineText}>{item.line}</Text>
              <Text style={styles.rescueUseText}>{item.use}</Text>
            </View>

            <Ionicons name="volume-high-outline" size={19} color="#94A3B8" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Courage Ladder */}
      <View style={styles.ladderCard}>
        <View style={styles.ladderTopRow}>
          <View>
            <Text style={styles.ladderTitle}>Courage Ladder</Text>
            <Text style={styles.ladderSubtitle}>
              Confidence grows step by step.
            </Text>
          </View>

          <View style={styles.ladderBadge}>
            <Text style={styles.ladderBadgeText}>Level 3</Text>
          </View>
        </View>

        <View style={styles.ladderList}>
          {ladderSteps.map((step, index) => {
            const completed = index < 3;
            const current = index === 3;

            return (
              <View key={step} style={styles.ladderRow}>
                <View
                  style={[
                    styles.ladderDot,
                    completed && styles.ladderDotDone,
                    current && styles.ladderDotCurrent,
                  ]}
                >
                  {completed && (
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  )}
                </View>

                <Text
                  style={[
                    styles.ladderStepText,
                    completed && styles.ladderStepDone,
                    current && styles.ladderStepCurrent,
                  ]}
                >
                  {step}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Coming Soon */}
      <View style={styles.futureCard}>
        <View style={styles.futureHeaderRow}>
          <View style={styles.futureIcon}>
            <Ionicons name="sparkles-outline" size={22} color={ACTION_COLOR} />
          </View>

          <View style={styles.futureTitleBox}>
            <Text style={styles.futureTitle}>Coming Soon</Text>
            <Text style={styles.futureSubtitle}>
              Confidence Building will become an AI fear-killing speaking coach.
            </Text>
          </View>
        </View>

        <View style={styles.futureList}>
          {comingSoonItems.map((item) => (
            <View key={item} style={styles.futureItemRow}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={ACTION_COLOR}
              />
              <Text style={styles.futureItemText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 18,
    paddingBottom: 110,
  },

  header: {
    marginTop: 8,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },

  emptyBox: {
    width: 42,
    height: 42,
  },

  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  heroTextBox: {
    flex: 1,
  },

  heroLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "800",
    marginBottom: 3,
  },

  heroTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
  },

  heroText: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 22,
    color: "#334155",
    fontWeight: "700",
  },

  confidenceRow: {
    marginTop: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  confidenceTextBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  confidenceLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "800",
  },

  confidenceValue: {
    fontSize: 13,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: ACTION_COLOR,
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },

  fearRow: {
    gap: 10,
    paddingRight: 18,
    marginBottom: 18,
  },

  fearCard: {
    width: 190,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  fearCardActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  fearIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  fearTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 5,
  },

  fearTitleActive: {
    color: ACTION_COLOR,
  },

  fearSubtitle: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    fontWeight: "600",
  },

  coachCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    marginBottom: 18,
  },

  coachIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  coachTextBox: {
    flex: 1,
  },

  coachTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 5,
  },

  coachText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#334155",
    fontWeight: "700",
  },

  missionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  missionTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  missionTitleBox: {
    flex: 1,
    paddingRight: 10,
  },

  missionLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "800",
    marginBottom: 4,
  },

  missionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },

  levelPill: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  levelPillText: {
    fontSize: 12,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  situationBox: {
    marginTop: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  boxLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "900",
    marginBottom: 5,
  },

  situationText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "800",
    color: "#0F172A",
  },

  lineBox: {
    marginTop: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  simpleLine: {
    fontSize: 17,
    lineHeight: 25,
    color: "#0F172A",
    fontWeight: "900",
  },

  strongerBox: {
    marginTop: 12,
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },

  strongerLabel: {
    fontSize: 12,
    color: ACTION_COLOR,
    fontWeight: "900",
    marginBottom: 6,
  },

  strongerText: {
    fontSize: 17,
    lineHeight: 25,
    color: "#0F172A",
    fontWeight: "900",
  },

  listenMiniButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
  },

  listenMiniText: {
    marginLeft: 5,
    fontSize: 12,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  practiceBox: {
    marginTop: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },

  micCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  micCircleActive: {
    backgroundColor: ACTION_COLOR,
    borderColor: ACTION_COLOR,
  },

  practiceTextBox: {
    flex: 1,
  },

  practiceTitle: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 4,
  },

  practiceText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "700",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  listenButton: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  listenButtonText: {
    color: ACTION_COLOR,
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 7,
  },

  practiceButton: {
    flex: 1.25,
    height: 48,
    borderRadius: 15,
    backgroundColor: ACTION_COLOR,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  practiceButtonActive: {
    backgroundColor: "#111827",
  },

  practiceButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 7,
  },

  missionRow: {
    gap: 10,
    paddingRight: 18,
    marginBottom: 18,
  },

  smallMissionCard: {
    width: 178,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  smallMissionActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  smallMissionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 5,
  },

  smallMissionTitleActive: {
    color: ACTION_COLOR,
  },

  smallMissionText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "700",
  },

  rescueCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  rescueTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  rescueIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  rescueTitleBox: {
    flex: 1,
  },

  rescueTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 3,
  },

  rescueSubtitle: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    fontWeight: "600",
  },

  rescueLine: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  rescueTextBox: {
    flex: 1,
    paddingRight: 8,
  },

  rescueLineText: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 4,
  },

  rescueUseText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "600",
  },

  ladderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  ladderTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  ladderTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },

  ladderSubtitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },

  ladderBadge: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  ladderBadgeText: {
    fontSize: 12,
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  ladderList: {
    marginTop: 16,
  },

  ladderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
  },

  ladderDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  ladderDotDone: {
    backgroundColor: ACTION_COLOR,
  },

  ladderDotCurrent: {
    backgroundColor: "#EEF2FF",
    borderWidth: 2,
    borderColor: ACTION_COLOR,
  },

  ladderStepText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "700",
  },

  ladderStepDone: {
    color: "#0F172A",
    fontWeight: "900",
  },

  ladderStepCurrent: {
    color: ACTION_COLOR,
    fontWeight: "900",
  },

  futureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
  },

  futureHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  futureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  futureTitleBox: {
    flex: 1,
  },

  futureTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 3,
  },

  futureSubtitle: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    fontWeight: "600",
  },

  futureList: {
    gap: 9,
  },

  futureItemRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  futureItemText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#334155",
    fontWeight: "700",
  },
});