#!/usr/bin/env bash

sslConfig=

case `uname -s` in
    Linux*)     sslConfig=/etc/ssl/openssl.cnf;;
    Darwin*)    sslConfig=/System/Library/OpenSSL/openssl.cnf;;
esac

show_help() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -h, --help      Show this help message"
  echo "  -c, --common-name     Common name for the certificates (default: localhost)"
  echo "  -d, --days      Validity period in days (default: 365000)"
  echo "  -p, --path      Output path for the certificates (default: current directory)"
  echo "  -s, --ssl-config     OpenSSL configuration file (default: $sslConfig)"
}

generate_ca_certificate() {
  echo "Generating CA certificate..."
  openssl genrsa 2048 > "$outputPath/ca-key.pem"
  openssl req -new -x509 -nodes -days "$validityPeriod" \
    -key "$outputPath/ca-key.pem" \
    -out "$outputPath/ca-cert.pem" \
    -subj "/CN=$commonName" -sha256
  echo "CA certificate generated."
}

generate_server_certificate() {
  echo "Generating server certificate..."
  openssl req -newkey rsa:2048 -nodes -keyout "$outputPath/server-key.pem" \
    -out "$outputPath/server-req.pem" -subj "/CN=$commonName" -sha256
  openssl x509 -req -days "$validityPeriod" -set_serial 01 \
    -in "$outputPath/server-req.pem" \
    -out "$outputPath/server-cert.pem" \
    -CA "$outputPath/ca-cert.pem" \
    -CAkey "$outputPath/ca-key.pem" \
    -CAcreateserial
  echo "Server certificate generated."
}

generate_client_certificate() {
  echo "Generating client certificate..."
  openssl req -newkey rsa:2048 -nodes -keyout "$outputPath/client-key.pem" \
    -out "$outputPath/client-req.pem" -subj "/CN=$commonName" -sha256
  openssl x509 -req -days "$validityPeriod" -set_serial 01 \
    -in "$outputPath/client-req.pem" \
    -out "$outputPath/client-cert.pem" \
    -CA "$outputPath/ca-cert.pem" \
    -CAkey "$outputPath/ca-key.pem" \
    -CAcreateserial
  echo "Client certificate generated."
}

verify_certificates() {
  echo "Verifying certificates..."
  openssl verify -CAfile "$outputPath/ca-cert.pem" "$outputPath/server-cert.pem" > /dev/null 2>&1
  openssl verify -CAfile "$outputPath/ca-cert.pem" "$outputPath/client-cert.pem" > /dev/null 2>&1
}

# Default values
commonName="localhost"
validityPeriod="365000"
outputPath="."

# Parse command-line options
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      show_help
      exit 0
      ;;
    -c|--common-name)
      commonName="$2"
      shift 2
      ;;
    -d|--days)
      validityPeriod="$2"
      shift 2
      ;;
    -p|--path)
      outputPath="$2"
      shift 2
      ;;
    -s|--ssl-config)
      sslConfig="$2"
      shift 2
      ;;
    *)
      show_help
      exit 0
      ;;
  esac
done

# Check if OpenSSL is available
if ! command -v openssl >/dev/null; then
  echo "Error: OpenSSL is not installed."
  exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$outputPath"

# Generate certificates
generate_ca_certificate
generate_server_certificate
generate_client_certificate
verify_certificates

echo "Certificate generation complete."
