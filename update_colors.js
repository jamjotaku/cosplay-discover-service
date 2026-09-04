const fs = require('fs');
const https = require('https');
const Papa = require('papaparse');
const path = require('path');

const dictPath = path.join(__dirname, 'src', 'data', 'vtuber_dictionary.json');
const dictionary = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRlfU_ch8RSqi8kvmeUs5savNiV6nw8R0SpQbnzocWErtnU-dUNiFyrSJNRmmbaMnojlhqXjMURWDpE/pub?gid=0&single=true&output=csv';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Let's just parse it as array of arrays to be safe
    const parsed = Papa.parse(data, { skipEmptyLines: true });
    
    // Find column index for name and color
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
        
        // Remove zero width spaces or strange characters from name
        name = name.replace(/[\u200B-\u200D\uFEFF]/g, '');

        if (!color.startsWith('#')) color = '#' + color;
        
        // Sometimes the official scraped name and the google sheet name differs slightly
        // We do a loose match or exact match
        const entry = dictionary.find(d => d.name === name || d.name.replace(/\s+/g, '') === name.replace(/\s+/g, ''));
        if (entry) {
          entry.color = color;
          updatedCount++;
        } else {
          // If the talent is missing from our scraped dictionary, let's add them!
          dictionary.push({ agency: 'Nijisanji', name, color });
          updatedCount++;
        }
      }
    } else {
       console.log('Headers not found', headers);
    }
    
    fs.writeFileSync(dictPath, JSON.stringify(dictionary, null, 2));
    
    // update artifact preview
    let md = '# 抽出されたVTuberマスター辞書\n\n';
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

    console.log(`Successfully merged colors. New total members: ${dictionary.length}. Updated/Added: ${updatedCount}`);
  });
}).on('error', err => {
  console.error(err);
});
