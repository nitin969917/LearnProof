#!/bin/bash
set -e

# ==============================================================================
# LearnProof AI - One-Command Database Restore Tool
# ==============================================================================

BACKUP_DIR="/home/ubuntu/backups"
TARGET_BACKUP="${1:-${BACKUP_DIR}/learnproof_latest.sql.gz}"

if [ ! -f "${TARGET_BACKUP}" ]; then
    echo "❌ Error: Backup file not found at ${TARGET_BACKUP}"
    echo "Available backups in ${BACKUP_DIR}:"
    ls -lh "${BACKUP_DIR}"/learnproof_backup_*.sql.gz 2>/dev/null || echo "No backups found."
    exit 1
fi

echo "⚠️  [WARNING] You are about to restore LearnProof database from:"
echo "   ${TARGET_BACKUP}"
echo ""

# Ensure Postgres container is running
if ! docker ps --format '{{.Names}}' | grep -q '^learnproof-db$'; then
    echo "🚀 Starting PostgreSQL container..."
    docker-compose -f /home/ubuntu/LearnProof/docker-compose.yml up -d db
    sleep 3
fi

echo "🔄 Restoring database into PostgreSQL container (learnproof-db)..."
gunzip -c "${TARGET_BACKUP}" | docker exec -i learnproof-db psql -U user -d learnproof_db

echo "🔄 Restarting application container..."
docker-compose -f /home/ubuntu/LearnProof/docker-compose.yml restart app

echo "🎉 Database restore completed successfully!"
