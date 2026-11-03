import { outlets, offices } from './history-branches.mjs';
import { typeLabel } from './history-core.mjs';
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const normalize = value => String(value || '').normalize('NFKC').trim().toLocaleLowerCase('ms-MY').replace(/\s+/g, ' ');
let selectedState = '', selectionKey = '', panel;
export function matchBranches(record) {
 const district = normalize(record.district);
 if (!district) return { branches: [], candidates: [] };
 const branches = outlets.filter(branch => normalize(branch.s) === normalize(record.state) && branch.dist.some(name => normalize(name) === district));
 const candidates = offices.filter(office => normalize(office.state) === normalize(record.state) && office.postcodes.some(postcode => branches.some(branch => branch.r.some(([from, to]) => postcode >= from && postcode <= to))));
 return { branches, candidates };
}
export function summarize(records) {
 const states = new Map(), types = [...new Set(records.map(record => record.disaster_type))].sort();
 for (const record of records) {
  if (!states.has(record.state)) states.set(record.state, { name: record.state, total: 0, counts: {} });
  const state = states.get(record.state);
  state.total++;
  state.counts[record.disaster_type] = (state.counts[record.disaster_type] || 0) + 1;
 }
 return { types, states: [...states.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)) };
}
function setup() {
 panel = document.createElement('section');
 panel.id = 'historyDashboard';
 document.getElementById('outlookBasis').insertAdjacentElement('afterend', panel);
 const style = document.createElement('style');
 style.textContent = `#historyDashboard{margin:18px 0 24px}#historyDashboard .hd-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:14px 0}#historyDashboard .hd-metric,#historyDashboard .hd-panel{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:18px}#historyDashboard .hd-metric strong{display:block;font-size:28px}#historyDashboard .hd-metric span{font-size:12px;color:var(--muted)}#historyDashboard .hd-layout{display:grid;grid-template-columns:1.6fr 1fr;gap:14px}#historyDashboard .hd-table{overflow:auto}#historyDashboard table{min-width:430px}#historyDashboard .hd-state{background:transparent;border:0;color:var(--ink);text-decoration:underline;text-underline-offset:4px;padding:0;text-align:left}#historyDashboard .hd-state[aria-pressed=true]{color:#ba98ec}#historyDashboard .hd-chart{margin:16px 0}#historyDashboard .hd-chart p{display:flex;justify-content:space-between;font-size:12px}#historyDashboard .hd-track{height:8px;background:var(--line);border-radius:5px;overflow:hidden}#historyDashboard .hd-track i{display:block;height:100%;background:#a888d7}#historyDashboard .hd-branches{margin-top:22px}#historyDashboard .hd-match{border:1px solid var(--line);border-radius:9px;padding:16px;margin:12px 0}#historyDashboard .hd-match-grid{display:grid;grid-template-columns:1fr 2fr;gap:20px;margin-top:12px}#historyDashboard .hd-tags{display:flex;gap:6px;flex-wrap:wrap}#historyDashboard .hd-tag{border:1px solid var(--line);border-radius:5px;padding:5px 8px;font-size:12px}#historyDashboard .hd-label{font-size:11px;color:var(--muted);margin:8px 0}#historyDashboard button:focus-visible{outline:2px solid #bf9df0;outline-offset:3px}@media(max-width:800px){#historyDashboard .hd-layout,#historyDashboard .hd-match-grid{grid-template-columns:1fr}#historyDashboard .hd-metrics{grid-template-columns:repeat(2,1fr)}}`;
 document.head.appendChild(style);
}
export function renderHistoryDashboard({ records, date, state, type, forecastDay, loaded }) {
 if (!panel) setup();
 panel.hidden = forecastDay;
 if (forecastDay) return;
 const key = [date, state, type].join('|');
 if (key !== selectionKey) { selectedState = state; selectionKey = key; }
 const model = summarize(records);
 if (!model.states.some(row => row.name === selectedState)) selectedState = model.states[0]?.name || '';
 const floodCount = records.filter(record => record.disaster_type === 'flood').length;
 const metrics = [[records.length,'Rekod sumber luar'],[floodCount,'Rekod banjir'],[model.states.length,'Negeri / WP dengan rekod'],[model.types.length,'Jenis bencana']];
 const table = `<div class="hd-table"><table><thead><tr><th>Negeri / WP</th>${model.types.map(value => `<th>${escape(typeLabel(value))}</th>`).join('')}<th>Jumlah</th></tr></thead><tbody>${model.states.map(row => `<tr><td><button type="button" class="hd-state" data-hd-state="${escape(row.name)}" aria-pressed="${row.name === selectedState}">${escape(row.name)}</button></td>${model.types.map(value => `<td>${row.counts[value] || '—'}</td>`).join('')}<td><b>${row.total}</b></td></tr>`).join('')}</tbody></table></div>`;
 panel.innerHTML = `<h2>Ringkasan sejarah mengikut tarikh</h2><div class="hd-metrics">${metrics.map(([count,label]) => `<div class="hd-metric"><strong>${loaded && records.length ? count : '—'}</strong><span>${label}</span></div>`).join('')}</div><div class="hd-layout"><div class="hd-panel"><h3>Negeri & jenis bencana</h3><p class="hint">Klik negeri untuk melihat padanan PPL/PSM.</p>${records.length ? table : `<p>${loaded ? 'Rekod belum tersedia untuk tarikh dan tapisan ini.' : 'Data sejarah belum dimuatkan.'}</p>`}</div><div class="hd-panel"><h3>Komposisi rekod</h3>${model.types.map(value => { const count = records.filter(record => record.disaster_type === value).length; const percent = count / records.length * 100; return `<div class="hd-chart"><p><span>${escape(typeLabel(value))}</span><span>${count} rekod · ${Math.round(percent)}%</span></p><div class="hd-track"><i style="width:${percent}%"></i></div></div>`; }).join('')}<p class="hint">Kiraan ialah rekod sumber. Beberapa rekod boleh merujuk kepada kejadian yang sama. Liputan sejarah adalah separa.</p></div></div><div class="hd-branches"><h2>PPL / PSM untuk semakan</h2><p class="hint">${escape(selectedState)} · Padanan kawasan untuk kesiapsiagaan. Gangguan semasa perlu disahkan melalui Laporan operasi.</p><div id="hdMatches"></div></div>`;
 const groups = new Map();
 for (const record of records.filter(row => row.state === selectedState)) {
  const groupKey = JSON.stringify([record.district, record.location, record.disaster_type]);
  if (!groups.has(groupKey)) groups.set(groupKey, { record, count: 0, uncertain: false });
  const group = groups.get(groupKey); group.count++; group.uncertain ||= record.review_required === 'yes';
 }
 document.getElementById('hdMatches').innerHTML = [...groups.values()].map(({record,count,uncertain}) => {
  const {branches,candidates} = matchBranches(record);
  return `<article class="hd-match"><p class="hd-label">${escape(typeLabel(record.disaster_type))} · ${count} rekod${uncertain ? ' · ⚑ Sumber belum disahkan' : ''}</p><h3>${escape(record.location || record.district || record.state)}</h3>${record.location && record.district ? `<p class="hint">Daerah ${escape(record.district)}</p>` : ''}<div class="hd-match-grid"><div><p class="hd-label">PPL · PADANAN DAERAH</p>${branches.length ? branches.map(branch => `<b>${escape(branch.n)}</b>`).join('<br>') : '<p class="hint">Padanan daerah belum tersedia.</p>'}</div><div><p class="hd-label">CALON PSM · ${candidates.length} CAWANGAN</p><div class="hd-tags">${candidates.map(office => `<span class="hd-tag">${escape(office.name)}</span>`).join('')}</div><p class="hint">${candidates.length ? 'Poskod bertindih dengan liputan PPL di atas. Liputan boleh merangkumi daerah bersebelahan. Lokasi dalam kawasan kejadian perlu disahkan.' : 'Padanan PSM belum tersedia untuk kawasan ini.'}</p></div></div></article>`;
 }).join('');
 panel.onclick = event => {
  const button = event.target.closest('[data-hd-state]');
  if (!button) return;
  selectedState = button.dataset.hdState;
  renderHistoryDashboard({ records, date, state, type, forecastDay, loaded });
  panel.querySelectorAll('[data-hd-state]').forEach(item => { if (item.dataset.hdState === selectedState) item.focus(); });
 };
}
