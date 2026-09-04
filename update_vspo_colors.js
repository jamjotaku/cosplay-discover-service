const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

const dictPath = path.join(__dirname, 'src', 'data', 'vtuber_dictionary.json');
const dictionary = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

const csvPath = 'C:\\Users\\mogiy\\.gemini\\antigravity\\brain\\5fa28501-4922-4135-ba19-cf50c01fe117\\.system_generated\\steps\\347\\content.md';
const content = fs.readFileSync(csvPath, 'utf8');

const lines = content.split('\n');
let csvStart = 0;
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('名前,カラーコード')) {
    csvStart = i;
    break;
  }
}
const csvData = lines.slice(csvStart).join('\n');

const parsed = Papa.parse(csvData, { skipEmptyLines: true });
const headers = parsed.data[0];
const nameIdx = headers.findIndex(h => h.includes('名前'));
const colorIdx = headers.findIndex(h => h.includes('カラーコード'));

let updatedCount = 0;

if (nameIdx !== -1 && colorIdx !== -1) {
  for (let i = 1; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    let name = row[nameIdx]?.trim();
    let color = row[colorIdx]?.trim();
    if (!name || !color) continue;
    
    name = name.replace(/[\u200B-\u200D\uFEFF]/g, '');
    if (!color.startsWith('#')) color = '#' + color;
    
    let found = false;
    for (const d of dictionary) {
      if (d.name.includes(name) || name.includes(d.name)) {
        d.color = color;
        updatedCount++;
        found = true;
        break;
      }
    }
    if (!found) {
       dictionary.push({ agency: 'VSPO', name, color });
       updatedCount++;
    }
  }
}

fs.writeFileSync(dictPath, JSON.stringify(dictionary, null, 2));

// update artifact
let md = '# 抽出されたVTuberマスター辞書 (公式カラーコード反映版)\n\n';
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

console.log(`Successfully updated/added ${updatedCount} VSPO members with official color codes!`);
