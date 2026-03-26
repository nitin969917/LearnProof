FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema for postinstall generation
COPY prisma ./prisma

# Install dependencies
RUN npm install --production --legacy-peer-deps

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

EXPOSE 8000

# Start command
CMD ["npm", "start"]
