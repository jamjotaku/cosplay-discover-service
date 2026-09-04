const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

const dictPath = path.join(__dirname, 'src', 'data', 'vtuber_dictionary.json');
const dictionary = [];

// Helper to extract emoji strings (groups emojis together if there are no other characters between them, splits by other chars)
function parseFanmarks(str) {
  if (!str) return [];
  // Replace non-emoji characters with a space to split different fanmarks
  const replaced = str.replace(/[^\p{Emoji_Presentation}\p{Extended_Pictographic}]+/gu, ' ');
  return replaced.trim().split(/\s+/).filter(e => e.length > 0);
}

const nijiContent = fs.readFileSync('C:\\Users\\mogiy\\.gemini\\antigravity\\brain\\5fa28501-4922-4135-ba19-cf50c01fe117\\.system_generated\\steps\\447\\content.md', 'utf8');
let csvStart = 0;
const lines = nijiContent.split('\n');
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('名前')) { csvStart = i; break; }
}
const nijiCsv = lines.slice(csvStart).join('\n');
const parsed = Papa.parse(nijiCsv, { skipEmptyLines: true });
const headers = parsed.data[0];
const nameIdx = headers.findIndex(h => h.includes('名前'));
const colorIdx = headers.findIndex(h => h.includes('カラーコード'));
const fmIdx = headers.findIndex(h => h.includes('ファンマーク') || h.includes('ファンマ'));

for (let i = 1; i < parsed.data.length; i++) {
  let name = parsed.data[i][nameIdx]?.trim();
  let color = colorIdx !== -1 ? (parsed.data[i][colorIdx]?.trim() || '#2C2C2C') : '#2C2C2C';
  let fmStr = fmIdx !== -1 ? parsed.data[i][fmIdx] : '';
  let fanmarks = parseFanmarks(fmStr);

  if (name) {
    name = name.replace(/[\u200B-\u200D\uFEFF]/g, '');
    if (!color.startsWith('#')) color = '#' + color;
    dictionary.push({ agency: 'Nijisanji', name, color, fanmarks });
  }
}

// Keep existing Hololive and VSPO from old dictionary and append fanmarks as empty for now, 
// OR re-parse them. Since we only fetched Nijisanji just now, let's just pull Hololive and VSPO from the existing json.
const oldDict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
oldDict.forEach(old => {
  if (old.agency !== 'Nijisanji') {
    old.fanmarks = []; // default empty
    dictionary.push(old);
  }
});

fs.writeFileSync(dictPath, JSON.stringify(dictionary, null, 2));

console.log(`Rebuilt dictionary with Nijisanji fanmarks. Total members: ${dictionary.length}`);
