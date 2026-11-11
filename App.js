import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Banco,
  countPocoes,
  createTable,
  deletePocao,
  insertPocao,
  selectPocoes,
  updatePocao,
} from './Banco/Config';

const PAGE_SIZE = 5;
const EMPTY_FORM = { nome: '', tipo: '', efeito: '', raridade: 'Comum' };
const RARITIES = ['Comum', 'Raro', 'Muito Raro'];

export default function App() {
  const [db, setDb] = useState(null);
  const [pocoes, setPocoes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadPocoes = useCallback(async (database, selectedPage = 1) => {
    const [items, quantity] = await Promise.all([
      selectPocoes(database, PAGE_SIZE, (selectedPage - 1) * PAGE_SIZE),
      countPocoes(database),
    ]);
    setPocoes(items);
    setTotal(quantity);
    if (selectedPage > Math.max(1, Math.ceil(quantity / PAGE_SIZE))) {
      setPage(Math.max(1, Math.ceil(quantity / PAGE_SIZE)));
    }
  }, []);

  useEffect(() => {
    async function initialize() {
      try {
        const database = await Banco();
        await createTable(database);
        setDb(database);
        await loadPocoes(database, 1);
      } catch (error) {
        console.error('Erro ao inicializar o banco de dados', error);
        Alert.alert('Erro', 'Não foi possível abrir o banco de dados local.');
      } finally {
        setLoading(false);
      }
    }
    initialize();
  }, [loadPocoes]);

  useEffect(() => {
    if (db) loadPocoes(db, page);
  }, [db, page, loadPocoes]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  }

  function openEdit(pocao) {
    setEditing(pocao);
    setForm({ nome: pocao.nome, tipo: pocao.tipo, efeito: pocao.efeito, raridade: pocao.raridade });
    setModalVisible(true);
  }

  async function savePocao() {
    if (!form.nome.trim() || !form.tipo.trim() || !form.efeito.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha nome, tipo e efeito.');
      return;
    }
    try {
      if (editing) {
        await updatePocao(db, editing.id, form);
      } else {
        await insertPocao(db, form);
      }
      setModalVisible(false);
      setPage(1);
      await loadPocoes(db, 1);
    } catch (error) {
      if (String(error?.message).includes('UNIQUE')) {
        Alert.alert('Nome duplicado', 'Já existe uma poção com esse nome.');
      } else {
        console.error('Erro ao salvar poção', error);
        Alert.alert('Erro', 'Não foi possível salvar a poção.');
      }
    }
  }

  function confirmDelete(pocao) {
    Alert.alert('Excluir poção', `Deseja excluir "${pocao.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePocao(db, pocao.id);
            await loadPocoes(db, page);
          } catch (error) {
            console.error('Erro ao excluir poção', error);
            Alert.alert('Erro', 'Não foi possível excluir a poção.');
          }
        },
      },
    ]);
  }

  function renderPotion({ item }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.potionName}>{item.nome}</Text>
          <Text style={styles.badge}>{item.raridade}</Text>
        </View>
        <Text style={styles.detail}><Text style={styles.label}>Tipo: </Text>{item.tipo}</Text>
        <Text style={styles.detail}><Text style={styles.label}>Efeito: </Text>{item.efeito}</Text>
        <View style={styles.actions}>
          <Pressable style={styles.editButton} onPress={() => openEdit(item)}>
            <Text style={styles.actionText}>Editar</Text>
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={() => confirmDelete(item)}>
            <Text style={styles.actionText}>Excluir</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (loading) {
    return <View style={styles.loading}><Text style={styles.loadingText}>Preparando o grimório...</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Poções</Text>
        <Text style={styles.subtitle}>Gerencie seu inventário mágico</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Poções cadastradas</Text>
          <Text style={styles.summaryCount}>{total}</Text>
        </View>
        <Pressable style={styles.newButton} onPress={openCreate}>
          <Text style={styles.newButtonText}>+ Cadastrar poção</Text>
        </Pressable>
        <FlatList
          data={pocoes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPotion}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma poção cadastrada.</Text>}
        />
        <View style={styles.pagination}>
          <Pressable disabled={page === 1} onPress={() => setPage(page - 1)} style={[styles.pageButton, page === 1 && styles.disabled]}>
            <Text style={styles.pageButtonText}>Anterior</Text>
          </Pressable>
          <Text style={styles.pageText}>Página {page} de {totalPages}</Text>
          <Pressable disabled={page === totalPages} onPress={() => setPage(page + 1)} style={[styles.pageButton, page === totalPages && styles.disabled]}>
            <Text style={styles.pageButtonText}>Próxima</Text>
          </Pressable>
        </View>
      </View>
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editing ? 'Editar poção' : 'Nova poção'}</Text>
            {[
              ['nome', 'Nome da poção'],
              ['tipo', 'Tipo'],
              ['efeito', 'Efeito'],
            ].map(([field, placeholder]) => (
              <TextInput
                key={field}
                style={styles.input}
                placeholder={placeholder}
                value={form[field]}
                onChangeText={(value) => setForm({ ...form, [field]: value })}
              />
            ))}
            <Text style={styles.inputLabel}>Raridade</Text>
            <View style={styles.rarityRow}>
              {RARITIES.map((rarity) => (
                <Pressable key={rarity} onPress={() => setForm({ ...form, raridade: rarity })} style={[styles.rarityOption, form.raridade === rarity && styles.raritySelected]}>
                  <Text style={[styles.rarityText, form.raridade === rarity && styles.raritySelectedText]}>{rarity}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}><Text>Cancelar</Text></Pressable>
              <Pressable style={styles.saveButton} onPress={savePocao}><Text style={styles.actionText}>Salvar</Text></Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f7fb' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#152238' },
  loadingText: { color: '#fff', fontSize: 18 },
  header: { backgroundColor: '#152238', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28 },
  title: { color: '#fff', fontSize: 32, fontWeight: '800' },
  subtitle: { color: '#b8c5d9', fontSize: 15, marginTop: 4 },
  content: { flex: 1, padding: 18 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  summaryTitle: { color: '#27364d', fontSize: 18, fontWeight: '700' },
  summaryCount: { color: '#3569d4', fontSize: 22, fontWeight: '800' },
  newButton: { backgroundColor: '#3569d4', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 14 },
  newButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  list: { paddingBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  potionName: { flex: 1, color: '#1e2b40', fontSize: 18, fontWeight: '700' },
  badge: { color: '#3569d4', backgroundColor: '#e8efff', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4, fontSize: 12, fontWeight: '700' },
  detail: { color: '#526176', fontSize: 14, marginBottom: 4 },
  label: { fontWeight: '700', color: '#34445c' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  editButton: { backgroundColor: '#3569d4', borderRadius: 7, paddingHorizontal: 15, paddingVertical: 8 },
  deleteButton: { backgroundColor: '#d94b55', borderRadius: 7, paddingHorizontal: 15, paddingVertical: 8 },
  actionText: { color: '#fff', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#718096', marginTop: 40 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  pageButton: { backgroundColor: '#e0e8f7', borderRadius: 7, paddingHorizontal: 12, paddingVertical: 9 },
  pageButtonText: { color: '#294f9f', fontWeight: '700' },
  disabled: { opacity: 0.4 },
  pageText: { color: '#526176', fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 22 },
  modalTitle: { color: '#1e2b40', fontSize: 22, fontWeight: '800', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#d5dce8', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 15 },
  inputLabel: { color: '#526176', fontWeight: '700', marginBottom: 7 },
  rarityRow: { flexDirection: 'row', gap: 7, marginBottom: 18 },
  rarityOption: { borderWidth: 1, borderColor: '#d5dce8', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 8 },
  raritySelected: { backgroundColor: '#3569d4', borderColor: '#3569d4' },
  rarityText: { color: '#526176', fontSize: 12 },
  raritySelectedText: { color: '#fff', fontWeight: '700' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelButton: { borderRadius: 7, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: '#edf0f5' },
  saveButton: { borderRadius: 7, paddingHorizontal: 20, paddingVertical: 11, backgroundColor: '#3569d4' },
});
