const fs = require('fs');
const Papa = require('papaparse');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const dict = JSON.parse(fs.readFileSync('src/data/vtuber_dictionary.json', 'utf8'));
fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRlfU_ch8RSqi8kvmeUs5savNiV6nw8R0SpQbnzocWErtnU-dUNiFyrSJNRmmbaMnojlhqXjMURWDpE/pub?gid=1691074498&single=true&output=csv').then(r=>r.text()).then(async text=>{
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  const rows = parsed.data.filter(r => r.member && r.member.trim() !== '');
  const records = [];
  const now = Date.now();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const member = r.member || '';
    const matched = dict.filter(d => d.name === member || member.includes(d.name));
    let debut = null;
    if(matched.length>0) debut = Math.min(...matched.map(d=>dict.findIndex(x=>x.name===d.name)));
    let status = 'active';
    if((r['生存確認']||'').includes('❌')) status = 'dead';
    if(r.link) {
      records.push({
        member: member, cosplayer: r.cosplayer||'', image_url: r.image||'', tweet_url: r.link, unit: r.unit||'',
        tags: matched.map(d=>d.name), agency: matched.length>0?matched[0].agency:null, debut_order: debut, status: status, created_at: new Date(now + i*1000).toISOString()
      });
    }
  }
  console.log('Uploading ' + records.length + ' records');
  for(let i=0; i<records.length; i+=500){
    const batch = records.slice(i, i+500);
    console.log('Inserting ' + i + ' to ' + (i+500));
    const {error} = await supabase.from('cosplay_items').upsert(batch, {onConflict:'tweet_url', ignoreDuplicates:true});
    if(error) console.error(error);
  }
  console.log('Done');
});