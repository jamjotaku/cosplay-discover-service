const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src', 'data', 'vtuber_dictionary.json');
const artifactPath = 'C:\\Users\\mogiy\\.gemini\\antigravity\\brain\\5fa28501-4922-4135-ba19-cf50c01fe117\\vtuber_list.md';

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let md = '# 抽出されたVTuberマスター辞書 (全257名)\n\n';
md += '公式サイトから自動抽出された最新のメンバー一覧です。\n\n';

const agencies = ['Hololive', 'Nijisanji', 'VSPO'];

agencies.forEach(agency => {
  const members = data.filter(d => d.agency === agency);
  md += `## ${agency} (${members.length}名)\n`;
  md += '| 名前 | カラーコード | 事務所 |\n';
  md += '| :--- | :--- | :--- |\n';
  members.forEach(m => {
    md += `| ${m.name} | \`${m.color}\` | ${m.agency} |\n`;
  });
  md += '\n';
});

fs.writeFileSync(artifactPath, md, 'utf8');
console.log('Artifact created.');
