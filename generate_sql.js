const fs = require('fs');
const dict = require('./src/data/vtuber_dictionary.json');
let sql = `-- 1. 辞書用テーブルの作成
CREATE TABLE IF NOT EXISTS public.vtuber_dictionary (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    agency text NOT NULL,
    color text,
    fanmarks text[] DEFAULT '{}'::text[],
    aliases text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now()
);

-- RLS設定（管理画面から読み書きするため）
ALTER TABLE public.vtuber_dictionary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous read" ON public.vtuber_dictionary;
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.vtuber_dictionary;
DROP POLICY IF EXISTS "Allow anonymous update" ON public.vtuber_dictionary;
DROP POLICY IF EXISTS "Allow anonymous delete" ON public.vtuber_dictionary;

CREATE POLICY "Allow anonymous read" ON public.vtuber_dictionary FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON public.vtuber_dictionary FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON public.vtuber_dictionary FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON public.vtuber_dictionary FOR DELETE USING (true);

-- 2. 初期データの流し込み
INSERT INTO public.vtuber_dictionary (name, agency, color, fanmarks, aliases) VALUES
`;
const values = dict.map(d => {
  const name = d.name.replace(/'/g, "''");
  const agency = d.agency.replace(/'/g, "''");
  const color = (d.color || '#9ca3af').replace(/'/g, "''");
  const fanmarks = d.fanmarks ? d.fanmarks.map(f => `'${f.replace(/'/g, "''")}'`).join(',') : '';
  return `('${name}', '${agency}', '${color}', ARRAY[${fanmarks}]::text[], ARRAY[]::text[])`;
});
sql += values.join(',\n') + ' ON CONFLICT (name) DO NOTHING;\n';
fs.writeFileSync('C:/Users/mogiy/.gemini/antigravity/brain/5fa28501-4922-4135-ba19-cf50c01fe117/create_dictionary.sql', sql);
console.log('Generated create_dictionary.sql');
