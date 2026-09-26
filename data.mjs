export const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1uYb8Ufwz7TxadUyrPzpkZh5dCMIUAIAHqvCyx6a0dJ4/edit';
export const DATA_URL = SHEET_URL.replace('/edit', '/gviz/tq') + '?tqx=out:csv&sheet=' + encodeURIComponent('ฐานข้อมูลรถสไลด์') + '&headers=1';
const columns = ['จังหวัด','เขต/อำเภอ','ผู้ให้บริการ','โทรศัพท์','24 ชม.','ประเภท','ที่อยู่/พื้นที่','ตรวจสอบล่าสุด','แหล่งข้อมูล','ภาค'];
export function parseCSV(text) {
  if (/^\s*</.test(text)) throw new Error('ข้อมูลไม่ใช่ CSV');
  const rows = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { row.push(field); field = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) { if (c === '\r' && text[i + 1] === '\n') i++; row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (quoted) throw new Error('CSV ไม่สมบูรณ์');
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}
export const normalize = value => String(value ?? '').normalize('NFKC').replace(/[๐-๙]/g, n => String(n.charCodeAt(0)-3664)).toLocaleLowerCase('th').trim();
export function phones(value) {
  const candidates = normalize(value).match(/(?:\+66|0)[\d\s().-]{7,18}\d/g) || [];
  return [...new Set(candidates.map(x => x.replace(/[^\d+]/g, '')).filter(x => /^(?:0[2-9]\d{7,8}|\+66[2-9]\d{7,8})$/.test(x)))];
}
export function readProviders(text) {
  const rows = parseCSV(text); const headers = (rows.shift() || []).map(x => x.replace(/^\uFEFF/, '').trim());
  const indices = columns.map(c => headers.indexOf(c));
  if (indices.some(i => i < 0)) throw new Error('หัวตารางไม่ตรงกับโครงสร้างฐานข้อมูล');
  let skipped = 0; const seen = new Set(); const providers = [];
  for (const row of rows) {
    if (row.every(x => !x.trim())) continue;
    const [province,district,name,phone,hours,type,area,checked,source,region] = indices.map(i => (row[i] || '').trim());
    if (!name || !province) { skipped++; continue; }
    const key = [province,district,name,phone].join('|'); if (seen.has(key)) continue; seen.add(key);
    providers.push({province,district,name,phone,phones:phones(phone),allDay:['ใช่','yes','true','24','24 ชม.','24 ชั่วโมง'].includes(normalize(hours)),type,area,checked,source,region});
  }
  return {providers,skipped};
}
export function filterProviders(providers, {query='',region='',province='',district='',allDay=false} = {}) {
  const q = normalize(query); const digits = q.replace(/[^\d]/g, '');
  const phoneQuery = /^[\d\s+().-]+$/.test(q) && digits.length > 0;
  return providers.filter(p => (!region || p.region === region) && (!province || p.province === province) && (!district || p.district === district) && (!allDay || p.allDay) && (!q || normalize([p.name,p.region,p.province,p.district,p.area,p.phone].join(' ')).includes(q) || (phoneQuery && p.phones.some(n => n.replace(/\D/g,'').includes(digits)))));
}
export function options(providers, field) { return [...new Set(providers.map(p => p[field]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'th')); }
export function checkedTime(value) {
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if (!m) return null;
  const year = +m[3] > 2400 ? +m[3] - 543 : +m[3]; const d = new Date(Date.UTC(year,+m[2]-1,+m[1]));
  return d.getUTCFullYear() === year && d.getUTCMonth() === +m[2]-1 && d.getUTCDate() === +m[1] ? d.getTime() : null;
}
