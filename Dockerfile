# ========================================
# Base Stage
# ========================================
FROM node:24.15.0-alpine3.23 AS base

# Set pnpm environment variables
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"

# Install and enable pnpm
RUN corepack enable

# Go to working directory
WORKDIR /app

# ========================================
# Runtime Dependencies Stage
# ========================================
FROM base AS deps

# Copy package file into Docker image 
# this is on /app directory, copy here so changes to it does not affect base image Docker caching
COPY package.json .
COPY pnpm-*.yaml .

# Install runtime dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# ========================================
# Build Stage
# ========================================
FROM base AS build

# Copy source doe
# this is on /app directory, copy here so changes to it does not affect base image Docker caching
COPY . .

# Install build dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build node dist
RUN pnpm run build

# ========================================
# Production Stage
# ========================================
FROM node:24.15.0-alpine3.23 AS prod

# Go to working directory
WORKDIR /app

RUN wget https://github.com/yt-dlp/yt-dlp/releases/download/2026.03.17/yt-dlp_musllinux \
    -O /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Copy runtime dependencies
COPY --from=deps /app/node_modules ./node_modules
# Copy build bundle
COPY --from=build /app/dist ./dist

# Set optimized environment variables
ENV NODE_ENV=production

# Switch to non-root user for security
RUN mkdir -p /app/downloads/musics /app/downloads/laws /app/temp \
    && chown -R node:node /app/downloads /app/temp
USER node

# Run application
CMD ["sh", "-c", "node dist/registerCommands.js && node dist/index.js"]
# CMD [ "pnpm", "start-all" ]
