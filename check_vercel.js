(async () => {
  const html = await fetch('https://cosplay-discover-service.vercel.app').then(r=>r.text());
  const jsFiles = [...html.matchAll(/_next\/static\/chunks\/[^\"]+\.js/g)].map(m => m[0]);
  for(let file of jsFiles) {
    const js = await fetch('https://cosplay-discover-service.vercel.app/' + file).then(r=>r.text());
    const m = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/);
    if(m) {
      console.log('Found in ' + file + ':', m[0]);
      return;
    }
  }
  console.log('Not found in any chunk');
})();
