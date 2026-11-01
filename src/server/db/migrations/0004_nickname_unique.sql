-- 닉네임이 없는 기존 사용자에게 랜덤 닉네임을 준다(#57).
-- 형식과 단어는 src/server/domain/names.ts의 generateNickname과 같다. 겹치면 다시 뽑는다.
DO $$
DECLARE
  adjectives text[] := ARRAY['포근한','느긋한','반짝이는','산뜻한','다정한','보송한','말랑한','상냥한','차분한','싱그러운','따뜻한','맑은','동글한','사뿐한','폭신한','꼼꼼한','부지런한','너그러운','해맑은','든든한'];
  nouns text[] := ARRAY['먼지','토끼','고양이','햄스터','화분','이불','머그컵','양말','쿠션','빗자루','수세미','행주','바구니','창문','햇살','구름','새싹','솜뭉치','책갈피','단추'];
  target record;
  candidate text;
BEGIN
  FOR target IN SELECT id FROM users WHERE nickname IS NULL LOOP
    LOOP
      candidate := adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
        || nouns[1 + floor(random() * array_length(nouns, 1))::int]
        || lpad(floor(random() * 10000)::int::text, 4, '0');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM users WHERE nickname = candidate);
    END LOOP;
    UPDATE users SET nickname = candidate WHERE id = target.id;
  END LOOP;
END $$;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_nickname_unique" UNIQUE("nickname");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_nickname_length" CHECK (char_length("users"."nickname") between 2 and 12);