import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { saveScore } from '../utils/storage';

const PracticeScreen = () => {
  const [score, setScore] = useState(0);

  const finishPractice = async () => {
    await saveScore(score);
    alert('Score saved successfully!');
    setScore(0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Practice Session</Text>
      <Text style={styles.score}>Current Score: {score}</Text>

      <Button title="Increase Score" onPress={() => setScore(score + 10)} />
      <View style={{ height: 10 }} />
      <Button title="Finish & Save Score" onPress={finishPractice} />
    </View>
  );
};

export default PracticeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
  },
  score: {
    fontSize: 18,
    marginBottom: 20,
  },
});