(() => {
  'use strict';
  const dialog = document.getElementById('resource-dialog');
  const list = document.getElementById('resource-list');
  const state = document.getElementById('resource-state');
  const query = document.getElementById('resource-query');
  const retry = document.getElementById('retry-resources');
  const filters = [...document.querySelectorAll('[data-category]')];
  let catalog = null;
  let category = 'all';
  let opener = null;
  const labels = {water:'น้ำ',rain:'ฝน',cctv:'CCTV',traffic:'จราจร',emergency:'ฉุกเฉิน'};
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function link(text, url, className) {
    const node = element('a', text, className);
    const parsed = new URL(url);
    if (!['https:', 'tel:'].includes(parsed.protocol)) throw new Error('Unsupported URL');
    node.href = url;
    if (parsed.protocol === 'https:') { node.target = '_blank'; node.rel = 'noopener noreferrer'; }
    return node;
  }
  function render() {
    if (!catalog) return;
    const search = query.value.trim().toLocaleLowerCase('th');
    const entries = [...catalog.sources, ...catalog.hotlines].filter(item =>
      (category === 'all' || item.categories.includes(category)) &&
      [item.name,item.provider,item.description,item.coverage,item.phone,item.lineId,...item.categories.map(x=>labels[x])]
        .filter(Boolean).join(' ').toLocaleLowerCase('th').includes(search));
    list.replaceChildren();
    state.textContent = entries.length ? 'พบ ' + entries.length + ' รายการ' : 'ไม่พบรายการ ลองเปลี่ยนหมวดหรือคำค้น';
    for (const item of entries) {
      const card = element('article', '', 'resource-card');
      card.append(element('h2', item.name));
      card.append(element('p', item.provider || item.coverage, 'resource-meta'));
      card.append(element('p', item.description));
      if (item.phone) {
        card.append(link('โทร ' + item.phone, 'tel:' + item.phone, 'resource-action phone'));
        if (item.lineId) card.append(element('p', 'LINE: ' + item.lineId + ' • เพิ่มเพื่อนด้วย ID นี้'));
        card.append(element('p', 'อ้างอิงหน่วยงาน • ตรวจ ' + item.verification.checkedAt, 'resource-verification'));
      } else {
        card.append(element('p', item.categories.map(x => labels[x]).join(' · '), 'resource-meta'));
        const opened = item.verification.status === 'opened';
        card.append(element('p', (opened ? 'เปิดหน้าได้เมื่อตรวจ' : 'ยังยืนยันการเปิดหน้าไม่ได้') + ' • ' + item.verification.checkedAt, 'resource-verification' + (opened ? '' : ' pending')));
        card.append(link('เปิดเว็บไซต์ ↗', item.url, 'resource-action'));
      }
      card.append(element('br'));
      card.append(link('แหล่งอ้างอิง ↗', item.verification.evidenceUrl, 'resource-evidence'));
      list.append(card);
    }
  }
  function select(value) {
    category = value;
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === value)));
    render();
  }
  function open(value, button) {
    opener = button;
    query.value = '';
    select(value);
    dialog.showModal();
    dialog.scrollTop = 0;
    document.getElementById('close-resources').focus();
  }
  document.getElementById('open-resources').onclick = event => open('all', event.currentTarget);
  document.getElementById('open-emergency').onclick = event => open('emergency', event.currentTarget);
  document.getElementById('close-resources').onclick = () => dialog.close();
  dialog.addEventListener('close', () => opener?.focus());
  filters.forEach(button => button.onclick = () => select(button.dataset.category));
  query.addEventListener('input', render);
  async function load() {
    retry.hidden = true;
    state.textContent = 'กำลังโหลดรายการ…';
    try {
      const response = await fetch('./data/resources.json', {cache:'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const result = await response.json();
      if (!Array.isArray(result.sources) || !Array.isArray(result.hotlines)) throw new Error('Invalid catalog');
      catalog = result;
      render();
    } catch (error) {
      catalog = null;
      list.replaceChildren();
      state.textContent = 'โหลดรายการไม่ได้ กรุณาลองอีกครั้ง • สายด่วนสำคัญ';
      // Keep emergency contacts usable even when the directory request fails.
      for (const [name, phone] of [['ปภ.','1784'],['การแพทย์ฉุกเฉิน','1669'],['กรมทางหลวง','1586'],['กรมทางหลวงชนบท','1146'],['การไฟฟ้าส่วนภูมิภาค','1129'],['การไฟฟ้านครหลวง','1130']]) {
        list.append(link(name + ' ' + phone, 'tel:' + phone, 'resource-action phone'));
      }
      list.append(element('p','LINE ปภ.: @1784DDPM'));
      retry.hidden = false;
      console.warn('Resource directory unavailable', error);
    }
  }
  retry.onclick = load;
  load();
})();
