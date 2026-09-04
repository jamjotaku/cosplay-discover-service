const fs = require('fs');
const dictPath = 'src/data/vtuber_dictionary.json';
let dict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

// にじさんじ公式を削除
dict = dict.filter(d => !d.name.includes('にじさんじ公式'));

// 念のため全てのファンマークから 🌈 と 🕒 を除外する
dict.forEach(d => {
  if (d.fanmarks) {
    d.fanmarks = d.fanmarks.filter(m => !m.includes('🌈') && !m.includes('🕒'));
  }
});

fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2));
console.log('Removed official nijisanji emojis!');
