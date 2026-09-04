const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

const dictPath = path.join(__dirname, 'src', 'data', 'vtuber_dictionary.json');
const dictionary = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

// Parse Hololive CSV
try {
  const holoContent = fs.readFileSync('C:\\Users\\mogiy\\.gemini\\antigravity\\brain\\5fa28501-4922-4135-ba19-cf50c01fe117\\.system_generated\\steps\\370\\content.md', 'utf8');
  let csvStart = 0;
  const lines = holoContent.split('\n');
  for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('名前')) { csvStart = i; break; }
  }
  const holoCsv = lines.slice(csvStart).join('\n');
  const parsed = Papa.parse(holoCsv, { skipEmptyLines: true });
  const headers = parsed.data[0];
  const nameIdx = headers.findIndex(h => h.includes('名前'));
  let colorIdx = headers.findIndex(h => h.includes('カラーコード'));
  
  if (nameIdx !== -1) {
    for (let i = 1; i < parsed.data.length; i++) {
      let name = parsed.data[i][nameIdx]?.trim();
      let color = (colorIdx !== -1 ? parsed.data[i][colorIdx]?.trim() : '') || '#56B5D7'; // Default Hololive Blue
      if (name) {
        name = name.replace(/[\u200B-\u200D\uFEFF]/g, '');
        if (color && !color.startsWith('#')) color = '#' + color;
        // Don't add duplicates
        if (!dictionary.find(d => d.name === name)) {
           dictionary.push({ agency: 'Hololive', name, color });
        }
      }
    }
  }
} catch (e) {
  console.log('Error parsing Hololive:', e.message);
}

fs.writeFileSync(dictPath, JSON.stringify(dictionary, null, 2));

// update artifact
let md = '# 抽出されたVTuberマスター辞書 (提供されたCSVデータのみ)\n\n';
md += 'ご提供いただいたCSVデータのみを使用して再構築したメンバー一覧です。\n\n';
const agencies = ['Hololive', 'Nijisanji', 'VSPO'];
agencies.forEach(agency => {
  const members = dictionary.filter(d => d.agency === agency);
  md += `## ${agency} (${members.length}名)\n`;
  md += '| 名前 | カラーコード | 事務所 |\n';
  md += '| :--- | :--- | :--- |\n';
  members.forEach(m => {
    md += `| ${m.name} | \`${m.color}\` | ${m.agency} |\n`;
  });
  md += '\n';
});
fs.writeFileSync('C:\\Users\\mogiy\\.gemini\\antigravity\\brain\\5fa28501-4922-4135-ba19-cf50c01fe117\\vtuber_list.md', md, 'utf8');

console.log(`Added Hololive members. Total members: ${dictionary.length}`);
