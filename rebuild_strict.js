const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

const dictPath = path.join(__dirname, 'src', 'data', 'vtuber_dictionary.json');

// Initialize empty dictionary
const dictionary = [];

// Parse Nijisanji CSV
try {
  const nijiContent = fs.readFileSync('C:\\Users\\mogiy\\.gemini\\antigravity\\brain\\5fa28501-4922-4135-ba19-cf50c01fe117\\.system_generated\\steps\\327\\content.md', 'utf8');
  let csvStart = 0;
  const lines = nijiContent.split('\n');
  for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('名前,カラーコード')) { csvStart = i; break; }
  }
  const nijiCsv = lines.slice(csvStart).join('\n');
  const parsed = Papa.parse(nijiCsv, { skipEmptyLines: true });
  const headers = parsed.data[0];
  const nameIdx = headers.findIndex(h => h.includes('名前'));
  const colorIdx = headers.findIndex(h => h.includes('カラーコード'));
  
  for (let i = 1; i < parsed.data.length; i++) {
    let name = parsed.data[i][nameIdx]?.trim();
    let color = parsed.data[i][colorIdx]?.trim() || '#2C2C2C';
    if (name) {
      name = name.replace(/[\u200B-\u200D\uFEFF]/g, '');
      if (!color.startsWith('#')) color = '#' + color;
      dictionary.push({ agency: 'Nijisanji', name, color });
    }
  }
} catch (e) {
  console.log('Error parsing Nijisanji:', e.message);
}

// Parse VSPO CSV
try {
  const vspoContent = fs.readFileSync('C:\\Users\\mogiy\\.gemini\\antigravity\\brain\\5fa28501-4922-4135-ba19-cf50c01fe117\\.system_generated\\steps\\347\\content.md', 'utf8');
  let csvStart = 0;
  const lines = vspoContent.split('\n');
  for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('名前,カラーコード')) { csvStart = i; break; }
  }
  const vspoCsv = lines.slice(csvStart).join('\n');
  const parsed = Papa.parse(vspoCsv, { skipEmptyLines: true });
  const headers = parsed.data[0];
  const nameIdx = headers.findIndex(h => h.includes('名前'));
  const colorIdx = headers.findIndex(h => h.includes('カラーコード'));
  
  for (let i = 1; i < parsed.data.length; i++) {
    let name = parsed.data[i][nameIdx]?.trim();
    let color = parsed.data[i][colorIdx]?.trim() || '#A5C1E7';
    if (name) {
      name = name.replace(/[\u200B-\u200D\uFEFF]/g, '');
      if (!color.startsWith('#')) color = '#' + color;
      dictionary.push({ agency: 'VSPO', name, color });
    }
  }
} catch (e) {
  console.log('Error parsing VSPO:', e.message);
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

console.log(`Rebuilt dictionary strictly from provided CSVs. Total members: ${dictionary.length}`);
