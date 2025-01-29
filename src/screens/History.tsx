import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Transaction {
  id: number;
  amount: string;
  description: string;
  category_name: string;
  category_id: number;
  date: string;
  type: 'IN' | 'OUT';
  payment_method: string;
}

interface Category {
  id: number;
  name: string;
}

export default function History() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

  const translatePaymentMethod = (method: string) => {
    switch (method) {
      case 'cash': return 'Dinheiro';
      case 'credit_card': return 'Cartão de Crédito';
      case 'debit_card': return 'Cartão de Débito';
      default: return method;
    }
  };

  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('@access_token');
      const response = await axios.get('http://192.168.18.149:8000/api/categories/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      setError('Erro ao carregar categorias');
      return [];
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = await AsyncStorage.getItem('@access_token');
      const response = await axios.get('http://192.168.18.149:8000/api/transactions/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      setError('Erro ao carregar transações');
      return [];
    }
  };

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [categoriesData, transactionsData] = await Promise.all([
        fetchCategories(),
        fetchTransactions(),
      ]);
      setCategories([{ id: 0, name: 'Todas' }, ...categoriesData]);
      setTransactions(transactionsData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [selectedCategory, transactions]);

  const filterTransactions = () => {
    if (selectedCategory === 'Todas') {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(
        transactions.filter((item) => item.category_name === selectedCategory)
      );
    }
  };

  const handleEdit = async () => {
    if (!editingTransaction) return;

    try {
      const token = await AsyncStorage.getItem('@access_token');

      const updatedTransaction = {
        ...editingTransaction,
        category: editingTransaction.category_id,
        date: date.toISOString().split('T')[0],
      };

      await axios.put(
        `http://192.168.18.149:8000/api/transactions/${editingTransaction.id}/`,
        updatedTransaction,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      loadData();
      setIsModalVisible(false);
      Alert.alert('Sucesso', 'Transação atualizada com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a transação.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('@access_token');
      await axios.delete(`http://192.168.18.149:8000/api/transactions/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadData();
      Alert.alert('Sucesso', 'Transação excluída com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível excluir a transação.');
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'IN';
    const amount = parseFloat(item.amount).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    return (
      <TouchableOpacity
        onPress={() => {
          setEditingTransaction(item);
          setDate(new Date(item.date));
          setIsModalVisible(true);
        }}
      >
        <View style={[styles.transactionCard, isIncome ? styles.incomeCard : styles.expenseCard]}>
          <View style={styles.transactionLeft}>
            <Icon
              name={isIncome ? 'arrow-upward' : 'arrow-downward'}
              size={20}
              color={isIncome ? '#2ecc71' : '#e74c3c'}
            />
            <View style={styles.transactionDetails}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionDescription}>{item.description}</Text>
                <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
              </View>
              <View style={styles.transactionFooter}>
                <Text style={styles.transactionCategory}>{item.category_name}</Text>
                <Text style={styles.transactionPayment}>
                  • {translatePaymentMethod(item.payment_method)}
                </Text>
              </View>
            </View>
          </View>
          <Text style={[styles.transactionAmount, isIncome ? styles.incomeText : styles.expenseText]}>
            {isIncome ? '+ ' : '- '}{amount}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#f9f9f9', '#eaeaea']} style={styles.container}>
      <Text style={styles.title}>Histórico Completo</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCategory}
          onValueChange={setSelectedCategory}
          style={styles.picker}
        >
          {categories.map((category) => (
            <Picker.Item key={category.id} label={category.name} value={category.name} />
          ))}
        </Picker>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTransaction}
        contentContainerStyle={styles.transactionList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma transação encontrada</Text>}
      />

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Transação</Text>
            <TextInput
              style={styles.input}
              placeholder="Descrição"
              value={editingTransaction?.description}
              onChangeText={(text) =>
                setEditingTransaction({ ...editingTransaction!, description: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Valor"
              keyboardType="numeric"
              value={editingTransaction?.amount}
              onChangeText={(text) =>
                setEditingTransaction({ ...editingTransaction!, amount: text })
              }
            />
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerText}>
                {date.toLocaleDateString('pt-BR')}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}
            <Picker
              selectedValue={editingTransaction?.category_name}
              onValueChange={(value) =>
                setEditingTransaction({
                  ...editingTransaction!,
                  category_name: value,
                  category_id: categories.find((c) => c.name === value)?.id || 0,
                })
              }
              style={styles.picker}
            >
              {categories.map((category) => (
                <Picker.Item key={category.id} label={category.name} value={category.name} />
              ))}
            </Picker>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(editingTransaction!.id)}>
                <Text style={styles.buttonText}>Excluir</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleEdit}>
                <Text style={styles.buttonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },
  picker: {
    height: 50,
  },
  transactionList: {
    paddingBottom: 20,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 10,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#666',
  },
  transactionPayment: {
    fontSize: 12,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  incomeText: {
    color: '#2ecc71',
  },
  expenseText: {
    color: '#e74c3c',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  errorText: {
    textAlign: 'center',
    color: '#e74c3c',
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  datePickerButton: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 15,
  },
  datePickerText: {
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2ecc71',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});