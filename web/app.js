const endpoints = {
  submit: '/.netlify/functions/submit',
  aggregate: '/.netlify/functions/aggregate'
};

function qs(id) { return document.getElementById(id); }

function renderMap(locations) {
  const mapEl = qs('world-map');
  if (!mapEl) return;

  if (!window.L) {
    mapEl.textContent = 'Map unavailable';
    return;
  }

  const existing = mapEl._leaflet_map;
  if (existing) {
    existing.remove();
  }

  const map = L.map(mapEl, {
    worldCopyJump: true,
    minZoom: 2,
    maxZoom: 6,
    scrollWheelZoom: false
  }).setView([20, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);

  mapEl._leaflet_map = map;

  if (!Array.isArray(locations) || locations.length === 0) {
    const info = document.createElement('div');
    info.className = 'hist-empty';
    info.textContent = 'No mapped locations yet';
    info.style.padding = '14px';
    mapEl.appendChild(info);
    return;
  }

  const max = locations.reduce((m, item) => Math.max(m, Number(item.count) || 0), 0) || 1;

  for (const item of locations) {
    const lat = Number(item.latitude);
    const lon = Number(item.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const radius = Math.max(7, Math.min(26, 7 + ((Number(item.count) || 0) / max) * 18));
    const label = item.city && item.country ? `${item.city}, ${item.country}` : (item.country || 'Location');

    const marker = L.circleMarker([lat, lon], {
      radius,
      color: '#0f62fe',
      fillColor: '#6fb1ff',
      fillOpacity: 0.7,
      weight: 1.5
    }).addTo(map);

    marker.bindPopup(`<strong>${label}</strong><br>${item.count} chants`);
  }
}

async function fetchAggregates() {
  const res = await fetch(endpoints.aggregate);
  if (!res.ok) throw new Error('Failed fetching aggregates');
  const data = await res.json();
  if (!data.ok) throw new Error('API error');
  renderAggregates(data);
  renderMap(data.locations || []);
}

function renderAggregates({total, daily}){
  qs('total-count').textContent = total ?? 0;
  const container = qs('daily-histogram');
  container.innerHTML = '';

  if (!Array.isArray(daily) || daily.length === 0) {
    const p = document.createElement('div');
    p.className = 'hist-empty';
    p.textContent = 'No submissions yet';
    container.appendChild(p);
    return;
  }

  // compute max for scaling
  const max = daily.reduce((m, r) => Math.max(m, Number(r.count) || 0), 0) || 1;

  for (const row of daily) {
    const histRow = document.createElement('div');
    histRow.className = 'hist-row';

    const label = document.createElement('div');
    label.className = 'hist-label';
    label.textContent = row.date;

    const barWrap = document.createElement('div');
    barWrap.className = 'hist-bar';

    const inner = document.createElement('div');
    inner.className = 'hist-bar-inner';
    const pct = Math.round(((Number(row.count) || 0) / max) * 100);
    inner.style.width = pct + '%';

    barWrap.appendChild(inner);

    const countEl = document.createElement('div');
    countEl.className = 'hist-count';
    countEl.textContent = row.count;

    histRow.appendChild(label);
    histRow.appendChild(barWrap);
    histRow.appendChild(countEl);
    container.appendChild(histRow);
  }
}

function setDefaultDate(){
  const dateInput = qs('date');
  const today = new Date().toISOString().slice(0,10);
  dateInput.value = today;
  dateInput.max = today;
}

document.addEventListener('DOMContentLoaded', () => {
  // Only show aggregate dashboard by default
  fetchAggregates().catch(err => console.error(err));

  // Modal controls
  const openBtn = qs('open-submit');
  const modal = qs('submit-modal');
  const closeBtn = qs('modal-close');
  const form = qs('submit-form');
  const msg = qs('form-msg');

  function openModal(){
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    setDefaultDate();
    qs('name').focus();
  }
  function closeModal(){
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
    form.reset();
  }

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    const name = qs('name').value.trim();
    const date = qs('date').value;
    const count = qs('count').value;
    if (!date || count === '') { msg.textContent = 'Please provide date and count.'; return; }

    // Prevent future dates client-side
    const todayStr = new Date().toISOString().slice(0,10);
    if (date > todayStr) { msg.textContent = 'Date cannot be in the future.'; return; }

    qs('submit-btn').disabled = true;
    try {
      const res = await fetch(endpoints.submit, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: name || null, date, count: Number(count)})
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(JSON.stringify(data));
      msg.textContent = 'Submitted — updating dashboard.';
      await fetchAggregates();
      closeModal();
    } catch (err) {
      console.error(err);
      msg.textContent = 'Submission failed. See console for details.';
    } finally {
      qs('submit-btn').disabled = false;
    }
  });
});
