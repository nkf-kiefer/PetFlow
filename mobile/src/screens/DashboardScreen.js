import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import {
  clinics, tutors, pets, employees,
  schedulings, products,
} from '../api/resources';
import { colors, spacing, radius, shadow } from '../theme';
import { formatCurrency } from '../utils/formatters';

const today = () => new Date().toISOString().split('T')[0];

const QUICK_ACTIONS = [
  { label: 'Novo agendamento', icon: '📅', route: 'Agenda', params: { screen: 'AgendamentoForm' } },
  { label: 'Novo pet', icon: '🐾', route: 'Pets/Tutores', params: { screen: 'PetForm' } },
  { label: 'Novo tutor', icon: '👤', route: 'Pets/Tutores', params: { screen: 'TutorForm' } },
  { label: 'Novo lançamento', icon: '💰', route: 'Mais', params: { screen: 'FinanceiroForm' } },
];

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats]       = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, t, p, e, s, pr] = await Promise.all([
        clinics.list(),
        tutors.list(),
        pets.list(),
        employees.list(),
        schedulings.list({ date: today() }),
        products.list(),
      ]);

      const allProds  = pr.data.results ?? pr.data;
      const lowStock  = allProds.filter((p) => p.quantity <= p.alert_threshold).length;
      const todaySch  = (s.data.results ?? s.data).length;
      const stockValue = allProds.reduce(
        (sum, product) => sum + (Number(product.quantity) * Number(product.price || 0)),
        0,
      );

      setStats({
        clinics:   (c.data.results ?? c.data).length,
        tutors:    (t.data.results ?? t.data).length,
        pets:      (p.data.results ?? p.data).length,
        employees: (e.data.results ?? e.data).length,
        todaySch,
        lowStock,
        stockValue,
      });
    } catch { /* silently ignore */ }
    finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const StatCard = ({ label, value, icon, color = colors.primary }) => (
    <View style={[styles.card, shadow.sm]}>
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={[styles.cardValue, { color }]}>{value ?? '–'}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.username ?? 'usuário'} 👋</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long', day: '2-digit', month: 'long',
              })}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Operação de hoje</Text>
          <Text style={styles.heroTitle}>Painel móvel da clínica</Text>
          <Text style={styles.heroText}>
            Consulte números rápidos, cadastre atendimentos e acompanhe estoque sem voltar ao desktop.
          </Text>
          <View style={styles.heroPills}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillLabel}>Agenda</Text>
              <Text style={styles.heroPillValue}>{stats?.todaySch ?? 0}</Text>
            </View>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillLabel}>Estoque</Text>
              <Text style={styles.heroPillValue}>{formatCurrency(stats?.stockValue ?? 0)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ações rápidas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              activeOpacity={0.82}
              onPress={() => navigation.navigate(action.route, action.params)}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats grid */}
        <Text style={styles.sectionTitle}>Visão geral</Text>
        <View style={styles.grid}>
          <StatCard label="Clínicas"       value={stats?.clinics}   icon="🏥" />
          <StatCard label="Tutores"         value={stats?.tutors}    icon="👤" />
          <StatCard label="Pets"            value={stats?.pets}      icon="🐾" />
          <StatCard label="Funcionários"    value={stats?.employees} icon="👩‍⚕️" />
          <StatCard
            label="Agendamentos hoje"
            value={stats?.todaySch}
            icon="📅"
            color={colors.teal}
          />
          <StatCard
            label="Estoque baixo"
            value={stats?.lowStock}
            icon="📦"
            color={stats?.lowStock > 0 ? colors.danger : colors.success}
          />
        </View>

        <View style={styles.insightBox}>
          <Text style={styles.insightTitle}>Leitura rápida</Text>
          <Text style={styles.insightText}>
            {stats?.lowStock > 0
              ? `Existem ${stats.lowStock} produtos com estoque baixo exigindo reposição.`
              : 'Nenhum produto em nível crítico de estoque no momento.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    backgroundColor: colors.sidebarBg,
    margin: -spacing.md,
    padding: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.lg + spacing.md,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  greeting: { fontSize: 18, fontWeight: '700', color: '#fff' },
  date:     { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  heroCard: {
    backgroundColor: colors.sidebarBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroEyebrow: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  heroText: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.72)',
    marginTop: spacing.sm,
  },
  heroPills: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  heroPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  heroPillLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  heroPillValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  actionsRow: {
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  actionCard: {
    width: 148,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow.sm,
  },
  actionIcon: {
    fontSize: 26,
    marginBottom: spacing.sm,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    width: '47%',
    flexGrow: 1,
  },
  cardIcon:  { fontSize: 28, marginBottom: spacing.xs },
  cardValue: { fontSize: 26, fontWeight: '800', marginBottom: 2 },
  cardLabel: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  insightBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
});
