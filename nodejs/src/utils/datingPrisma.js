const { PrismaClient } = require('../generated/dating-client');
const path = require('path');

const datingPrisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.resolve(__dirname, '../../prisma/dating-dev.db')}`,
    },
  },
});

module.exports = datingPrisma;
