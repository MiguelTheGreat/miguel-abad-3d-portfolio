import { escapeHtml, getProjectDiagramSvg } from './ZoneModals.js';

export function renderClassicView(container, portfolio, guestbookNotes, { onSwitchTo3D, onCopy, onOpenContact }) {
  const { profile, education, skills, projects, experiences, references } = portfolio;
  const edu = education[0] || {};
  const artifacts = experiences.flatMap((e) => e.artifacts || []);

  container.innerHTML = `
    <div class="min-h-screen bg-[#FAFAFA] text-[#111111] swiss-grid-bg">
      <!-- Sticky Top Bar -->
      <header class="sticky top-0 z-40 bg-[#FAFAFA]/95 backdrop-blur-md border-b border-black/15 no-print">
        <div class="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded bg-[#111111] text-white flex items-center justify-center font-bold text-sm tracking-tighter">MA</span>
            <div class="hidden sm:block">
              <p class="text-xs font-bold uppercase tracking-widest leading-none">${escapeHtml(profile.full_name)}</p>
              <p class="text-[11px] text-[#595959] mt-0.5">BS Computer Engineering · DLSU</p>
            </div>
          </div>

          <nav class="hidden md:flex items-center gap-6 text-xs font-medium uppercase tracking-wider">
            <a href="#classic-intro" class="hover:text-[#0047FF]">01. Intro</a>
            <a href="#classic-resume" class="hover:text-[#0047FF]">02. Resume</a>
            <a href="#classic-work" class="hover:text-[#0047FF]">03. Academic Work</a>
            <a href="#classic-leadership" class="hover:text-[#0047FF]">04. Leadership</a>
            <a href="#classic-references" class="hover:text-[#0047FF]">05. References</a>
          </nav>

          <div class="flex items-center gap-2">
            <button id="classicContactBtn" class="px-3 py-2 rounded border border-black/20 hover:border-black text-xs font-semibold">Contact</button>
            <button id="switchTo3DBtn" class="px-3.5 py-2 rounded bg-[#E63946] text-white text-xs font-bold uppercase tracking-wider hover:opacity-90">
              ✈ 3D Flight Mode
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-8">
        <!-- 01. INTRO -->
        <section id="classic-intro" class="pt-12 pb-16 border-b border-black/20">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div class="lg:col-span-4 space-y-5">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/20 text-[11px] font-semibold uppercase tracking-widest">
                <span class="w-2 h-2 rounded-full bg-[#0047FF]"></span>
                <span>Career e-Portfolio · 2026</span>
              </div>
              <div class="border-t border-black/15 pt-4 space-y-3 text-sm">
                <div><span class="block text-[11px] uppercase tracking-widest text-[#595959]">Institution</span><span class="font-medium">${escapeHtml(edu.institution)}</span></div>
                <div><span class="block text-[11px] uppercase tracking-widest text-[#595959]">Degree Program</span><span class="font-medium">${escapeHtml(edu.degree)} (${escapeHtml(edu.period)})</span></div>
                <div><span class="block text-[11px] uppercase tracking-widest text-[#595959]">Academic Standing</span><span class="font-medium">${escapeHtml(edu.honors)}</span></div>
                <div><span class="block text-[11px] uppercase tracking-widest text-[#595959]">Location</span><span class="font-medium">${escapeHtml(profile.location)}</span></div>
              </div>
              <div class="p-5 rounded-lg border border-black/20 bg-white space-y-3">
                <p class="text-[11px] font-bold uppercase tracking-widest text-[#595959]">Direct Contact &amp; Public Profile</p>
                <div class="flex items-center justify-between gap-2 text-sm">
                  <a href="mailto:${escapeHtml(profile.email)}" class="font-medium hover:text-[#0047FF] underline underline-offset-4 break-all">${escapeHtml(profile.email)}</a>
                  <button data-classic-copy="${escapeHtml(profile.email)}" data-msg="Email copied" class="px-2 py-1 text-[11px] rounded border border-black/20 hover:bg-black hover:text-white">Copy</button>
                </div>
                <div class="flex items-center justify-between gap-2 text-sm">
                  <span class="font-medium">${escapeHtml(profile.phone)}</span>
                  <button data-classic-copy="${escapeHtml(profile.phone)}" data-msg="Phone copied" class="px-2 py-1 text-[11px] rounded border border-black/20 hover:bg-black hover:text-white">Copy</button>
                </div>
                <a href="${escapeHtml(profile.linkedin_url)}" target="_blank" rel="noopener noreferrer" class="w-full inline-flex items-center justify-between px-3.5 py-2.5 rounded bg-[#0047FF] text-white text-xs font-semibold">
                  <span>linkedin.com/in/miguel-andrei-abad</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

            <div class="lg:col-span-8 space-y-6">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.2em] text-[#0047FF] mb-2">01 / Self-Introduction</p>
                <h1 class="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.03]">${escapeHtml(profile.full_name)}</h1>
                <p class="mt-4 text-xl text-[#595959] leading-snug max-w-3xl">${escapeHtml(profile.tagline)}</p>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-black/15 text-base leading-relaxed text-neutral-700">
                <p>${escapeHtml(profile.summary)}</p>
                <p>${escapeHtml(profile.summary_secondary)}</p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div class="p-4 rounded-lg border border-black/15 bg-white">
                  <span class="text-xs font-mono text-[#0047FF] font-bold">01 // HARDWARE</span>
                  <h2 class="font-bold text-sm mt-1">Embedded &amp; PCB Design</h2>
                  <p class="text-xs text-[#595959] mt-1">4-layer KiCad routing, PIC16F877A, ESP32, and 6-DOF IMU telemetry.</p>
                </div>
                <div class="p-4 rounded-lg border border-black/15 bg-white">
                  <span class="text-xs font-mono text-[#0047FF] font-bold">02 // INTELLIGENCE</span>
                  <h2 class="font-bold text-sm mt-1">Computer Vision &amp; ML</h2>
                  <p class="text-xs text-[#595959] mt-1">PyTorch, CNN-LSTM spatio-temporal models, OpenCV &amp; MediaPipe.</p>
                </div>
                <div class="p-4 rounded-lg border border-black/15 bg-white">
                  <span class="text-xs font-mono text-[#0047FF] font-bold">03 // SOFTWARE</span>
                  <h2 class="font-bold text-sm mt-1">Full-Stack &amp; Mobile</h2>
                  <p class="text-xs text-[#595959] mt-1">Native Android SDK, JavaScript, SQL RDBMS, and REST APIs.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 02. RESUME -->
        <section id="classic-resume" class="py-16 border-b border-black/20">
          <div class="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-[#0047FF] mb-2">02 / Curriculum Vitae</p>
              <h2 class="text-3xl font-bold tracking-tight">Resume &amp; Technical Matrix</h2>
            </div>
            <div class="flex flex-wrap gap-3 no-print">
              <a href="${escapeHtml(profile.resume_pdf_url || '/Miguel_Andrei_Abad_Resume.pdf')}" target="_blank" rel="noopener noreferrer" class="px-4 py-2.5 rounded border border-[#111111] text-xs font-semibold uppercase tracking-wider hover:bg-[#111111] hover:text-white transition-colors">
                Download Resume PDF
              </a>
              <button onclick="window.print()" class="px-4 py-2.5 rounded bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#0047FF] transition-colors">
                Print / Save as PDF
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div class="lg:col-span-5 p-6 rounded-lg border border-black/20 bg-white">
              <span class="text-[11px] font-bold uppercase tracking-widest text-[#595959]">Education</span>
              <h3 class="text-xl font-bold mt-2">${escapeHtml(edu.institution)}</h3>
              <p class="text-sm font-medium text-[#0047FF] mt-0.5">${escapeHtml(edu.degree)}</p>
              <p class="text-xs font-mono text-[#595959] mt-1">${escapeHtml(edu.period)} · Manila, Philippines</p>
              <div class="mt-3 inline-block px-3 py-1 rounded bg-black/5 text-xs font-semibold">Honors: ${escapeHtml(edu.honors)}</div>
              <div class="mt-5 pt-4 border-t border-black/10">
                <p class="text-xs font-bold uppercase tracking-wider text-[#595959] mb-2.5">Relevant Coursework</p>
                <div class="flex flex-wrap gap-1.5">
                  ${(edu.coursework || []).map((c) => `<span class="px-2.5 py-1 rounded border border-black/15 text-xs">${escapeHtml(c)}</span>`).join('')}
                </div>
              </div>
            </div>

            <div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              ${skills.map((sk, i) => `
                <div class="p-5 rounded-lg border border-black/20 bg-white">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-bold uppercase tracking-widest">${escapeHtml(sk.category)}</span>
                    <span class="text-xs font-mono text-[#595959]">0${i + 1}</span>
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    ${(sk.items || []).map((it) => `<span class="px-2.5 py-1 rounded bg-neutral-100 text-xs font-medium">${escapeHtml(it)}</span>`).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </section>

        <!-- 03. ACADEMIC WORK -->
        <section id="classic-work" class="py-16 border-b border-black/20">
          <div class="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-[#0047FF] mb-2">03 / Academic Work Samples</p>
              <h2 class="text-3xl font-bold tracking-tight">Selected Engineering Artifacts</h2>
            </div>
            <div class="flex flex-wrap gap-2 no-print" id="classicFilters">
              <button data-cfilter="all" class="cfilter-btn px-3.5 py-1.5 rounded text-xs font-semibold uppercase tracking-wider bg-[#111111] text-white">All (${projects.length})</button>
              <button data-cfilter="ml" class="cfilter-btn px-3.5 py-1.5 rounded text-xs font-semibold uppercase tracking-wider border border-black/20">AI &amp; Vision</button>
              <button data-cfilter="hardware" class="cfilter-btn px-3.5 py-1.5 rounded text-xs font-semibold uppercase tracking-wider border border-black/20">Hardware &amp; Arch</button>
              <button data-cfilter="software" class="cfilter-btn px-3.5 py-1.5 rounded text-xs font-semibold uppercase tracking-wider border border-black/20">Full-Stack</button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8" id="classicProjectGrid">
            ${projects.map((p) => `
              <article data-tags="${escapeHtml(p.filter_tags)}" class="classic-card rounded-lg border border-black/20 bg-white overflow-hidden flex flex-col justify-between">
                <div>
                  <div class="h-52 bg-neutral-100 border-b border-black/10 p-5 flex items-center justify-center relative">
                    <span class="absolute top-3 left-3 px-2 py-0.5 rounded bg-[#0047FF] text-white text-[10px] font-bold uppercase">${escapeHtml(p.status)}</span>
                    ${getProjectDiagramSvg(p.diagram_type, p.media_url)}
                  </div>
                  <div class="p-6">
                    <p class="text-xs font-mono text-[#595959] uppercase mb-1">${escapeHtml(p.category)}</p>
                    <h3 class="text-xl font-bold">${escapeHtml(p.title)}</h3>
                    <p class="text-sm text-[#595959] mt-2 leading-relaxed">${escapeHtml(p.overview)}</p>
                    <ul class="mt-3 space-y-1.5 text-xs text-neutral-700 list-disc ml-4">
                      ${(p.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
                    </ul>
                  </div>
                </div>
                <div class="px-6 pb-5 flex flex-wrap gap-1.5">
                  ${(p.technologies || []).map((t) => `<span class="px-2 py-0.5 rounded bg-neutral-100 text-[11px] font-mono">${escapeHtml(t)}</span>`).join('')}
                </div>
              </article>
            `).join('')}
          </div>
        </section>

        <!-- 04. LEADERSHIP -->
        <section id="classic-leadership" class="py-16 border-b border-black/20">
          <div class="mb-10">
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-[#0047FF] mb-2">04 / Leadership &amp; Service</p>
            <h2 class="text-3xl font-bold tracking-tight">Organizational &amp; Academic Leadership</h2>
          </div>

          <div class="rounded-lg border border-black/20 bg-white overflow-hidden">
            <div class="p-6 border-b border-black/15 flex flex-wrap items-center justify-between gap-4 bg-neutral-50">
              <div>
                <span class="text-xs font-mono uppercase tracking-widest text-[#0047FF] font-bold">Student Professional Organization</span>
                <h3 class="text-2xl font-bold mt-1">ACCESS DLSU — Association of Computer Engineering Students</h3>
                <p class="text-sm text-[#595959]">De La Salle University – Manila · Department of Electronics and Computer Engineering</p>
              </div>
              <span class="px-3 py-1 rounded bg-[#111111] text-white text-xs font-semibold">Nov 2025 – Present</span>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-black/15">
              <div class="lg:col-span-6 p-6 space-y-6">
                ${experiences.map((exp, idx) => `
                  <div class="pl-5 border-l-2 ${idx === 0 ? 'border-[#0047FF]' : 'border-black/25'}">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <h4 class="text-lg font-bold">${escapeHtml(exp.role)}</h4>
                      <span class="text-xs font-mono ${idx === 0 ? 'text-[#0047FF] font-semibold' : 'text-[#595959]'}">${escapeHtml(exp.period)}</span>
                    </div>
                    <ul class="mt-2 space-y-2 text-sm text-neutral-700 list-disc ml-4">
                      ${(exp.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
                    </ul>
                  </div>
                `).join('')}
              </div>

              <div class="lg:col-span-6 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                ${artifacts.map((a) => `
                  <div class="p-4 rounded border border-black/15">
                    <span class="text-xs font-mono text-[#0047FF] font-bold">${escapeHtml(a.code)}</span>
                    <h5 class="font-bold text-sm mt-1">${escapeHtml(a.title)}</h5>
                    <p class="text-xs text-[#595959] mt-1 leading-relaxed">${escapeHtml(a.description)}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </section>

        <!-- 05. REFERENCES & GUESTBOOK -->
        <section id="classic-references" class="py-16">
          <div class="mb-10">
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-[#0047FF] mb-2">05 / References &amp; Guestbook</p>
            <h2 class="text-3xl font-bold tracking-tight">Academic &amp; Organizational References</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${references.map((r) => `
              <div class="p-6 rounded-lg border border-black/20 bg-white flex flex-col justify-between">
                <div>
                  <span class="text-[11px] font-mono uppercase tracking-widest text-[#0047FF] font-bold">${escapeHtml(r.title)}</span>
                  <h3 class="text-lg font-bold mt-2">${escapeHtml(r.name)}</h3>
                  <p class="text-xs text-[#595959] mt-0.5">${escapeHtml(r.organization)}</p>
                  <p class="text-sm text-neutral-700 mt-3 leading-relaxed">${escapeHtml(r.relationship)}</p>
                </div>
                <div class="mt-5 pt-3 border-t border-black/10 text-xs font-mono text-[#595959]">${escapeHtml(r.email)}</div>
              </div>
            `).join('')}

            <div class="p-6 rounded-lg border-2 border-[#111111] bg-[#111111] text-white flex flex-col justify-between">
              <div>
                <span class="text-[11px] font-mono uppercase tracking-widest opacity-75">Verification &amp; Contact</span>
                <h3 class="text-lg font-bold mt-2">Direct Recruiter Inquiry</h3>
                <p class="text-sm opacity-85 mt-2">Reach out directly or leave a note on the Live Sky-Guestbook (${(guestbookNotes || []).length} notes).</p>
              </div>
              <div class="mt-5 space-y-2">
                <button id="classicOpenContact2" class="w-full py-2.5 px-4 rounded bg-[#0047FF] text-white text-xs font-bold uppercase tracking-wider">Send Message / Sign Guestbook</button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  `;

  container.querySelector('#switchTo3DBtn').addEventListener('click', onSwitchTo3D);
  container.querySelector('#classicContactBtn').addEventListener('click', onOpenContact);
  container.querySelector('#classicOpenContact2').addEventListener('click', onOpenContact);

  container.querySelectorAll('[data-classic-copy]').forEach((btn) => {
    btn.addEventListener('click', () => onCopy(btn.dataset.classicCopy, btn.dataset.msg));
  });

  const filterBtns = container.querySelectorAll('.cfilter-btn');
  const cards = container.querySelectorAll('.classic-card');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.cfilter;
      filterBtns.forEach((b) => {
        b.classList.remove('bg-[#111111]', 'text-white');
        b.classList.add('border', 'border-black/20');
      });
      btn.classList.add('bg-[#111111]', 'text-white');
      btn.classList.remove('border', 'border-black/20');
      cards.forEach((c) => {
        c.classList.toggle('hidden', f !== 'all' && !c.dataset.tags.includes(f));
      });
    });
  });
}
