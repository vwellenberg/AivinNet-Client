#!/usr/bin/env bash
#
# AivinNet frontend deploy: build and copy into the live serve dir.
# Client-only changes need no restart — the backend serves the directory live.
#
# This is the canonical copy. `~/deploy-client.sh` on the server is a thin
# wrapper that pulls the repo and then execs THIS file, so the deploy procedure
# is reviewable and versioned instead of living as one untracked file on a box.

set -euo pipefail

REPO="${REPO:-$HOME/AivinNet-Client}"

# Where the backend serves the client from. The config directory was renamed
# swingmusic -> aivinnet (AivinNet#98) and the backend moves it on its first
# start after that release — so which name is real depends on whether that
# start has happened yet. Deploying into the wrong one is silent: the copy
# succeeds, and the browser keeps getting the old bundle from the other
# directory. Resolve it instead of hard-coding, preferring the new name.
default_serve="$HOME/.config/aivinnet/client"
if [[ ! -d "$HOME/.config/aivinnet" && -d "$HOME/.config/swingmusic" ]]; then
	default_serve="$HOME/.config/swingmusic/client"
fi
SERVE="${SERVE:-$default_serve}"

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

# Fail loudly rather than deploying into a directory the backend does not read.
# `cp` into a missing target would either error cryptically or, worse, create
# the wrong path and report success while the browser keeps the old bundle.
if [[ ! -d "$SERVE" ]]; then
	echo "SERVE dir does not exist: $SERVE" >&2
	echo "  The backend serves ~/.config/<aivinnet|swingmusic>/client — start it once so it" >&2
	echo "  creates (and migrates) that directory, or set SERVE=... explicitly." >&2
	exit 1
fi

cp -r "$REPO/dist/"* "$SERVE/"
echo "DEPLOYED into $SERVE"

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

# ---------------------------------------------------------------------------
# Post-deploy gate: no phone width may force a wider layout viewport.
#
# This lives HERE, not in Vitest, because jsdom has no layout engine — the two
# "not responsive any more" reports (#433, then the same bar again at 360px)
# were min-content arithmetic that only a real browser computes. The gate runs
# against the app that was just deployed, across the real phone-width spectrum
# (320–430; measuring only 390 is what let the second report through).
#
# A FAIL exits non-zero so it cannot be missed; the SKIP paths stay loud on
# purpose — a gate that silently evaporates is how this class of bug shipped.
# ---------------------------------------------------------------------------
UITEST="${UITEST:-$HOME/uitest}"
BACKEND="${BACKEND:-$HOME/AivinNet}"
if [[ -d "$UITEST/node_modules/playwright" ]]; then
    TOKEN=$(cd "$BACKEND" && "$HOME/.local/bin/uv" run python - <<'PY' 2>/dev/null | tail -1
from aivinnet.app_builder import app, config_jwt
from aivinnet.db.userdata import UserTable
from flask_jwt_extended import create_access_token
config_jwt(app)
with app.app_context():
    print(create_access_token(identity=list(UserTable.get_all())[0].todict()))
PY
)
    if [[ -n "$TOKEN" ]]; then
        if NODE_PATH="$UITEST/node_modules" TOKEN="$TOKEN" node "$REPO/scripts/overflow-check.js"; then
            echo "OVERFLOW_CHECK_OK"
        else
            echo "OVERFLOW_FAIL — a phone width renders wider than its viewport, see FAIL lines above"
            exit 1
        fi
    else
        echo "OVERFLOW_CHECK_SKIPPED (could not mint a token via $BACKEND)"
    fi
else
    echo "OVERFLOW_CHECK_SKIPPED (no playwright under $UITEST)"
fi
