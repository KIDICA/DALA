#!/usr/bin/env bash
echo Creating self-signed certificate
openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:4096 -keyout key.pem -out cert.pem