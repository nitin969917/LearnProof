const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function migrate() {
    console.log('Starting migration...');

    const mysqlConnection = await mysql.createConnection(process.env.MYSQL_DATABASE_URL);
    console.log('Connected to MySQL source.');

    try {
        // Table list in dependency order
        const tables = [
            { prismaName: 'userProfile', tableName: 'UserProfile', idField: 'id' },
            { prismaName: 'subject', tableName: 'Subject', idField: 'id' },
            { prismaName: 'playlist', tableName: 'Playlist', idField: 'id' },
            { prismaName: 'video', tableName: 'Video', idField: 'id' },
            { prismaName: 'userActivityLog', tableName: 'UserActivityLog', idField: 'id' },
            { prismaName: 'subjectNote', tableName: 'SubjectNote', idField: 'id' },
            { prismaName: 'askMyNoteChat', tableName: 'AskMyNoteChat', idField: 'id' },
            { prismaName: 'videoNote', tableName: 'VideoNote', idField: 'id' },
            { prismaName: 'videoNoteFile', tableName: 'VideoNoteFile', idField: 'id' },
            { prismaName: 'videoComment', tableName: 'VideoComment', idField: 'id' },
            { prismaName: 'videoIntuition', tableName: 'VideoIntuition', idField: 'id' },
            { prismaName: 'videoQuizData', tableName: 'VideoQuizData', idField: 'id' },
            { prismaName: 'quiz', tableName: 'Quiz', idField: 'id' },
            { prismaName: 'certificate', tableName: 'Certificate', idField: 'id' }
        ];

        for (const { prismaName, tableName } of tables) {
            console.log(`Migrating table: ${tableName}...`);
            const [rows] = await mysqlConnection.execute(`SELECT * FROM ${tableName}`);
            console.log(`Found ${rows.length} rows in ${tableName}.`);

            if (rows.length === 0) continue;

            // Handle data type conversions (MySQL Int -> Postgres Boolean)
            const formattedRows = rows.map(row => {
                const newRow = { ...row };
                for (const key in newRow) {
                    if (newRow[key] instanceof Date) {
                        newRow[key] = newRow[key].toISOString();
                    }
                    
                    // Convert 0/1 to boolean for specific fields
                    if (['is_completed', 'passed', 'is_combined'].includes(key)) {
                        newRow[key] = !!newRow[key];
                    }
                }
                return newRow;
            });

            // Use createMany to insert (Preserves IDs if they are provided)
            await prisma[prismaName].createMany({
                data: formattedRows,
                skipDuplicates: true
            });
            console.log(`Successfully migrated ${rows.length} rows to ${tableName}.`);
        }

        // Reset PostgreSQL ID sequences for all tables
        console.log('Resetting sequences...');
        for (const { tableName } of tables) {
            await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), coalesce(max(id),0) + 1, false) FROM "${tableName}";`);
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mysqlConnection.end();
        await prisma.$disconnect();
    }
}

migrate();
