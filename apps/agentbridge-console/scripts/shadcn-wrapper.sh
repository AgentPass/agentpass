#!/bin/bash

REAL_YARN=$(command -v yarn)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FORCED_CWD="$(cd "${SCRIPT_DIR}/.." && pwd)"

FAKEBIN=$(mktemp -d)

cat > "${FAKEBIN}/yarn" <<EOF
#!/bin/bash
exec "${REAL_YARN}" -W --cwd "${FORCED_CWD}" "\$@"
EOF
chmod +x "${FAKEBIN}/yarn"

PATH="${FAKEBIN}:$PATH" npx shadcn "$@"

rm -rf "${FAKEBIN}"
