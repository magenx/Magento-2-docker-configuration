# syntax = docker/dockerfile:labs

ARG OPENSEARCH_IMAGE
ARG OPENSEARCH_DEV_IMAGE

FROM ${OPENSEARCH_DEV_IMAGE} AS build
USER root
RUN <<EOF
/usr/share/opensearch/bin/opensearch-plugin install --batch analysis-icu
/usr/share/opensearch/bin/opensearch-plugin install --batch analysis-phonetic
EOF

# ---------------------------------------------------------------------
#  Own TLS certificates instead of the security plugin demo ones
#  https://docs.opensearch.org/latest/security/configuration/generate-certificates/
#  root CA key stays in this stage, only signed certs go to runtime
# ---------------------------------------------------------------------
ARG BRAND
ARG OPENSEARCH_CERT_DAYS=730

WORKDIR /certs
RUN <<EOF
  set -e
  command -v openssl >/dev/null || { apt-get update; apt-get install -y --no-install-recommends openssl; }

  printf '[req]\ndistinguished_name = dn\nprompt = no\n[dn]\nO = %s\nCN = %s-root-ca\n[v3_ca]\nbasicConstraints = critical,CA:TRUE\nkeyUsage = critical,keyCertSign,cRLSign\nsubjectKeyIdentifier = hash\n' \
    "${BRAND}" "${BRAND}" > ca.cnf
  printf 'basicConstraints = CA:FALSE\nkeyUsage = critical,digitalSignature,keyEncipherment\nextendedKeyUsage = serverAuth,clientAuth\nsubjectAltName = DNS:opensearch\n' > node.ext
  printf 'basicConstraints = CA:FALSE\nkeyUsage = critical,digitalSignature\nextendedKeyUsage = clientAuth\n' > admin.ext

  openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out root-ca-key.pem
  openssl req -x509 -new -sha256 -key root-ca-key.pem -config ca.cnf -extensions v3_ca \
    -days "${OPENSEARCH_CERT_DAYS}" -out root-ca.pem

  for cert in node admin; do
    [ "${cert}" = node ] && cn=opensearch || cn=admin
    openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out ${cert}-key.pem
    openssl req -new -key ${cert}-key.pem -config ca.cnf -subj "/O=${BRAND}/CN=${cn}" -out ${cert}.csr
    openssl x509 -req -sha256 -in ${cert}.csr -CA root-ca.pem -CAkey root-ca-key.pem -CAcreateserial \
      -days "${OPENSEARCH_CERT_DAYS}" -extfile ${cert}.ext -out ${cert}.pem
    openssl verify -CAfile root-ca.pem ${cert}.pem
  done
EOF

# Admin user only, no demo users. Password comes from a build secret, not a build arg
RUN --mount=type=secret,id=opensearch_admin_password,required=true <<EOF
  set -e
  hash=$(/usr/share/opensearch/plugins/opensearch-security/tools/hash.sh \
    -p "$(cat /run/secrets/opensearch_admin_password)" | tail -n 1)
  case "${hash}" in \$2*) ;; *) echo "hash.sh failed: ${hash}"; exit 1 ;; esac
  cat > /certs/internal_users.yml <<YML
_meta:
  type: "internalusers"
  config_version: 2

admin:
  hash: "${hash}"
  reserved: true
  backend_roles:
  - "admin"
  description: "Admin user"
YML
EOF

# Security settings, demo installer is disabled with DISABLE_INSTALL_DEMO_CONFIG
RUN <<EOF
  set -e
  cd /usr/share/opensearch/config
  cat >> opensearch.yml <<YML

######## Start OpenSearch Security Configuration ########
plugins.security.ssl.transport.pemcert_filepath: node.pem
plugins.security.ssl.transport.pemkey_filepath: node-key.pem
plugins.security.ssl.transport.pemtrustedcas_filepath: root-ca.pem
plugins.security.ssl.transport.enforce_hostname_verification: false
plugins.security.ssl.http.enabled: false
plugins.security.allow_default_init_securityindex: true
plugins.security.authcz.admin_dn:
  - "CN=admin,O=${BRAND}"
plugins.security.nodes_dn:
  - "CN=opensearch,O=${BRAND}"
plugins.security.restapi.roles_enabled: ["all_access", "security_rest_api_access"]
######## End OpenSearch Security Configuration ########
YML
  # opensearch creates the keystore on start if missing, config is read-only at runtime
  [ -f opensearch.keystore ] || /usr/share/opensearch/bin/opensearch-keystore create
EOF

FROM ${OPENSEARCH_IMAGE}

ARG DHI_STACK_UID

COPY --from=build /usr/share/opensearch/plugins /usr/share/opensearch/plugins
COPY --from=build --chown=${DHI_STACK_UID}:${DHI_STACK_UID} --chmod=0400 \
  /usr/share/opensearch/config/opensearch.yml \
  /certs/root-ca.pem \
  /certs/node.pem \
  /certs/node-key.pem \
  /certs/admin.pem \
  /certs/admin-key.pem \
  /usr/share/opensearch/config/
COPY --from=build --chown=${DHI_STACK_UID}:${DHI_STACK_UID} --chmod=0600 \
  /usr/share/opensearch/config/opensearch.keystore /usr/share/opensearch/config/
COPY --from=build --chown=${DHI_STACK_UID}:${DHI_STACK_UID} --chmod=0400 \
  /certs/internal_users.yml /usr/share/opensearch/config/opensearch-security/
