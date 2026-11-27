import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { WIDGET_NAME } from './NextWarrantyWidget';
import { renderNextWarranty } from './render';

/** Runs in the background when the launcher adds, updates (periodic) or resizes the widget. */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== WIDGET_NAME) return;
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      props.renderWidget(await renderNextWarranty(props.widgetInfo));
      break;
    default:
      break;
  }
}
