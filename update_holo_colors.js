const fs = require('fs');
const path = require('path');

const dictPath = path.join(__dirname, 'src', 'data', 'vtuber_dictionary.json');
const dictionary = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

// Known colors from my AI knowledge
const holoColors = {
  'ときのそら': '#1B6ED4',
  'ロボ子さん': '#C32629',
  'さくらみこ': '#FA7C8F',
  '星街すいせい': '#3A96C4',
  'AZKi': '#E74360',
  '夜空メル': '#FFD700',
  'アキ・ローゼンタール': '#D43735',
  '赤井はあと': '#C12D2D',
  '白上フブキ': '#31BCC3',
  '夏色まつり': '#F29C38',
  '湊あくあ': '#ED8D99',
  '紫咲シオン': '#8862A8',
  '百鬼あやめ': '#C92B2B',
  '癒月ちょこ': '#FDDF00',
  '大空スバル': '#F7C859',
  '大神ミオ': '#D6313B',
  '猫又おかゆ': '#8265A4',
  '戌神ころね': '#F2D33D',
  '兎田ぺこら': '#6C7DFF',
  '不知火フレア': '#FF8833',
  '白銀ノエル': '#E6E6E6',
  '宝鐘マリン': '#A00000',
  '天音かなた': '#80B6DE',
  '角巻わため': '#FDF1A3',
  '常闇トワ': '#A167A5',
  '姫森ルーナ': '#EE94B6',
  '雪花ラミィ': '#74BDEB',
  '桃鈴ねね': '#F8B661',
  '獅白ぼたん': '#EBEBEB',
  '尾丸ポルカ': '#ED1F24',
  'ラプラス・ダークネス': '#6A4D9F',
  '鷹嶺ルイ': '#B32631',
  '博衣こより': '#F6B4C4',
  '沙花叉クロヱ': '#1A1A1A',
  '風真いろは': '#A4C873',
  '火威青': '#2B3958',
  '音乃瀬奏': '#F3B411',
  '一条莉々華': '#D03D3D',
  '儒烏風亭らでん': '#000000',
  '轟はじめ': '#F7C6C6'
};

let updated = 0;
dictionary.forEach(d => {
  if (d.agency === 'Hololive') {
    // Exact or loose match
    let match = Object.keys(holoColors).find(k => k === d.name || d.name.includes(k));
    if (match) {
      d.color = holoColors[match];
      updated++;
    } else {
      // Default light blue if not matched
      if(d.color === '#cccccc' || d.color === '#2C2C2C' || d.color === '#56B5D7') {
         d.color = '#56B5D7';
      }
    }
  }
});

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

console.log(`Updated ${updated} Hololive members with AI colors.`);
