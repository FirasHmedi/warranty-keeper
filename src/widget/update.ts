import { requestWidgetUpdate } from 'react-native-android-widget';

import { WIDGET_NAME } from './NextWarrantyWidget';
import { renderNextWarranty } from './render';

/** Redraws every widget on the home screen (after a change, and when the app starts). */
export function refreshWidgets(): void {
  requestWidgetUpdate({ widgetName: WIDGET_NAME, renderWidget: renderNextWarranty }).catch(() => {});
}
