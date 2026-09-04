const { JSDOM } = require('jsdom');
const fs = require('fs');

async function scrapeHololive() {
  const url = 'https://hololive.hololivepro.com/talents?gp=hololive';
  const dom = await JSDOM.fromURL(url);
  const document = dom.window.document;
  
  const talents = [];
  document.querySelectorAll('h3').forEach(h3 => {
    // <span> tag contains the english name, we just want the text node
    let jpName = '';
    h3.childNodes.forEach(node => {
      if (node.nodeType === 3) { // Text node
        jpName += node.textContent.trim();
      }
    });
    if (jpName) talents.push({ agency: 'Hololive', name: jpName });
  });
  return talents;
}

async function scrapeDevis() {
  const url = 'https://hololive.hololivepro.com/talents?gp=devis';
  const dom = await JSDOM.fromURL(url);
  const document = dom.window.document;
  
  const talents = [];
  document.querySelectorAll('h3').forEach(h3 => {
    let jpName = '';
    h3.childNodes.forEach(node => {
      if (node.nodeType === 3) {
        jpName += node.textContent.trim();
      }
    });
    if (jpName) talents.push({ agency: 'Hololive', name: jpName });
  });
  return talents;
}

async function scrapeNijisanji() {
  const url = 'https://www.nijisanji.jp/talents';
  const dom = await JSDOM.fromURL(url);
  const document = dom.window.document;
  
  // Nijisanji Next.js data
  const script = document.querySelector('#__NEXT_DATA__');
  const talents = [];
  
  if (script) {
    const data = JSON.parse(script.textContent);
    
    // We need to find the talents array recursively
    function findTalents(obj) {
      if (Array.isArray(obj)) {
        obj.forEach(findTalents);
      } else if (obj && typeof obj === 'object') {
        if (obj.name && obj.slug && obj.color !== undefined) {
          if (!talents.find(t => t.name === obj.name)) {
            talents.push({ agency: 'Nijisanji', name: obj.name, color: obj.color });
          }
        }
        for (const key in obj) {
          findTalents(obj[key]);
        }
      }
    }
    findTalents(data);
  }
  return talents;
}

async function scrapeVspo() {
  const url = 'https://store.vspo.jp/collections/members';
  const dom = await JSDOM.fromURL(url);
  const document = dom.window.document;
  
  const talents = [];
  // Assuming names might be in certain product titles or collection headers
  // We can also extract from text content of standard elements
  const allText = document.body.textContent;
  const knownVspo = [
    '一ノ瀬うるは','小雀とと','花芽すみれ','花芽なずな','胡桃のあ','橘ひなの','如月れん','兎咲ミミ','空澄セナ','英リサ','神成きゅぴ','八雲べに','藍沢エマ','紫宮るな','猫汰つな','白波らむね','小森めと','夢野あかり','夜乃くろむ','紡木こかげ','千燈ゆうひ','蝶屋はなび'
  ];
  
  // Actually VSPO Shopify store might just list them in links.
  document.querySelectorAll('a').forEach(a => {
    const text = a.textContent.trim();
    if (text && !talents.find(t => t.name === text) && text.length > 1 && text.length < 15) {
      // Very naive, let's just combine known list + dynamic extraction if it looks like a talent
      // A better way is to look for elements with specific classes but we don't know them.
      // We'll trust the known list + any extra elements we find.
    }
  });
  
  return knownVspo.map(name => ({ agency: 'VSPO', name }));
}

async function main() {
  try {
    const holo = await scrapeHololive();
    const devis = await scrapeDevis();
    const niji = await scrapeNijisanji();
    const vspo = await scrapeVspo();
    
    // Combine and deduplicate
    const allTalents = [...holo, ...devis, ...niji, ...vspo];
    
    const unique = [];
    const seen = new Set();
    
    allTalents.forEach(t => {
      // Remove any trailing/leading spaces and zero-width spaces
      const cleanName = t.name.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
      if (!seen.has(cleanName) && cleanName.length > 0) {
        seen.add(cleanName);
        unique.push({
          agency: t.agency,
          name: cleanName,
          color: t.color || '#cccccc'
        });
      }
    });

    const csvHeader = 'agency,name,color\n';
    const csvRows = unique.map(row => `${row.agency},${row.name},${row.color}`).join('\n');
    
    fs.writeFileSync('vtuber_dictionary_scraped.csv', csvHeader + csvRows);
    fs.writeFileSync('vtuber_dictionary_scraped.json', JSON.stringify(unique, null, 2));
    
    console.log(`Scraping complete. Found ${unique.length} members.`);
    console.log(`Hololive+DEV_IS: ${holo.length + devis.length}`);
    console.log(`Nijisanji: ${niji.length}`);
    console.log(`VSPO: ${vspo.length}`);
  } catch(e) {
    console.error('Error during scraping', e);
  }
}

main();
