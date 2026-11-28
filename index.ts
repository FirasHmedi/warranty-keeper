import { Platform } from 'react-native';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from './src/widget/task-handler';

if (Platform.OS === 'android') registerWidgetTaskHandler(widgetTaskHandler);

// Must stay last (react-native-android-widget docs for Expo Router).
import 'expo-router/entry';
