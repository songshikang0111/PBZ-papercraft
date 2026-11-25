#!/bin/bash
# Render chapters one after another (each waits for any running chapter render to finish).
# usage: film/tools/queue.sh 02-forest 03-village ...
cd "$(dirname "$0")/../.."
for c in "$@"; do
  while pgrep -f "render.py film/chapters/.* video" > /dev/null; do sleep 20; done
  mkdir -p work/film/renders/$c
  uv run -q --with playwright --with numpy python film/tools/render.py film/chapters/$c video 2>&1 | grep -v fromDrawing > work/film/renders/$c/render.log
done
