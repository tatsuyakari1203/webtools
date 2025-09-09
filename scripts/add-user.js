#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Hàm tạo key ngẫu nhiên 16 ký tự
function generateRandomKey(length = 16) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

// Hàm thêm user vào INVITE_KEYS trong .env file
function addUserToEnv(username) {
  const envPath = path.join(process.cwd(), '.env');
  const key = generateRandomKey();
  
  try {
    // Kiểm tra xem .env file có tồn tại không
    if (!fs.existsSync(envPath)) {
      // Tạo .env file mới với INVITE_KEYS
      const newInviteKeys = JSON.stringify({[username]: key});
      const envContent = `# Environment variables\nINVITE_KEYS='${newInviteKeys}'\n`;
      fs.writeFileSync(envPath, envContent);
      console.log(`✅ Đã tạo .env file mới và thêm user: ${username}`);
    } else {
      // Đọc nội dung .env hiện tại
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Tìm dòng INVITE_KEYS
      const inviteKeysMatch = envContent.match(/INVITE_KEYS='([^']*)'/);
      
      if (inviteKeysMatch) {
        // Parse JSON hiện tại
        let currentKeys;
        try {
          currentKeys = JSON.parse(inviteKeysMatch[1]);
        } catch (e) {
          console.log('⚠️  INVITE_KEYS không đúng định dạng JSON, sẽ tạo mới');
          currentKeys = {};
        }
        
        // Kiểm tra user đã tồn tại chưa
        if (currentKeys[username]) {
          console.log(`⚠️  User '${username}' đã tồn tại trong INVITE_KEYS`);
          return;
        }
        
        // Thêm user mới
        currentKeys[username] = key;
        const newInviteKeys = JSON.stringify(currentKeys);
        
        // Thay thế dòng INVITE_KEYS
        envContent = envContent.replace(
          /INVITE_KEYS='[^']*'/,
          `INVITE_KEYS='${newInviteKeys}'`
        );
        
        fs.writeFileSync(envPath, envContent);
        console.log(`✅ Đã thêm user mới vào INVITE_KEYS: ${username}`);
      } else {
        // Không tìm thấy INVITE_KEYS, thêm vào cuối file
        const newInviteKeys = JSON.stringify({[username]: key});
        envContent += `\nINVITE_KEYS='${newInviteKeys}'\n`;
        fs.writeFileSync(envPath, envContent);
        console.log(`✅ Đã tạo INVITE_KEYS mới và thêm user: ${username}`);
      }
    }
    
    console.log(`🔑 Key: ${key}`);
    console.log(`📝 INVITE_KEYS đã được cập nhật với user: ${username}`);
    
  } catch (error) {
    console.error('❌ Lỗi khi thêm user:', error.message);
    process.exit(1);
  }
}

// Lấy tên user từ command line arguments
const username = process.argv[2];

if (!username) {
  console.log('❌ Vui lòng cung cấp tên user');
  console.log('Cách sử dụng: npm run add-user <username>');
  console.log('Ví dụ: npm run add-user john');
  process.exit(1);
}

// Kiểm tra tên user hợp lệ (chỉ chứa chữ cái, số và dấu gạch dưới)
if (!/^[a-zA-Z0-9_]+$/.test(username)) {
  console.log('❌ Tên user chỉ được chứa chữ cái, số và dấu gạch dưới');
  process.exit(1);
}

console.log(`🚀 Đang tạo user: ${username}...`);
addUserToEnv(username);