export function getProjectDiagramSvg(diagramType, mediaUrl) {
  if (mediaUrl) {
    return `<img src="${mediaUrl}" alt="Project schematic" class="w-full h-full object-contain rounded" />`;
  }
  switch (diagramType) {
    case 'fsl-fusion':
      return `
        <svg class="w-full max-w-md h-36 text-[#111111]" viewBox="0 0 420 130" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="10" y="15" width="95" height="38" rx="4" fill="#FFFFFF"/>
          <text x="57" y="32" text-anchor="middle" font-size="9" font-weight="bold" stroke="none" fill="#111111">ESP32 + 6-DOF IMU</text>
          <text x="57" y="44" text-anchor="middle" font-size="7.5" stroke="none" fill="#737373">Accel / Gyro Stream</text>
          <rect x="10" y="75" width="95" height="38" rx="4" fill="#FFFFFF"/>
          <text x="57" y="92" text-anchor="middle" font-size="9" font-weight="bold" stroke="none" fill="#111111">RGB Camera Feed</text>
          <text x="57" y="104" text-anchor="middle" font-size="7.5" stroke="none" fill="#737373">MediaPipe Keypoints</text>
          <path d="M105 34 H135 V55 H155" stroke="#0047FF" stroke-width="1.75"/>
          <path d="M105 94 H135 V73 H155" stroke="#0047FF" stroke-width="1.75"/>
          <rect x="155" y="38" width="115" height="52" rx="4" stroke="#0047FF" stroke-width="2" fill="#FFFFFF"/>
          <text x="212" y="60" text-anchor="middle" font-size="9.5" font-weight="bold" stroke="none" fill="#0047FF">CNN-LSTM MODEL</text>
          <text x="212" y="74" text-anchor="middle" font-size="7.5" stroke="none" fill="#111111">Spatio-Temporal Fusion</text>
          <path d="M270 64 H300" stroke="#0047FF" stroke-width="1.75"/>
          <polygon points="300,61 306,64 300,67" fill="#0047FF" stroke="none"/>
          <rect x="308" y="38" width="102" height="52" rx="4" fill="#FFFFFF"/>
          <text x="359" y="60" text-anchor="middle" font-size="9" font-weight="bold" stroke="none" fill="#111111">Gloss-to-Text</text>
          <text x="359" y="74" text-anchor="middle" font-size="7.5" stroke="none" fill="#737373">Android Native UI</text>
        </svg>`;
    case 'pcb-4layer':
      return `
        <svg class="w-full max-w-md h-36 text-[#111111]" viewBox="0 0 420 130" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="65" y="10" width="290" height="110" rx="6" stroke-width="2" fill="#FFFFFF"/>
          <circle cx="77" cy="22" r="4" stroke="#0047FF"/>
          <circle cx="343" cy="22" r="4" stroke="#0047FF"/>
          <circle cx="77" cy="108" r="4" stroke="#0047FF"/>
          <circle cx="343" cy="108" r="4" stroke="#0047FF"/>
          <rect x="92" y="26" width="56" height="32" rx="2"/>
          <text x="120" y="41" text-anchor="middle" font-size="8" font-weight="bold" stroke="none" fill="#111111">5V LDO</text>
          <text x="120" y="51" text-anchor="middle" font-size="7" stroke="none" fill="#737373">Power Reg</text>
          <rect x="92" y="72" width="56" height="32" rx="2"/>
          <text x="120" y="87" text-anchor="middle" font-size="8" font-weight="bold" stroke="none" fill="#111111">ICSP 6-PIN</text>
          <text x="120" y="97" text-anchor="middle" font-size="7" stroke="none" fill="#737373">Prog Header</text>
          <rect x="178" y="25" width="76" height="80" rx="3" stroke="#0047FF" stroke-width="2"/>
          <text x="216" y="62" text-anchor="middle" font-size="9" font-weight="bold" stroke="none" fill="#0047FF">PIC16F877A</text>
          <text x="216" y="74" text-anchor="middle" font-size="7" stroke="none" fill="#111111">40-DIP MCU</text>
          <path d="M148 42 H178 M148 88 H178 M254 45 H280 M254 65 H280 M254 85 H280" stroke="#0047FF" stroke-width="1.2"/>
          <rect x="280" y="26" width="54" height="32" rx="2"/>
          <text x="307" y="41" text-anchor="middle" font-size="8" font-weight="bold" stroke="none" fill="#111111">20MHz XTAL</text>
          <text x="307" y="51" text-anchor="middle" font-size="7" stroke="none" fill="#737373">Clock Osc</text>
          <rect x="280" y="72" width="54" height="32" rx="2"/>
          <text x="307" y="87" text-anchor="middle" font-size="8" font-weight="bold" stroke="none" fill="#111111">I/O PORTS</text>
          <text x="307" y="97" text-anchor="middle" font-size="7" stroke="none" fill="#737373">A / B / C / D</text>
        </svg>`;
    case 'pdf-catalog':
      return `
        <svg class="w-full max-w-md h-36 text-[#111111]" viewBox="0 0 420 130" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="18" y="16" width="160" height="98" rx="4" fill="#FFFFFF"/>
          <line x1="18" y1="32" x2="178" y2="32"/>
          <circle cx="28" cy="24" r="2.5" fill="#0047FF" stroke="none"/>
          <circle cx="36" cy="24" r="2.5" fill="#111111" stroke="none"/>
          <rect x="28" y="42" width="42" height="62" rx="2" stroke-dasharray="2 2"/>
          <rect x="78" y="42" width="90" height="62" rx="2" stroke="#0047FF"/>
          <text x="123" y="71" text-anchor="middle" font-size="8.5" font-weight="bold" stroke="none" fill="#0047FF">PDF Viewport</text>
          <text x="123" y="83" text-anchor="middle" font-size="7" stroke="none" fill="#737373">Zoom / Chapters</text>
          <path d="M178 46 H245" stroke="#0047FF" stroke-width="1.5"/>
          <path d="M178 88 H245" stroke="#111111" stroke-width="1.5"/>
          <rect x="245" y="22" width="155" height="40" rx="4" stroke="#0047FF" fill="#FFFFFF"/>
          <text x="322" y="40" text-anchor="middle" font-size="8.5" font-weight="bold" stroke="none" fill="#0047FF">Async REST APIs</text>
          <text x="322" y="52" text-anchor="middle" font-size="7" stroke="none" fill="#111111">MangaDex &amp; Google Books</text>
          <rect x="245" y="70" width="155" height="40" rx="4" fill="#FFFFFF"/>
          <text x="322" y="88" text-anchor="middle" font-size="8.5" font-weight="bold" stroke="none" fill="#111111">Relational SQL RDBMS</text>
          <text x="322" y="100" text-anchor="middle" font-size="7" stroke="none" fill="#737373">History / Uploads CRUD</text>
        </svg>`;
    case 'sap1-bus':
    default:
      return `
        <svg class="w-full max-w-md h-36 text-[#111111]" viewBox="0 0 420 130" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="210" y1="12" x2="210" y2="118" stroke="#0047FF" stroke-width="3.5"/>
          <text x="210" y="9" text-anchor="middle" font-size="7.5" font-weight="bold" stroke="none" fill="#0047FF">8-BIT W-BUS</text>
          <rect x="45" y="18" width="110" height="24" rx="2" fill="#FFFFFF"/>
          <text x="100" y="33" text-anchor="middle" font-size="8" font-weight="bold" stroke="none" fill="#111111">Program Counter (PC)</text>
          <path d="M155 30 H208" stroke="currentColor"/>
          <rect x="45" y="52" width="110" height="24" rx="2" fill="#FFFFFF"/>
          <text x="100" y="67" text-anchor="middle" font-size="8" font-weight="bold" stroke="none" fill="#111111">MAR &amp; 16x8 RAM</text>
          <path d="M155 64 H208" stroke="currentColor"/>
          <rect x="45" y="86" width="110" height="24" rx="2" fill="#FFFFFF"/>
          <text x="100" y="101" text-anchor="middle" font-size="8" font-weight="bold" stroke="none" fill="#111111">Instruction Reg (IR)</text>
          <path d="M155 98 H208" stroke="currentColor"/>
          <rect x="265" y="18" width="110" height="24" rx="2" fill="#FFFFFF"/>
          <text x="320" y="33" text-anchor="middle" font-size="8" font-weight="bold" stroke="none" fill="#111111">Accumulator (Reg A)</text>
          <path d="M212 30 H265" stroke="currentColor"/>
          <rect x="265" y="52" width="110" height="24" rx="2" stroke="#0047FF" fill="#FFFFFF"/>
          <text x="320" y="67" text-anchor="middle" font-size="8" font-weight="bold" stroke="none" fill="#0047FF">Adder / Subtractor ALU</text>
          <path d="M212 64 H265" stroke="#0047FF"/>
          <rect x="265" y="86" width="110" height="24" rx="2" fill="#FFFFFF"/>
          <text x="320" y="101" text-anchor="middle" font-size="8" font-weight="bold" stroke="none" fill="#111111">Controller Sequencer</text>
          <path d="M212 98 H265" stroke="currentColor"/>
        </svg>`;
  }
}

