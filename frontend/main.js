function ensureSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY ||
      SUPABASE_URL.includes('YOUR-PROJECT-REF') ||
      SUPABASE_ANON_KEY.includes('YOUR-ANON-PUBLIC-KEY')) {
    throw new Error('Please open config.js and set SUPABASE_URL and SUPABASE_ANON_KEY.');
  }
}

async function apiGet(pathWithQuery) {
  ensureSupabaseConfig();
  const url = `${SUPABASE_URL}/rest/v1/${pathWithQuery}`;

  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  return res.json();
}

async function apiPost(path, payload) {
  ensureSupabaseConfig();
  const url = `${SUPABASE_URL}/rest/v1/${path}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  return res.json();
}

async function fetchTable(tableName) {
  return apiGet(`${tableName}?select=*`);
}

function renderTable(data, tableName) {
  const container = document.getElementById('table-container');
  const title = document.getElementById('output-title');

  title.textContent = `Table: ${tableName}`;

  if (!data || data.length === 0) {
    container.innerHTML = '<p>No rows found.</p>';
    return;
  }

  const columns = Object.keys(data[0]);

  let html = '<table><thead><tr>';
  for (const col of columns) {
    html += `<th>${col}</th>`;
  }
  html += '</tr></thead><tbody>';

  for (const row of data) {
    html += '<tr>';
    for (const col of columns) {
      const value = row[col];
      html += `<td>${value === null || value === undefined ? '' : String(value)}</td>`;
    }
    html += '</tr>';
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}

async function handleLoadClick() {
  const select = document.getElementById('table-select');
  const tableName = select.value;

  const container = document.getElementById('table-container');
  container.innerHTML = '<p>Loading...</p>';

  try {
    const data = await fetchTable(tableName);
    renderTable(data, tableName);
  } catch (err) {
    container.innerHTML = `<p style="color:#f87171;">${err.message}</p>`;
  }
}

// DASHBOARD
async function loadDashboard() {
  const totalBinsEl = document.getElementById('metric-total-bins');
  const activeBinsEl = document.getElementById('metric-active-bins');
  const openComplaintsEl = document.getElementById('metric-open-complaints');
  const openTicketsEl = document.getElementById('metric-open-tickets');

  const pickupsContainer = document.getElementById('dashboard-pickups');
  const complaintsContainer = document.getElementById('dashboard-complaints');

  try {
    const [bins, complaints, tickets, pickupsAll, routes] = await Promise.all([
      fetchTable('bins'),
      apiGet('complaints?select=*'),
      apiGet('maint_tickets?select=*'),
      apiGet('route_pickups?select=*&order=scheduled_time.desc'),
      fetchTable('routes')
    ]);

    totalBinsEl.textContent = bins.length;
    activeBinsEl.textContent = bins.filter(b => b.status === 'ACTIVE').length;
    openComplaintsEl.textContent = complaints.filter(c => c.status === 'OPEN').length;
    openTicketsEl.textContent = tickets.filter(t => t.status === 'OPEN').length;

    const pickups = pickupsAll.slice(0, 5);

    // Recent pickups
    if (!pickups.length) {
      pickupsContainer.innerHTML = '<p class="muted">No pickups yet.</p>';
    } else {
      let html = '<table class="small-table"><thead><tr>' +
        '<th>Pickup ID</th><th>Bin</th><th>Truck</th><th>Status</th><th>Scheduled</th><th>Actual</th>' +
        '</tr></thead><tbody>';
      for (const p of pickups) {
        html += `<tr>
          <td>${p.pickup_id}</td>
          <td>${p.bin_id}</td>
          <td>${p.truck_id ?? ''}</td>
          <td>${p.status}</td>
          <td>${p.scheduled_time ?? ''}</td>
          <td>${p.actual_time ?? ''}</td>
        </tr>`;
      }
      html += '</tbody></table>';
      pickupsContainer.innerHTML = html;
    }

    // Recent complaints
    if (!complaints.length) {
      complaintsContainer.innerHTML = '<p class="muted">No complaints yet.</p>';
    } else {
      const sorted = [...complaints].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
      let html = '<ul class="list">';
      for (const c of sorted) {
        html += `<li class="list-item">
          <strong>#${c.complaint_id}</strong> - ${c.type}
          <small>Bin ${c.bin_id} · Status: <span class="pill pill-status-${String(c.status).toLowerCase()}">${c.status}</span></small>
        </li>`;
      }
      html += '</ul>';
      complaintsContainer.innerHTML = html;
    }

    updateRouteChart(pickupsAll, routes);
  } catch (err) {
    totalBinsEl.textContent = '-';
    activeBinsEl.textContent = '-';
    openComplaintsEl.textContent = '-';
    openTicketsEl.textContent = '-';
    pickupsContainer.innerHTML = `<p style="color:#f87171;">${err.message}</p>`;
    complaintsContainer.innerHTML = `<p style="color:#f87171;">${err.message}</p>`;
  }
}

// BINS VIEW
let binsCache = [];
let zonesCache = [];
let selectedBinId = null;
let routeChart = null;

function updateRouteChart(pickups, routes = []) {
  if (typeof Chart === 'undefined') return;
  const canvas = document.getElementById('route-chart');
  if (!canvas) return;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const filtered = pickups.filter(p => {
    if (!p.scheduled_time) return true;
    const dt = new Date(p.scheduled_time);
    return dt >= cutoff;
  });

  const counts = {};
  for (const p of filtered) {
    const key = p.route_id || 'Unknown';
    counts[key] = (counts[key] || 0) + 1;
  }

  const labels = Object.keys(counts).map(key => {
    const rid = Number(key);
    const route = routes.find(r => r.route_id === rid);
    return route?.route_name || `Route ${key}`;
  });
  const data = Object.values(counts);
  if (!labels.length) {
    labels.push('No data');
    data.push(0);
  }

  if (routeChart) routeChart.destroy();
  routeChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Pickups (last 7 days)',
        data,
        tension: 0.35,
        fill: true,
        borderColor: '#60a5fa',
        backgroundColor: ctx => {
          const { chart } = ctx;
          const { ctx: c } = chart;
          const gradient = c.createLinearGradient(0, 0, 0, chart.height);
          gradient.addColorStop(0, 'rgba(96,165,250,0.45)');
          gradient.addColorStop(1, 'rgba(96,165,250,0.05)');
          return gradient;
        },
        pointBackgroundColor: '#93c5fd',
        pointBorderColor: '#1d4ed8',
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          borderColor: '#1e3a8a',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} pickups`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#e5e7eb' }
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 0, color: '#e5e7eb' },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      }
    }
  });
}

