# Build stage
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Set the backend URL for the build
ARG VITE_BACKEND_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_ADMIN_EMAIL
ARG VITE_LINKEDIN_CLIENT_ID
ARG VITE_FIREBASE_KEY
ARG VITE_FIREBASE_VAPID_KEY
ARG VITE_APPLE_CLIENT_ID
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_ADMIN_EMAIL=$VITE_ADMIN_EMAIL
ENV VITE_LINKEDIN_CLIENT_ID=$VITE_LINKEDIN_CLIENT_ID
ENV VITE_FIREBASE_KEY=$VITE_FIREBASE_KEY
ENV VITE_FIREBASE_VAPID_KEY=$VITE_FIREBASE_VAPID_KEY
ENV VITE_APPLE_CLIENT_ID=$VITE_APPLE_CLIENT_ID

RUN npm run build

# Serve stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config (we will update this in docker-compose)
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
