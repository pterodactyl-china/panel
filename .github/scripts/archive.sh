#!/usr/bin/env bash
# Packs the release archive from a checkout whose frontend is already built.
#
#   bash archive.sh                # panel.tar.gz，不含 vendor
#   bash archive.sh --with-vendor  # panel-full.tar.gz，含 vendor，供国内直接部署
set -euo pipefail

rm -rf node_modules tests CONTRIBUTING.md flake.lock flake.nix phpunit.xml shell.nix

if [[ "${1:-}" == "--with-vendor" ]]; then
    tar -czf panel-full.tar.gz --exclude=panel.tar.gz * .editorconfig .env.example .gitignore .oxfmtrc.json
    exit 0
fi

tar -czf panel.tar.gz * .editorconfig .env.example .gitignore .oxfmtrc.json
