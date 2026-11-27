#!/usr/bin/env bash
# Used by the CI "screenshots" job, inside the Android emulator runner.
# Usage: scripts/ci-screenshots.sh <apk> <output dir>
set -euo pipefail
APK="$1"
OUT="$2"
PKG=com.pomwik.warranty
mkdir -p "$OUT"

adb install -r "$APK"
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1
sleep 20
adb exec-out screencap -p > "$OUT/1-list-empty.png"

# Tap the "Add" button (bottom right) using the screen size.
SIZE=$(adb shell wm size | tail -n1 | awk '{print $NF}' | tr -d '\r')
W=${SIZE%x*}
H=${SIZE#*x}
adb shell input tap $((W * 80 / 100)) $((H * 93 / 100))
sleep 5
adb exec-out screencap -p > "$OUT/2-add.png"

adb logcat -d -s ReactNativeJS:V AndroidRuntime:E > "$OUT/logcat.txt" || true
