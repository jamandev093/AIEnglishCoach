import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getScores, ScoreEntry } from '../utils/storage';

const screenWidth = Dimensions.get('window').width;

const AnalyticsScreen = () => {
  const [scores, setScores] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = async () => {
    const data = await getScores();

    // Get last 7 entries
    const last7 = data.slice(-7);

    setScores(last7);
  };

  const chartData = {
    labels: scores.map((_, index) => `S${index + 1}`),
    datasets: [
      {
        data: scores.length > 0 ? scores.map(item => item.score) : [0],
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Progress</Text>

      {scores.length > 0 ? (
        <LineChart
          data={chartData}
          width={screenWidth - 20}
          height={220}
          chartConfig={{
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          style={styles.chart}
        />
      ) : (
        <Text>No data available</Text>
      )}
    </View>
  );
};

export default AnalyticsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
  },
  chart: {
    borderRadius: 10,
  },
});