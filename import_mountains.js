const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = '1fceb2373be201e39250482fad520d8ca603ac8e82276b16cb10dfe16adb6e06';
const BASE_URL = 'http://api.forest.go.kr/openapi/service/trailInfoService/getforeststoryservice';

// City/region → [lat, lng] lookup table
const CITY_COORDS = {
  '서울':      [37.5665, 126.9780],
  '인천':      [37.4563, 126.7052],
  '부산':      [35.1796, 129.0756],
  '대구':      [35.8714, 128.6014],
  '광주':      [35.1595, 126.8526],
  '대전':      [36.3504, 127.3845],
  '울산':      [35.5384, 129.3114],
  '세종':      [36.4801, 127.2882],
  '수원':      [37.2636, 127.0286],
  '성남':      [37.4449, 127.1389],
  '고양':      [37.6564, 126.8355],
  '용인':      [37.2411, 127.1775],
  '화성':      [37.1996, 126.8312],
  '안산':      [37.3219, 126.8308],
  '부천':      [37.5035, 126.7660],
  '남양주':    [37.6357, 127.2165],
  '안양':      [37.3943, 126.9568],
  '평택':      [36.9922, 127.1128],
  '시흥':      [37.3800, 126.8030],
  '파주':      [37.7601, 126.7798],
  '의정부':    [37.7381, 127.0474],
  '김포':      [37.6154, 126.7157],
  '광명':      [37.4784, 126.8648],
  '광주시':    [37.4295, 127.2553],
  '군포':      [37.3616, 126.9352],
  '이천':      [37.2722, 127.4351],
  '양주':      [37.7852, 127.0459],
  '오산':      [37.1499, 127.0769],
  '구리':      [37.5943, 127.1294],
  '안성':      [37.0078, 127.2799],
  '포천':      [37.8945, 127.2003],
  '의왕':      [37.3450, 126.9688],
  '하남':      [37.5395, 127.2148],
  '여주':      [37.2982, 127.6376],
  '양평':      [37.4919, 127.4875],
  '동두천':    [37.9038, 127.0606],
  '과천':      [37.4292, 126.9879],
  '가평':      [37.8314, 127.5100],
  '연천':      [38.0962, 127.0750],
  '춘천':      [37.8813, 127.7300],
  '원주':      [37.3422, 127.9202],
  '강릉':      [37.7519, 128.8761],
  '동해':      [37.5247, 129.1143],
  '태백':      [37.1640, 128.9860],
  '속초':      [38.2070, 128.5918],
  '삼척':      [37.4496, 129.1652],
  '홍천':      [37.6969, 127.8882],
  '횡성':      [37.4914, 127.9845],
  '영월':      [37.1835, 128.4614],
  '평창':      [37.3703, 128.3908],
  '정선':      [37.3800, 128.6600],
  '철원':      [38.1464, 127.3134],
  '화천':      [38.1063, 127.7085],
  '양구':      [38.1099, 127.9893],
  '인제':      [38.0692, 128.1705],
  '고성':      [38.3804, 128.4679],
  '양양':      [38.0755, 128.6179],
  '청주':      [36.6424, 127.4890],
  '충주':      [36.9910, 127.9259],
  '제천':      [37.1323, 128.1909],
  '보은':      [36.4891, 127.7296],
  '옥천':      [36.3063, 127.5706],
  '영동':      [36.1752, 127.7764],
  '증평':      [36.7855, 127.5817],
  '진천':      [36.8559, 127.4351],
  '괴산':      [36.8152, 127.7869],
  '음성':      [36.9400, 127.6906],
  '단양':      [36.9848, 128.3654],
  '천안':      [36.8151, 127.1139],
  '공주':      [36.4466, 127.1190],
  '보령':      [36.3332, 126.6127],
  '아산':      [36.7898, 127.0022],
  '서산':      [36.7846, 126.4503],
  '논산':      [36.1870, 127.0990],
  '계룡':      [36.2747, 127.2488],
  '당진':      [36.8894, 126.6450],
  '금산':      [36.1088, 127.4882],
  '부여':      [36.2750, 126.9096],
  '서천':      [36.0798, 126.6921],
  '청양':      [36.4593, 126.8021],
  '홍성':      [36.6009, 126.6611],
  '예산':      [36.6800, 126.8452],
  '태안':      [36.7451, 126.2980],
  '전주':      [35.8242, 127.1479],
  '군산':      [35.9676, 126.7368],
  '익산':      [35.9483, 126.9577],
  '정읍':      [35.5699, 126.8560],
  '남원':      [35.4163, 127.3900],
  '김제':      [35.8034, 126.8807],
  '완주':      [35.9044, 127.1620],
  '진안':      [35.7910, 127.4241],
  '무주':      [36.0072, 127.6609],
  '장수':      [35.6474, 127.5209],
  '임실':      [35.6177, 127.2893],
  '순창':      [35.3745, 127.1378],
  '고창':      [35.4357, 126.7020],
  '부안':      [35.7316, 126.7335],
  '목포':      [34.8118, 126.3922],
  '여수':      [34.7604, 127.6622],
  '순천':      [34.9506, 127.4872],
  '나주':      [35.0160, 126.7107],
  '광양':      [34.9406, 127.6956],
  '담양':      [35.3214, 126.9882],
  '곡성':      [35.2819, 127.2924],
  '구례':      [35.2023, 127.4626],
  '고흥':      [34.6046, 127.2838],
  '보성':      [34.7714, 127.0800],
  '화순':      [35.0642, 126.9866],
  '장흥':      [34.6820, 126.9070],
  '강진':      [34.6424, 126.7680],
  '해남':      [34.5742, 126.5990],
  '영암':      [34.8001, 126.6968],
  '무안':      [34.9902, 126.4812],
  '함평':      [35.0655, 126.5169],
  '영광':      [35.2773, 126.5117],
  '장성':      [35.3016, 126.7855],
  '완도':      [34.3103, 126.7553],
  '진도':      [34.4873, 126.2633],
  '신안':      [34.8270, 126.1076],
  '포항':      [36.0190, 129.3435],
  '경주':      [35.8562, 129.2249],
  '김천':      [36.1398, 128.1135],
  '안동':      [36.5684, 128.7294],
  '구미':      [36.1198, 128.3444],
  '영주':      [36.8058, 128.6240],
  '영천':      [35.9735, 128.9383],
  '상주':      [36.4109, 128.1588],
  '문경':      [36.5866, 128.1863],
  '경산':      [35.8249, 128.7410],
  '군위':      [36.2391, 128.5726],
  '의성':      [36.3529, 128.6969],
  '청송':      [36.4356, 129.0574],
  '영양':      [36.6669, 129.1120],
  '영덕':      [36.4154, 129.3651],
  '청도':      [35.6476, 128.7362],
  '고령':      [35.7273, 128.2637],
  '성주':      [35.9194, 128.2822],
  '칠곡':      [35.9955, 128.4014],
  '예천':      [36.6566, 128.4524],
  '봉화':      [36.8931, 128.7319],
  '울진':      [36.9931, 129.4000],
  '울릉':      [37.4844, 130.9057],
  '창원':      [35.2280, 128.6811],
  '진주':      [35.1800, 128.1076],
  '통영':      [34.8544, 128.4330],
  '사천':      [35.0038, 128.0644],
  '김해':      [35.2342, 128.8811],
  '밀양':      [35.5037, 128.7463],
  '거제':      [34.8800, 128.6211],
  '양산':      [35.3350, 129.0375],
  '의령':      [35.3227, 128.2614],
  '함안':      [35.2727, 128.4065],
  '창녕':      [35.5448, 128.4912],
  '고성군':    [34.9735, 128.3226],
  '남해':      [34.8374, 127.8924],
  '하동':      [35.0677, 127.7514],
  '산청':      [35.4148, 127.8738],
  '함양':      [35.5207, 127.7254],
  '거창':      [35.6868, 127.9095],
  '합천':      [35.5660, 128.1664],
  '제주':      [33.4996, 126.5312],
  '서귀포':    [33.2541, 126.5600],
  '북한산':    [37.6585, 126.9780],
  '지리산':    [35.3372, 127.7306],
  '한라산':    [33.3617, 126.5292],
  '설악산':    [38.1194, 128.4656],
  '오대산':    [37.7960, 128.5420],
  '태백산':    [37.0988, 128.9164],
  '소백산':    [36.9584, 128.4880],
  '월악산':    [36.8621, 128.0832],
  '속리산':    [36.5391, 127.8748],
  '덕유산':    [35.8474, 127.7393],
  '가야산':    [35.8009, 128.1074],
  '내장산':    [35.4882, 126.8880],
  '무등산':    [35.1275, 126.9885],
  '계룡산':    [36.3623, 127.1988],
  '치악산':    [37.3700, 128.0500],
  '주왕산':    [36.3888, 129.1605],
  '월출산':    [34.7638, 126.6919],
  '두륜산':    [34.4937, 126.5928],
  '가지산':    [35.5795, 129.0239],
};

