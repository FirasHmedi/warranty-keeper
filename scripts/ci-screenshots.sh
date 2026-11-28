#!/usr/bin/env bash
# Used by the CI "screenshots" job, inside the Android emulator runner.
# Runs the app in English then in French, creates sample items through the UI
# and takes screenshots. Tap targets are found with `uiautomator dump`.
# Usage: scripts/ci-screenshots.sh <apk> <output dir>
set -uo pipefail
APK="$1"
OUT="$2"
PKG=com.pomwik.warranty
mkdir -p "$OUT"
UI="$OUT/ui.xml"

log() { echo "== $*"; }

# Dump the screen hierarchy to $UI (retries: dump fails while the UI is busy).
dump() {
  for _ in 1 2 3 4 5; do
    if adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 && adb pull /sdcard/ui.xml "$UI" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  echo "uiautomator dump failed"
  return 1
}

# Print the center "x y" of the first node whose attribute matches exactly.
# Usage: find_node <attr> <value>   (attr: text, content-desc, resource-id)
find_node() {
  python3 - "$UI" "$1" "$2" <<'PY'
import re, sys, xml.etree.ElementTree as ET
path, attr, value = sys.argv[1:]
for node in ET.parse(path).iter('node'):
    if node.get(attr) == value or (attr == 'text' and node.get('hint') == value):
        m = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.get('bounds', ''))
        if m:
            x1, y1, x2, y2 = map(int, m.groups())
            if x2 > x1 and y2 > y1:
                print((x1 + x2) // 2, (y1 + y2) // 2)
                sys.exit(0)
sys.exit(1)
PY
}

# Tap the node; scroll down and retry when it is not on screen.
tap() {
  local attr="$1" value="$2" pos
  for _ in 1 2 3 4 5 6; do
    dump || return 1
    if pos=$(find_node "$attr" "$value"); then
      # shellcheck disable=SC2086
      adb shell input tap $pos
      sleep 1.5
      return 0
    fi
    adb shell input swipe $((W / 2)) $((H * 70 / 100)) $((W / 2)) $((H * 35 / 100)) 300
    sleep 1
  done
  echo "Not found on screen: $attr=$value"
  cp "$UI" "$OUT/missing-$(echo "$value" | tr -c 'a-zA-Z0-9' '_').xml" || true
  return 1
}

has_text() { dump >/dev/null && grep -q "text=\"$1\"" "$UI"; }

hide_keyboard() {
  if adb shell dumpsys input_method | grep -q "mInputShown=true"; then
    adb shell input keyevent KEYCODE_BACK
    sleep 1
  fi
}

# Type ASCII text into the focused field (spaces as %s).
type_text() {
  adb shell input text "${1// /%s}"
  sleep 0.5
  hide_keyboard
}

shot() {
  sleep 2
  adb exec-out screencap -p > "$OUT/$1.png"
  log "screenshot $1.png"
}

launch() {
  adb shell am force-stop "$PKG"
  adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null
  sleep 12
}

set_locale() {
  local tag="$1"
  log "locale $tag"
  # Per-app language (Android 13+, the app declares en/fr in its locale config).
  adb shell cmd locale set-app-locales "$PKG" --locales "$tag" || true
  adb shell cmd locale get-app-locales "$PKG" || true
}

# Fallback: system locale through a root shell and a framework restart.
set_system_locale() {
  adb root >/dev/null 2>&1 || true
  sleep 3
  adb wait-for-device
  adb shell setprop persist.sys.locale "$1"
  adb shell setprop ctl.restart zygote
  sleep 10
  adb wait-for-device
  for _ in $(seq 1 60); do
    [ "$(adb shell getprop sys.boot_completed | tr -d '\r')" = 1 ] && break
    sleep 2
  done
  sleep 30
  adb shell input keyevent 82 || true
}

# Purchase date: open the native picker, go back <months> months, pick day <day>.
pick_date() {
  local field="$1" months="$2" day="$3"
  tap content-desc "$field" || return 1
  sleep 1
  dump || return 1
  local prev
  prev=$(find_node resource-id android:id/prev) || { echo "no prev button"; cp "$UI" "$OUT/missing-picker.xml"; return 1; }
  for _ in $(seq 1 "$months"); do
    # shellcheck disable=SC2086
    adb shell input tap $prev
    sleep 0.6
  done
  tap text "$day" || return 1
  tap resource-id android:id/button1
}

# Add one item through the form. Args: language-specific labels + values.
add_item() {
  local add="$1" date_label="$2" name="$3" store="$4" months_back="$5" day="$6" preset="$7" price="$8" save="$9"
  tap content-desc "$add" || return 1
  sleep 2
  tap text "$NAME_PH" && type_text "$name"
  tap text "$STORE_PH" && type_text "$store"
  if [ "$months_back" -gt 0 ]; then pick_date "$date_label" "$months_back" "$day"; fi
  tap text "$preset"
  tap text "$PRICE_PH" && type_text "$price"
  tap text "$save" || return 1
  sleep 2
}

