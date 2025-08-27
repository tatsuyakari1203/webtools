#!/bin/bash

# Script to install WebTools systemd service

set -e

SERVICE_NAME="webtools"
SERVICE_FILE="webtools.service"
SYSTEMD_DIR="/etc/systemd/system"
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Installing WebTools systemd service..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "This script must be run as root (use sudo)"
    exit 1
fi

# Check if service file exists
if [ ! -f "$CURRENT_DIR/$SERVICE_FILE" ]; then
    echo "Error: $SERVICE_FILE not found in current directory"
    exit 1
fi

# Stop service if it's running
if systemctl is-active --quiet $SERVICE_NAME; then
    echo "Stopping existing $SERVICE_NAME service..."
    systemctl stop $SERVICE_NAME
fi

# Copy service file to systemd directory
echo "Copying service file to $SYSTEMD_DIR..."
cp "$CURRENT_DIR/$SERVICE_FILE" "$SYSTEMD_DIR/"

# Reload systemd daemon
echo "Reloading systemd daemon..."
systemctl daemon-reload

# Enable service to start on boot
echo "Enabling $SERVICE_NAME service..."
systemctl enable $SERVICE_NAME

# Start the service
echo "Starting $SERVICE_NAME service..."
systemctl start $SERVICE_NAME

# Check service status
echo "Checking service status..."
systemctl status $SERVICE_NAME --no-pager

echo ""
echo "✅ WebTools service installed successfully!"
echo "Service will automatically start on system boot."
echo ""
echo "Useful commands:"
echo "  sudo systemctl status webtools    # Check service status"
echo "  sudo systemctl stop webtools     # Stop service"
echo "  sudo systemctl start webtools    # Start service"
echo "  sudo systemctl restart webtools  # Restart service"
echo "  sudo journalctl -u webtools -f   # View service logs"
echo ""