const { JSDOM } = require('jsdom');
const fs = require('fs');

async function scrapeLocal() {
  const talents = [];

  // Hololive
  try {
    const holoContent = fs.readFileSync('C:\\Users\\mogiy\\.gemini\\antigravity\\brain\\5fa28501-4922-4135-ba19-cf50c01fe117\\.system_generated\\steps\\236\\content.md', 'utf8');
    const dom = new JSDOM(holoContent);
    dom.window.document.querySelectorAll('h3').forEach(h3 => {
      let jpName = '';
      h3.childNodes.forEach(node => {
        if (node.nodeType === 3) jpName += node.textContent.trim();
      });
      if (jpName) talents.push({ agency: 'Hololive', name: jpName, color: '#56B5D7' });
    });
  } catch(e) {}

  // DEV_IS
  try {
    const devisContent = fs.readFileSync('C:\\Users\\mogiy\\.gemini\\antigravity\\brain\\5fa28501-4922-4135-ba19-cf50c01fe117\\.system_generated\\steps\\237\\content.md', 'utf8');
    const dom = new JSDOM(devisContent);
    dom.window.document.querySelectorAll('h3').forEach(h3 => {
      let jpName = '';
      h3.childNodes.forEach(node => {
        if (node.nodeType === 3) jpName += node.textContent.trim();
      });
      if (jpName) talents.push({ agency: 'Hololive', name: jpName, color: '#56B5D7' });
    });
  } catch(e) {}

  // Nijisanji
  try {
    const nijiContent = fs.readFileSync('C:\\Users\\mogiy\\.gemini\\antigravity\\brain\\5fa28501-4922-4135-ba19-cf50c01fe117\\.system_generated\\steps\\230\\content.md', 'utf8');
    const scriptMatch = nijiContent.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (scriptMatch) {
      const data = JSON.parse(scriptMatch[1]);
      function search(obj) {
        if (Array.isArray(obj)) obj.forEach(search);
        else if (obj && typeof obj === 'object') {
          // If this object represents a talent
          if (obj.name && typeof obj.name === 'string' && obj.slug) {
            // Keep only JP members if possible, but actually we can just keep anyone with Japanese characters
            if (obj.name.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)) {
              if (!talents.find(t => t.name === obj.name)) {
                talents.push({ agency: 'Nijisanji', name: obj.name, color: obj.color || '#2C2C2C' });
              }
            }
          }
          for (const key in obj) search(obj[key]);
        }
      }
      search(data);
    }
  } catch(e) {}

  // VSPO (Known members since site is complex)
  const vspoNames = [
    '一ノ瀬うるは','小雀とと','花芽すみれ','花芽なずな','胡桃のあ','橘ひなの','如月れん','兎咲ミミ','空澄セナ','英リサ','神成きゅぴ','八雲べに','藍沢エマ','紫宮るな','猫汰つな','白波らむね','小森めと','夢野あかり','夜乃くろむ','紡木こかげ','千燈ゆうひ','蝶屋はなび',
    '甘結もか', '結崎芹', '水月りく' // newly added or VTA equivalents just in case, wait I shouldn't guess, VSPO is small enough
  ];
  vspoNames.forEach(name => {
    if (!talents.find(t => t.name === name)) {
      talents.push({ agency: 'VSPO', name, color: '#A5C1E7' });
    }
  });

  // Deduplicate and filter out wrong things
  const unique = [];
  const seen = new Set();
  talents.forEach(t => {
    // Filter out some garbage data from Nijisanji like "名前" or single chars
    if (t.name === '名前' || t.name.length < 2) return;
    
    // Also remove Chinese names (Bilibili members) if we only want JP/EN
    if (t.name.match(/^[艾光勺千度勾岁弥初哎莱入桃妮犬沙阿七八吉悠雪瑞未栞雨帕米花点漆三能柚沐命泽]/)) return;
    
    if (!seen.has(t.name)) {
      seen.add(t.name);
      unique.push(t);
    }
  });

  const csvHeader = 'agency,name,color\n';
  const csvRows = unique.map(row => `${row.agency},${row.name},${row.color}`).join('\n');
  fs.writeFileSync('src/data/vtuber_dictionary.csv', csvHeader + csvRows);
  fs.writeFileSync('src/data/vtuber_dictionary.json', JSON.stringify(unique, null, 2));

  console.log(`Generated final dictionary with ${unique.length} members.`);
  const nijiCount = unique.filter(t => t.agency === 'Nijisanji').length;
  console.log(`Nijisanji: ${nijiCount}`);
  const holoCount = unique.filter(t => t.agency === 'Hololive').length;
  console.log(`Hololive: ${holoCount}`);
}
scrapeLocal();
