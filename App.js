import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Banco, createTable, selectUsuarios } from './Banco/Config';

export default function App() {
  const [status, setStatus] = useState('Inicializando banco de dados...');
  const [totalUsuarios, setTotalUsuarios] = useState(0);

  useEffect(() => {
    let active = true;

    async function initializeDatabase() {
      try {
        const db = await Banco();
        await createTable(db);
        const usuarios = await selectUsuarios(db);

        if (active) {
          setTotalUsuarios(usuarios.length);
          setStatus('Banco de dados pronto');
        }
      } catch (error) {
        console.error('Erro ao inicializar o banco de dados', error);
        if (active) {
          setStatus('Não foi possível inicializar o banco de dados');
        }
      }
    }

    initializeDatabase();

    return () => {
      active = false;
    };
  }, []);


  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>SQLite Mobile</Text>
      <Text style={styles.status}>{status}</Text>
      <Text style={styles.count}>Usuários cadastrados: {totalUsuarios}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  status: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  count: {
    color: '#555',
  },
});
