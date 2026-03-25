import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../theme';
import { formatDate, formatDateTime } from '../utils/formatters';

function pad(value) {
  return String(value).padStart(2, '0');
}

function parseDateValue(value, mode) {
  if (!value) return new Date();

  if (mode === 'datetime') {
    const normalized = value.includes('T') ? value : `${value}T09:00`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toFieldValue(date, mode) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());

  if (mode === 'datetime') {
    return `${year}-${month}-${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  return `${year}-${month}-${day}`;
}

function buildDayOptions(baseDate) {
  const list = [];
  for (let index = 0; index < 30; index += 1) {
    const next = new Date(baseDate);
    next.setDate(baseDate.getDate() + index);
    list.push(next);
  }
  return list;
}

function buildTimeOptions() {
  const list = [];
  for (let hour = 7; hour <= 21; hour += 1) {
    list.push({ hour, minute: 0 });
    list.push({ hour, minute: 30 });
  }
  return list;
}

export default function AppDateField({
  label,
  value,
  onChange,
  error,
  mode = 'date',
  placeholder,
  minTime = '07:00',
  maxTime = '21:00',
  intervalMinutes = 30,
}) {
  const [visible, setVisible] = useState(false);
  const currentDate = useMemo(() => parseDateValue(value, mode), [value, mode]);
  const [draftDate, setDraftDate] = useState(currentDate);

  const dayOptions = useMemo(() => buildDayOptions(new Date()), []);
  const timeOptions = useMemo(() => {
    const parseMinutes = (time) => {
      const [hours, minutes] = String(time).split(':').map(Number);
      return ((hours || 0) * 60) + (minutes || 0);
    };

    const start = parseMinutes(minTime);
    const end = parseMinutes(maxTime);
    const step = Math.max(5, Number(intervalMinutes) || 30);
    const list = [];

    for (let current = start; current <= end; current += step) {
      list.push({
        hour: Math.floor(current / 60),
        minute: current % 60,
      });
    }

    return list;
  }, [minTime, maxTime, intervalMinutes]);

  function openModal() {
    setDraftDate(parseDateValue(value, mode));
    setVisible(true);
  }

  function closeModal() {
    setVisible(false);
  }

  function selectDay(nextDay) {
    const updated = new Date(draftDate);
    updated.setFullYear(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate());
    setDraftDate(updated);
    if (mode === 'date') {
      onChange(toFieldValue(updated, mode));
      closeModal();
    }
  }

  function selectTime(hour, minute) {
    const updated = new Date(draftDate);
    updated.setHours(hour, minute, 0, 0);
    setDraftDate(updated);
    onChange(toFieldValue(updated, mode));
    closeModal();
  }

  const displayValue = value
    ? mode === 'datetime'
      ? formatDateTime(currentDate)
      : formatDate(currentDate)
    : (placeholder ?? (mode === 'datetime' ? 'Selecionar data e hora' : 'Selecionar data'));

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        activeOpacity={0.78}
        style={[styles.field, error && styles.fieldError]}
        onPress={openModal}
      >
        <Text style={[styles.valueText, !value && styles.placeholder]}>{displayValue}</Text>
        <Text style={styles.icon}>{mode === 'datetime' ? '🗓️' : '📅'}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={closeModal} />
          <SafeAreaView edges={['bottom']} style={styles.sheetWrap}>
            <View style={styles.sheet}>
              <View style={styles.grabber} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{label ?? 'Selecionar'}</Text>
                <TouchableOpacity onPress={closeModal}>
                  <Text style={styles.closeText}>Fechar</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionLabel}>Data</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
                {dayOptions.map((day) => {
                  const selected =
                    day.getFullYear() === draftDate.getFullYear() &&
                    day.getMonth() === draftDate.getMonth() &&
                    day.getDate() === draftDate.getDate();

                  return (
                    <TouchableOpacity
                      key={day.toISOString()}
                      style={[styles.dayChip, selected && styles.dayChipSelected]}
                      onPress={() => selectDay(day)}
                      activeOpacity={0.82}
                    >
                      <Text style={[styles.dayWeek, selected && styles.dayTextSelected]}>
                        {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                      </Text>
                      <Text style={[styles.dayNumber, selected && styles.dayTextSelected]}>
                        {day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {mode === 'datetime' ? (
                <>
                  <Text style={styles.sectionLabel}>Hora</Text>
                  <ScrollView contentContainerStyle={styles.timeGrid}>
                    {timeOptions.map((slot) => {
                      const selected =
                        draftDate.getHours() === slot.hour && draftDate.getMinutes() === slot.minute;

                      return (
                        <TouchableOpacity
                          key={`${slot.hour}:${slot.minute}`}
                          style={[styles.timeChip, selected && styles.timeChipSelected]}
                          onPress={() => selectTime(slot.hour, slot.minute)}
                          activeOpacity={0.82}
                        >
                          <Text style={[styles.timeText, selected && styles.dayTextSelected]}>
                            {pad(slot.hour)}:{pad(slot.minute)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              ) : null}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    marginBottom: 6,
  },
  field: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldError: {
    borderColor: colors.danger,
  },
  valueText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    marginRight: spacing.sm,
    textAlign: 'center',
  },
  placeholder: {
    color: colors.textMuted,
  },
  icon: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetWrap: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '82%',
    minHeight: 360,
    paddingBottom: spacing.lg,
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  sheetTitle: {
    ...typography.h3,
  },
  closeText: {
    color: colors.primary,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.md,
  },
  dayRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  dayChip: {
    width: 104,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  dayChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayWeek: {
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  dayNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  dayTextSelected: {
    color: '#fff',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  timeChip: {
    width: '22%',
    minWidth: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  timeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});