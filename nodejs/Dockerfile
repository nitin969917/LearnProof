FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema for postinstall generation (required for npm install postinstall script)
COPY prisma ./prisma

# Install dependencies and PM2 globally
RUN npm install --production --legacy-peer-deps
RUN npm install pm2 -g

# Generate Prisma Clients
RUN npx prisma generate --schema=prisma/schema.prisma && npx prisma generate --schema=prisma/dating.prisma

# Copy source code
COPY . .

EXPOSE 8000

# Push schema changes then start with PM2 in CLUSTER mode (uses all CPU cores)
# instances: max automatically detects and uses all available CPU cores
CMD npx prisma db push --schema=prisma/schema.prisma && \
    npx prisma db push --schema=prisma/dating.prisma && \
    pm2-runtime start server.js -i max --name learnproof
