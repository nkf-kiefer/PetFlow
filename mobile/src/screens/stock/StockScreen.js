import React, { useState, useCallback } from 'react';
import {
  View, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Text, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { stockMovements } from '../../api/resources';
import ListItemCard from '../../components/ListItemCard';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, radius } from '../../theme';

const TYPE_COLORS = {
  entrada:   colors.success,
  saida:     colors.danger,
  ajuste:    colors.warning,
  devolucao: colors.info,
};

const TYPE_LABEL = {
  entrada:   'Entrada',
  saida:     'Saída',
  ajuste:    'Ajuste',
  devolucao: 'Devolução',
};

export default function StockScreen({ navigation }) {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await stockMovements.list();
      setItems(data.results ?? data);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = items.filter((i) =>
    i.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <TextInput
        style={styles.search}
        placeholder="Filtrar movimentações..."
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
          const dt = item.created_at
            ? new Date(item.created_at).toLocaleDateString('pt-BR')
            : '';
          return (
            <ListItemCard
              title={item.description}
              subtitle={`Qtd: ${item.quantity} · ${dt}`}
              badge={TYPE_LABEL[item.movement_type] ?? item.movement_type}
              badgeColor={TYPE_COLORS[item.movement_type] ?? colors.textMuted}
              onPress={() => {}} // stock movements are read-only after creation
            />
          );
        }}
        ListEmptyComponent={<EmptyState message="Nenhuma movimentação registrada" />}
        contentContainerStyle={{ paddingBottom: 90 }}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('EstoqueForm', {})}
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
