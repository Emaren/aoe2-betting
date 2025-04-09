# aoe2hd-frontend/Dockerfile

# ✅ Use Node.js base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install deps first (for caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the project
COPY . .

# Expose the port used by `next dev`
EXPOSE 3000

# Set env explicitly for dev mode inside Docker
ENV NODE_ENV=development

# Start the dev server
CMD ["npm", "run", "dev"]