function getRegionFromLocation(loc) {
  if (!loc) return '기타';
  // Extract province
  const provMap = {
    '서울': '서울', '인천': '인천', '경기': '경기', '강원': '강원',
    '충북': '충북', '충남': '충남', '전북': '전북', '전남': '전남',
    '경북': '경북', '경남': '경남', '부산': '부산', '대구': '대구',
    '광주': '광주', '대전': '대전', '울산': '울산', '세종': '세종',
    '제주': '제주',
  };
  for (const [k, v] of Object.entries(provMap)) {
    if (loc.includes(k)) return v;
  }
  return '기타';
}

function getCoordsFromLocation(loc) {
  if (!loc) return null;
  // Try to find a city match in the location string
  // First try known mountain names
  const knownMountains = ['북한산','지리산','한라산','설악산','오대산','태백산','소백산',
    '월악산','속리산','덕유산','가야산','내장산','무등산','계룡산','치악산','주왕산',
    '월출산','두륜산','가지산'];
  for (const m of knownMountains) {
    if (loc.includes(m)) return CITY_COORDS[m];
  }
  // Try cities/counties
  const cityKeys = Object.keys(CITY_COORDS).filter(k => !['북한산','지리산','한라산','설악산','오대산','태백산','소백산','월악산','속리산','덕유산','가야산','내장산','무등산','계룡산','치악산','주왕산','월출산','두륜산','가지산'].includes(k));
  for (const key of cityKeys) {
    if (loc.includes(key)) return CITY_COORDS[key];
  }
  return null;
}

