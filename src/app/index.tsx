import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { daysText, StatusBadge } from '../components/StatusBadge';
import { useItems } from '../data/store';
import { formatDate, t } from '../i18n';
import { buildList, countByStatus, type StatusFilter } from '../lib/items';
import { todayISO } from '../lib/warranty';
import { useTheme } from '../theme';

const FILTERS: { key: StatusFilter; label: 'filterAll' | 'filterActive' | 'filterSoon' | 'filterExpired' }[] = [
  { key: 'all', label: 'filterAll' },
  { key: 'soon', label: 'filterSoon' },
  { key: 'active', label: 'filterActive' },
  { key: 'expired', label: 'filterExpired' },
];

export default function ListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { items, loading } = useItems();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const today = todayISO();
  const rows = useMemo(() => buildList(items, today, query, filter), [items, today, query, filter]);
  const counts = useMemo(() => countByStatus(items, today), [items, today]);

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      {items.length > 0 && (
        <View style={styles.tools}>
          <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialIcons name="search" size={20} color={theme.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('searchPlaceholder')}
              placeholderTextColor={theme.muted}
              style={[styles.searchInput, { color: theme.text }]}
              accessibilityLabel={t('searchPlaceholder')}
            />
            {query !== '' && (
              <Pressable onPress={() => setQuery('')} accessibilityRole="button" hitSlop={8}>
                <MaterialIcons name="close" size={20} color={theme.muted} />
              </Pressable>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {FILTERS.map((f) => {
              const selected = filter === f.key;
              const count = f.key === 'all' ? items.length : counts[f.key];
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.chip,
                    { borderColor: selected ? theme.accent : theme.border },
                    selected && { backgroundColor: theme.accent },
                  ]}
                >
                  <Text style={[styles.chipText, { color: selected ? theme.onAccent : theme.text }]}>
                    {t(f.label)} · {count}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={rows}
        keyExtractor={(v) => v.item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 96 + insets.bottom }]}
        ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: theme.border }]} />}
        ListEmptyComponent={
          loading ? undefined : items.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="verified-user" size={48} color={theme.muted} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('emptyTitle')}</Text>
              <Text style={[styles.emptyText, { color: theme.muted }]}>{t('emptyText')}</Text>
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: theme.muted, marginTop: 32 }]}>{t('noResults')}</Text>
          )
        }
        renderItem={({ item: v }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/item/[id]', params: { id: v.item.id } })}
            accessibilityRole="button"
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
          >
            <View style={styles.rowMain}>
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                {v.item.name}
              </Text>
              <Text style={[styles.sub, { color: theme.muted }]} numberOfLines={1}>
                {t('endsOn', { date: formatDate(v.item.endDate) })}
                {v.item.store ? ` · ${v.item.store}` : ''}
              </Text>
            </View>
            <View style={styles.rowSide}>
              <StatusBadge status={v.status} />
              <Text style={[styles.days, { color: theme.status[v.status].fg }]}>{daysText(v.daysLeft)}</Text>
            </View>
          </Pressable>
        )}
      />

      <Pressable
        onPress={() => router.push('/edit')}
        accessibilityRole="button"
        accessibilityLabel={t('addItem')}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.accent, bottom: 20 + insets.bottom, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <MaterialIcons name="add" size={24} color={theme.onAccent} />
        <Text style={[styles.fabText, { color: theme.onAccent }]}>{t('addItem')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tools: { paddingHorizontal: 16, paddingTop: 4, gap: 10 },
  search: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, gap: 6 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 16 },
  chips: { gap: 8, paddingBottom: 4 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 14, fontWeight: '500' },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  sep: { height: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  rowMain: { flex: 1, gap: 3 },
  rowSide: { alignItems: 'flex-end', gap: 4 },
  name: { fontSize: 17, fontWeight: '600' },
  sub: { fontSize: 14 },
  days: { fontSize: 13, fontWeight: '500' },
  empty: { alignItems: 'center', marginTop: 80, gap: 10, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 21 },
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    elevation: 3,
  },
  fabText: { fontSize: 16, fontWeight: '600' },
});
