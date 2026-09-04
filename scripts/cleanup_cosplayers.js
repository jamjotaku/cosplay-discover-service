const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 全角英数字を半角に変換する関数
function toHalfWidth(str) {
  return str.replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
}

// 正規化関数（スペース除去、小文字化、半角化）
function normalizeName(name) {
  if (!name) return "";
  let n = toHalfWidth(name);
  n = n.toLowerCase();
  n = n.replace(/[\s　]/g, ''); // 半角・全角スペースを除去
  return n;
}

async function run() {
  console.log("Fetching all cosplayers...");
  
  // get all records
  let allItems = [];
  let offset = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('cosplay_items')
      .select('id, cosplayer')
      .range(offset, offset + limit - 1);
      
    if (error) throw error;
    if (data.length === 0) break;
    
    allItems = allItems.concat(data);
    offset += limit;
  }
  
  console.log(`Fetched ${allItems.length} records.`);
  
  // 正規化名 -> 最も頻出する元の名前（正統な名前とする）のマッピングを作成
  const normalizedMap = {};
  
  for (const item of allItems) {
    const orig = item.cosplayer;
    if (!orig) continue;
    const norm = normalizeName(orig);
    
    if (!normalizedMap[norm]) {
      normalizedMap[norm] = {};
    }
    if (!normalizedMap[norm][orig]) {
      normalizedMap[norm][orig] = 0;
    }
    normalizedMap[norm][orig]++;
  }
  
  const canonicalMap = {};
  
  for (const norm in normalizedMap) {
    const origNames = Object.keys(normalizedMap[norm]);
    if (origNames.length > 1) {
      // 出現回数が最も多いものを代表名にする
      origNames.sort((a, b) => normalizedMap[norm][b] - normalizedMap[norm][a]);
      const canonical = origNames[0];
      
      for (const orig of origNames) {
        if (orig !== canonical) {
          canonicalMap[orig] = canonical;
        }
      }
    }
  }
  
  const mergeTargets = Object.keys(canonicalMap);
  console.log(`Found ${mergeTargets.length} name variations to merge.`);
  
  if (mergeTargets.length === 0) {
    console.log("No merges needed!");
    return;
  }
  
  // 実際にアップデート
  let updateCount = 0;
  for (const orig of mergeTargets) {
    const canonical = canonicalMap[orig];
    console.log(`Merging: "${orig}" -> "${canonical}"`);
    
    const { error } = await supabase
      .from('cosplay_items')
      .update({ cosplayer: canonical })
      .eq('cosplayer', orig);
      
    if (error) {
      console.error(`Error updating ${orig}:`, error);
    } else {
      updateCount++;
    }
  }
  
  console.log(`Successfully merged ${updateCount} variations.`);
}

run();
