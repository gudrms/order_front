-- 타코몰리 김포점 Seed 데이터 (수동 삽입용)

-- 1. User 생성
INSERT INTO "User" (id, email, name, role, "createdAt", "updatedAt")
VALUES ('user_123456789', 'owner@example.com', '홍길동 사장님', 'OWNER', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Store 생성
INSERT INTO "Store" (id, name, "storeType", "branchId", "branchName", type, description, "okposBranchCode", "businessHours", theme, "isActive", "ownerId", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  '타코몰리 김포점',
  'tacomolly',
  'gimpo',
  '김포점',
  'MEXICAN',
  '신선한 재료로 만드는 멕시칸 레스토랑',
  'STORE_TACOMOLLY_GIMPO',
  '{"weekday": "11:00-22:00", "weekend": "11:00-23:00"}'::jsonb,
  '{"primaryColor": "#FF6B35", "logo": "https://example.com/tacomolly-logo.png"}'::jsonb,
  true,
  'user_123456789',
  NOW(),
  NOW()
)
RETURNING id AS store_id;

-- 이후 단계는 store_id가 필요하므로, 별도 스크립트로 분리합니다
-- Store ID를 먼저 확인 후 카테고리/메뉴 삽입을 진행하세요

-- Store ID 조회
SELECT id, name FROM "Store" WHERE "storeType" = 'tacomolly' AND "branchId" = 'gimpo';
