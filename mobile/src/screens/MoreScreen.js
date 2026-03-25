import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../theme';

const MENU = [
  { label: 'Clínicas', subtitle: 'Base operacional e unidades', icon: '🏥', screen: 'Clinicas' },
  { label: 'Funcionários', subtitle: 'Equipe e perfis de acesso', icon: '👩‍⚕️', screen: 'Funcionarios' },
  { label: 'Serviços', subtitle: 'Catálogo e duração', icon: '⚙️',  screen: 'Servicos' },
  { label: 'Produtos', subtitle: 'Itens vendidos e usados', icon: '📦',  screen: 'Produtos' },
  { label: 'Estoque', subtitle: 'Entradas, saídas e ajustes', icon: '📊',  screen: 'Estoque' },
  { label: 'Financeiro', subtitle: 'Receitas, despesas e status', icon: '💰',  screen: 'Financeiro' },
];

export default function MoreScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Módulos</Text>
        <Text style={styles.subheading}>Gerencie os recursos mais administrativos do PetFlow.</Text>
        {MENU.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={[styles.row, shadow.sm]}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.72}
          >
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <View style={styles.copyWrap}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  scroll:  { padding: spacing.md, paddingBottom: spacing.xl },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  subheading: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  copyWrap: { flex: 1 },
  icon:    { fontSize: 22 },
  label:   { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
  chevron: { fontSize: 24, color: colors.border },
});
