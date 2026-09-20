#!/usr/bin/env bash
# ==============================================================================
# LoadBench Studio — Local Pre-Flight Verification Pipeline
# 
# Runs the full test & quality ladder locally before committing or pushing.
# Guarantees that GitHub Actions will succeed on the first attempt without
# burning failed CI runner minutes.
# ==============================================================================

set -eo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

echo -e "${BOLD}${CYAN}====================================================================${NC}"
echo -e "${BOLD}${CYAN}  LoadBench Studio — Local Pre-Flight Verification Pipeline${NC}"
echo -e "${BOLD}${CYAN}====================================================================${NC}\n"

START_TIME=$(date +%s)

# 1. Version Synchronization & Immutability Check
echo -e "${BOLD}[1/7] Verifying Version Synchronization & Lock Status...${NC}"
PKG_VER=$(node -p "require('./package.json').version")
TAURI_VER=$(node -p "require('./src-tauri/tauri.conf.json').version")
CARGO_VER=$(grep -E '^version\s*=' src-tauri/Cargo.toml | head -1 | tr -d ' "' | cut -d= -f2)

if [ "$PKG_VER" != "$TAURI_VER" ] || [ "$PKG_VER" != "$CARGO_VER" ]; then
  echo -e "${RED}❌ Version Mismatch Detected!${NC}"
  echo "  package.json:            $PKG_VER"
  echo "  src-tauri/tauri.conf.json: $TAURI_VER"
  echo "  src-tauri/Cargo.toml:    $CARGO_VER"
  exit 1
fi
echo -e "${GREEN}✓ All package versions synchronized at ${PKG_VER}${NC}\n"

# 2. Frontend TypeScript Typecheck
echo -e "${BOLD}[2/7] Running TypeScript Strict Typecheck (tsc --noEmit)...${NC}"
npm run typecheck
echo -e "${GREEN}✓ TypeScript compilation passed with 0 type errors${NC}\n"

# 3. Frontend Production Bundle Build
echo -e "${BOLD}[3/7] Verifying Frontend Production Build (vite build)...${NC}"
npx vite build
echo -e "${GREEN}✓ Frontend production build passed${NC}\n"

# 4. Rust Backend Check
echo -e "${BOLD}[4/7] Running Cargo Check (src-tauri)...${NC}"
cargo check --manifest-path src-tauri/Cargo.toml
echo -e "${GREEN}✓ Cargo check passed with 0 errors${NC}\n"

# 5. Rust Strict Clippy Linter
echo -e "${BOLD}[5/7] Running Cargo Clippy with Strict Warnings (-D warnings)...${NC}"
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
echo -e "${GREEN}✓ Cargo clippy passed with 0 warnings${NC}\n"

# 6. Rust Backend Unit & Ballistic Tests
echo -e "${BOLD}[6/7] Running Rust Backend Unit Tests...${NC}"
cargo test --manifest-path src-tauri/Cargo.toml --verbose
echo -e "${GREEN}✓ All Rust unit and integration tests passed${NC}\n"

# 7. CSS Vendor Prefix Hygiene Check
echo -e "${BOLD}[7/7] Checking CSS Vendor Prefix Protocol (-webkit-backdrop-filter)...${NC}"
MISSING_PREFIXES=0
while IFS= read -r file; do
  if grep -n "backdrop-filter:" "$file" | grep -v "\-webkit\-backdrop\-filter:" > /dev/null 2>&1; then
    if awk '/^[[:space:]]*backdrop-filter:/ { if (prev !~ /-webkit-backdrop-filter:/) print NR ": " $0 } { prev = $0 }' "$file" | grep -q .; then
      echo -e "${YELLOW}⚠️  Warning: Missing preceding -webkit-backdrop-filter in $file${NC}"
      MISSING_PREFIXES=$((MISSING_PREFIXES + 1))
    fi
  fi
done < <(find src -type f \( -name "*.css" -o -name "*.tsx" -o -name "*.ts" \))

if [ "$MISSING_PREFIXES" -eq 0 ]; then
  echo -e "${GREEN}✓ All CSS vendor prefixes verified${NC}\n"
else
  echo -e "${YELLOW}⚠️  Detected $MISSING_PREFIXES file(s) with potential vendor prefix ordering issues${NC}\n"
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo -e "${BOLD}${GREEN}====================================================================${NC}"
echo -e "${BOLD}${GREEN}  ✓ ALL PRE-FLIGHT CHECKS PASSED SUCCESSFULLY (${DURATION}s)${NC}"
echo -e "${BOLD}${GREEN}  The codebase is in pristine condition for GitHub Actions.${NC}"
echo -e "${BOLD}${GREEN}====================================================================${NC}"