function diffFromAlt(alt) {
  if (alt < 400) return '입문';
  if (alt < 600) return '초급';
  if (alt < 900) return '중급';
  if (alt < 1200) return '고급';
  return '고급';
}

function lvFromAlt(alt) {
  if (alt < 400) return {min:0, max:0};
  if (alt < 600) return {min:0, max:1};
  if (alt < 900) return {min:1, max:2};
  if (alt < 1200) return {min:2, max:3};
  return {min:3, max:4};
}

function guessTimeFromAlt(alt) {
  // Rough: 1h per 300m, base 1h
  const hours = 1 + alt/300;
  return Math.round(hours * 60);
}

function guessDistFromAlt(alt) {
  return parseFloat((3 + alt/200).toFixed(1));
}

function tagsFromSubtitle(subtitle, loc) {
  const tags = [];
  if (!subtitle) return tags;
  const s = subtitle + (loc || '');
  if (s.includes('계곡') || s.includes('물') || s.includes('폭포')) tags.push('계곡');
  if (s.includes('꽃') || s.includes('철쭉') || s.includes('진달래')) tags.push('꽃길');
  if (s.includes('일출') || s.includes('해돋이')) tags.push('일출');
  if (s.includes('역사') || s.includes('산성') || s.includes('사찰') || s.includes('절')) tags.push('역사');
  if (s.includes('숲') || s.includes('나무') || s.includes('소나무')) tags.push('숲길');
  if (s.includes('암릉') || s.includes('바위') || s.includes('암봉')) tags.push('암릉');
  if (s.includes('전망') || s.includes('조망') || s.includes('뷰')) tags.push('도심뷰');
  if (tags.length === 0) tags.push('숲길'); // default
  return tags;
}

function sanitizeId(nm) {
  return nm.replace(/[^a-zA-Z0-9가-힣]/g, '').substring(0, 20);
}

function fetchPage(pageNo) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}?serviceKey=${API_KEY}&pageNo=${pageNo}&numOfRows=100&type=xml`;
    http.get(url, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      res.on('end', () => {
        const xml = Buffer.concat(chunks).toString('utf8');
        resolve(xml);
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[1];
    const get = (tag) => {
      const r = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`);
      const found = r.exec(block);
      return found ? found[1].replace(/&amp;amp;nbsp;/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() : '';
    };
    items.push({
      id: get('mntnid'),
      nm: get('mntnnm'),
      alt: parseInt(get('mntninfohght')) || 0,
      loc: get('mntninfopoflc'),
      subtitle: get('mntnsbttlinfo'),
    });
  }
  return items;
}

