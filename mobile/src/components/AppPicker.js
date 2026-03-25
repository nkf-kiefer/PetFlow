import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  FlatList, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../theme';
import { normalizeSearch } from '../utils/formatters';

/**
 * AppPicker – custom modal-based picker (no extra native dependencies).
 *
 * Props:
 *   label      (string)
 *   value      (any)   – currently selected value
 *   options    ([{ label, value }])
 *   onValueChange (fn)
 *   placeholder (string)
 *   error      (string)
 */
export default function AppPicker({
  label,
  value,
  options = [],
  onValueChange,
  placeholder = 'Selecionar...',
  error,
  style,
  searchable = true,
}) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((o) => o.value === value);
  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const term = normalizeSearch(query);
    return options.filter((option) => normalizeSearch(option.label).includes(term));
  }, [options, query, searchable]);

  function openPicker() {
    setQuery('');
    setVisible(true);
  }

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        style={[styles.input, error && styles.inputError]}
        onPress={openPicker}
        activeOpacity={0.7}
      >
        <Text style={[styles.valueText, !selected && styles.placeholder]}>
          {selected?.label ?? placeholder}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
          <SafeAreaView edges={['bottom']} style={styles.sheetWrap}>
            <View style={styles.sheet}>
              <View style={styles.grabber} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{label ?? 'Selecionar'}</Text>
                <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              {searchable && options.length > 8 ? (
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar opção..."
                  placeholderTextColor={colors.textMuted}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              ) : null}

              <FlatList
                keyboardShouldPersistTaps="handled"
                data={filteredOptions}
                keyExtractor={(item) => String(item.value)}
                ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma opção encontrada.</Text>}
                renderItem={({ item }) => {
                  const isSelected = item.value === value;
                  return (
                    <TouchableOpacity
                      style={[styles.option, isSelected && styles.optionSelected]}
                      onPress={() => {
                        onValueChange(item.value);
                        setVisible(false);
                      }}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {item.label}
                      </Text>
                      {isSelected ? <Text style={styles.check}>✓</Text> : null}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: 6 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    backgroundColor: colors.surface,
    minHeight: 48,
  },
  inputError: { borderColor: colors.danger },
  valueText: { flex: 1, fontSize: 14, color: colors.textPrimary },
  placeholder: { color: colors.textMuted },
  arrow: { color: colors.textMuted, fontSize: 14 },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  sheetWrap: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '82%',
    minHeight: 280,
    overflow: 'hidden',
  },
  grabber: {
    width: 42,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: { ...typography.h3 },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 18, color: colors.textMuted },
  searchInput: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: { backgroundColor: colors.primaryLight },
  optionText: { flex: 1, fontSize: 14, color: colors.textPrimary },
  optionTextSelected: { color: colors.primary, fontWeight: '600' },
  check: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  emptyText: {
    padding: spacing.lg,
    textAlign: 'center',
    color: colors.textMuted,
  },
});
