import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { formatDate, t } from '../i18n';
import type { WidgetRow } from '../lib/widget';
import { dark, light, type Theme } from '../theme';

export const WIDGET_NAME = 'NextWarranty';

function daysLabel(days: number): string {
  if (days === 0) return t('widgetToday');
  if (days === 1) return t('widgetOneDay');
  return t('widgetDaysLeft', { n: days });
}

const hex = (c: string) => c as `#${string}`;

function Body({ rows, theme }: { rows: WidgetRow[]; theme: Theme }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel={t('widgetTitle')}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: hex(theme.surface),
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'column',
        flexGap: 6,
      }}
    >
      <TextWidget
        text={t('widgetTitle')}
        maxLines={1}
        truncate="END"
        style={{ fontSize: 13, fontWeight: '600', color: hex(theme.muted) }}
      />
      {rows.length === 0 ? (
        <TextWidget text={t('widgetEmpty')} maxLines={3} style={{ fontSize: 15, color: hex(theme.text) }} />
      ) : (
        rows.map((row) => (
          <FlexWidget
            key={row.id}
            style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', flexGap: 8 }}
          >
            <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
              <TextWidget
                text={row.name}
                maxLines={1}
                truncate="END"
                style={{ fontSize: 16, fontWeight: '600', color: hex(theme.text) }}
              />
              <TextWidget
                text={formatDate(row.endDate)}
                maxLines={1}
                style={{ fontSize: 12, color: hex(theme.muted) }}
              />
            </FlexWidget>
            <TextWidget
              text={daysLabel(row.daysLeft)}
              maxLines={1}
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: hex(theme.status[row.status].fg),
                backgroundColor: hex(theme.status[row.status].bg),
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 3,
              }}
            />
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}

/** Light and dark versions; the launcher picks the one that matches the phone theme. */
export function NextWarrantyWidget({ rows }: { rows: WidgetRow[] }) {
  return { light: <Body rows={rows} theme={light} />, dark: <Body rows={rows} theme={dark} /> };
}
