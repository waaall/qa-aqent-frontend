#!/usr/bin/env node

/**
 * 自动截图脚本
 * 使用 Puppeteer 自动截取项目运行时的页面截图
 *
 * 使用方法：
 * 1. 安装依赖：npm install -D puppeteer
 * 2. 启动开发服务器：npm run dev
 * 3. 运行脚本：node docs/screenshot.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function takeScreenshot() {
  const screenshotsDir = path.join(__dirname, 'screenshots');

  // 创建截图目录
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    console.log('✓ 创建截图目录:', screenshotsDir);
  }

  console.log('🚀 启动浏览器...');

  // 启动浏览器
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // 设置视口大小
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    console.log('📡 访问页面: http://localhost:3000');

    // 访问页面
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // 等待页面加载完成
    await page.waitForTimeout(2000);

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `app-screenshot-${timestamp}.png`;
    const filepath = path.join(screenshotsDir, filename);

    console.log('📸 正在截图...');

    // 截取全页面
    await page.screenshot({
      path: filepath,
      fullPage: true
    });

    console.log('✅ 截图成功!');
    console.log('📁 文件路径:', filepath);

    // 同时保存一个最新版本
    const latestPath = path.join(screenshotsDir, 'latest.png');
    fs.copyFileSync(filepath, latestPath);
    console.log('📁 最新截图:', latestPath);

  } catch (error) {
    console.error('❌ 截图失败:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
    console.log('🔚 浏览器已关闭');
  }
}

// 主函数
(async () => {
  try {
    await takeScreenshot();
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
})();
