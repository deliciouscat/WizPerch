#!/usr/bin/env node
/**
 * 빌드 후 환경 변수가 제대로 주입되었는지 확인하는 스크립트
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = resolve(__dirname, '..', 'dist');
const assetsDir = join(distDir, 'assets');

if (!existsSync(distDir)) {
  console.error('❌ dist 폴더를 찾을 수 없습니다. 먼저 npm run build를 실행하세요.');
  process.exit(1);
}

// 빌드된 JS 파일 찾기
let mainJsFile = null;
if (existsSync(assetsDir)) {
  const files = readdirSync(assetsDir);
  const mainFile = files.find(f => f.startsWith('main-') && f.endsWith('.js'));
  if (mainFile) {
    mainJsFile = join(assetsDir, mainFile);
  }
}

if (!mainJsFile || !existsSync(mainJsFile)) {
  console.error('❌ 빌드된 main.js 파일을 찾을 수 없습니다.');
  process.exit(1);
}

const content = readFileSync(mainJsFile, 'utf-8');

console.log('🔍 빌드된 파일에서 환경 변수 확인 중...\n');
console.log(`파일: ${mainJsFile}\n`);

// Clerk 키 확인 (여러 패턴 시도)
let clerkKey = null;
const patterns = [
  /VITE_CLERK_PUBLISHABLE_KEY["']?\s*[:=]\s*["']([^"']+)["']/,
  /pk_test_[a-zA-Z0-9_-]+/,
  /"pk_test_[^"]+"/,
  /'pk_test_[^']+'/
];

for (const pattern of patterns) {
  const match = content.match(pattern);
  if (match) {
    clerkKey = match[1] || match[0].replace(/["']/g, '');
    break;
  }
}

if (clerkKey) {
  console.log('✅ VITE_CLERK_PUBLISHABLE_KEY 발견:');
  console.log(`   길이: ${clerkKey.length}자`);
  console.log(`   접두사: ${clerkKey.substring(0, 30)}...`);
  console.log(`   형식: ${clerkKey.startsWith('pk_') ? '✅ 올바름' : '❌ 잘못됨'}`);
} else {
  console.log('❌ VITE_CLERK_PUBLISHABLE_KEY를 찾을 수 없습니다.');
  console.log('   빌드 시 환경 변수가 주입되지 않았을 수 있습니다.');
}

// Convex URL 확인
let convexUrl = null;
const urlPatterns = [
  /VITE_CONVEX_URL["']?\s*[:=]\s*["']([^"']+)["']/,
  /https:\/\/[a-zA-Z0-9-]+\.convex\.cloud/
];

for (const pattern of urlPatterns) {
  const match = content.match(pattern);
  if (match) {
    convexUrl = match[1] || match[0];
    break;
  }
}

if (convexUrl) {
  console.log('\n✅ VITE_CONVEX_URL 발견:');
  console.log(`   URL: ${convexUrl}`);
} else {
  console.log('\n❌ VITE_CONVEX_URL을 찾을 수 없습니다.');
}

console.log('\n💡 팁: 환경 변수가 없으면 .env 또는 .env.local 파일을 확인하세요.');

