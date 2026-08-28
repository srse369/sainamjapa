const endpoints = {
  submit: '/.netlify/functions/submit',
  aggregate: '/.netlify/functions/aggregate',
  registerName: '/.netlify/functions/register_name',
  fetchNames: '/.netlify/functions/fetch_names'
};

function qs(id) { return document.getElementById(id); }

let allNames = [];

// Fetch names on page load
async function loadNames() {
  try {
    const res = await fetch(endpoints.fetchNames);
    const data = await res.json();
    if (data.ok) {
      allNames = data.names || [];
      renderNameDropdown();
    }
  } catch (err) {
    console.error('Failed to load names:', err);
  }
}

function renderNameDropdown() {
  const select = qs('name');
  select.innerHTML = '<option value="">— Anonymous —</option>';
  allNames.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

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
  // Load names and initial aggregates
  loadNames();
  fetchAggregates().catch(err => console.error(err));

  // ===== REGISTER MODAL CONTROLS =====
  const registerModal = qs('register-modal');
  const openRegisterBtn = qs('open-register');
  const registerCloseBtn = qs('register-modal-close');
  const registerForm = qs('register-form');
  const registerMsg = qs('register-msg');

  function openRegisterModal() {
    registerModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    qs('register-name').focus();
  }

  function closeRegisterModal() {
    registerModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    registerForm.reset();
    registerMsg.textContent = '';
    registerMsg.style.color = '';
  }

  openRegisterBtn.addEventListener('click', openRegisterModal);
  registerCloseBtn.addEventListener('click', closeRegisterModal);
  registerModal.addEventListener('click', (e) => {
    if (e.target === registerModal) closeRegisterModal();
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerMsg.textContent = '';
    const name = qs('register-name').value.trim();

    if (!name) {
      registerMsg.textContent = 'Name is required';
      registerMsg.style.color = '#ef4444';
      return;
    }

    qs('register-btn').disabled = true;
    try {
      const res = await fetch(endpoints.registerName, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        registerMsg.textContent = 'Name registered!';
        registerMsg.style.color = '#10b981';
        await loadNames();
        setTimeout(() => {
          closeRegisterModal();
        }, 800);
      } else if (res.status === 409) {
        registerMsg.textContent = 'Name already registered';
        registerMsg.style.color = '#ef4444';
      } else {
        registerMsg.textContent = data.error || 'Registration failed';
        registerMsg.style.color = '#ef4444';
      }
    } catch (err) {
      console.error(err);
      registerMsg.textContent = 'Error: ' + err.message;
      registerMsg.style.color = '#ef4444';
    } finally {
      qs('register-btn').disabled = false;
    }
  });

  // Close register modal with ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && registerModal.getAttribute('aria-hidden') === 'false') {
      closeRegisterModal();
    }
  });

  // ===== SUBMIT MODAL CONTROLS =====
  const openBtn = qs('open-submit');
  const modal = qs('submit-modal');
  const closeBtn = qs('modal-close');
  const form = qs('submit-form');
  const msg = qs('form-msg');

  function openModal(){
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    setDefaultDate();
  }
  function closeModal(){
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
    form.reset();
  }

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });
  document.addEventListener('keydown', (e)=>{ 
    if(e.key==='Escape' && modal.getAttribute('aria-hidden')==='false') closeModal(); 
  });

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
