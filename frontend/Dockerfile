# Stage 1: Build the React app using Node.js
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first to cache npm install layer
COPY package.json package-lock.json ./

# Install exact versions from lockfile (faster and deterministic)
RUN npm ci

# Copy source code separately so code changes don't re-install dependencies
COPY . .

# Build the Vite production bundle (outputs to dist/)
RUN npm run build

# Stage 2: Serve the built static files with nginx
FROM nginx:1.27-alpine

# Remove the default nginx site config
RUN rm /etc/nginx/conf.d/default.conf

# Add our custom config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy only the built static files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Document the port nginx listens on
EXPOSE 80
