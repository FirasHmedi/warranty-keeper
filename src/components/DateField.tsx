import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatDate, t } from '../i18n';
import { atLocalTime, isValidISODate, toISODate } from '../lib/dates';
import { useTheme } from '../theme';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/** Native date picker on Android and iOS; a YYYY-MM-DD text field on web. */
export function DateField({ value, onChange }: Props) {
  const theme = useTheme();
  const [showIOS, setShowIOS] = useState(false);
  const current = isValidISODate(value) ? atLocalTime(value, 12) : new Date();

  if (Platform.OS === 'web') {
    return (
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t('datePlaceholder')}
        placeholderTextColor={theme.muted}
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
      />
    );
  }

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        maximumDate: new Date(),
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(toISODate(date));
        },
      });
    } else {
      setShowIOS((s) => !s);
    }
  };

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('purchaseDate')}
        onPress={open}
        style={[styles.input, styles.row, { borderColor: theme.border, backgroundColor: theme.surface }]}
      >
        <Text style={{ color: theme.text, fontSize: 16 }}>{isValidISODate(value) ? formatDate(value) : '—'}</Text>
        <MaterialIcons name="event" size={22} color={theme.muted} />
      </Pressable>
      {showIOS && (
        <DateTimePicker
          value={current}
          mode="date"
          display="inline"
          maximumDate={new Date()}
          onChange={(_e, date) => date && onChange(toISODate(date))}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
