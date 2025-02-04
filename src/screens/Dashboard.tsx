import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import TransactionForm from '../components/TransactionForm';
import { AuthService, TransactionService, UserService } from '../services/api';


type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  History: undefined;
};

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Transaction {
  id: number;
  amount: string;
  description: string;
  category_name: string; 
  date: string;
  type: 'IN' | 'OUT';
  payment_method: string;
}

interface DashboardProps {
  onLogout: () => void;
}

interface Summary {
  balance: number;
  total_income: number;
  total_expenses: number;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({
    balance: 0,
    total_income: 0,
    total_expenses: 0,
  });
  const [username, setUsername] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  useEffect(() => {
    loadData();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await UserService.getProfile();
      setUsername(userData.username);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
    }
  };

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [transactionsData, summaryData] = await Promise.all([
        TransactionService.getTransactions(),
        TransactionService.getSummary(),
      ]);

      setTransactions(transactionsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      onLogout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {username}</Text>
          <Text style={styles.subtitle}>Gerencie suas finanças</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCards}>
        <View style={[styles.card, { backgroundColor: colors.primary }]}>
          <Text style={styles.cardTitle}>Saldo Atual</Text>
          <Text style={styles.cardAmount}>
            R$ {parseFloat(summary.balance.toString()).toFixed(2)}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.card, { backgroundColor: colors.income }]}>
            <Text style={styles.cardTitle}>Receitas</Text>
            <Text style={styles.cardAmount}>
              R$ {parseFloat(summary.total_income.toString()).toFixed(2)}
            </Text>
          </View>

          <View style={[styles.card,{ backgroundColor: colors.expense }]}>
            <Text style={styles.cardTitle}>Despesas</Text>
            <Text style={styles.cardAmount}>
              R$ {parseFloat(summary.total_expenses.toString()).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.transactionHeader}>
        <Text style={styles.sectionTitle}>Últimas Transações</Text>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
          <Text style={styles.seeAll}>Ver todas</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={[styles.transactionCard, item.type === 'IN' ? styles.income : styles.expenses]}
          >
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionDescription}>{item.description}</Text>
              <View style={styles.metaContainer}>
                <Text style={styles.category}>
                  {item.category_name || 'Outros'}  {/* Alterado para category_name */}
                </Text>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
                <Text style={styles.paymentMethod}>{item.payment_method}</Text>
              </View>
            </View>
            <Text
              style={[styles.transactionAmount, item.type === 'IN' ? styles.income : styles.expenses]}
            >
              {item.type === 'IN' ? '+' : '-'} R$ {parseFloat(item.amount).toFixed(2)}
            </Text>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowTransactionForm(true)}
      >
        <Icon name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showTransactionForm} onRequestClose={() => setShowTransactionForm(false)}>
        <TransactionForm
          visible={showTransactionForm}
          onClose={() => setShowTransactionForm(false)}
          onSuccess={() => {
            setShowTransactionForm(false);
            loadData();
          }}
        />
      </Modal>
    </View>
  );
}

const colors = {
  background: '#121212',
  surface: '#1E1E1E',
  primary: '#BB86FC',
  secondary: '#03DAC6',
  error: '#CF6679',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  income: '#4CAF50',
  expense: '#EF5350',
  divider: '#383838',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    elevation: 3,
  },
  summaryCards: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  cardAmount: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  seeAll: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  transactionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 6,
    fontWeight: '600',
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  category: {
    backgroundColor: '#2A2A2A',
    color: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '500',
    overflow: 'hidden',
  },
  date: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  paymentMethod: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  income: {
    color: colors.income,
    borderLeftColor: colors.income,
  },
  expenses: {
    color: colors.expense,
    borderLeftColor: colors.expense,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    right: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  listContent: {
    paddingBottom: 100,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 12,
  },
});