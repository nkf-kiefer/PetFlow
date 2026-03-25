import React, { useState, useCallback } from 'react';
import {
  View, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Text, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { schedulings } from '../../api/resources';
import ListItemCard from '../../components/ListItemCard';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, radius } from '../../theme';

const STATUS_COLORS = {
  agendado:     colors.info,
  confirmado:   colors.teal,
  em_andamento: colors.warning,
  concluido:    colors.success,
  cancelado:    colors.danger,
};

const STATUS_LABEL = {
  agendado:     'Agendado',
  confirmado:   'Confirmado',
  em_andamento: 'Em andamento',
  concluido:    'Concluído',
  cancelado:    'Cancelado',
};

export default function SchedulingsScreen({ navigation }) {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await schedulings.list();
      setItems(data.results ?? data);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = items.filter((i) => {
    const term = search.toLowerCase();
    return (
      String(i.pet ?? '').toLowerCase().includes(term) ||
      String(i.status ?? '').toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <TextInput
        style={styles.search}
        placeholder="Filtrar agendamentos..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => {
          const dt = item.date_time
            ? new Date(item.date_time).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
            : '';
          return (
            <ListItemCard
              title={dt}
              subtitle={`R$ ${Number(item.total_value).toFixed(2)}`}
              badge={STATUS_LABEL[item.status] ?? item.status}
              badgeColor={STATUS_COLORS[item.status] ?? colors.textMuted}
              onPress={() => navigation.navigate('AgendamentoForm', { item })}
            />
          );
        }}
        ListEmptyComponent={<EmptyState message="Nenhum agendamento encontrado" />}
        contentContainerStyle={{ paddingBottom: 90 }}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AgendamentoForm', {})}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  search: {
    margin: spacing.md,
    padding: spacing.sm + 4,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 14,
  },
  fab: {
    position: 'absolute', bottom: spacing.lg, right: spacing.lg,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 5,
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '300', lineHeight: 34 },
});