async function main() {
  console.log('Fetching total count...');
  const firstPage = await fetchPage(1);
  const totalMatch = /<totalCount>(\d+)<\/totalCount>/.exec(firstPage);
  const total = totalMatch ? parseInt(totalMatch[1]) : 0;
  const totalPages = Math.ceil(total / 100);
  console.log(`Total: ${total}, Pages: ${totalPages}`);

  let allItems = parseItems(firstPage);
  for (let p = 2; p <= totalPages; p++) {
    process.stdout.write(`Fetching page ${p}/${totalPages}...\r`);
    const xml = await fetchPage(p);
    allItems = allItems.concat(parseItems(xml));
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\nFetched ${allItems.length} total items`);

  // Read existing MTS names from index.html
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const existingNames = new Set();
  const nmRegex = /nm:'([^']+)'/g;
  let nm;
  while ((nm = nmRegex.exec(html)) !== null) {
    existingNames.add(nm[1]);
  }
  console.log(`Existing mountain names: ${existingNames.size}`);

  // Filter and convert
  const newEntries = [];
  const seenNames = new Set(existingNames);

  for (const item of allItems) {
    if (item.alt < 300) continue;
    if (!item.nm) continue;
    if (seenNames.has(item.nm)) continue;

    const coords = getCoordsFromLocation(item.loc);
    if (!coords) continue; // skip if no coord mapping

    seenNames.add(item.nm);

    const region = getRegionFromLocation(item.loc);
    const diff = diffFromAlt(item.alt);
    const lv = lvFromAlt(item.alt);
    const timeMin = guessTimeFromAlt(item.alt);
    const distKm = guessDistFromAlt(item.alt);
    const timeH = (timeMin/60).toFixed(1) + 'h';
    const tags = tagsFromSubtitle(item.subtitle, item.loc);
    const lat = parseFloat((coords[0] + (Math.random()-0.5)*0.1).toFixed(4));
    const lng = parseFloat((coords[1] + (Math.random()-0.5)*0.1).toFixed(4));

    // simple waypoints: 4 points around summit
    const wp = [
      [parseFloat((lat-0.015).toFixed(4)), parseFloat((lng-0.010).toFixed(4))],
      [parseFloat((lat-0.008).toFixed(4)), parseFloat((lng-0.004).toFixed(4))],
      [parseFloat((lat+0.002).toFixed(4)), parseFloat((lng+0.003).toFixed(4))],
      [lat, lng],
    ];

    const idStr = sanitizeId(item.nm);
    const familyOk = item.alt < 600;
    const access = item.alt < 400 ? 4 : item.alt < 700 ? 3 : 2;

    const entry = `{id:'api_${idStr}',nm:'${item.nm}',lat:${lat},lng:${lng},alt:${item.alt},color:'#7ab8f5',
   region:'${region}',
   course:'정상 코스',dist:'${distKm}km',time:'${timeH}',diff:'${diff}',
   tags:${JSON.stringify(tags)},lvMin:${lv.min},lvMax:${lv.max},distKm:${distKm},timeMin:${timeMin},
   access:${access},crowd:2,scenic:3,exercise:3,windSafe:3,familyOk:${familyOk},
   parking:{available:true,fee:'무료',capacity:'100대',info:'등산로 입구'},
   toilet:{count:2,locations:['입구','중간']},
   transport:{bus:'지역 버스',subway:'해당 없음'},
   top100:false,
   wp:${JSON.stringify(wp)}}`;

    newEntries.push(entry);
  }

  console.log(`New entries to add: ${newEntries.length}`);

  if (newEntries.length === 0) {
    console.log('No new entries to add.');
    return;
  }

  // Insert before the closing ]; of MTS array (line 3930)
  // Find the pattern: last top100 entry followed by ];\n\nconst COURSES
  const insertMarker = 'top100:false,wp:[[37.253,127.091],[37.256,127.096],[37.260,127.101]]}\n];';
  const insertPos = html.indexOf(insertMarker);
  if (insertPos === -1) {
    console.error('Could not find insertion point in index.html');
    // Try alternative
    const alt2 = html.lastIndexOf('];\n\nconst COURSES');
    if (alt2 === -1) {
      console.error('Alternative insertion point also not found.');
      fs.writeFileSync('new_entries.js', newEntries.join(',\n') + '\n');
      console.log('Wrote new_entries.js instead');
      return;
    }
    const newHtml = html.substring(0, alt2) + ',\n' + newEntries.join(',\n') + '\n' + html.substring(alt2);
    fs.writeFileSync(path.join(__dirname, 'index.html'), newHtml, 'utf8');
    console.log('Done (alt method)!');
    return;
  }

  const insertAt = insertPos + insertMarker.length - 2; // before the '}' closing + '];\n'
  // Actually insert after the last entry's closing }
  const before = html.substring(0, insertPos + 'top100:false,wp:[[37.253,127.091],[37.256,127.096],[37.260,127.101]]}' .length);
  const after  = html.substring(insertPos + 'top100:false,wp:[[37.253,127.091],[37.256,127.096],[37.260,127.101]]}' .length);

  const newHtml = before + ',\n' + newEntries.join(',\n') + after;
  fs.writeFileSync(path.join(__dirname, 'index.html'), newHtml, 'utf8');
  console.log(`Done! Added ${newEntries.length} mountains.`);
}

main().catch(console.error);
