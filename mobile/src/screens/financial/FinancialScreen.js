import React, { useState, useCallback } from 'react';
import {
  View, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Text, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { financialRecords } from '../../api/resources';
import ListItemCard from '../../components/ListItemCard';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, radius } from '../../theme';
import { formatCurrency, normalizeSearch } from '../../utils/formatters';

const STATUS_COLORS = {
  pendente:  colors.warning,
  realizado: colors.success,
  cancelado: colors.danger,
};

export default function FinancialScreen({ navigation }) {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await financialRecords.list();
      setItems(data.results ?? data);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = items.filter((i) => {
    const haystack = normalizeSearch(`${i.description} ${i.category} ${i.record_type} ${i.status}`);
    return haystack.includes(normalizeSearch(search));
  });

  const summary = filtered.reduce((acc, item) => {
    const amount = Number(item.amount || 0);
    if (item.record_type === 'receita') acc.receita += amount;
    if (item.record_type === 'despesa') acc.despesa += amount;
    return acc;
  }, { receita: 0, despesa: 0 });

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <TextInput
        style={styles.search}
        placeholder="Filtrar lançamentos..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.summaryIncome]}>
          <Text style={styles.summaryLabel}>Receitas</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.receita)}</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryExpense]}>
          <Text style={styles.summaryLabel}>Despesas</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.despesa)}</Text>
        </View>
      </View>
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
          const isReceita = item.record_type === 'receita';
          return (
            <ListItemCard
              title={item.description}
              subtitle={`${item.category} · Venc: ${item.due_date ?? '—'}`}
              meta={`${isReceita ? '+' : '-'} ${formatCurrency(item.amount)}`}
              badge={item.status}
              badgeColor={STATUS_COLORS[item.status] ?? colors.textMuted}
              onPress={() => navigation.navigate('FinanceiroForm', { item })}
            />
          );
        }}
        ListEmptyComponent={<EmptyState message="Nenhum lançamento encontrado" />}
        contentContainerStyle={{ paddingBottom: 90 }}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('FinanceiroForm', {})}
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
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  summaryIncome: {
    backgroundColor: colors.successLight,
  },
  summaryExpense: {
    backgroundColor: colors.dangerLight,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
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
