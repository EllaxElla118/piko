FROM node:18-bullseye-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libgtk-3-0 \
    libgbm1 \
    libnss3 \
    libasound2 \
    libxss1 \
    libx11-xcb1 \
    libxtst6 \
    xdg-utils \
    libglib2.0-0 \
    python3 \
    python3-pip \
    python-is-python3 \
    ffmpeg \
    git \
    build-essential \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

ENV YOUTUBE_DL_SKIP_DOWNLOAD = true

# Install app dependencies
RUN npm install

RUN npm install github:EllaxElla118/whatsapp-web.js

# Bundle app source
COPY . .

# Create data directories
RUN mkdir -p ./auth_data ./chrome_data

RUN chmod 777 ./auth_data ./chrome_data

EXPOSE 3034

# Command to run the app
CMD ["node", "app.js"]
