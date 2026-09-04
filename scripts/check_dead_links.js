const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// 開発環境用の.env.localを読み込む（GitHub Actionsでは環境変数が直接渡される）
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTweet(url) {
  const apiUrl = 'https://publish.twitter.com/oembed?url=' + encodeURIComponent(url);
  try {
    const response = await fetch(apiUrl);
    if (response.status === 200) return 'active';
    if (response.status === 404) return 'dead';
    return 'unknown';
  } catch (err) {
    return 'error';
  }
}

async function run() {
  console.log('Starting dead link check...');
  
  // 最も古いチェック日時のものを500件取得
  const { data: items, error } = await supabase
    .from('cosplay_items')
    .select('id, tweet_url')
    .eq('status', 'active')
    .order('last_checked_at', { ascending: true, nullsFirst: true })
    .limit(500);

  if (error || !items || items.length === 0) {
    console.log('No items to check or error fetching items.');
    return;
  }

  console.log('Fetched ' + items.length + ' items to check.');

  let deadCount = 0;
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const status = await checkTweet(item.tweet_url);
    
    const updatePayload = {
      last_checked_at: new Date().toISOString()
    };
    
    if (status === 'dead') {
      updatePayload.status = 'dead';
      deadCount++;
      console.log(`[${i+1}] DEAD: ${item.tweet_url}`);
    } else if (i % 50 === 0) {
      console.log(`[${i+1}/${items.length}] Checked...`);
    }

    await supabase
      .from('cosplay_items')
      .update(updatePayload)
      .eq('id', item.id);
      
    // 1秒待機してレート制限を回避
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`Check complete. Found ${deadCount} dead links.`);
}

run();
