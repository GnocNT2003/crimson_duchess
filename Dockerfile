# ========================================
# Base Stage
# ========================================
FROM node:24.15.0-slim AS base

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
FROM base

# # Create non-root group and user for extra security
# RUN groupadd -g 1001 discord && \
#     useradd -g discord -u 1001 discord && \
#     chown -R discord:discord /app

# Install Python for yt-dlp
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Copy yt-dlp scripts
COPY ./yt-dlp/downloadYT.py ./yt-dlp/downloadYT.py
COPY ./yt-dlp/requirements.txt ./yt-dlp/requirements.txt

# Create venv with system Python and install dependencies
RUN python3 -m venv ./yt-dlp/.venv && \
    ./yt-dlp/.venv/bin/pip install --no-cache-dir -r ./yt-dlp/requirements.txt

# Copy runtime dependencies
COPY --from=deps /app/node_modules ./node_modules
# Copy build bundle
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-*.yaml ./

# Set optimized environment variables
ENV NODE_ENV=production

# # Switch to non-root user for security
# USER discord

# Run application
CMD [ "pnpm", "start-all" ]
