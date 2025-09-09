#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Hàm xóa user khỏi INVITE_KEYS trong .env file
function removeUserFromEnv(username) {
  const envPath = path.join(process.cwd(), '.env');
  
  try {
    // Kiểm tra xem .env file có tồn tại không
    if (!fs.existsSync(envPath)) {
      console.log('❌ Không tìm thấy file .env');
      process.exit(1);
    }
    
    // Đọc nội dung .env hiện tại
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Tìm dòng INVITE_KEYS
    const inviteKeysMatch = envContent.match(/INVITE_KEYS='([^']*)'/);
    
    if (!inviteKeysMatch) {
      console.log('❌ Không tìm thấy INVITE_KEYS trong file .env');
      process.exit(1);
    }
    
    // Parse JSON hiện tại
    let currentKeys;
    try {
      currentKeys = JSON.parse(inviteKeysMatch[1]);
    } catch (e) {
      console.log('❌ INVITE_KEYS không đúng định dạng JSON');
      process.exit(1);
    }
    
    // Kiểm tra user có tồn tại không
    if (!currentKeys[username]) {
      console.log(`⚠️  User '${username}' không tồn tại trong INVITE_KEYS`);
      return;
    }
    
    // Xóa user
    delete currentKeys[username];
    const newInviteKeys = JSON.stringify(currentKeys);
    
    // Thay thế dòng INVITE_KEYS
    envContent = envContent.replace(
      /INVITE_KEYS='[^']*'/,
      `INVITE_KEYS='${newInviteKeys}'`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Đã xóa user khỏi INVITE_KEYS: ${username}`);
    console.log(`📝 INVITE_KEYS đã được cập nhật`);
    
    // Hiển thị danh sách user còn lại
    const remainingUsers = Object.keys(currentKeys);
    if (remainingUsers.length > 0) {
      console.log(`👥 User còn lại: ${remainingUsers.join(', ')}`);
    } else {
      console.log(`👥 Không còn user nào trong INVITE_KEYS`);
    }
    
  } catch (error) {
    console.error('❌ Lỗi khi xóa user:', error.message);
    process.exit(1);
  }
}

// Lấy tên user từ command line arguments
const username = process.argv[2];

if (!username) {
  console.log('❌ Vui lòng cung cấp tên user cần xóa');
  console.log('Cách sử dụng: npm run remove-user <username>');
  console.log('Ví dụ: npm run remove-user john');
  process.exit(1);
}

// Kiểm tra tên user hợp lệ (chỉ chứa chữ cái, số và dấu gạch dưới)
if (!/^[a-zA-Z0-9_]+$/.test(username)) {
  console.log('❌ Tên user chỉ được chứa chữ cái, số và dấu gạch dưới');
  process.exit(1);
}

console.log(`🗑️  Đang xóa user: ${username}...`);
removeUserFromEnv(username);