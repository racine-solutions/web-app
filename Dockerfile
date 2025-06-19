# Stage 1: Build the Angular application
FROM node:16 as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
# Copy version.js file needed for postinstall script
COPY version.js ./

# Create necessary directories for version.js
RUN mkdir -p src/environments

# Install dependencies
ARG NPM_REGISTRY_URL=https://registry.npmjs.org/
RUN npm config set registry $NPM_REGISTRY_URL
RUN npm ci

# Copy the rest of the application code
COPY . .

# Set Puppeteer arguments if needed
ARG PUPPETEER_SKIP_DOWNLOAD_ARG=true
ARG PUPPETEER_DOWNLOAD_HOST_ARG=https://storage.googleapis.com
ARG PUPPETEER_CHROMIUM_REVISION_ARG=1011831
ENV PUPPETEER_SKIP_DOWNLOAD=$PUPPETEER_SKIP_DOWNLOAD_ARG
ENV PUPPETEER_DOWNLOAD_HOST=$PUPPETEER_DOWNLOAD_HOST_ARG
ENV PUPPETEER_CHROMIUM_REVISION=$PUPPETEER_CHROMIUM_REVISION_ARG

# Build the application
ARG BUILD_ENVIRONMENT_OPTIONS=--configuration production
RUN npm run build -- $BUILD_ENVIRONMENT_OPTIONS

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output to replace the default nginx contents
COPY --from=build /app/dist/web-app /usr/share/nginx/html

# Copy custom nginx configuration if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