run_language() {
  local lang="$1"
  if [ "$lang" = fr ]; then
    TAG=fr-FR
    ADD="Ajouter"; DATE_LABEL="Date d’achat"; SAVE="Enregistrer"; NAME_PH="Ex. : lave-linge"
    STORE_PH="Où vous l’avez acheté"; PRICE_PH="0,00"; P12="12 mois"; P24="24 mois"; EMPTY="Aucun article"
  else
    TAG=en-GB
    ADD="Add item"; DATE_LABEL="Purchase date"; SAVE="Save"; NAME_PH="e.g. Washing machine"
    STORE_PH="Where you bought it"; PRICE_PH="0.00"; P12="12 mo"; P24="24 mo"; EMPTY="No items yet"
  fi
  adb shell pm clear "$PKG" >/dev/null
  adb shell cmd uimode night no
  set_locale "$TAG"
  launch
  if ! has_text "$EMPTY"; then
    log "per-app language not applied, switching the system locale"
    set_system_locale "$TAG"
    launch
  fi
  if ! has_text "$EMPTY"; then
    echo "The app does not show the $lang empty state text \"$EMPTY\"."
    cp "$UI" "$OUT/$lang-wrong-language.xml"
    shot "$lang-wrong-language"
    return 1
  fi
  shot "$lang-1-empty"

  # Add form, empty: placeholders in the app language.
  tap content-desc "$ADD" || return 1
  shot "$lang-2-add"
  adb shell input keyevent KEYCODE_BACK
  sleep 2

  if [ "$lang" = fr ]; then
    add_item "$ADD" "$DATE_LABEL" "Lave-linge" "Magasin du centre" 0 1 "$P24" "549,90" "$SAVE" || return 1
    add_item "$ADD" "$DATE_LABEL" "Casque audio" "Boutique en ligne" 11 15 "$P12" "89" "$SAVE" || return 1
    add_item "$ADD" "$DATE_LABEL" "Bouilloire" "Grande surface" 14 3 "$P12" "39,99" "$SAVE" || return 1
  else
    add_item "$ADD" "$DATE_LABEL" "Washing machine" "High street store" 0 1 "$P24" "549.90" "$SAVE" || return 1
    add_item "$ADD" "$DATE_LABEL" "Headphones" "Online shop" 11 15 "$P12" "89" "$SAVE" || return 1
    add_item "$ADD" "$DATE_LABEL" "Coffee maker" "Supermarket" 14 3 "$P12" "39.99" "$SAVE" || return 1
  fi
  shot "$lang-3-list"

  # Details of the first item, then its edit form (price shown with the language separator).
  local first
  first=$([ "$lang" = fr ] && echo "Lave-linge" || echo "Washing machine")
  tap text "$first" || return 1
  shot "$lang-4-details"
  if [ "$lang" = fr ]; then tap content-desc "Modifier"; else tap content-desc "Edit"; fi
  shot "$lang-5-edit"
  adb shell input keyevent KEYCODE_BACK
  sleep 1.5
  adb shell input keyevent KEYCODE_BACK
  sleep 1.5

  adb shell cmd uimode night yes
  sleep 3
  shot "$lang-6-list-dark"
  adb shell cmd uimode night no
  sleep 2
}

adb install -r "$APK"
SIZE=$(adb shell wm size | tail -n1 | awk '{print $NF}' | tr -d '\r')
W=${SIZE%x*}
H=${SIZE#*x}
log "screen ${W}x${H}"

# Home-screen widget, best effort: long-press the home screen, open the widget
# picker, find the app's widget and drag it onto the home screen.
add_widget() {
  adb shell input keyevent KEYCODE_HOME
  sleep 3
  adb shell input swipe $((W / 2)) $((H * 45 / 100)) $((W / 2)) $((H * 45 / 100)) 1500
  sleep 2
  tap text "Widgets" || return 1
  sleep 3
  local label pos="" i
  # The picker lists apps by name ("Garanties" in French, "Warranty Keeper" in English);
  # open it, then drag its widget preview.
  tap text "Garanties" || tap text "Warranty Keeper" || { cp "$UI" "$OUT/widget-picker.xml"; return 1; }
  sleep 2
  for i in 1 2 3; do
    dump || return 1
    for label in "Prochaine garantie à finir" "Next warranty to expire"; do
      if pos=$(find_node text "$label"); then break 2; fi
    done
    pos=""
    adb shell input swipe $((W / 2)) $((H * 70 / 100)) $((W / 2)) $((H * 40 / 100)) 300
    sleep 1
  done
  [ -n "$pos" ] || { cp "$UI" "$OUT/widget-picker.xml"; echo "widget not in picker"; return 1; }
  # The preview sits just above its label.
  local x=${pos% *} y=${pos#* }
  y=$((y - 150))
  adb shell input draganddrop "$x" "$y" $((W / 2)) $((H * 40 / 100)) 2500 || \
    adb shell input swipe "$x" "$y" $((W / 2)) $((H * 40 / 100)) 2500
  sleep 6
  shot "widget-home"
  adb shell cmd uimode night yes
  sleep 5
  shot "widget-home-dark"
  adb shell cmd uimode night no
  sleep 2
  adb shell dumpsys appwidget | grep -iA3 "nextwarranty" > "$OUT/appwidget-bound.txt" || true
}

STATUS=0
run_language en || { echo "English run failed"; STATUS=1; }
run_language fr || { echo "French run failed"; STATUS=1; }

# The widget provider must be registered with the system.
adb shell dumpsys appwidget > "$OUT/appwidget.txt" || true
if grep -q "warranty.widget.NextWarranty" "$OUT/appwidget.txt"; then
  log "widget provider registered"
else
  echo "Widget provider com.pomwik.warranty/.widget.NextWarranty not listed by dumpsys appwidget"
  STATUS=1
fi
add_widget || echo "Could not add the widget to the home screen (optional step)"
rm -f "$UI"

adb logcat -d -s ReactNativeJS:V AndroidRuntime:E > "$OUT/logcat.txt" || true

# Fail if the app crashed during the run.
if adb logcat -d | grep -q "FATAL EXCEPTION"; then adb logcat -d | grep -A30 "FATAL EXCEPTION"; echo "App crashed"; exit 1; fi
exit $STATUS