export function renderZoneContent(zoneId, portfolio, guestbookNotes) {
  const { profile, education, skills, projects, experiences, references } = portfolio;

  if (zoneId === 'central') {
    const notesHtml = (guestbookNotes || []).map((n) => `
      <div class="p-3 rounded border border-neutral-200 bg-neutral-50">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-neutral-900">${escapeHtml(n.sender_name)}${n.company ? ` · <span class="font-normal text-neutral-500">${escapeHtml(n.company)}</span>` : ''}</span>
          <span class="font-mono text-[10px] text-neutral-400">${escapeHtml((n.created_at || '').slice(0, 10))}</span>
        </div>
        <p class="text-xs text-neutral-700 mt-1.5 leading-relaxed">${escapeHtml(n.message)}</p>
      </div>
    `).join('') || '<p class="text-xs text-neutral-500">No guestbook notes yet. Fly to South Lounge or click Contact to leave one!</p>';

    return `
      <div class="space-y-6">
        <div>
          <span class="text-[11px] font-mono font-bold uppercase tracking-widest text-[#E63946]">01 // Central Plaza</span>
          <h2 class="text-3xl font-bold tracking-tight mt-1">${escapeHtml(profile.full_name)}</h2>
          <p class="text-sm text-neutral-600 mt-1">${escapeHtml(profile.tagline)}</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm leading-relaxed text-neutral-700 border-t border-neutral-200 pt-4">
          <p>${escapeHtml(profile.summary)}</p>
          <p>${escapeHtml(profile.summary_secondary)}</p>
        </div>

        <div class="p-4 rounded border border-neutral-200 bg-neutral-50 space-y-2.5">
          <p class="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Direct Contact &amp; Public Profile</p>
          <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span class="font-mono">${escapeHtml(profile.email)}</span>
            <button data-copy="${escapeHtml(profile.email)}" data-copy-msg="Email copied to clipboard" class="px-2.5 py-1 text-xs font-semibold rounded border border-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors">Copy Email</button>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span class="font-mono">${escapeHtml(profile.phone)}</span>
            <button data-copy="${escapeHtml(profile.phone)}" data-copy-msg="Phone number copied" class="px-2.5 py-1 text-xs font-semibold rounded border border-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors">Copy Phone</button>
          </div>
          <div class="pt-2">
            <a href="${escapeHtml(profile.linkedin_url)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#0047FF] text-white text-xs font-semibold hover:opacity-90">
              <span>Open LinkedIn Profile</span>
              <span>↗</span>
            </a>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2.5">
            <h3 class="text-xs font-bold uppercase tracking-widest text-neutral-500">Live Sky-Guestbook</h3>
            <button data-open-zone="south" class="text-xs font-semibold text-[#0047FF] hover:underline">+ Leave a Note</button>
          </div>
          <div class="space-y-2 max-h-56 overflow-y-auto pr-1">${notesHtml}</div>
        </div>
      </div>
    `;
  }

  if (zoneId === 'north') {
    const edu = education[0] || {};
    const coursework = (edu.coursework || []).map((c) => `<span class="px-2.5 py-1 rounded border border-neutral-200 text-xs">${escapeHtml(c)}</span>`).join('');
    const skillsHtml = skills.map((sk) => `
      <div class="p-4 rounded border border-neutral-200 bg-white">
        <p class="text-xs font-bold uppercase tracking-wider mb-2">${escapeHtml(sk.category)}</p>
        <div class="flex flex-wrap gap-1.5">
          ${(sk.items || []).map((it) => `<span class="px-2 py-0.5 rounded bg-neutral-100 text-xs font-medium">${escapeHtml(it)}</span>`).join('')}
        </div>
      </div>
    `).join('');

    return `
      <div class="space-y-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span class="text-[11px] font-mono font-bold uppercase tracking-widest text-[#0047FF]">02 // North Pavilion</span>
            <h2 class="text-2xl font-bold tracking-tight mt-1">Resume &amp; Technical Matrix</h2>
          </div>
          <a href="${escapeHtml(profile.resume_pdf_url || '/Miguel_Andrei_Abad_Resume.pdf')}" target="_blank" rel="noopener noreferrer" class="px-4 py-2 rounded bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#0047FF] transition-colors">
            Download Resume PDF ↓
          </a>
        </div>

        <div class="p-5 rounded border border-neutral-200 bg-neutral-50">
          <p class="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Education</p>
          <h3 class="text-lg font-bold mt-1">${escapeHtml(edu.institution || '')}</h3>
          <p class="text-sm font-medium text-[#0047FF]">${escapeHtml(edu.degree || '')}</p>
          <p class="text-xs font-mono text-neutral-500 mt-0.5">${escapeHtml(edu.period || '')} · ${escapeHtml(edu.honors || '')}</p>
          <div class="mt-3 flex flex-wrap gap-1.5">${coursework}</div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${skillsHtml}</div>
      </div>
    `;
  }

  if (zoneId === 'east') {
    const cardsHtml = projects.map((p, idx) => `
      <div class="rounded border border-neutral-200 bg-white overflow-hidden">
        <div class="h-40 bg-neutral-100 border-b border-neutral-200 p-3 flex items-center justify-center relative">
          <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#0047FF] text-white text-[10px] font-bold uppercase">${escapeHtml(p.status)}</span>
          ${getProjectDiagramSvg(p.diagram_type, p.media_url)}
        </div>
        <div class="p-4 space-y-2.5">
          <p class="text-[11px] font-mono text-neutral-500 uppercase">${escapeHtml(p.category)}</p>
          <h3 class="text-base font-bold">${escapeHtml(p.title)}</h3>
          <p class="text-xs text-neutral-600 leading-relaxed">${escapeHtml(p.overview)}</p>
          <ul class="space-y-1 text-xs text-neutral-700 list-disc ml-4">
            ${(p.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
          </ul>
          <div class="flex flex-wrap gap-1 pt-1">
            ${(p.technologies || []).map((t) => `<span class="px-2 py-0.5 rounded bg-neutral-100 text-[11px] font-mono">${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>
      </div>
    `).join('');

    return `
      <div class="space-y-5">
        <div>
          <span class="text-[11px] font-mono font-bold uppercase tracking-widest text-[#0047FF]">03 // East Hardware &amp; AI Sky-Lab</span>
          <h2 class="text-2xl font-bold tracking-tight mt-1">Academic Work Samples (${projects.length})</h2>
        </div>
        <div class="grid grid-cols-1 gap-4">${cardsHtml}</div>
      </div>
    `;
  }

  if (zoneId === 'west') {
    const rolesHtml = experiences.map((exp, idx) => `
      <div class="pl-4 border-l-2 ${idx === 0 ? 'border-[#0047FF]' : 'border-neutral-300'} space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-base font-bold">${escapeHtml(exp.role)}</h3>
          <span class="text-xs font-mono ${idx === 0 ? 'text-[#0047FF] font-semibold' : 'text-neutral-500'}">${escapeHtml(exp.period)}</span>
        </div>
        <ul class="space-y-1.5 text-xs text-neutral-700 list-disc ml-4">
          ${(exp.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    const artifacts = experiences.flatMap((e) => e.artifacts || []);
    const artifactsHtml = artifacts.map((a) => `
      <div class="p-3.5 rounded border border-neutral-200 bg-neutral-50">
        <span class="text-[10px] font-mono font-bold text-[#0047FF]">${escapeHtml(a.code)}</span>
        <h4 class="text-xs font-bold mt-0.5">${escapeHtml(a.title)}</h4>
        <p class="text-xs text-neutral-600 mt-1 leading-relaxed">${escapeHtml(a.description)}</p>
      </div>
    `).join('');

    return `
      <div class="space-y-6">
        <div>
          <span class="text-[11px] font-mono font-bold uppercase tracking-widest text-[#E63946]">04 // West Student Hub</span>
          <h2 class="text-2xl font-bold tracking-tight mt-1">ACCESS DLSU — Leadership &amp; Service</h2>
          <p class="text-xs text-neutral-500 mt-0.5">Association of Computer Engineering Students · De La Salle University – Manila</p>
        </div>
        <div class="space-y-5">${rolesHtml}</div>
        <div>
          <p class="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2.5">Key Operational Deliverables &amp; Initiatives</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${artifactsHtml}</div>
        </div>
      </div>
    `;
  }

  // South Lounge: References & Contact / Guestbook Form
  const refsHtml = references.map((r) => `
    <div class="p-4 rounded border border-neutral-200 bg-neutral-50">
      <span class="text-[10px] font-mono font-bold uppercase text-[#0047FF]">${escapeHtml(r.title)}</span>
      <h4 class="text-sm font-bold mt-1">${escapeHtml(r.name)}</h4>
      <p class="text-xs text-neutral-500">${escapeHtml(r.organization)}</p>
      <p class="text-xs text-neutral-700 mt-2 leading-relaxed">${escapeHtml(r.relationship)}</p>
      <p class="text-[11px] font-mono text-neutral-400 mt-2">${escapeHtml(r.email)}</p>
    </div>
  `).join('');

  return `
    <div class="space-y-6">
      <div>
        <span class="text-[11px] font-mono font-bold uppercase tracking-widest text-[#E63946]">05 // South Lounge</span>
        <h2 class="text-2xl font-bold tracking-tight mt-1">References &amp; Recruiter Contact</h2>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${refsHtml}</div>

      <form id="contactForm" class="p-5 rounded border border-neutral-300 bg-white space-y-3">
        <p class="text-xs font-bold uppercase tracking-widest text-neutral-800">Send Direct Message / Leave Sky-Guestbook Note</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="sender_name" required placeholder="Your Name *" class="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:outline-none focus:border-[#0047FF]" />
          <input name="sender_email" type="email" required placeholder="Email Address *" class="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:outline-none focus:border-[#0047FF]" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="company" placeholder="Company / Organization" class="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:outline-none focus:border-[#0047FF]" />
          <input name="subject" placeholder="Subject (e.g. Internship / Collaboration)" class="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:outline-none focus:border-[#0047FF]" />
        </div>
        <textarea name="message" required rows="3" placeholder="Write your message or public guestbook note..." class="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:outline-none focus:border-[#0047FF]"></textarea>
        <label class="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
          <input type="checkbox" name="is_public_guestbook" class="rounded border-neutral-300" />
          <span>Post publicly to the Central Plaza Sky-Guestbook Board</span>
        </label>
        <div id="contactFeedback" class="text-xs hidden"></div>
        <button type="submit" class="w-full py-2.5 px-4 rounded bg-[#111111] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0047FF] transition-colors">
          Send Message
        </button>
      </form>
    </div>
  `;
}

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
