FROM python:3.11-slim

# Install Node.js 18 + ffmpeg
RUN apt-get update && apt-get install -y curl ffmpeg && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    pip install yt-dlp && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 8080
CMD ["node", "src/index.js"]
