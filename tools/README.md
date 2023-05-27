# Generate Certificates and Proxy Manager

This project provides a set of scripts to generate self-signed certificates using OpenSSL and manage a proxy server using the [simple-proxy](https://github.com/jthomperoo/simple-proxy) command.

## Directory Structure

The project has the following structure:

```bash
.
├── README.md
├── generate_certificates.sh
├── proxy.log
├── proxy.sh
└── keys
    ├── ca-cert.pem
    ├── ca-key.pem
    ├── client-cert.pem
    ├── client-key.pem
    ├── client-req.pem
    ├── server-cert.pem
    ├── server-key.pem
    └── server-req.pem
```

- `README.md`: This file, providing an overview and instructions for the project.
- `generate_certificates`: Script to generate self-signed certificates.
- `keys/`: Directory to store the generated certificates.
- `proxy.log`: Log file for the proxy.
- `proxy.sh`: Script to manage the proxy server.

## Generate Certificates

The `generate_certificates` script generates self-signed certificates using OpenSSL. It offers options to customize the common name, validity period, output directory, and OpenSSL configuration file.

### Command-line Options

- `-h, --help`: Show the help message with available options.
- `-c, --common-name`: Set the common name for the certificates (default: localhost).
- `-d, --days`: Set the validity period in days (default: 365000).
- `-p, --path`: Set the output directory for the certificates (default: current directory).
- `-s, --ssl-config`: Set the OpenSSL configuration file (default: system-specific).

### Script Functions

- `show_help()`: Show the help message with available options.
- `generate_ca_certificate()`: Generate the Certificate Authority (CA) certificate.
- `generate_server_certificate()`: Generate the server certificate.
- `generate_client_certificate()`: Generate the client certificate.
- `verify_certificates()`: Verify the generated certificates.


### Usage
To generate the certificates and save them in the keys/directory, run the following command:

```bash
$ generate_certificates.sh -p keys
```

## Proxy Manager

The `proxy.sh` script manages the proxy server using the `simple-proxy` command. It provides options to start, stop, check the status, and view the log of the proxy server.

### Available Commands

- `start`: Start the proxy server.
- `stop`: Stop the proxy server.
- `status`: Check the status of the proxy server.
- `log`: View the log of the proxy server.
- `help`: Show the help message with available commands.

### Script Variables

- `PROXY_COMMAND`: The command to start the proxy server using `simple-proxy`. The command is defined with the desired options and parameters.
- `LOG_FILE`: The log file of the proxy server.
- `PID_FILE`: The file that stores the Process ID (PID) of the running proxy server.

