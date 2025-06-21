###############
### STAGE 1: Build app
###############
ARG BUILDER_IMAGE=node:22.9.0-alpine
ARG NGINX_IMAGE=nginx:1.27.4-alpine3.21-slim

FROM $BUILDER_IMAGE as builder
ARG NPM_REGISTRY_URL=https://registry.npmjs.org/
ARG BUILD_ENVIRONMENT_OPTIONS="--configuration production"
ARG PUPPETEER_DOWNLOAD_HOST_ARG=https://storage.googleapis.com
ARG PUPPETEER_CHROMIUM_REVISION_ARG=1011831
ARG PUPPETEER_SKIP_DOWNLOAD_ARG

# Set the environment variable to increase Node.js memory limit
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV PATH /usr/src/app/node_modules/.bin:$PATH
ENV PUPPETEER_DOWNLOAD_HOST $PUPPETEER_DOWNLOAD_HOST_ARG
ENV PUPPETEER_CHROMIUM_REVISION $PUPPETEER_CHROMIUM_REVISION_ARG
ENV PUPPETEER_SKIP_DOWNLOAD $PUPPETEER_SKIP_DOWNLOAD_ARG

# Install git and other dependencies in a single layer
RUN apk add --no-cache git

WORKDIR /usr/src/app

# Copy package files first to leverage Docker layer caching
COPY package.json package-lock.json ./

# Configure npm and install dependencies in a single layer
RUN npm config set fetch-retry-maxtimeout 120000 \
    && npm config set registry $NPM_REGISTRY_URL --location=global \
    && npm ci --ignore-scripts

# Copy the rest of the application code
COPY . .

# Run version.js and ngcc manually (these were in postinstall script)
RUN node version.js && npx ngcc

# Build the application
RUN npm run build -- --output-path=/dist $BUILD_ENVIRONMENT_OPTIONS

###############
### STAGE 2: Serve app with nginx ###
###############
FROM $NGINX_IMAGE

COPY --from=builder /dist /usr/share/nginx/html

EXPOSE 80

# When the container starts, replace the env.js with values from environment variables
CMD ["/bin/sh",  "-c",  "envsubst < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js && exec nginx -g 'daemon off;'"]
