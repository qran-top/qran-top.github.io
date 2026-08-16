const https = require('https');
https.get('https://api.quran.com/api/v4/verses/by_page/3?words=true&word_fields=text_uthmani,char_type_name', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const pm = json.verses.flatMap(v => v.words).filter(w => w.char_type_name !== 'word' && w.char_type_name !== 'end');
    console.log(pm.slice(0, 3));
  });
});
