#!/usr/bin/env bash
# ========================================================
# SCRIPT CÀI ĐẶT & CHẠY TỰ ĐỘNG 24/7 TRÊN VPS LINUX
# Dự án: Khu tự trị Noel Nguyễn
# ========================================================

echo ">>> 1. Cập nhật hệ thống và cài đặt Node.js LTS..."
sudo apt-get update -y
sudo apt-get install -y curl git ufw

# Cài đặt Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo ">>> 2. Cài đặt PM2 (Công cụ giữ web chạy vĩnh viễn 24/7)..."
sudo npm install -g pm2

echo ">>> 3. Cài đặt thư viện dự án..."
npm install

echo ">>> 4. Mở cổng mạng 3000..."
sudo ufw allow 3000/tcp || true

echo ">>> 5. Khởi chạy ứng dụng qua PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -n 1 | bash || true

echo "========================================================"
echo "🎉 HOÀN TẤT! Web chat đã chạy 24/7 trên VPS của bạn!"
echo "👉 Truy cập bằng IP: http://$(curl -s ifconfig.me):3000"
echo "========================================================"
