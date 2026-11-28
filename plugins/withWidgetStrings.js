// Launcher name, widget name and widget description in English (default) and French.
// react-native-android-widget writes the label and description as given, so app.json
// points them to the resources written here.
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const STRINGS = {
  values: {
    widget_next_warranty_label: 'Next warranty to expire',
    widget_next_warranty_desc: 'The warranties that end soonest. Tap to open the app.',
  },
  'values-fr': {
    // values/strings.xml gets app_name from app.json ("Warranty Keeper").
    app_name: 'Garanties',
    widget_next_warranty_label: 'Prochaine garantie à finir',
    widget_next_warranty_desc: 'Les garanties qui finissent le plus tôt. Touchez pour ouvrir l’app.',
  },
};

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/'/g, "\\'");

module.exports = function withWidgetStrings(config) {
  return withDangerousMod(config, [
    'android',
    (c) => {
      const res = path.join(c.modRequest.platformProjectRoot, 'app/src/main/res');
      for (const [dir, strings] of Object.entries(STRINGS)) {
        fs.mkdirSync(path.join(res, dir), { recursive: true });
        const items = Object.entries(strings).map(([name, text]) => `  <string name="${name}">${escape(text)}</string>`);
        fs.writeFileSync(
          path.join(res, dir, 'widget_strings.xml'),
          `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${items.join('\n')}\n</resources>\n`,
        );
      }
      return c;
    },
  ]);
};
