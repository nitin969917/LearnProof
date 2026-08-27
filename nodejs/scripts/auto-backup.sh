#!/bin/bash
set -e

# ==============================================================================
# LearnProof AI - Automated Local PostgreSQL Backup & Rotation Script
# ==============================================================================

BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +"%Y_%m_%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/learnproof_backup_${TIMESTAMP}.sql.gz"
LATEST_LINK="${BACKUP_DIR}/learnproof_latest.sql.gz"
DAYS_TO_KEEP=30

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "🚀 [$(date)] Starting LearnProof automated database backup..."

# Dump learnproof_db from the running Postgres container and gzip it
if docker ps --format '{{.Names}}' | grep -q '^learnproof-db$'; then
    docker exec learnproof-db pg_dump -U user -d learnproof_db | gzip > "${BACKUP_FILE}"
elif docker-compose -f /home/ubuntu/LearnProof/docker-compose.yml ps -q db >/dev/null 2>&1; then
    docker-compose -f /home/ubuntu/LearnProof/docker-compose.yml exec -T db pg_dump -U user -d learnproof_db | gzip > "${BACKUP_FILE}"
else
    echo "⚠️ PostgreSQL container (learnproof-db) is not running! Skipping backup."
    exit 0
fi

# Update latest symlink
ln -sf "${BACKUP_FILE}" "${LATEST_LINK}"

FILE_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
echo "✅ Backup successfully created: ${BACKUP_FILE} (${FILE_SIZE})"

# Auto-prune backups older than 30 days
echo "🧹 Pruning backups older than ${DAYS_TO_KEEP} days..."
find "${BACKUP_DIR}" -type f -name "learnproof_backup_*.sql.gz" -mtime +${DAYS_TO_KEEP} -delete

TOTAL_BACKUPS=$(ls -1 "${BACKUP_DIR}"/learnproof_backup_*.sql.gz 2>/dev/null | wc -l)
echo "📦 Total active backups in ${BACKUP_DIR}: ${TOTAL_BACKUPS}"
