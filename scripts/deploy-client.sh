#!/usr/bin/env bash
#
# AivinNet frontend deploy: build and copy into the live serve dir.
# Client-only changes need no restart — swingmusic serves the directory live.
#
# This is the canonical copy. `~/deploy-client.sh` on the server is a thin
# wrapper that pulls the repo and then execs THIS file, so the deploy procedure
# is reviewable and versioned instead of living as one untracked file on a box.

set -euo pipefail

REPO="${REPO:-$HOME/AivinNet-Client}"
SERVE="${SERVE:-$HOME/.config/swingmusic/client}"

# How long an orphaned asset is kept after it stops being part of the build.
#
# Measured rather than guessed: the server sends `Cache-Control: no-cache` for
# index.html AND for the hashed assets, so a browser must revalidate before
# using a stored copy — a stale index.html cannot quietly ask for a chunk that
# is gone. The window that remains is a tab that was ALREADY OPEN across a
# deploy and lazy-loads a route afterwards; it holds its index.html in memory.
# A week covers that generously.
GRACE_DAYS="${GRACE_DAYS:-7}"

cd "$REPO"
yarn build

cp -r "$REPO/dist/"* "$SERVE/"
echo "DEPLOYED"

# ---------------------------------------------------------------------------
# Prune orphans.
#
# Every deploy writes ~130 newly hashed files and leaves the previous ~130 in
# place, so the serve dir grows without bound (measured: 1099 assets against
# 131 in the build).
#
# Two conditions, both required: the file is NOT part of the current build, AND
# it has not been touched for GRACE_DAYS. Deleting purely by "not in the build"
# would pull the rug from under any tab still running the previous version.
# ---------------------------------------------------------------------------
if [[ -d "$SERVE/assets" && -d "$REPO/dist/assets" ]]; then
    pruned=0

    while IFS= read -r name; do
        file="$SERVE/assets/$name"
        # -mtime +N is "older than N days"; the copy above refreshes every file
        # that is still current, so age here means "missed the last N days of
        # deploys".
        if [[ -n "$(find "$file" -maxdepth 0 -mtime "+$GRACE_DAYS" 2>/dev/null)" ]]; then
            rm -f "$file"
            pruned=$((pruned + 1))
        fi
    done < <(comm -23 <(ls -1 "$SERVE/assets" | sort) <(ls -1 "$REPO/dist/assets" | sort))

    orphans=$(comm -23 <(ls -1 "$SERVE/assets" | sort) <(ls -1 "$REPO/dist/assets" | sort) | wc -l)
    echo "PRUNED $pruned orphaned asset(s) older than ${GRACE_DAYS}d; $orphans still within the grace window"
fi

curl -s http://localhost:1970/ | grep -oE "index\.[a-z0-9]+\.(js|css)" | head -2
