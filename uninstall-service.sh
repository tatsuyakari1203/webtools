#!/bin/bash

# Script to uninstall WebTools systemd service

set -e

SERVICE_NAME="webtools"
SERVICE_FILE="webtools.service"
SYSTEMD_DIR="/etc/systemd/system"

echo "Uninstalling WebTools systemd service..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "This script must be run as root (use sudo)"
    exit 1
fi

# Stop service if it's running
if systemctl is-active --quiet $SERVICE_NAME; then
    echo "Stopping $SERVICE_NAME service..."
    systemctl stop $SERVICE_NAME
else
    echo "Service $SERVICE_NAME is not running"
fi

# Disable service from starting on boot
if systemctl is-enabled --quiet $SERVICE_NAME; then
    echo "Disabling $SERVICE_NAME service..."
    systemctl disable $SERVICE_NAME
else
    echo "Service $SERVICE_NAME is not enabled"
fi

# Remove service file
if [ -f "$SYSTEMD_DIR/$SERVICE_FILE" ]; then
    echo "Removing service file from $SYSTEMD_DIR..."
    rm "$SYSTEMD_DIR/$SERVICE_FILE"
else
    echo "Service file not found in $SYSTEMD_DIR"
fi

# Reload systemd daemon
echo "Reloading systemd daemon..."
systemctl daemon-reload

# Reset failed state if any
systemctl reset-failed $SERVICE_NAME 2>/dev/null || true

echo ""
echo "✅ WebTools service uninstalled successfully!"
echo "The service will no longer start automatically on system boot."
echo ""