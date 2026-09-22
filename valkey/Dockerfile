# syntax = docker/dockerfile:labs

ARG VALKEY_IMAGE
FROM ${VALKEY_IMAGE} AS base

# ---------------------------------------------------------------------
#  RUNTIME: cache  (service cache, UID 6380) - volatile, no persistence
# ---------------------------------------------------------------------
FROM base AS cache

COPY --chmod=644 config/cache.conf /etc/valkey/cache.conf

COPY --chmod=644 <<EOF /etc/passwd
cache:x:6380:6380:cache:/data:/bin/false
nobody:x:65534:65534:nobody:/nonexistent:/bin/false
EOF

COPY --chmod=644 <<EOF /etc/group
cache:x:6380:
shadow:x:42:
nobody:x:65534:
EOF

COPY --chmod=600 <<EOF /etc/shadow
cache:!::0:99999:7:::
nobody:*::0:99999:7:::
EOF

# ---------------------------------------------------------------------
#  RUNTIME: session  (service session, UID 6379) - RDB + AOF
# ---------------------------------------------------------------------
FROM base AS session

COPY --chmod=644 config/session.conf /etc/valkey/session.conf

COPY --chmod=644 <<EOF /etc/passwd
session:x:6379:6379:session:/data:/bin/false
nobody:x:65534:65534:nobody:/nonexistent:/bin/false
EOF

COPY --chmod=644 <<EOF /etc/group
session:x:6379:
shadow:x:42:
nobody:x:65534:
EOF

COPY --chmod=600 <<EOF /etc/shadow
session:!::0:99999:7:::
nobody:*::0:99999:7:::
EOF
