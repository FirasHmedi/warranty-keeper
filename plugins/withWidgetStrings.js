// Widget picker label in English (default) and French.
const { AndroidConfig, withDangerousMod, withStringsXml } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const NAME = 'widget_next_warranty_label';
const EN = 'Next warranty to expire';
const FR = 'Prochaine garantie à finir';

module.exports = function withWidgetStrings(config) {
  config = withStringsXml(config, (c) => {
    c.modResults = AndroidConfig.Strings.setStringItem([{ $: { name: NAME }, _: EN }], c.modResults);
    return c;
  });
  return withDangerousMod(config, [
    'android',
    (c) => {
      const dir = path.join(c.modRequest.platformProjectRoot, 'app/src/main/res/values-fr');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, 'widget_strings.xml'),
        `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <string name="${NAME}">${FR}</string>\n</resources>\n`,
      );
      return c;
    },
  ]);
};
