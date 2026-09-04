const fs = require('fs');

const csvText = fs.readFileSync('vspo2.csv', 'utf8');
const lines = csvText.trim().split('\n').slice(1);

const vspoMap = {};
const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

for (const line of lines) {
  const cols = line.split(',');
  if (cols.length < 7) continue;
  
  const name = cols[0].trim();
  const color = cols[1].trim();
  const fanmarkRaw = cols[6].trim();
  
  let fanmarks = [];
  let match;
  while ((match = emojiRegex.exec(fanmarkRaw)) !== null) {
    fanmarks.push(match[0]);
  }
  
  vspoMap[name] = { color, fanmarks };
}

const dictPath = 'src/data/vtuber_dictionary.json';
const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

let updated = 0;
for (let i = 0; i < dict.length; i++) {
  const v = dict[i];
  if (vspoMap[v.name]) {
    v.color = vspoMap[v.name].color || v.color;
    v.fanmarks = vspoMap[v.name].fanmarks;
    updated++;
  }
}

fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2));
console.log('Updated ' + updated + ' VSPO members!');
