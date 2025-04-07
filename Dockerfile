# Frontend Dockerfile for Next.js
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy only package files for caching npm install
COPY package.json package-lock.json* ./

# Install dependencies (cached if unchanged)
RUN npm install

# Copy all other source files
COPY . .

# Expose frontend port
EXPOSE 3000

# Default to production, allow override via NODE_ENV
ENV NODE_ENV=production

# Run production or development command based on environment
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = 'development' ]; then npm run dev; else npm run build && npm start; fi"]
