import type { WidgetInfo } from 'react-native-android-widget';

import { repository } from '../data/repository';
import { nextToExpire, rowsForHeight } from '../lib/widget';
import { todayISO } from '../lib/warranty';
import { NextWarrantyWidget } from './NextWarrantyWidget';

/** Builds the widget for its current size from the items stored on the phone. */
export async function renderNextWarranty(info: Pick<WidgetInfo, 'height'>) {
  const items = await repository.list();
  return NextWarrantyWidget({ rows: nextToExpire(items, todayISO(), rowsForHeight(info.height)) });
}
