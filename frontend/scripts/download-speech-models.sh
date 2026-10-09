#!/usr/bin/env bash
# Downloads the small Vosk speech models (one per app language) and repackages them as
# public/models/vosk/<language>.tar.gz, the format vosk-browser loads. Skips models already there.
set -euo pipefail
cd "$(dirname "$0")/.."

BASE=https://alphacephei.com/vosk/models
# language code (as in src/i18n/locales) -> model name
MODELS=(
  "en vosk-model-small-en-us-0.15"
  "es vosk-model-small-es-0.42"
  "pt vosk-model-small-pt-0.3"
)

OUT=public/models/vosk
mkdir -p "$OUT"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

for entry in "${MODELS[@]}"; do
  read -r lang name <<<"$entry"
  if [ -f "$OUT/$lang.tar.gz" ]; then
    echo "$lang: already there"
    continue
  fi
  echo "$lang: downloading $name"
  curl -fsSL -o "$work/$name.zip" "$BASE/$name.zip"
  unzip -q "$work/$name.zip" -d "$work"
  tar -czf "$OUT/$lang.tar.gz" -C "$work" "$name"
  rm -rf "$work/$name" "$work/$name.zip"
done
echo "speech models ready in $OUT"
