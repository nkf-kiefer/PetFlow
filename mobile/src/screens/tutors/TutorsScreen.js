import React, { useState, useCallback } from 'react';
import {
  View, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Text, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { tutors } from '../../api/resources';
import ListItemCard from '../../components/ListItemCard';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, radius, shadow } from '../../theme';

export default function TutorsScreen({ navigation }) {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await tutors.list();
      setItems(data.results ?? data);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <View style={styles.switcherWrap}>
        <TouchableOpacity style={[styles.switcherCard, shadow.sm]} activeOpacity={0.86}>
          <Text style={styles.switcherEyebrow}>Lista atual</Text>
          <Text style={styles.switcherTitle}>Tutores</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switcherCard, styles.switcherSecondary, shadow.sm]}
          activeOpacity={0.86}
          onPress={() => navigation.navigate('Pets')}
        >
          <Text style={styles.switcherEyebrow}>Acesso direto</Text>
          <Text style={styles.switcherTitle}>Ver pets</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.search}
        placeholder="Buscar tutores..."
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
        renderItem={({ item }) => (
          <ListItemCard
            title={item.name}
            subtitle={item.phone}
            onPress={() => navigation.navigate('TutorForm', { item })}
          />
        )}
        ListEmptyComponent={<EmptyState message="Nenhum tutor cadastrado" />}
        contentContainerStyle={{ paddingBottom: 90 }}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('TutorForm', {})}
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
  switcherWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  switcherCard: {
    flex: 1,
    backgroundColor: colors.sidebarBg,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  switcherSecondary: {
    backgroundColor: colors.surface,
  },
  switcherEyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.textMuted,
    marginBottom: 4,
  },
  switcherTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
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
