#!/usr/bin/env bash
# perf-test実行ラッパー。
# 使い方: ./run.sh <scenario> [k6の追加オプション...]
# 例:     ./run.sh timeline-read
#         VUS=100 DURATION=3m ./run.sh timeline-read
#         ./run.sh login --vus 1 --duration 10s   (スモーク実行)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCENARIO="${1:-}"
shift || true

if [[ -z "$SCENARIO" ]]; then
  echo "使い方: $0 <scenario> [k6オプション...]"
  echo "利用可能なシナリオ:"
  ls "$SCRIPT_DIR/scripts/scenarios" | sed 's/\.js$//' | sed 's/^/  - /'
  exit 1
fi

SCENARIO_FILE="$SCRIPT_DIR/scripts/scenarios/$SCENARIO.js"
if [[ ! -f "$SCENARIO_FILE" ]]; then
  echo "シナリオファイルが見つかりません: $SCENARIO_FILE"
  exit 1
fi

if ! command -v k6 >/dev/null 2>&1; then
  echo "k6コマンドが見つかりません。README.mdのインストール手順を参照してください。"
  exit 1
fi

mkdir -p "$SCRIPT_DIR/results"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
SUMMARY_FILE="$SCRIPT_DIR/results/${SCENARIO}-${TIMESTAMP}.json"

echo "シナリオ '${SCENARIO}' を実行します（結果: ${SUMMARY_FILE}）"
k6 run --summary-export="$SUMMARY_FILE" "$SCENARIO_FILE" "$@"