function renderBinsList(bins) {
  const container = document.getElementById('bins-list');
  if (!bins.length) {
    container.innerHTML = '<p class="muted">No bins found.</p>';
    return;
  }

  let html = '<div class="list">';
  for (const b of bins) {
    const zone = zonesCache.find(z => z.zone_id === b.zone_id);
    html += `<div class="list-item" data-bin-id="${b.bin_id}">
      <strong>Bin #${b.bin_id}</strong> · <span class="pill">${b.bin_type}</span>
      <small>Zone: ${zone ? zone.name : b.zone_id} · Status: ${b.status}</small>
    </div>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

function applyBinsFilters() {
  const zoneFilter = document.getElementById('bins-zone-filter').value;
  const typeFilter = document.getElementById('bins-type-filter').value;

  let filtered = [...binsCache];
  if (zoneFilter !== 'all') {
    const zId = Number(zoneFilter);
    filtered = filtered.filter(b => b.zone_id === zId);
  }
  if (typeFilter !== 'all') {
    filtered = filtered.filter(b => b.bin_type === typeFilter);
  }
  renderBinsList(filtered);
}

async function loadBinsView() {
  const list = document.getElementById('bins-list');
  const details = document.getElementById('bin-details');
  list.innerHTML = 'Loading bins...';
  details.innerHTML = '<p>Select a bin to view relationships.</p>';

  try {
    [binsCache, zonesCache] = await Promise.all([
      fetchTable('bins'),
      fetchTable('zones')
    ]);

    const zoneFilter = document.getElementById('bins-zone-filter');
    zoneFilter.innerHTML = '<option value="all">All zones</option>' +
      zonesCache.map(z => `<option value="${z.zone_id}">${z.name}</option>`).join('');

    applyBinsFilters();
    populateBinSelects();
  } catch (err) {
    list.innerHTML = `<p style="color:#f87171;">${err.message}</p>`;
  }
}

function populateBinSelects() {
  const options = binsCache.map(b => `<option value="${b.bin_id}">Bin #${b.bin_id} (${b.bin_type})</option>`).join('');
  const complaintBin = document.getElementById('complaint-bin');
  const ticketBin = document.getElementById('ticket-bin');
  if (complaintBin) {
    complaintBin.innerHTML = options || '<option value="">No bins</option>';
    if (selectedBinId) complaintBin.value = selectedBinId;
  }
  if (ticketBin) {
    ticketBin.innerHTML = options || '<option value="">No bins</option>';
    if (selectedBinId) ticketBin.value = selectedBinId;
  }
}

async function loadBinDetails(binId) {
  const bin = binsCache.find(b => b.bin_id === binId);
  const container = document.getElementById('bin-details');
  if (!bin) {
    container.innerHTML = '<p class="muted">Bin not found.</p>';
    return;
  }

  selectedBinId = binId;
  const complaintBin = document.getElementById('complaint-bin');
  const ticketBin = document.getElementById('ticket-bin');
  if (complaintBin) complaintBin.value = binId;
  if (ticketBin) ticketBin.value = binId;

  container.innerHTML = 'Loading relationships...';

  try {
    const [devices, complaints, tickets, pickups] = await Promise.all([
      apiGet(`devices?select=*&bin_id=eq.${binId}`),
      apiGet(`complaints?select=*&bin_id=eq.${binId}&order=created_at.desc&limit=5`),
      apiGet(`maint_tickets?select=*&bin_id=eq.${binId}&order=created_at.desc&limit=5`),
      apiGet(`route_pickups?select=*&bin_id=eq.${binId}&order=scheduled_time.desc&limit=5`)
    ]);

    const zone = zonesCache.find(z => z.zone_id === bin.zone_id);

    let html = `<div>
      <p><strong>Bin #${bin.bin_id}</strong> (${bin.bin_type})</p>
      <p class="muted">Zone: ${zone ? zone.name : bin.zone_id} · Status: ${bin.status}</p>
      <p class="muted">Location: ${bin.latitude}, ${bin.longitude}</p>
    </div>`;

    html += '<div class="two-col-detail">';

    // left column: devices + complaints
    html += '<div class="detail-block">';
    html += '<h4>IoT Devices</h4>';
    if (!devices.length) {
      html += '<p class="muted">No devices linked.</p>';
    } else {
      html += '<ul>';
      for (const d of devices) {
        html += `<li>Device #${d.device_id} · ${d.device_serial} (${d.status})</li>`;
      }
      html += '</ul>';
    }

    html += '<h4>Recent Complaints</h4>';
    if (!complaints.length) {
      html += '<p class="muted">No complaints.</p>';
    } else {
      html += '<ul>';
      for (const c of complaints) {
        html += `<li>#${c.complaint_id} - ${c.type} <span class="pill pill-status-${String(c.status).toLowerCase()}">${c.status}</span></li>`;
      }
      html += '</ul>';
    }
    html += '</div>';

    // right column: tickets + pickups
    html += '<div class="detail-block">';
    html += '<h4>Maintenance Tickets</h4>';
    if (!tickets.length) {
      html += '<p class="muted">No tickets.</p>';
    } else {
      html += '<ul>';
      for (const t of tickets) {
        html += `<li>#${t.ticket_id} - ${t.issue_desc.substring(0, 40)}... <span class="pill pill-status-${String(t.status).toLowerCase()}">${t.status}</span></li>`;
      }
      html += '</ul>';
    }

    html += '<h4>Recent Pickups</h4>';
    if (!pickups.length) {
      html += '<p class="muted">No pickups.</p>';
    } else {
      html += '<ul>';
      for (const p of pickups) {
        html += `<li>Pickup #${p.pickup_id} · Route ${p.route_id} · Status ${p.status}</li>`;
      }
      html += '</ul>';
    }

    html += '</div>'; // end right col
    html += '</div>'; // end grid

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<p style="color:#f87171;">${err.message}</p>`;
  }
}

// ROUTES VIEW
let routesCache = [];

function renderRoutesList(routes) {
  const container = document.getElementById('routes-list');
  if (!routes.length) {
    container.innerHTML = '<p class="muted">No routes defined.</p>';
    return;
  }
  let html = '<div class="list">';
  for (const r of routes) {
    html += `<div class="list-item" data-route-id="${r.route_id}">
      <strong>${r.route_name || ('Route #' + r.route_id)}</strong>
      <small>Zone ${r.zone_id} · Days: ${r.scheduled_days || '-'} · Avg time: ${r.avg_time_min || '-'} min</small>
    </div>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

async function loadRoutesView() {
  const list = document.getElementById('routes-list');
  const pickupsList = document.getElementById('route-pickups-list');
  list.innerHTML = 'Loading routes...';
  pickupsList.innerHTML = '<p>Select a route to view pickups.</p>';

  try {
    routesCache = await fetchTable('routes');
    renderRoutesList(routesCache);
  } catch (err) {
    list.innerHTML = `<p style="color:#f87171;">${err.message}</p>`;
  }
}

async function selectRouteById(routeId) {
  // Ensure routes are loaded
  if (!routesCache.length) {
    await loadRoutesView();
  }

  const routesList = document.getElementById('routes-list');
  if (!routesList) return;

  const item = routesList.querySelector(`.list-item[data-route-id="${routeId}"]`);
  if (!item) return;

  document.querySelectorAll('#routes-list .list-item').forEach(el => el.classList.remove('active'));
  item.classList.add('active');
  loadRoutePickups(routeId);
}

async function loadRoutePickups(routeId) {
  const container = document.getElementById('route-pickups-list');
  container.innerHTML = 'Loading pickups...';
  try {
    const pickups = await apiGet(`route_pickups?select=*&route_id=eq.${routeId}&order=scheduled_time.desc`);
    if (!pickups.length) {
      container.innerHTML = '<p class="muted">No pickups for this route.</p>';
      return;
    }
    let html = '<table class="small-table"><thead><tr>' +
      '<th>ID</th><th>Bin</th><th>Truck</th><th>Status</th><th>Scheduled</th><th>Actual</th><th>Weight (kg)</th>' +
      '</tr></thead><tbody>';
    for (const p of pickups) {
      html += `<tr>
        <td>${p.pickup_id}</td>
        <td>${p.bin_id}</td>
        <td>${p.truck_id ?? ''}</td>
        <td>${p.status}</td>
        <td>${p.scheduled_time ?? ''}</td>
        <td>${p.actual_time ?? ''}</td>
        <td>${p.weight_kg ?? ''}</td>
      </tr>`;
    }
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<p style="color:#f87171;">${err.message}</p>`;
  }
}

// COMPLAINTS & TICKETS VIEW
async function loadComplaintsView() {
  const complaintsList = document.getElementById('complaints-list');
  const ticketsList = document.getElementById('tickets-list');
  complaintsList.innerHTML = 'Loading complaints...';
  ticketsList.innerHTML = 'Loading tickets...';

  try {
    const [complaints, tickets] = await Promise.all([
      apiGet('complaints?select=*&order=created_at.desc&limit=20'),
      apiGet('maint_tickets?select=*&order=created_at.desc&limit=20')
    ]);

    if (!complaints.length) {
      complaintsList.innerHTML = '<p class="muted">No complaints.</p>';
    } else {
      let html = '<ul class="list">';
      for (const c of complaints) {
        html += `<li class="list-item">
          <strong>#${c.complaint_id}</strong> - ${c.type}
          <small>Bin ${c.bin_id} · Status: <span class="pill pill-status-${String(c.status).toLowerCase()}">${c.status}</span></small>
        </li>`;
      }
      html += '</ul>';
      complaintsList.innerHTML = html;
    }

    if (!tickets.length) {
      ticketsList.innerHTML = '<p class="muted">No tickets.</p>';
    } else {
      let html = '<ul class="list">';
      for (const t of tickets) {
        html += `<li class="list-item">
          <strong>#${t.ticket_id}</strong> - ${t.issue_desc.substring(0, 50)}...
          <small>Bin ${t.bin_id} · Status: <span class="pill pill-status-${String(t.status).toLowerCase()}">${t.status}</span></small>
        </li>`;
      }
      html += '</ul>';
      ticketsList.innerHTML = html;
    }
  } catch (err) {
    complaintsList.innerHTML = `<p style="color:#f87171;">${err.message}</p>`;
    ticketsList.innerHTML = `<p style="color:#f87171;">${err.message}</p>`;
  }
}

async function handleComplaintSubmit(e) {
  e.preventDefault();
  const statusEl = document.getElementById('complaint-status');
  const binId = Number(document.getElementById('complaint-bin').value);
  const type = document.getElementById('complaint-type').value;
  const desc = document.getElementById('complaint-desc').value.trim();
  const userId = Number(document.getElementById('complaint-user').value);

  if (!binId || !userId || !desc) {
    statusEl.textContent = 'Please fill bin, user, and description.';
    statusEl.style.color = '#fbbf24';
    return;
  }

  statusEl.textContent = 'Submitting...';
  statusEl.style.color = '#9ca3af';

  try {
    await apiPost('complaints', {
      bin_id: binId,
      user_id: userId,
      type,
      description: desc,
      status: 'OPEN'
    });

    statusEl.textContent = 'Complaint created.';
    statusEl.style.color = '#22c55e';
    document.getElementById('complaint-desc').value = '';
    await Promise.all([loadComplaintsView(), loadDashboard()]);
    if (selectedBinId) loadBinDetails(selectedBinId);
  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.style.color = '#f87171';
  }
}

async function handleTicketSubmit(e) {
  e.preventDefault();
  const statusEl = document.getElementById('ticket-status-msg');
  const binId = Number(document.getElementById('ticket-bin').value);
  const status = document.getElementById('ticket-status').value;
  const desc = document.getElementById('ticket-desc').value.trim();
  const createdBy = Number(document.getElementById('ticket-created').value);
  const assignedToVal = document.getElementById('ticket-assigned').value.trim();
  const assignedTo = assignedToVal ? Number(assignedToVal) : null;

  if (!binId || !createdBy || !desc) {
    statusEl.textContent = 'Please fill bin, created_by, and description.';
    statusEl.style.color = '#fbbf24';
    return;
  }

  statusEl.textContent = 'Submitting...';
  statusEl.style.color = '#9ca3af';

  try {
    await apiPost('maint_tickets', {
      bin_id: binId,
      status,
      issue_desc: desc,
      created_by: createdBy,
      assigned_to: assignedTo
    });

    statusEl.textContent = 'Ticket created.';
    statusEl.style.color = '#22c55e';
    document.getElementById('ticket-desc').value = '';
    await Promise.all([loadComplaintsView(), loadDashboard()]);
    if (selectedBinId) loadBinDetails(selectedBinId);
  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.style.color = '#f87171';
  }
}

function setupNavigation() {
  const tabs = Array.from(document.querySelectorAll('.nav-tab'));
  const sections = Array.from(document.querySelectorAll('.page-section'));

  function activate(sectionId) {
    tabs.forEach(t => {
      t.classList.toggle('active', t.dataset.section === sectionId);
    });
    sections.forEach(s => {
      s.classList.toggle('active', s.id === sectionId);
    });

    // Lazy-load per section
    if (sectionId === 'dashboard-section') loadDashboard();
    if (sectionId === 'bins-section') loadBinsView();
    if (sectionId === 'routes-section') loadRoutesView();
    if (sectionId === 'complaints-section') loadComplaintsView();
  }

  tabs.forEach(t => {
    t.addEventListener('click', () => activate(t.dataset.section));
  });

  // default
  activate('dashboard-section');
}

function setupEvents() {
  const btn = document.getElementById('load-btn');
  if (btn) {
    btn.addEventListener('click', handleLoadClick);
  }

  const binsZoneFilter = document.getElementById('bins-zone-filter');
  const binsTypeFilter = document.getElementById('bins-type-filter');
  const binsRefresh = document.getElementById('bins-refresh');

  if (binsZoneFilter) binsZoneFilter.addEventListener('change', applyBinsFilters);
  if (binsTypeFilter) binsTypeFilter.addEventListener('change', applyBinsFilters);
  if (binsRefresh) binsRefresh.addEventListener('click', loadBinsView);

  const binsList = document.getElementById('bins-list');
  if (binsList) {
    binsList.addEventListener('click', (e) => {
      const item = e.target.closest('.list-item[data-bin-id]');
      if (!item) return;
      const id = Number(item.dataset.binId);
      document.querySelectorAll('#bins-list .list-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      loadBinDetails(id);
    });
  }

  const routesList = document.getElementById('routes-list');
  if (routesList) {
    routesList.addEventListener('click', (e) => {
      const item = e.target.closest('.list-item[data-route-id]');
      if (!item) return;
      const id = Number(item.dataset.routeId);
      document.querySelectorAll('#routes-list .list-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      loadRoutePickups(id);
    });
  }

  const route1Btn = document.getElementById('route1-btn');
  const route2Btn = document.getElementById('route2-btn');
  if (route1Btn) route1Btn.addEventListener('click', () => selectRouteById(1));
  if (route2Btn) route2Btn.addEventListener('click', () => selectRouteById(2));

  const complaintForm = document.getElementById('complaint-form');
  if (complaintForm) complaintForm.addEventListener('submit', handleComplaintSubmit);

  const ticketForm = document.getElementById('ticket-form');
  if (ticketForm) ticketForm.addEventListener('submit', handleTicketSubmit);
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    ensureSupabaseConfig();
  } catch (err) {
    console.error(err.message);
  }
  setupNavigation();
  setupEvents();
});
