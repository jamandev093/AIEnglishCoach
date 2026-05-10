import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const words = [
  { word: 'Hello', ipa: '/həˈloʊ/' },
  { word: 'World', ipa: '/wɜːrld/' },
  { word: 'Apple', ipa: '/ˈæpəl/' },
  { word: 'Teacher', ipa: '/ˈtiːtʃər/' },
  { word: 'Confidence', ipa: '/ˈkɒnfɪdəns/' },
];

const SIZE = 140;
const STROKE_WIDTH = 12;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function PronunciationPractice() {
  const [index, ] = useState(0);
  const [recording, setRecording] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [streak] = useState(5);
 
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);

  const waveAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const animatedStroke = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRCUMFERENCE, 0],
  });

  // 🔊 SOUND EFFECT
  const playSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../../../assets/success.mp3') // Add small success sound here
    );
    await sound.playAsync();
  };

  // 📳 RECORD START
  const startRecording = async () => {
    setRecording(true);
    setScore(null);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1.6,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopRecording = () => {
    setRecording(false);
    generateScore();
  };

  // 🎯 SCORE GENERATION
  const generateScore = async () => {
    const randomScore = Math.floor(Math.random() * 15) + 85;
    setScore(randomScore);

    // Save history
    setScoreHistory(prev => [...prev, randomScore]);

    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: randomScore,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    await playSound();

    
  };

  const progressPercent = ((index + 1) / words.length) * 100;

  return (
    <View style={styles.container}>

      
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Text style={styles.streak}>🔥 {streak} Day Streak</Text>
      </View>

      {/* PROGRESS BAR */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${progressPercent}%` },
          ]}
        />
      </View>

      <Text style={styles.progressText}>
        Word {index + 1} of {words.length}
      </Text>

      {/* WORD CARD */}
      <View style={styles.card}>
        <Text style={styles.word}>{words[index].word}</Text>
        <Text style={styles.ipa}>{words[index].ipa}</Text>
      </View>

      {/* RECORD SECTION */}
      <View style={styles.recordSection}>
        {recording && (
          <Animated.View
            style={[
              styles.wave,
              { transform: [{ scaleY: waveAnim }] },
            ]}
          />
        )}

        <TouchableOpacity
          style={[
            styles.recordBtn,
            recording && styles.recordingActive,
          ]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
        >
          <Ionicons name="mic" size={22} color="white" />
        </TouchableOpacity>

        <Text style={styles.holdText}>Hold to speak</Text>
      </View>

      {/* CIRCULAR SCORE */}
      {score !== null && (
        <View style={styles.scoreContainer}>
          <Svg width={SIZE} height={SIZE}>
            <Circle
              stroke="#eee"
              fill="none"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE_WIDTH}
            />
            <AnimatedCircle
              stroke="#2a9d8f"
              fill="none"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={animatedStroke}
              strokeLinecap="round"
              rotation="-90"
              origin={`${SIZE / 2}, ${SIZE / 2}`}
            />
          </Svg>

          <Animated.Text style={styles.scoreText}>
            {score}%
          </Animated.Text>
        </View>
      )}

      {/* SCORE HISTORY */}
      {scoreHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Recent Scores</Text>
          <Text style={styles.historyText}>
            {scoreHistory.slice(-5).join('  •  ')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
    alignItems: 'center',
    paddingTop: 60,
  },

  topBar: {
    width: '90%',
    alignItems: 'flex-end',
  },

  streak: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff8c00',
  },

  progressBarContainer: {
    width: '85%',
    height: 6,
    backgroundColor: '#ddd',
    borderRadius: 10,
    marginTop: 20,
    overflow: 'hidden',
  },

  progressBar: {
    height: 6,
    backgroundColor: '#2a9d8f',
  },

  progressText: {
    marginTop: 8,
    fontSize: 13,
    color: '#666',
  },

  card: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 35,
    alignItems: 'center',
    marginTop: 25,
    elevation: 5,
  },

  word: {
    fontSize: 30,
    fontWeight: 'bold',
  },

  ipa: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },

  recordSection: {
    alignItems: 'center',
    marginTop: 40,
  },

  wave: {
    width: 10,
    height: 60,
    backgroundColor: '#ff3b30',
    borderRadius: 6,
    marginBottom: 15,
  },

  recordBtn: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
  },

  recordingActive: {
    backgroundColor: '#d62828',
  },

  holdText: {
    marginTop: 10,
    fontSize: 12,
    color: '#777',
  },

  scoreContainer: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scoreText: {
    position: 'absolute',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2a9d8f',
  },

  historyContainer: {
    marginTop: 30,
    alignItems: 'center',
  },

  historyTitle: {
    fontSize: 13,
    color: '#777',
  },

  historyText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '600',
  },
});
