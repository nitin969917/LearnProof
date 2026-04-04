FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema for postinstall generation (required for npm install postinstall script)
COPY prisma ./prisma

# Install dependencies and PM2 globally
RUN npm install --production --legacy-peer-deps
RUN npm install pm2 -g

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

EXPOSE 8000

# Start command with PM2 Runtime for 24-core clustering
CMD ["pm2-runtime", "start", "server.js", "-i", "max"]
