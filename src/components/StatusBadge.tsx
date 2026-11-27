import { StyleSheet, Text, View } from 'react-native';

import { t } from '../i18n';
import type { WarrantyStatus } from '../lib/warranty';
import { useTheme } from '../theme';

const LABEL = { active: 'statusActive', soon: 'statusSoon', expired: 'statusExpired' } as const;

export function StatusBadge({ status }: { status: WarrantyStatus }) {
  const theme = useTheme();
  const c = theme.status[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.fg }]}>{t(LABEL[status])}</Text>
    </View>
  );
}

export function daysText(daysLeft: number): string {
  if (daysLeft === 0) return t('endsToday');
  if (daysLeft === 1) return t('oneDayLeft');
  if (daysLeft > 1) return t('daysLeft', { n: daysLeft });
  if (daysLeft === -1) return t('expiredYesterday');
  return t('expiredAgo', { n: -daysLeft });
}

const styles = StyleSheet.create({
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '600' },
});
