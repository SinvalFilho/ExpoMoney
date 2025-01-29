import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

interface Transaction {
  id: number;
  amount: number;
  category_name: string;
  type: 'IN' | 'OUT';
}

const chartColors = ['#7F5A83', '#0D324D', '#BFCDE0', '#F7EF81', '#D55672', '#5DD9C1'];

const colors = {
  background: '#0A0A0A',
  surface: '#1A1A1A',
  primary: '#7F5A83',
  secondary: '#5DD9C1',
  error: '#D55672',
  text: '#FFFFFF',
  textSecondary: '#888888',
  income: '#5DD9C1',
  expense: '#D55672',
  divider: '#2A2A2A',
};

export default function Charts() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const token = await AsyncStorage.getItem('@access_token');
        if (!token) throw new Error('Token não encontrado');

        const response = await axios.get('http://192.168.18.149:8000/api/transactions/', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (isMounted) {
          if (Array.isArray(response.data)) {
            setTransactions(response.data);
          } else {
            throw new Error('Formato de resposta inválido');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar transações:', error);
        if (isMounted) setError('Erro ao carregar dados');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const processChartData = () => {
    const categoryTotals: { [key: string]: number } = {};

    transactions.forEach(({ amount, category_name, type }) => {
      const key = `${category_name} (${type === 'IN' ? 'Entrada' : 'Saída'})`;

      if (type === 'IN') {
        categoryTotals[key] = (categoryTotals[key] || 0) + parseFloat(amount.toString());
      } else {
        categoryTotals[key] = (categoryTotals[key] || 0) - parseFloat(amount.toString());
      }
    });

    const data = Object.keys(categoryTotals).map((key, index) => ({
      name: key,
      amount: Math.abs(categoryTotals[key]),
      color: chartColors[index % chartColors.length],
      legendFontColor: colors.text,
      legendFontSize: 14,
    }));

    return data.length > 0 ? data : [{ name: 'Sem Dados', amount: 1, color: '#ccc', legendFontColor: colors.textSecondary, legendFontSize: 14 }];
  };

  return (
    <LinearGradient
      colors={['#0A0A0A', '#1A1A1A']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Análise por Categoria</Text>
        <View style={styles.separator} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando insights...</Text>
        </View>
      ) : error ? (
        <View style={styles.messageContainer}>
          <Text style={styles.errorText}>🚨 {error}</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.messageContainer}>
          <Text style={styles.emptyText}>📊 Nenhum dado para exibir</Text>
        </View>
      ) : (
        <View style={styles.chartCard}>
          <PieChart
            data={processChartData()}
            width={Dimensions.get('window').width - 48}
            height={260}
            chartConfig={{
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              decimalPlaces: 2,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="18"
            absolute
            style={styles.chart}
            hasLegend={false}
          />
          <View style={styles.legendContainer}>
            {processChartData().map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'left',
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.5,
  },
  separator: {
    height: 3,
    width: 48,
    backgroundColor: colors.primary,
    marginTop: 16,
    borderRadius: 2,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.5,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: colors.error,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff08',
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    color: colors.text,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    maxWidth: 100,
  },
});