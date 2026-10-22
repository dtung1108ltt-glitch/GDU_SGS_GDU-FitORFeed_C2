FROM node:20-alpine

WORKDIR /app

# Copy file cấu hình package
COPY package.json package-lock.json* ./

# Cấu hình lại registry và tăng timeout để tránh lỗi mạng trên máy ảo của bạn
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm install

# Copy toàn bộ mã nguồn
COPY . .

# Mở port của Vite
EXPOSE 5173

# Chạy server với cờ host để truy cập được từ bên ngoài container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
