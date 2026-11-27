import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { notify } from '../components/confirm';
import { DateField } from '../components/DateField';
import { useItem } from '../data/store';
import { type Item, newId } from '../data/types';
import { formatDate, t } from '../i18n';
import { type TranslationKey } from '../i18n/en';
import { isValidISODate } from '../lib/dates';
import { parseMonths, parsePrice } from '../lib/format';
import { type DraftError, validateDraft } from '../lib/validate';
import { MONTH_PRESETS, isValidMonths, todayISO, warrantyEndDate } from '../lib/warranty';
import { saveItem } from '../services/items';
import { deleteReceipt, saveReceipt } from '../services/receipts';
import { ensureNotificationPermission } from '../services/reminders';
import { type Theme, useTheme } from '../theme';

const ERROR_TEXT: Record<DraftError, TranslationKey> = {
  nameRequired: 'errNameRequired',
  dateInvalid: 'errDateInvalid',
  monthsInvalid: 'errMonthsInvalid',
  priceInvalid: 'errPriceInvalid',
};

export default function EditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { item, loading } = useItem(id);
  if (id && loading) return null;
  return <ItemForm key={item?.id ?? 'new'} initial={item} />;
}

function ItemForm({ initial }: { initial: Item | null }) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const initialMonths = initial?.warrantyMonths ?? 24;
  const isPreset = (MONTH_PRESETS as readonly number[]).includes(initialMonths);

  const [name, setName] = useState(initial?.name ?? '');
  const [store, setStore] = useState(initial?.store ?? '');
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? todayISO());
  const [preset, setPreset] = useState<number | 'custom'>(isPreset ? initialMonths : 'custom');
  const [customMonths, setCustomMonths] = useState(isPreset ? '' : String(initialMonths));
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [receiptUri, setReceiptUri] = useState<string | null>(initial?.receiptUri ?? null);
  const [reminders, setReminders] = useState(initial?.remindersEnabled ?? false);
  const [errors, setErrors] = useState<DraftError[]>([]);
  const [saving, setSaving] = useState(false);

  // Photos copied during this edit; cleaned up if they end up unused.
  const picked = useRef<string[]>([]);
  const saved = useRef(false);
  useEffect(
    () => () => {
      if (!saved.current) picked.current.forEach(deleteReceipt);
    },
    [],
  );

  const months = preset === 'custom' ? parseMonths(customMonths) : preset;
  const endDate =
    months !== null && isValidMonths(months) && isValidISODate(purchaseDate)
      ? warrantyEndDate(purchaseDate, months)
      : null;

  const pickPhoto = async (source: 'camera' | 'library') => {
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        notify(t('permCameraTitle'), t('permCameraText'));
        return;
      }
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets[0]) return;
    const uri = await saveReceipt(result.assets[0].uri);
    picked.current.push(uri);
    setReceiptUri(uri);
  };

  const toggleReminders = async (on: boolean) => {
    if (!on) {
      setReminders(false);
      return;
    }
    const granted = await ensureNotificationPermission();
    if (!granted) notify(t('permNotifTitle'), t('permNotifText'));
    setReminders(granted);
  };

  const onSave = async () => {
    const found = validateDraft({ name, purchaseDate, months, price });
    setErrors(found);
    if (found.length > 0 || months === null || endDate === null) return;
    setSaving(true);
    try {
      const item: Item = {
        id: initial?.id ?? newId(),
        name: name.trim(),
        store: store.trim() || null,
        purchaseDate,
        warrantyMonths: months,
        endDate,
        price: parsePrice(price) ?? null,
        notes: notes.trim() || null,
        receiptUri,
        remindersEnabled: reminders,
        notificationIds: initial?.notificationIds ?? [],
        createdAt: initial?.createdAt ?? 0,
        updatedAt: 0,
      };
      await saveItem(item, initial);
      saved.current = true;
      picked.current.filter((u) => u !== receiptUri).forEach(deleteReceipt);
      router.back();
    } catch {
      notify(t('saveError'), '');
    } finally {
      setSaving(false);
    }
  };

  const err = (e: DraftError) =>
    errors.includes(e) ? <Text style={styles.error}>{t(ERROR_TEXT[e])}</Text> : null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: initial ? t('editItem') : t('newItem') }} />
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Field label={t('name')} styles={styles}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('namePlaceholder')}
            placeholderTextColor={theme.muted}
            style={styles.input}
            maxLength={120}
          />
          {err('nameRequired')}
        </Field>

        <Field label={t('store')} styles={styles}>
          <TextInput
            value={store}
            onChangeText={setStore}
            placeholder={t('storePlaceholder')}
            placeholderTextColor={theme.muted}
            style={styles.input}
            maxLength={120}
          />
        </Field>

        <Field label={t('purchaseDate')} styles={styles}>
          <DateField value={purchaseDate} onChange={setPurchaseDate} />
          {err('dateInvalid')}
        </Field>

        <Field label={t('warrantyLength')} styles={styles}>
          <View style={styles.chips}>
            {[...MONTH_PRESETS, 'custom' as const].map((p) => {
              const selected = preset === p;
              return (
                <Pressable
                  key={String(p)}
                  onPress={() => setPreset(p)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {p === 'custom' ? t('custom') : t('monthsShort', { n: p })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {preset === 'custom' && (
            <TextInput
              value={customMonths}
              onChangeText={setCustomMonths}
              placeholder={t('customMonths')}
              placeholderTextColor={theme.muted}
              keyboardType="number-pad"
              style={styles.input}
              maxLength={3}
              accessibilityLabel={t('customMonths')}
            />
          )}
          {err('monthsInvalid')}
          <View style={styles.endBox}>
            <Text style={styles.endLabel}>{t('endDate')}</Text>
            <Text style={styles.endValue}>{endDate ? formatDate(endDate) : '—'}</Text>
          </View>
        </Field>

        <Field label={t('price')} styles={styles}>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="0,00"
            placeholderTextColor={theme.muted}
            keyboardType="decimal-pad"
            style={styles.input}
            maxLength={14}
          />
          {err('priceInvalid')}
        </Field>

        <Field label={t('notes')} styles={styles}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={t('notesPlaceholder')}
            placeholderTextColor={theme.muted}
            style={[styles.input, styles.multiline]}
            multiline
            maxLength={2000}
          />
        </Field>

        <Field label={t('receipt')} styles={styles}>
          {receiptUri ? (
            <View style={{ gap: 8 }}>
              <Image source={{ uri: receiptUri }} style={styles.receipt} resizeMode="cover" />
              <Pressable onPress={() => setReceiptUri(null)} accessibilityRole="button" style={styles.secondary}>
                <MaterialIcons name="close" size={18} color={theme.text} />
                <Text style={styles.secondaryText}>{t('removePhoto')}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.photoRow}>
              {Platform.OS !== 'web' && (
                <Pressable onPress={() => pickPhoto('camera')} accessibilityRole="button" style={styles.secondary}>
                  <MaterialIcons name="photo-camera" size={18} color={theme.text} />
                  <Text style={styles.secondaryText}>{t('takePhoto')}</Text>
                </Pressable>
              )}
              <Pressable onPress={() => pickPhoto('library')} accessibilityRole="button" style={styles.secondary}>
                <MaterialIcons name="photo-library" size={18} color={theme.text} />
                <Text style={styles.secondaryText}>{t('pickPhoto')}</Text>
              </Pressable>
            </View>
          )}
        </Field>

        <View style={styles.switchRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.label}>{t('reminders')}</Text>
            <Text style={styles.help}>{t('remindersHelp')}</Text>
          </View>
          <Switch
            value={reminders}
            onValueChange={toggleReminders}
            trackColor={{ true: theme.accent, false: theme.border }}
            accessibilityLabel={t('reminders')}
          />
        </View>

        <Pressable
          onPress={onSave}
          disabled={saving}
          accessibilityRole="button"
          style={({ pressed }) => [styles.primary, { opacity: pressed || saving ? 0.7 : 1 }]}
        >
          <Text style={styles.primaryText}>{t('save')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  children,
  styles,
}: {
  label: string;
  children: React.ReactNode;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    content: { padding: 16, gap: 18, paddingBottom: 48 },
    field: { gap: 8 },
    label: { fontSize: 14, fontWeight: '600', color: theme.text },
    help: { fontSize: 13, color: theme.muted, lineHeight: 18 },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      color: theme.text,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
    },
    multiline: { minHeight: 88, textAlignVertical: 'top' },
    error: { color: theme.danger, fontSize: 13 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { borderWidth: 1, borderColor: theme.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
    chipSelected: { backgroundColor: theme.accent, borderColor: theme.accent },
    chipText: { fontSize: 15, color: theme.text },
    chipTextSelected: { color: theme.onAccent, fontWeight: '600' },
    endBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    endLabel: { fontSize: 14, color: theme.muted },
    endValue: { fontSize: 16, fontWeight: '600', color: theme.text },
    photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    secondary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      alignSelf: 'flex-start',
    },
    secondaryText: { fontSize: 15, color: theme.text },
    receipt: { width: '100%', height: 200, borderRadius: 10 },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    primary: { backgroundColor: theme.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    primaryText: { color: theme.onAccent, fontSize: 17, fontWeight: '600' },
  });
}
