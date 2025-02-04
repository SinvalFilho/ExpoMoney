import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Dimensions, 
  RefreshControl, 
  TouchableOpacity,
  ScrollView 
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

import { TransactionService, Transaction } from '../services/api';

const chartColors = ['#7F5A83', '#0D324D', '#BFCDE0', '#F7EF81', '#D55672', '#5DD9C1'];

const colors = {
  background: '#0A0A0A',
  surface: '#1A1A1A',
  primary: '#7F5A83',
  secondary: '#5DD9C1',
  error: '#D55672',
  text: '#FFFFFF',
  textSecondary: '#888888',
};

export default function Charts() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width);

  const handleContainerLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const loadData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const transactions = await TransactionService.getTransactions();
      setTransactions(transactions);
    } catch (error) {
      setError('Erro ao carregar dados. Puxe para atualizar.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const processChartData = () => {
    const filtered = transactions.filter(t => 
      t.type === 'OUT' && 
      new Date(t.date) >= startDate && 
      new Date(t.date) <= endDate
    );

    const categories: { [key: string]: number } = {};
    let total = 0;

    filtered.forEach(t => {
      const amount = parseFloat(t.amount);
      categories[t.category_name] = (categories[t.category_name] || 0) + amount;
      total += amount;
    });

    const data = Object.entries(categories).map(([name, amount], index) => ({
      name: `${name}\nR$ ${amount.toFixed(2)} (${((amount/total)*100).toFixed(1)}%)`,
      amount,
      color: chartColors[index % chartColors.length],
      legendFontColor: colors.text,
      legendFontSize: 12,
    }));

    return {
      data: data.length > 0 ? data : [{ name: 'Sem gastos no período', amount: 1, color: '#ccc' }],
      total
    };
  };

  const { data, total } = processChartData();

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(null);
    if (selectedDate) {
      if (showDatePicker === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  return (
    <LinearGradient colors={['#0A0A0A', '#1A1A1A']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Análise Financeira</Text>
          <View style={styles.separator} />
        </View>

        <View style={styles.dateContainer}>
          <TouchableOpacity 
            style={styles.dateInput} 
            onPress={() => setShowDatePicker('start')}
          >
            <Text style={styles.dateText}>
              Data Inicial: {startDate.toLocaleDateString('pt-BR')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.dateInput} 
            onPress={() => setShowDatePicker('end')}
          >
            <Text style={styles.dateText}>
              Data Final: {endDate.toLocaleDateString('pt-BR')}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={showDatePicker === 'start' ? startDate : endDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              style={styles.datePicker}
            />
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Carregando dados...</Text>
          </View>
        ) : error ? (
          <View style={styles.messageContainer}>
            <Text style={styles.errorText}>🚨 {error}</Text>
          </View>
        ) : (
          <View style={styles.chartContainer} onLayout={handleContainerLayout}>
            <PieChart
              data={data}
              width={containerWidth}
              height={300}
              chartConfig={{
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                color: () => colors.text,
                decimalPlaces: 2,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="90"
              absolute
              hasLegend={false}
              style={styles.chart}
            />

            <Text style={styles.totalText}>
              Total Gasto: R$ {total.toFixed(2)}
            </Text>

            <View style={styles.legendContainer}>
              {data.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 20,
  },
  separator: {
    height: 2,
    width: '30%',
    backgroundColor: '#7F5A83',
  },
  dateContainer: {
    marginVertical: 15,
    gap: 10,
    width: '100%',
    alignItems: 'center',
  },
  dateInput: {
    backgroundColor: '#FFFFFF10',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7F5A83',
    width: '80%',
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  datePicker: {
    backgroundColor: '#1A1A1A',
  },
  chartContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  chart: {
    marginVertical: 20,
  },
  totalText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 15,
    backgroundColor: '#7F5A8320',
    padding: 12,
    borderRadius: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    paddingHorizontal: 10,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF10',
    padding: 10,
    borderRadius: 8,
    minWidth: '45%',
    margin: 5,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: '#FFFFFF',
    fontSize: 12,
    flexShrink: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  loadingText: {
    color: '#888888',
    marginTop: 12,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  errorText: {
    color: '#D55672',
    fontSize: 16,
  },
});