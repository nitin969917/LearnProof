#!/bin/bash
set -e

# ==============================================================================
# LearnProof AI - Full System Restore Tool (DB + Media + Ask My Notes + Social Hub)
# ==============================================================================

BACKUP_DIR="/home/ubuntu/backups"
TARGET_DB="${1:-${BACKUP_DIR}/learnproof_latest.sql.gz}"
TARGET_MEDIA="${BACKUP_DIR}/learnproof_media_latest.tar.gz"

if [ ! -f "${TARGET_DB}" ]; then
    echo "❌ Error: Database backup file not found at ${TARGET_DB}"
    echo "Available backups in ${BACKUP_DIR}:"
    ls -lh "${BACKUP_DIR}"/learnproof_*.sql.gz 2>/dev/null || echo "No backups found."
    exit 1
fi

echo "⚠️  [WARNING] You are about to restore LearnProof system from:"
echo "   DB:    ${TARGET_DB}"
[ -f "${TARGET_MEDIA}" ] && echo "   MEDIA: ${TARGET_MEDIA}"
echo ""

# Ensure Postgres container is running
if ! docker ps --format '{{.Names}}' | grep -q '^learnproof-db$'; then
    echo "🚀 Starting PostgreSQL container..."
    docker-compose -f /home/ubuntu/LearnProof/docker-compose.yml up -d db
    sleep 3
fi

echo "🔄 Restoring all tables into PostgreSQL container (learnproof-db)..."
gunzip -c "${TARGET_DB}" | docker exec -i learnproof-db psql -U user -d learnproof_db

# Restore media files if present
if [ -f "${TARGET_MEDIA}" ]; then
    echo "🔄 Restoring uploaded documents & media files..."
    tar -xzf "${TARGET_MEDIA}" -C "/home/ubuntu/LearnProof/nodejs"
fi

echo "🔄 Restarting application container..."
docker-compose -f /home/ubuntu/LearnProof/docker-compose.yml restart app

echo "🎉 Full system restore completed successfully! (Learning, Social Hub, Ask My Notes are all restored)"
