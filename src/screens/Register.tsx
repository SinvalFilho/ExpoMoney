import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import ModalSelector from 'react-native-modal-selector';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { register } from '../services/api';

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

export default function Register({ navigation }: any) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    user_type: 'PF' as 'PF' | 'PJ',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const userTypeOptions = [
    { key: 'PF', label: 'Pessoa Física' },
    { key: 'PJ', label: 'Pessoa Jurídica' },
  ];

  const handleRegister = async () => {
    setLoading(true);
    try {
      await register(form);
      navigation.navigate('Login');
    } catch (err) {
      setError('Erro no registro. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Criar Nova Conta</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.inputContainer}>
          <Icon name="person" size={20} color={colors.textSecondary} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Nome de usuário"
            placeholderTextColor={colors.textSecondary}
            value={form.username}
            onChangeText={(t) => setForm({ ...form, username: t })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="email" size={20} color={colors.textSecondary} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            value={form.email}
            onChangeText={(t) => setForm({ ...form, email: t })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color={colors.textSecondary} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            value={form.password}
            onChangeText={(t) => setForm({ ...form, password: t })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color={colors.textSecondary} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Confirme a senha"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            value={form.confirmPassword}
            onChangeText={(t) => setForm({ ...form, confirmPassword: t })}
          />
        </View>

        <View style={styles.modalSelectorContainer}>
          <ModalSelector
            data={userTypeOptions}
            initValue="Selecione o tipo de usuário"
            supportedOrientations={['portrait']}
            accessible={true}
            scrollViewAccessibilityLabel={'Scrollable options'}
            cancelButtonAccessibilityLabel={'Cancelar'}
            onChange={(option) => setForm({ ...form, user_type: option.key as 'PF' | 'PJ' })}
          >
            <View style={styles.modalSelectorInput}>
              <Text style={styles.modalSelectorText}>
                {form.user_type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
              </Text>
              <Icon name="arrow-drop-down" size={24} color={colors.textSecondary} />
            </View>
          </ModalSelector>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Text style={styles.buttonText}>Criar Conta</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Já tem conta? Faça login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 25,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: colors.text,
  },
  modalSelectorContainer: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
  },
  modalSelectorInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    height: 50,
  },
  modalSelectorText: {
    color: colors.text,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    padding: 10,
    alignItems: 'center',
  },
  linkText: {
    color: colors.secondary,
    fontWeight: '500',
  },
  error: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: 15,
  },
});