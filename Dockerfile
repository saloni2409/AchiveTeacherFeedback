# Use Node.js as the base image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install all dependencies (we need devDependencies to build Vite)
RUN npm ci

# Copy the rest of the application code
# Note: Since .env.local is NOT in .dockerignore, it will be copied here,
# allowing its values to be built into the static files by Vite.
COPY . .

# Build the Vite application for production
RUN npm run build

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD [ "npm", "start" ]
