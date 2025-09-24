FROM node:18-alpine
WORKDIR /app
# Copy package files first for better layer caching
COPY package*.json ./
RUN npm ci --only=production
# Copy application source
COPY src/ ./src/
COPY public/ ./public/
EXPOSE 3000
CMD ["node", "src/index.js"]
