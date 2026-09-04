const fs = require('fs');

const path = 'C:\\Users\\mogiy\\.gemini\\antigravity\\brain\\5fa28501-4922-4135-ba19-cf50c01fe117\\.system_generated\\steps\\230\\content.md';
const content = fs.readFileSync(path, 'utf8');

const scriptMatch = content.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
if (scriptMatch) {
  const data = JSON.parse(scriptMatch[1]);
  // The data structure usually has props.pageProps.talents or similar
  const talents = [];
  function search(obj) {
    if (Array.isArray(obj)) obj.forEach(search);
    else if (obj && typeof obj === 'object') {
      if (obj.name && typeof obj.name === 'string' && obj.name.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)) {
        // Japanese text detected
        if (!talents.includes(obj.name)) talents.push(obj.name);
      }
      for (const key in obj) search(obj[key]);
    }
  }
  search(data);
  console.log('Nijisanji names found via JSON:');
  console.log(talents.join(', '));
}
