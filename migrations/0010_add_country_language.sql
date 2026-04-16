-- 0010: 국가/언어 필드 추가
ALTER TABLE users ADD COLUMN country TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'ko';
