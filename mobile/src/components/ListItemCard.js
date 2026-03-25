import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '../theme';

/**
 * ListItemCard – pressable row used in all list screens.
 *
 * Props:
 *   title       (string) – main text
 *   subtitle    (string) – secondary text
 *   badge       (string) – optional badge label
 *   badgeColor  (string) – badge background or text color
 *   meta        (string) – extra right-side text
 *   onPress     (fn)
 */
export default function ListItemCard({ title, subtitle, badge, badgeColor, meta, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.72}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>

      <View style={styles.right}>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        {badge ? (
          <View style={[styles.badge, { backgroundColor: badgeColor ?? colors.primaryLight }]}>
            <Text style={[styles.badgeText, { color: badgeColor ? '#fff' : colors.primary }]}>
              {badge}
            </Text>
          </View>
        ) : null}
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow.sm,
  },
  content: { flex: 1, marginRight: spacing.sm },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  meta: { fontSize: 12, color: colors.textMuted },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  chevron: { fontSize: 20, color: colors.border, marginTop: -2 },
});
