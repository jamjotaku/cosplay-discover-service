const fs = require('fs');

const csvText = fs.readFileSync('niji.csv', 'utf8');
const lines = csvText.trim().split('\n').slice(2); // Skip header and empty line

const nijiMap = {};
const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

for (const line of lines) {
  const cols = line.split(',');
  if (cols.length < 7) continue;
  
  const name = cols[0].trim();
  if (!name) continue;
  
  const color = cols[1].trim();
  const fanmarkRaw = cols[6] ? cols[6].trim() : '';
  
  let fanmarks = [];
  let match;
  while ((match = emojiRegex.exec(fanmarkRaw)) !== null) {
    if (match[0] !== '🌈' && match[0] !== '🕒') {
      fanmarks.push(match[0]);
    }
  }
  
  nijiMap[name] = { color, fanmarks };
}

const dictPath = 'src/data/vtuber_dictionary.json';
const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

let updated = 0;
for (let i = 0; i < dict.length; i++) {
  const v = dict[i];
  // 以前の名前「鈴鹿詩子」などの揺れも吸収するため完全一致でチェック
  if (nijiMap[v.name] && v.agency === 'Nijisanji') {
    v.color = nijiMap[v.name].color || v.color;
    v.fanmarks = nijiMap[v.name].fanmarks;
    updated++;
  }
}

fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2));
console.log('Updated ' + updated + ' Nijisanji members!');
