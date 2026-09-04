const fs = require('fs');
const path = require('path');

const dictPath = path.join(__dirname, 'src', 'data', 'vtuber_dictionary.json');
const dictionary = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

// Revert Hololive colors to empty string
let updated = 0;
dictionary.forEach(d => {
  if (d.agency === 'Hololive') {
    d.color = '#cccccc'; // Set to gray/blank as requested
    updated++;
  }
});

fs.writeFileSync(dictPath, JSON.stringify(dictionary, null, 2));

// update artifact
let md = '# 抽出されたVTuberマスター辞書 (提供されたCSVデータのみ)\n\n';
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

console.log(`Reverted ${updated} Hololive members colors to blank/gray.`);
