# SSL Certificate for Timeweb PostgreSQL

This directory contains the SSL certificate required for secure connection to Timeweb PostgreSQL database.

## Certificate Information

- **File**: `root.crt`
- **Type**: ISRG Root X1 (Let's Encrypt root certificate)
- **Purpose**: SSL/TLS verification for PostgreSQL connections
- **Valid Until**: 2035-06-04

## Usage

The certificate is automatically loaded by the backend API when connecting to the PostgreSQL database in production mode.

## Security Note

This is a public root certificate and can be safely committed to the repository. It does not contain any sensitive information.
