FROM mcr.microsoft.com/playwright:v1.49.1-noble

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Ensure Chromium is installed for Playwright
RUN npx playwright install chromium

# Expose the API port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
