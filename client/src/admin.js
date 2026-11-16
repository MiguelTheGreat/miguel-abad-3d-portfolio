const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const logoutBtn = document.getElementById('logoutBtn');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (res.ok) {
      showDashboard();
    }
  } catch { /* not logged in */ }
}

function showDashboard() {
  loginSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');
  loadAdminData();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  const fd = new FormData(loginForm);
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username: fd.get('username'), password: fd.get('password') })
  });
  const data = await res.json();
  if (!res.ok) {
    loginError.textContent = data.error || 'Login failed';
    loginError.classList.remove('hidden');
    return;
  }
  showDashboard();
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  location.reload();
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => {
      b.classList.remove('bg-[#111111]', 'text-white');
      b.classList.add('border', 'border-black/20');
    });
    btn.classList.add('bg-[#111111]', 'text-white');
    btn.classList.remove('border', 'border-black/20');

    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
    document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
  });
});

async function loadAdminData() {
  const [portRes, msgRes, anaRes] = await Promise.all([
    fetch('/api/portfolio'),
    fetch('/api/admin/messages', { credentials: 'include' }),
    fetch('/api/admin/analytics', { credentials: 'include' })
  ]);

  const portfolio = await portRes.json();
  const { messages } = await msgRes.json();
  const analytics = await anaRes.json();

  renderProjects(portfolio.projects || []);
  renderMessages(messages || []);
  renderAnalytics(analytics);
  populateProfileForm(portfolio.profile || {});
}

function renderProjects(projects) {
  const list = document.getElementById('adminProjectList');
  list.innerHTML = projects.map((p) => `
    <div class="p-4 rounded border border-black/20 bg-white flex flex-wrap items-center justify-between gap-4">
      <div>
        <span class="text-[10px] font-mono font-bold uppercase text-[#0047FF]">${p.status} · ${p.category}</span>
        <h4 class="text-sm font-bold">${p.title}</h4>
        <p class="text-xs text-neutral-500">${(p.technologies || []).join(', ')}</p>
      </div>
      <button data-del-proj="${p.id}" class="px-3 py-1.5 rounded border border-[#E63946] text-[#E63946] text-xs font-semibold hover:bg-[#E63946] hover:text-white">Delete</button>
    </div>
  `).join('');

  list.querySelectorAll('[data-del-proj]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await fetch(`/api/admin/projects/${btn.dataset.delProj}`, { method: 'DELETE', credentials: 'include' });
      loadAdminData();
    });
  });
}

document.getElementById('addProjectForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  let mediaUrl = '';

  const fileInput = document.getElementById('projectFileInput');
  if (fileInput.files.length > 0) {
    const upFd = new FormData();
    upFd.append('file', fileInput.files[0]);
    const upRes = await fetch('/api/admin/upload', { method: 'POST', credentials: 'include', body: upFd });
    const upData = await upRes.json();
    if (upRes.ok) mediaUrl = upData.url;
  }

  const payload = {
    title: fd.get('title'),
    category: fd.get('category'),
    status: fd.get('status') || 'Engineering Project',
    overview: fd.get('overview'),
    technologies: String(fd.get('technologies') || '').split(',').map((s) => s.trim()).filter(Boolean),
    bullets: String(fd.get('bullets') || '').split('\n').map((s) => s.trim()).filter(Boolean),
    media_url: mediaUrl
  };

  await fetch('/api/admin/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  form.reset();
  loadAdminData();
});

function renderMessages(messages) {
  const list = document.getElementById('adminMessagesList');
  list.innerHTML = messages.map((m) => `
    <div class="p-4 rounded border border-black/20 bg-white space-y-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span class="text-sm font-bold">${m.sender_name}</span>
          <span class="text-xs text-neutral-500 ml-2">${m.sender_email}${m.company ? ` · ${m.company}` : ''}</span>
        </div>
        <span class="text-[10px] font-mono px-2 py-0.5 rounded ${m.is_public_guestbook ? 'bg-[#0047FF] text-white' : 'bg-neutral-200'}">
          ${m.is_public_guestbook ? 'PUBLIC GUESTBOOK' : 'PRIVATE INQUIRY'}
        </span>
      </div>
      <p class="text-xs text-neutral-700">${m.message}</p>
      <div class="flex items-center gap-2 pt-1">
        <button data-del-msg="${m.id}" class="text-xs text-[#E63946] hover:underline">Delete</button>
      </div>
    </div>
  `).join('') || '<p class="text-xs text-neutral-500">No messages yet.</p>';

  list.querySelectorAll('[data-del-msg]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await fetch(`/api/admin/messages/${btn.dataset.delMsg}`, { method: 'DELETE', credentials: 'include' });
      loadAdminData();
    });
  });
}

function renderAnalytics(analytics) {
  const box = document.getElementById('adminAnalyticsBox');
  const rows = (analytics.byZone || []).map((z) => `
    <tr class="border-b border-black/10">
      <td class="py-2 font-mono font-bold uppercase">${z.zone_visited}</td>
      <td class="py-2">${z.visits}</td>
      <td class="py-2">${z.unique_sessions}</td>
      <td class="py-2">${((z.avg_duration_ms || 0) / 1000).toFixed(1)}s</td>
    </tr>
  `).join('');

  box.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-bold uppercase tracking-wider">3D Zone Exploration Telemetry</h3>
      <span class="text-xs font-mono text-[#0047FF] font-bold">Total Events: ${analytics.totalEvents || 0}</span>
    </div>
    <table class="w-full text-left text-xs">
      <thead>
        <tr class="border-b border-black/20 text-neutral-500 uppercase">
          <th class="py-2">Zone</th>
          <th class="py-2">Visits</th>
          <th class="py-2">Unique Sessions</th>
          <th class="py-2">Avg Duration</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="4" class="py-4 text-neutral-500">No telemetry events recorded yet.</td></tr>'}</tbody>
    </table>
  `;
}

function populateProfileForm(profile) {
  const form = document.getElementById('profileForm');
  form.full_name.value = profile.full_name || '';
  form.email.value = profile.email || '';
  form.phone.value = profile.phone || '';
  form.location.value = profile.location || '';
  form.tagline.value = profile.tagline || '';
  form.summary.value = profile.summary || '';
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = Object.fromEntries(fd.entries());
  const res = await fetch('/api/admin/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    const msg = document.getElementById('profileSavedMsg');
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 2000);
  }
});

document.getElementById('resumeUploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const res = await fetch('/api/admin/upload?type=resume', {
    method: 'POST',
    credentials: 'include',
    body: fd
  });
  if (res.ok) {
    const msg = document.getElementById('resumeUploadMsg');
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 2000);
  }
});

checkAuth();
