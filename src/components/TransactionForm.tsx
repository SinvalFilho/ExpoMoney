import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Modal, Text, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getCategories, createCategory, updateCategory, deleteCategory, createTransaction } from '../services/api';

interface Category {
  id: number;
  name: string;
}

interface TransactionFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

const TransactionForm: React.FC<TransactionFormProps> = ({ visible, onClose, onSuccess }) => {
  const [form, setForm] = useState<{
    amount: string;
    description: string;
    category: string;
    type: 'OUT' | 'IN';
    payment_method: string;
  }>({
    amount: '',
    description: '',
    category: '',
    type: 'OUT',
    payment_method: 'cash',
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible]);

  const loadCategories = async () => {
    try {
      setError('');
      const categories = await getCategories();
      setCategories(categories);
      if (categories.length > 0 && (!form.category || !categories.some((cat) => cat.id === Number(form.category)))) {
        setForm((prev) => ({ ...prev, category: String(categories[0].id) }));
      }
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      setError('Erro ao carregar categorias. Tente novamente.');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return Alert.alert('Erro', 'O nome da categoria não pode estar vazio.');
    try {
      const category = await createCategory(newCategory);
      setCategories((prev) => [...prev, category]);
      setForm((prev) => ({ ...prev, category: String(category.id) }));
      setNewCategory('');
      await loadCategories();
      Alert.alert('Sucesso', 'Categoria criada com sucesso!');
    } catch (err) {
      console.error('Erro ao criar categoria:', err);
      Alert.alert('Erro', 'Não foi possível criar a categoria.');
    }
  };

  const handleEditCategory = async (id: number, newName: string) => {
    try {
      await updateCategory(id, newName);
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? { ...cat, name: newName } : cat))
      );
      Alert.alert('Sucesso', 'Categoria atualizada com sucesso!');
    } catch (err) {
      console.error('Erro ao editar categoria:', err);
      Alert.alert('Erro', 'Não foi possível editar a categoria.');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      Alert.alert('Sucesso', 'Categoria removida com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir categoria:', err);
      Alert.alert('Erro', 'Não foi possível excluir a categoria.');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await createTransaction({
        amount: parseFloat(form.amount),
        description: form.description,
        category: parseInt(form.category),
        type: form.type,
        payment_method: form.payment_method,
      });
      onClose();
      resetForm();
      onSuccess();
    } catch (err: any) {
      console.error('Erro ao salvar transação:', err);
      setError(err.response?.data?.detail || 'Erro ao salvar transação');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      amount: '',
      description: '',
      category: categories.length > 0 ? String(categories[0].id) : '',
      type: 'OUT',
      payment_method: 'cash',
    });
    setError('');
  };

  return (
    <Modal visible={visible} animationType="slide">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Nova Transação</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Valor (ex: 150.50)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={form.amount}
          onChangeText={(t) => setForm({ ...form, amount: t.replace(/[^0-9.]/g, '') })}
        />

        <TextInput
          style={styles.input}
          placeholder="Descrição"
          placeholderTextColor={colors.textSecondary}
          value={form.description}
          onChangeText={(t) => setForm({ ...form, description: t })}
        />

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={form.category}
            onValueChange={(v) => setForm({ ...form, category: v })}
            style={styles.picker}
            dropdownIconColor={colors.textSecondary}
          >
            {categories.map((cat) => (
              <Picker.Item key={cat.id} label={cat.name} value={String(cat.id)} color={colors.text} />
            ))}
          </Picker>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Nova Categoria"
          placeholderTextColor={colors.textSecondary}
          value={newCategory}
          onChangeText={setNewCategory}
        />
        <Button title="Adicionar Categoria" onPress={handleCreateCategory} color={colors.primary} />

        <View style={styles.pickerContainer}>
          {categories.map((cat) => (
            <View key={cat.id} style={styles.categoryRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholderTextColor={colors.textSecondary}
                defaultValue={cat.name}
                onEndEditing={(e) => handleEditCategory(cat.id, e.nativeEvent.text)}
              />
              <Button title="Excluir" onPress={() => handleDeleteCategory(cat.id)} color={colors.error} />
            </View>
          ))}
        </View>

        <View style={styles.pickerContainer}>
        <Picker
          selectedValue={form.type}
          onValueChange={(v: 'OUT' | 'IN') => setForm({ ...form, type: v })}
          style={styles.picker}
          dropdownIconColor={colors.textSecondary}
        >
          <Picker.Item label="Entrada" value="IN" color={colors.text} />
          <Picker.Item label="Saída" value="OUT" color={colors.text} />
        </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={form.payment_method}
            onValueChange={(v) => setForm({ ...form, payment_method: v })}
            style={styles.picker}
            dropdownIconColor={colors.textSecondary}
          >
            <Picker.Item label="Dinheiro" value="cash" color={colors.text} />
            <Picker.Item label="Cartão de Crédito" value="credit_card" color={colors.text} />
            <Picker.Item label="Cartão de Débito" value="debit_card" color={colors.text} />
          </Picker>
        </View>

        <View style={styles.buttons}>
          <Button
            title="Cancelar"
            onPress={() => {
              resetForm();
              onClose();
            }}
            color={colors.textSecondary}
            disabled={loading}
          />
          <Button
            title={loading ? 'Salvando...' : 'Salvar'}
            onPress={handleSubmit}
            disabled={loading || !form.amount || !form.category}
            color={colors.primary}
          />
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: colors.text,
    fontWeight: 'bold',
  },
  input: {
    height: 50,
    borderColor: colors.divider,
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    gap: 15,
  },
  error: {
    color: colors.error,
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14,
  },
  pickerContainer: {
    borderColor: colors.divider,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  picker: {
    color: colors.text,
    backgroundColor: colors.surface,
    height: 50,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
});

export default TransactionForm;