#!/bin/bash
set -e

# ==============================================================================
# LearnProof AI - Complete Automated Backup Script (DB + Media + Ask My Notes + Social Hub)
# ==============================================================================

BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +"%Y_%m_%d_%H%M%S")
DB_BACKUP_FILE="${BACKUP_DIR}/learnproof_db_${TIMESTAMP}.sql.gz"
MEDIA_BACKUP_FILE="${BACKUP_DIR}/learnproof_media_${TIMESTAMP}.tar.gz"
LATEST_DB_LINK="${BACKUP_DIR}/learnproof_latest.sql.gz"
LATEST_MEDIA_LINK="${BACKUP_DIR}/learnproof_media_latest.tar.gz"
DAYS_TO_KEEP=30

mkdir -p "${BACKUP_DIR}"

echo "🚀 [$(date)] Starting full system backup (Learning, Social Hub, Ask My Notes)..."

# 1. Backup full PostgreSQL database (all 40 tables)
if docker ps --format '{{.Names}}' | grep -q '^learnproof-db$'; then
    docker exec learnproof-db pg_dump -U user -d learnproof_db | gzip > "${DB_BACKUP_FILE}"
elif docker-compose -f /home/ubuntu/LearnProof/docker-compose.yml ps -q db >/dev/null 2>&1; then
    docker-compose -f /home/ubuntu/LearnProof/docker-compose.yml exec -T db pg_dump -U user -d learnproof_db | gzip > "${DB_BACKUP_FILE}"
else
    echo "⚠️ PostgreSQL container (learnproof-db) is not running! Skipping DB dump."
fi

if [ -f "${DB_BACKUP_FILE}" ]; then
    ln -sf "${DB_BACKUP_FILE}" "${LATEST_DB_LINK}"
    DB_SIZE=$(ls -lh "${DB_BACKUP_FILE}" | awk '{print $5}')
    echo "✅ Database backup created: ${DB_BACKUP_FILE} (${DB_SIZE})"
fi

# 2. Backup uploaded media files (Ask My Notes PDFs/docs, profile avatars, note files)
APP_MEDIA_DIR="/home/ubuntu/LearnProof/nodejs/media"
if [ -d "${APP_MEDIA_DIR}" ]; then
    tar -czf "${MEDIA_BACKUP_FILE}" -C "/home/ubuntu/LearnProof/nodejs" media 2>/dev/null || true
    if [ -f "${MEDIA_BACKUP_FILE}" ]; then
        ln -sf "${MEDIA_BACKUP_FILE}" "${LATEST_MEDIA_LINK}"
        MEDIA_SIZE=$(ls -lh "${MEDIA_BACKUP_FILE}" | awk '{print $5}')
        echo "✅ Media & Documents backup created: ${MEDIA_BACKUP_FILE} (${MEDIA_SIZE})"
    fi
fi

# 3. Auto-prune backups older than 30 days
echo "🧹 Pruning backups older than ${DAYS_TO_KEEP} days..."
find "${BACKUP_DIR}" -type f \( -name "learnproof_db_*.sql.gz" -o -name "learnproof_media_*.tar.gz" -o -name "learnproof_backup_*.sql.gz" \) -mtime +${DAYS_TO_KEEP} -delete

TOTAL_DB=$(ls -1 "${BACKUP_DIR}"/learnproof_*.sql.gz 2>/dev/null | wc -l)
TOTAL_MEDIA=$(ls -1 "${BACKUP_DIR}"/learnproof_media_*.tar.gz 2>/dev/null | wc -l)
echo "📦 Backups summary in ${BACKUP_DIR}: ${TOTAL_DB} DB snapshots, ${TOTAL_MEDIA} media archives."
