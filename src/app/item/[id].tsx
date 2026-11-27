import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { confirmDelete } from '../../components/confirm';
import { daysText, StatusBadge } from '../../components/StatusBadge';
import { useItem } from '../../data/store';
import { formatDate, locale, t } from '../../i18n';
import { formatPrice } from '../../lib/format';
import { daysRemaining, todayISO, warrantyStatus } from '../../lib/warranty';
import { deleteItem } from '../../services/items';
import { useTheme } from '../../theme';

export default function ItemScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { item, loading } = useItem(id);

  if (loading) return null;
  if (!item) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.muted, fontSize: 16 }}>{t('notFound')}</Text>
      </View>
    );
  }

  const today = todayISO();
  const status = warrantyStatus(item.endDate, today);
  const days = daysRemaining(item.endDate, today);

  const onDelete = () =>
    confirmDelete(t('deleteTitle'), t('deleteText', { name: item.name }), async () => {
      await deleteItem(item);
      router.back();
    });

  const rows: [string, string][] = [
    [t('endDate'), formatDate(item.endDate)],
    [t('purchaseDate'), formatDate(item.purchaseDate)],
    [t('warrantyLength'), t('months', { n: item.warrantyMonths })],
  ];
  if (item.store) rows.push([t('storeLabel'), item.store]);
  if (item.price !== null) rows.push([t('priceLabel'), formatPrice(item.price, locale)]);

  return (
    <>
      <Stack.Screen
        options={{
          title: t('details'),
          headerRight: () => (
            <Pressable
              onPress={() => router.push({ pathname: '/edit', params: { id: item.id } })}
              accessibilityRole="button"
              accessibilityLabel={t('edit')}
              hitSlop={10}
            >
              <MaterialIcons name="edit" size={24} color={theme.text} />
            </Pressable>
          ),
        }}
      />
      <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{item.name}</Text>
        <View style={styles.statusRow}>
          <StatusBadge status={status} />
          <Text style={[styles.days, { color: theme.status[status].fg }]}>{daysText(days)}</Text>
        </View>

        <View style={[styles.table, { borderColor: theme.border }]}>
          {rows.map(([label, value]) => (
            <View key={label} style={[styles.tableRow, { borderColor: theme.border }]}>
              <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
              <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
            </View>
          ))}
          <View style={[styles.tableRow, { borderColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.muted }]}>{t('reminders')}</Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {item.remindersEnabled ? t('remindersOn') : t('remindersOff')}
            </Text>
          </View>
        </View>

        {item.notes ? (
          <View style={styles.block}>
            <Text style={[styles.label, { color: theme.muted }]}>{t('notesLabel')}</Text>
            <Text style={[styles.notes, { color: theme.text }]}>{item.notes}</Text>
          </View>
        ) : null}

        {item.receiptUri ? (
          <View style={styles.block}>
            <Text style={[styles.label, { color: theme.muted }]}>{t('receiptLabel')}</Text>
            <Image
              source={{ uri: item.receiptUri }}
              style={[styles.receipt, { borderColor: theme.border }]}
              resizeMode="contain"
              accessibilityLabel={t('receiptLabel')}
            />
          </View>
        ) : null}

        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          style={({ pressed }) => [styles.delete, { borderColor: theme.danger, opacity: pressed ? 0.6 : 1 }]}
        >
          <MaterialIcons name="delete-outline" size={20} color={theme.danger} />
          <Text style={[styles.deleteText, { color: theme.danger }]}>{t('delete')}</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  days: { fontSize: 15, fontWeight: '500' },
  table: { borderTopWidth: StyleSheet.hairlineWidth },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: 14 },
  value: { fontSize: 15, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  block: { gap: 6 },
  notes: { fontSize: 15, lineHeight: 21 },
  receipt: { width: '100%', height: 320, borderWidth: 1, borderRadius: 10 },
  delete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 8,
  },
  deleteText: { fontSize: 16, fontWeight: '600' },
});
