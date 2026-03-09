#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// .env を読み込む
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('エラー: .env ファイルが見つかりません。.env.example を参考に作成してください。');
  process.exit(1);
}

const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

if (!env.CALIL_APP_KEY) {
  console.error('エラー: .env に CALIL_APP_KEY が設定されていません。');
  process.exit(1);
}

// テンプレートを読み込んで置換
const template = fs.readFileSync(path.join(__dirname, 'background.template.js'), 'utf8');
const output = template.replace(/__CALIL_APP_KEY__/g, env.CALIL_APP_KEY);
fs.writeFileSync(path.join(__dirname, 'background.js'), output);

console.log('background.js を生成しました。');
