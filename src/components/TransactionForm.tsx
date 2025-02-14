import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ModalSelector from 'react-native-modal-selector';
import { CategoryService, TransactionService, Category } from '../services/api';

type TransactionFormProps = {
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
  const [form, setForm] = useState({
    amount: '',
    description: '',
    category: '',
    type: 'OUT' as 'IN' | 'OUT',
    payment_method: 'cash',
    date: new Date(),
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCategories();
      resetForm();
    }
  }, [visible]);

  const loadCategories = async () => {
    try {
      const categories = await CategoryService.getCategories();
      setCategories(categories);
      if (categories.length > 0) {
        setForm((prev) => ({ ...prev, category: String(categories[0].id) }));
      }
    } catch (err) {
      setError('Erro ao carregar categorias');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await TransactionService.createTransaction({
        amount: parseFloat(form.amount),
        description: form.description,
        category: parseInt(form.category),
        type: form.type,
        payment_method: form.payment_method,
        date: form.date.toISOString().split('T')[0],
      });
      onClose();
      onSuccess();
    } catch (err: any) {
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
      date: new Date(),
    });
    setError('');
  };

  return (
    <KeyboardAvoidingView behavior="height" style={styles.container}>
      <Text style={styles.title}>Nova Transação</Text>
      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.dateText}>Data: {form.date.toLocaleDateString('pt-BR')}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={form.date}
          mode="date"
          display="default"
          themeVariant="dark"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setForm({ ...form, date });
          }}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Valor"
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

      <Text style={styles.label}>Categoria</Text>
      <ModalSelector
        data={categories.map((cat) => ({ key: cat.id, label: cat.name }))}
        initValue="Selecione uma categoria"
        onChange={(option) => setForm({ ...form, category: String(option.key) })}
        style={styles.modalSelector}
        selectStyle={styles.modalSelectorSelect}
        selectTextStyle={styles.modalSelectorText}
        optionTextStyle={styles.modalSelectorOptionText}
        optionContainerStyle={styles.modalSelectorOptionContainer}
      />

      <Text style={styles.label}>Tipo</Text>
      <ModalSelector
        data={[
          { key: 'IN', label: 'Entrada' },
          { key: 'OUT', label: 'Saída' },
        ]}
        initValue="Selecione o tipo"
        onChange={(option) => setForm({ ...form, type: option.key as 'IN' | 'OUT' })}
        style={styles.modalSelector}
        selectStyle={styles.modalSelectorSelect}
        selectTextStyle={styles.modalSelectorText}
        optionTextStyle={styles.modalSelectorOptionText}
        optionContainerStyle={styles.modalSelectorOptionContainer}
      />

      <Text style={styles.label}>Método de Pagamento</Text>
      <ModalSelector
        data={[
          { key: 'cash', label: 'Dinheiro' },
          { key: 'credit_card', label: 'Cartão de Crédito' },
          { key: 'debit_card', label: 'Cartão de Débito' },
        ]}
        initValue="Selecione o método"
        onChange={(option) => setForm({ ...form, payment_method: option.key })}
        style={styles.modalSelector}
        selectStyle={styles.modalSelectorSelect}
        selectTextStyle={styles.modalSelectorText}
        optionTextStyle={styles.modalSelectorOptionText}
        optionContainerStyle={styles.modalSelectorOptionContainer}
      />

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSubmit}
          disabled={loading || !form.amount || !form.category}
        >
          <Text style={styles.buttonText}>{loading ? 'Salvando...' : 'Salvar'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    color: colors.text,
    marginBottom: 20,
  },
  error: {
    color: colors.error,
    marginBottom: 10,
  },
  input: {
    height: 50,
    borderColor: colors.divider,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingLeft: 10,
    color: colors.text,
  },
  dateButton: {
    marginBottom: 15,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
  },
  label: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 5,
  },
  modalSelector: {
    marginBottom: 15,
  },
  modalSelectorSelect: {
    borderColor: colors.divider,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    backgroundColor: colors.surface,
  },
  modalSelectorText: {
    color: colors.text,
  },
  modalSelectorOptionText: {
    color: colors.text,
  },
  modalSelectorOptionContainer: {
    backgroundColor: colors.surface,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: colors.divider,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    textAlign: 'center',
    color: colors.text,
    fontSize: 16,
  },
});

export default TransactionForm;