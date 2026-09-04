const fs = require('fs');

const path = 'C:\\Users\\mogiy\\.gemini\\antigravity\\brain\\5fa28501-4922-4135-ba19-cf50c01fe117\\.system_generated\\steps\\230\\content.md';
const content = fs.readFileSync(path, 'utf8');

// Looking for __NEXT_DATA__ or names in the JSON
const nextDataMatch = content.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);

if (nextDataMatch) {
  try {
    const data = JSON.parse(nextDataMatch[1]);
    const talents = [];
    
    // Recursive search for talents
    function findTalents(obj) {
      if (Array.isArray(obj)) {
        obj.forEach(findTalents);
      } else if (obj !== null && typeof obj === 'object') {
        if (obj.name && obj.affiliation && typeof obj.name === 'string') {
          if (!talents.includes(obj.name)) {
            talents.push(obj.name);
          }
        }
        for (const key in obj) {
          findTalents(obj[key]);
        }
      }
    }
    
    findTalents(data);
    console.log(`Found ${talents.length} talents:`);
    console.log(talents.slice(0, 50).join(', '));
  } catch (e) {
    console.error('Error parsing JSON:', e.message);
  }
} else {
  console.log('No __NEXT_DATA__ found. Trying regex for names.');
  // The Nijisanji talents page uses English names in URLs, and Japanese names in text.
  // Maybe it's in standard HTML.
}
