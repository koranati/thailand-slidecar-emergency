import {DATA_URL,readProviders,filterProviders,options,checkedTime} from './data.mjs';
const $ = id => document.getElementById(id);
let providers = [], limit = 30, loading = false, loaded = false, fetchedAt = null;
const dateFormat = new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeZone:'Asia/Bangkok'});
const timeFormat = new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Bangkok'});
function node(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
function setOptions(select, values, placeholder) { const previous = select.value; select.replaceChildren(new Option(placeholder,''), ...values.map(v => new Option(v,v))); if (values.includes(previous)) select.value = previous; }
function provinces() { const region = $('region').value; const rows = region ? providers.filter(p=>p.region===region) : providers; setOptions($('province'),options(rows,'province'),'ทุกจังหวัดที่มีข้อมูล'); $('province').disabled=false; }
function districts() { const region = $('region').value; const province = $('province').value; const rows = providers.filter(p=>(!region||p.region===region)&&p.province===province); setOptions($('district'),province ? options(rows,'district') : [],province ? 'ทุกเขต / อำเภอ' : 'เลือกจังหวัดก่อน'); $('district').disabled = !province; }
function card(p) {
  const article = node('article','card'); const top = node('div','card-head');
  top.append(node('p','location',[p.region,p.province,p.district].filter(Boolean).join(' · ')),node('span','badge'+(p.allDay?'':' unknown'),p.allDay?'24 ชั่วโมง':'ไม่ระบุ 24 ชม.'));
  article.append(top,node('h3','',p.name),node('p','type',p.type || 'ไม่ระบุประเภทบริการ'),node('p','area',p.area || 'สอบถามพื้นที่บริการโดยตรง'));
  const meta = node('div','card-meta'); meta.append(node('p','',`ตรวจสอบตามชีต: ${p.checked || 'ไม่ระบุวันที่'}`),node('p','',`แหล่งข้อมูล: ${p.source || 'ไม่ระบุ'}`)); article.append(meta);
  if (p.phones.length) {
    for (const number of p.phones) {
      const display = p.phones.length === 1 ? p.phone : number;
      article.append(node('span','phone',display)); const call = node('a','call','☎ โทรทันที'); call.href='tel:'+number; call.setAttribute('aria-label',`โทรหา ${p.name} ที่ ${number}`); article.append(call);
    }
  } else article.append(node('p','small muted',p.phone ? `เบอร์ที่ระบุ: ${p.phone} — โปรดตรวจสอบในชีตต้นฉบับ` : 'ยังไม่มีเบอร์โทร กรุณาดูชีตต้นฉบับ'));
  return article;
}
function render() {
  const matched = filterProviders(providers,{query:$('search').value,region:$('region').value,province:$('province').value,district:$('district').value,allDay:$('hours').checked});
  $('results-title').textContent = `พบ ${matched.length.toLocaleString('th-TH')} ผู้ให้บริการ`;
  $('status').textContent = `พบ ${matched.length} ผู้ให้บริการ แสดง ${Math.min(limit,matched.length)} รายการ`;
  $('cards').replaceChildren(...matched.slice(0,limit).map(card)); $('empty').hidden = matched.length !== 0; $('more').hidden = matched.length <= limit;
  $('more').textContent = `แสดงเพิ่มเติม (${Math.max(0,matched.length-limit)} รายการ)`;
}
function reset() { $('search').value=''; $('region').value=''; $('province').value=''; $('district').value=''; $('hours').checked=false; provinces(); districts(); limit=30; if(loaded)render(); }
function dates() { const dates = providers.map(p=>checkedTime(p.checked)).filter(x=>x!==null); $('updated').textContent = `วันที่ตรวจสอบล่าสุดที่ระบุในชีต: ${dates.length ? dateFormat.format(new Date(Math.max(...dates))) : 'ไม่ระบุ'} · ดึงข้อมูล: ${timeFormat.format(fetchedAt)} น. (เวลาไทย)`; }
async function load() {
  if (loading) return; loading=true; $('refresh').disabled=true; $('refresh').textContent='กำลังโหลด…'; $('cards').setAttribute('aria-busy','true'); $('error').hidden=true; $('loading').hidden=loaded;
  if (!loaded) { $('empty').hidden=true; $('results-title').textContent='กำลังโหลดข้อมูล…'; }
  $('status').textContent='กำลังโหลดข้อมูลล่าสุด';
  try {
    const response = await fetch(DATA_URL+'&_='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(15000)});
    if (!response.ok) throw new Error('HTTP '+response.status);
    const result = readProviders(await response.text()); providers = result.providers; fetchedAt = new Date(); loaded=true;
    setOptions($('region'),options(providers,'region'),'ทุกภาค'); $('region').disabled=false; provinces(); districts(); dates();
    $('coverage').textContent=`ฐานข้อมูลมี ${providers.length} ราย ใน ${options(providers,'province').length} จังหวัด/พื้นที่ และ ${options(providers,'region').length} ภาค/ขอบเขต • ยังไม่ครอบคลุมทุกพื้นที่ • อ่านชีตใหม่อัตโนมัติทุก 5 นาที`+(result.skipped ? ` • ข้าม ${result.skipped} แถวที่ไม่มีชื่อหรือจังหวัด` : ''); render();
  } catch {
    $('error').textContent=loaded ? 'อัปเดตไม่สำเร็จ กำลังแสดงข้อมูลจากการโหลดครั้งก่อนตามเวลาที่ระบุ กรุณาตรวจสอบอินเทอร์เน็ตแล้วกด “โหลดข้อมูลใหม่” หรือเปิดชีตต้นฉบับ' : 'โหลดข้อมูลไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วกด “โหลดข้อมูลใหม่” หรือเปิด Google Sheet ต้นฉบับด้านล่าง';
    $('error').hidden=false; $('status').textContent='โหลดข้อมูลไม่สำเร็จ'; if(!loaded)$('results-title').textContent='ยังโหลดรายชื่อไม่ได้';
  } finally { loading=false; $('refresh').disabled=false; $('refresh').textContent='↻ โหลดข้อมูลใหม่'; $('loading').hidden=true; $('cards').setAttribute('aria-busy','false'); }
}
$('search').addEventListener('input',()=>{limit=30;if(loaded)render();});
$('region').addEventListener('change',()=>{$('province').value='';$('district').value='';provinces();districts();limit=30;if(loaded)render();});
$('province').addEventListener('change',()=>{$('district').value='';districts();limit=30;if(loaded)render();});
for(const id of ['district','hours'])$(id).addEventListener('change',()=>{limit=30;if(loaded)render();});
for(const id of ['reset','empty-reset'])$(id).addEventListener('click',reset);
$('refresh').addEventListener('click',load); $('more').addEventListener('click',()=>{const oldCount=$('cards').children.length;limit+=30;render();const next=$('cards').children[oldCount];if(next){next.tabIndex=-1;next.focus();}});
setInterval(()=>{if(document.visibilityState==='visible')load();},300000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&(!fetchedAt||Date.now()-fetchedAt.getTime()>300000))load();});
load();
