import { PORTFOLIO_PROJECTS, STATION_DECK_H } from '../config/portfolioData.js';
import { getIslandRadius } from '../world/terrain.js';

export function setupUIAndModals({
  scene, hemiLight, dl, oceanMat, grassMat, sctx, skyTex, streetLampBulbs,
  getZonesState, setZonesState, guestbookNotes, stationClusters, drawMainBoardTex,
  ALL_ROAD_POLYLINES, car, terrain, sound, miguelLetters, camState, onClassicChange
}) {
  let skyMode = 0;
  let isClassic = false;

  function showToast(msg) {
    const t = document.getElementById('toastBanner');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(t._tm);
    t._tm = setTimeout(() => t.classList.add('hidden'), 2200);
  }

  function setSkyMode(mode) {
    skyMode = mode % 3;
    const sgrad = sctx.createLinearGradient(0, 0, 0, 512);
    const btn = document.getElementById('skyModeBtn');
    if (skyMode === 0) {
      sgrad.addColorStop(0, '#0077b6'); sgrad.addColorStop(0.55, '#48cae4'); sgrad.addColorStop(1, '#caf0f8');
      scene.fog.color.setHex(0x90e0ef);
      hemiLight.color.setHex(0xffffff); hemiLight.groundColor.setHex(0x40916c); hemiLight.intensity = 0.95;
      dl.color.setHex(0xfff4d2); dl.intensity = 1.25;
      oceanMat.color.setHex(0x0096c7); grassMat.color.setHex(0xffffff);
      streetLampBulbs.forEach(m => { m.emissiveIntensity = 0.7; });
      if (btn) btn.textContent = '☀ Day';
    } else if (skyMode === 1) {
      sgrad.addColorStop(0, '#240046'); sgrad.addColorStop(0.45, '#c9184a'); sgrad.addColorStop(0.8, '#ff758f'); sgrad.addColorStop(1, '#ffb703');
      scene.fog.color.setHex(0xff8fa3);
      hemiLight.color.setHex(0xffccd5); hemiLight.groundColor.setHex(0x3a5a40); hemiLight.intensity = 0.82;
      dl.color.setHex(0xff9e00); dl.intensity = 1.15;
      oceanMat.color.setHex(0x1d3557); grassMat.color.setHex(0xffd6ba);
      streetLampBulbs.forEach(m => { m.emissiveIntensity = 1.8; });
      if (btn) btn.textContent = '🌅 Sunset';
    } else {
      sgrad.addColorStop(0, '#03045e'); sgrad.addColorStop(0.5, '#0a0928'); sgrad.addColorStop(1, '#10002b');
      scene.fog.color.setHex(0x0a0928);
      hemiLight.color.setHex(0x48cae4); hemiLight.groundColor.setHex(0x1b4332); hemiLight.intensity = 0.52;
      dl.color.setHex(0x90e0ef); dl.intensity = 0.65;
      oceanMat.color.setHex(0x03045e); grassMat.color.setHex(0x557799);
      streetLampBulbs.forEach(m => { m.emissiveIntensity = 2.8; });
      if (btn) btn.textContent = '🌙 Cyber Night';
    }
    sctx.fillStyle = sgrad;
    sctx.fillRect(0, 0, 16, 512);
    skyTex.needsUpdate = true;
  }
  setSkyMode(0);

  document.getElementById('skyModeBtn').addEventListener('click', () => {
    setSkyMode(skyMode + 1);
    const names = ['Sunny Day', 'Golden Sunset', 'Cyber Night'];
    showToast(`Atmosphere: ${names[skyMode]}`);
  });

  document.getElementById('soundToggleBtn').addEventListener('click', (e) => {
    e.target.textContent = sound.toggleMute() ? '🔊 Sound On' : '🔇 Sound Off';
  });

  document.getElementById('guestbookBtn').addEventListener('click', () => {
    document.getElementById('guestbookModal').classList.remove('hidden');
    document.getElementById('guestbookModal').classList.add('flex');
  });

  document.getElementById('closeGbModal').addEventListener('click', () => {
    document.getElementById('guestbookModal').classList.add('hidden');
    document.getElementById('guestbookModal').classList.remove('flex');
  });

  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard?.writeText(btn.dataset.copy);
      showToast('Copied ' + btn.dataset.copy);
    });
  });

  document.getElementById('downloadResumeBtn').addEventListener('click', () => {
    const lines = [
      'MIGUEL ANDREI B. ABAD',
      'BS Computer Engineering | De La Salle University - Manila (2023 - Present)',
      'Email: abadandrei22@gmail.com | Phone: +63 977 652 9418 | Cavite, Philippines',
      'LinkedIn: https://www.linkedin.com/in/miguel-andrei-abad-a8845532a/',
      '--------------------------------------------------------------------------------',
      'EDUCATION & STANDING',
      'De La Salle University - Manila | BS in Computer Engineering (Consistent Dean\'s Lister)',
      'Coursework: Embedded Systems, Microprocessor Systems & Architecture, Digital Logic Design,',
      '            Signal Processing, Operating Systems, Feedback & Control Systems, Machine Learning',
      '',
      'FLAGSHIP ENGINEERING SYSTEMS',
      '1. Real-Time FSL Sign Recognition via Wearable-Vision Fusion (Ongoing Thesis)',
      '   - Native Android app fusing ESP32 6-DOF IMU telemetry & RGB camera via PyTorch CNN-LSTM.',
      '2. PIC16F877A Microcontroller Development Board (Hardware / KiCad)',
      '   - Custom 4-layer PCB breakout with 5V LDO, 20MHz XTAL, ICSP header (DRC verified).',
      '3. Web-Based PDF Reader & Digital Catalog (Full-Stack Web)',
      '   - In-browser PDF reader with MangaDex & Google Books REST APIs and SQL RDBMS.',
      '4. Bit by Bit - Interactive SAP-1 Computer Simulator (Architecture)',
      '   - Cycle-accurate 8-bit W-bus, ALU, and control word bitmask visualizer.',
      '',
      'TECHNICAL MATRIX',
      'Languages: C / C++, Python, Java, Kotlin, JavaScript, SQL, Verilog, MATLAB, HTML5/CSS3',
      'ML & Frameworks: PyTorch, OpenCV, MediaPipe, Keras, Android SDK',
      'Hardware & EDA: KiCad (4-Layer PCB), AutoCAD, PIC16F877A, ESP32, Arduino, 6-DOF IMU',
      '',
      'LEADERSHIP - ACCESS DLSU',
      'Associate Vice President for Academics (Sept 2026 - Present) | Junior Officer (Nov 2025 - Sept 2026)',
      'Spearheaded digital learning repositories, peer tutorials, and college-wide exam reviewers.'
    ];
    const esc = s => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    let stream = 'BT\n/F1 10 Tf\n48 750 Td\n14 TL\n';
    lines.forEach((l, i) => {
      if (i === 0) stream += '/F1 14 Tf (' + esc(l) + ') Tj T* /F1 9.5 Tf ';
      else stream += '(' + esc(l) + ') Tj T* ';
    });
    stream += 'ET';
    const objs = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
      `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
      '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj'
    ];
    let pdf = '%PDF-1.4\n';
    const offs = [0];
    objs.forEach(o => { offs.push(pdf.length); pdf += o + '\n'; });
    const xrefPos = pdf.length;
    pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objs.length; i++) pdf += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
    pdf += `trailer << /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
    const blob = new Blob([pdf], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Miguel_Andrei_Abad_Resume.pdf';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Downloaded Miguel_Andrei_Abad_Resume.pdf');
  });

  document.getElementById('gbForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    guestbookNotes.unshift({ sender_name: fd.get('name'), message: fd.get('msg') });
    localStorage.setItem('miguel_guestbook', JSON.stringify(guestbookNotes));
    const updated = setZonesState(guestbookNotes);
    ['central', 'south'].forEach(id => {
      const st = stationClusters.get(id);
      const zObj = updated.find(z => z.id === id);
      if (st && zObj) {
        st.mainMat.map.dispose();
        st.mainMat.map = drawMainBoardTex(zObj);
        st.mainMat.needsUpdate = true;
      }
    });
    e.target.reset();
    document.getElementById('closeGbModal').click();
    showToast('Note transmitted to Sky-Guestbook!');
  });

  function renderFull2DClassic() {
    const cv = document.getElementById('classicViewContainer');
    const projects = PORTFOLIO_PROJECTS;
    cv.innerHTML = `
      <header class="sticky top-0 z-40 bg-[#FAFAFA]/95 backdrop-blur-md border-b border-black/15 no-print">
        <div class="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded bg-[#111111] text-white flex items-center justify-center font-bold text-sm">MA</span>
            <div class="hidden sm:block">
              <p class="text-xs font-bold uppercase tracking-widest leading-none">Miguel Andrei B. Abad</p>
              <p class="text-[11px] text-[#595959] mt-0.5">BS Computer Engineering · DLSU</p>
            </div>
          </div>
          <nav class="hidden md:flex items-center gap-6 text-xs font-medium uppercase tracking-wider">
            <a href="#c-intro" class="hover:text-[#0047FF]">01. Intro</a>
            <a href="#c-resume" class="hover:text-[#0047FF]">02. Resume</a>
            <a href="#c-work" class="hover:text-[#0047FF]">03. Academic Work</a>
            <a href="#c-lead" class="hover:text-[#0047FF]">04. Leadership</a>
            <a href="#c-ref" class="hover:text-[#0047FF]">05. References</a>
          </nav>
          <div class="flex items-center gap-2">
            <button id="openAtsBtn2D" class="px-3 py-2 rounded border border-black/20 hover:bg-black hover:text-white text-xs font-semibold">ATS Resume</button>
            <button onclick="window.print()" class="px-3 py-2 rounded border border-black/20 hover:bg-black hover:text-white text-xs font-semibold">Print / PDF</button>
            <button id="back3dBtn" class="px-3.5 py-2 rounded bg-[#E63946] text-white text-xs font-bold uppercase tracking-wider">🏎 3D World</button>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-8">
        <section id="c-intro" class="py-12 border-b border-black/20 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div class="lg:col-span-4 space-y-5">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/20 text-[11px] font-semibold uppercase tracking-widest">
              <span class="w-2 h-2 rounded-full bg-[#0047FF]"></span><span>Career e-Portfolio · 2026</span>
            </div>
            <div class="border-t border-black/15 pt-4 space-y-2.5 text-sm">
              <div><span class="block text-[11px] uppercase tracking-widest text-[#595959]">Institution</span><span class="font-medium">De La Salle University – Manila</span></div>
              <div><span class="block text-[11px] uppercase tracking-widest text-[#595959]">Degree</span><span class="font-medium">BS in Computer Engineering (2023 – Present)</span></div>
              <div><span class="block text-[11px] uppercase tracking-widest text-[#595959]">Standing</span><span class="font-medium">Consistent Dean's Lister</span></div>
              <div><span class="block text-[11px] uppercase tracking-widest text-[#595959]">Location</span><span class="font-medium">Cavite, Philippines</span></div>
            </div>
            <div class="p-4 rounded-lg border border-black/20 bg-white space-y-2 text-xs">
              <div class="flex justify-between items-center"><span class="font-mono">abadandrei22@gmail.com</span><button data-c2="abadandrei22@gmail.com" class="px-2 py-0.5 border rounded">Copy</button></div>
              <div class="flex justify-between items-center"><span class="font-mono">+63 977 652 9418</span><button data-c2="+63 977 652 9418" class="px-2 py-0.5 border rounded">Copy</button></div>
              <a href="https://www.linkedin.com/in/miguel-andrei-abad-a8845532a/" target="_blank" class="block text-center py-2 rounded bg-[#0047FF] text-white font-semibold">LinkedIn Profile ↗</a>
            </div>
          </div>
          <div class="lg:col-span-8 space-y-6">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-[#0047FF] mb-2">01 / Self-Introduction</p>
              <h1 class="text-4xl sm:text-6xl font-bold tracking-tight">Miguel Andrei B. Abad</h1>
              <p class="mt-3 text-xl text-[#595959]">Computer Engineering undergraduate specializing in embedded systems, computer vision, and full-stack software engineering.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-black/15 text-sm leading-relaxed text-neutral-700">
              <p>I am an undergraduate Computer Engineering student at <strong>De La Salle University – Manila</strong> focused on bridging low-level hardware systems with intelligent software. My work spans custom PCB design, microcontroller firmware, sensor telemetry fusion, and deep learning pipelines.</p>
              <p>Alongside hardware and ML development, I build responsive, data-driven web and mobile apps backed by relational databases and RESTful architectures. Outside the lab, I serve as <strong>Associate Vice President for Academics at ACCESS DLSU</strong>.</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="p-4 rounded-lg border border-black/15 bg-white"><span class="text-xs font-mono text-[#0047FF] font-bold">01 // HARDWARE</span><h2 class="font-bold text-sm mt-1">Embedded &amp; PCB Design</h2><p class="text-xs text-[#595959] mt-1">4-layer KiCad routing, PIC16F877A, ESP32, 6-DOF IMU.</p></div>
              <div class="p-4 rounded-lg border border-black/15 bg-white"><span class="text-xs font-mono text-[#0047FF] font-bold">02 // INTELLIGENCE</span><h2 class="font-bold text-sm mt-1">Computer Vision &amp; ML</h2><p class="text-xs text-[#595959] mt-1">PyTorch, CNN-LSTM models, OpenCV &amp; MediaPipe.</p></div>
              <div class="p-4 rounded-lg border border-black/15 bg-white"><span class="text-xs font-mono text-[#0047FF] font-bold">03 // SOFTWARE</span><h2 class="font-bold text-sm mt-1">Full-Stack &amp; Mobile</h2><p class="text-xs text-[#595959] mt-1">Android SDK, JavaScript, SQL RDBMS, REST APIs.</p></div>
            </div>
          </div>
        </section>

        <section id="c-resume" class="py-12 border-b border-black/20">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-[#0047FF] mb-2">02 / Curriculum Vitae</p>
          <h2 class="text-3xl font-bold tracking-tight mb-8">Resume &amp; Technical Matrix</h2>
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div class="lg:col-span-5 p-6 rounded-lg border border-black/20 bg-white">
              <h3 class="text-xl font-bold">De La Salle University – Manila</h3>
              <p class="text-sm font-medium text-[#0047FF]">Bachelor of Science in Computer Engineering</p>
              <p class="text-xs font-mono text-[#595959] mt-1">2023 – Present · Consistent Dean's Lister</p>
              <div class="mt-4 pt-4 border-t border-black/10 flex flex-wrap gap-1.5">
                ${['Embedded Systems','Microprocessor Systems & Architecture','Digital Logic Design','Signal Processing','Operating Systems','Feedback and Control Systems','Machine Learning'].map(c => `<span class="px-2.5 py-1 rounded border border-black/15 text-xs">${c}</span>`).join('')}
              </div>
            </div>
            <div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="p-5 rounded-lg border border-black/20 bg-white"><p class="text-xs font-bold uppercase mb-2">01 · Programming Languages</p><div class="flex flex-wrap gap-1.5">${['C / C++','Python','Java','Kotlin','JavaScript','SQL','Verilog','MATLAB','HTML5 / CSS3'].map(s=>`<span class="px-2 py-0.5 rounded bg-neutral-100 text-xs">${s}</span>`).join('')}</div></div>
              <div class="p-5 rounded-lg border border-black/20 bg-white"><p class="text-xs font-bold uppercase mb-2">02 · Frameworks &amp; Libraries</p><div class="flex flex-wrap gap-1.5">${['PyTorch','OpenCV','MediaPipe','Keras','Android SDK'].map(s=>`<span class="px-2 py-0.5 rounded bg-neutral-100 text-xs">${s}</span>`).join('')}</div></div>
              <div class="p-5 rounded-lg border border-black/20 bg-white"><p class="text-xs font-bold uppercase mb-2">03 · Hardware &amp; EDA</p><div class="flex flex-wrap gap-1.5">${['KiCad','AutoCAD','PIC Microcontrollers','ESP32','Arduino','6-DOF IMU'].map(s=>`<span class="px-2 py-0.5 rounded bg-neutral-100 text-xs">${s}</span>`).join('')}</div></div>
              <div class="p-5 rounded-lg border border-black/20 bg-white"><p class="text-xs font-bold uppercase mb-2">04 · Tools &amp; Platforms</p><div class="flex flex-wrap gap-1.5">${['Git & GitHub','Android Studio','VS Code','RESTful APIs','RDBMS / SQL'].map(s=>`<span class="px-2 py-0.5 rounded bg-neutral-100 text-xs">${s}</span>`).join('')}</div></div>
            </div>
          </div>
        </section>

        <section id="c-work" class="py-12 border-b border-black/20">
          <div class="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div><p class="text-xs font-bold uppercase tracking-[0.2em] text-[#0047FF] mb-2">03 / Academic Work Samples</p><h2 class="text-3xl font-bold tracking-tight">Selected Engineering Artifacts</h2></div>
            <div class="flex flex-wrap gap-2 no-print">
              <button data-cf="all" class="cf-btn px-3 py-1.5 rounded text-xs font-semibold uppercase bg-[#111111] text-white">All (4)</button>
              <button data-cf="ml" class="cf-btn px-3 py-1.5 rounded text-xs font-semibold uppercase border border-black/20">AI &amp; Vision</button>
              <button data-cf="hardware" class="cf-btn px-3 py-1.5 rounded text-xs font-semibold uppercase border border-black/20">Hardware &amp; Arch</button>
              <button data-cf="software" class="cf-btn px-3 py-1.5 rounded text-xs font-semibold uppercase border border-black/20">Full-Stack</button>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${projects.map(p => `
              <article data-tags="${p.filter}" data-pid="${p.id}" class="c-card cursor-pointer rounded-lg border border-black/20 bg-white overflow-hidden flex flex-col justify-between hover:border-[#0047FF] transition-all">
                <div>
                  <div class="h-44 bg-neutral-100 border-b border-black/10 p-4 flex items-center justify-center relative">
                    <span class="absolute top-3 left-3 px-2 py-0.5 rounded bg-[#0047FF] text-white text-[10px] font-bold uppercase">${p.status}</span>
                    ${p.svg}
                  </div>
                  <div class="p-6">
                    <p class="text-xs font-mono text-[#595959] mb-1">${p.cat}</p>
                    <h3 class="text-lg font-bold">${p.title}</h3>
                    <p class="text-xs text-[#595959] mt-2 leading-relaxed">${p.desc}</p>
                  </div>
                </div>
                <div class="px-6 pb-5 pt-3 border-t border-black/10 flex items-center justify-between gap-2">
                  <div class="flex flex-wrap gap-1.5">${p.tags.map(t=>`<span class="px-2 py-0.5 rounded bg-neutral-100 text-[11px] font-mono">${t}</span>`).join('')}</div>
                  <span class="text-xs font-bold text-[#0047FF] shrink-0">Case Study →</span>
                </div>
              </article>
            `).join('')}
          </div>
        </section>

        <section id="c-lead" class="py-12 border-b border-black/20">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-[#0047FF] mb-2">04 / Leadership &amp; Service</p>
          <h2 class="text-3xl font-bold tracking-tight mb-6">ACCESS DLSU — Association of Computer Engineering Students</h2>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 rounded-lg border border-black/20 bg-white p-6">
            <div class="space-y-5">
              <div class="pl-4 border-l-2 border-[#0047FF]"><h3 class="font-bold">Associate Vice President for Academics <span class="text-xs font-mono text-[#0047FF]">(Sept 2026 – Present)</span></h3><p class="text-xs text-neutral-700 mt-1">Spearhead college-wide academic assistance programs, peer-led technical tutorials, student performance research, and centralized digital learning repositories.</p></div>
              <div class="pl-4 border-l-2 border-black/30"><h3 class="font-bold">Junior Officer for Academics <span class="text-xs font-mono text-[#595959]">(Nov 2025 – Sept 2026)</span></h3><p class="text-xs text-neutral-700 mt-1">Authored technical reviewers, formula sheets, and study guides for Digital Logic, Circuits, and Programming; facilitated pre-exam peer clinics.</p></div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div class="p-3 rounded border border-black/15"><strong class="text-[#0047FF]">01 · Learning Repository</strong><p class="text-[#595959] mt-1">Structured archive indexing notes &amp; lab primers.</p></div>
              <div class="p-3 rounded border border-black/15"><strong class="text-[#0047FF]">02 · Peer Tutorials</strong><p class="text-[#595959] mt-1">Review clinics for microprocessors &amp; C/Python.</p></div>
              <div class="p-3 rounded border border-black/15"><strong class="text-[#0047FF]">03 · Academic Research</strong><p class="text-[#595959] mt-1">Student feedback metrics &amp; bottleneck analysis.</p></div>
              <div class="p-3 rounded border border-black/15"><strong class="text-[#0047FF]">04 · Reviewer Publications</strong><p class="text-[#595959] mt-1">High-yield exam reviewers across CpE.</p></div>
            </div>
          </div>
        </section>

        <section id="c-ref" class="py-12">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-[#0047FF] mb-2">05 / References</p>
          <h2 class="text-3xl font-bold tracking-tight mb-6">Academic &amp; Organizational References</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="p-6 rounded-lg border border-black/20 bg-white"><span class="text-[11px] font-mono text-[#0047FF] font-bold uppercase">Faculty / Thesis Reference</span><h3 class="font-bold mt-1">Department of Electronics &amp; Computer Engineering</h3><p class="text-xs text-neutral-600 mt-2">De La Salle University – Manila · Faculty Adviser for Embedded Systems &amp; Wearable-Vision Sign Recognition Research.</p></div>
            <div class="p-6 rounded-lg border border-black/20 bg-white"><span class="text-[11px] font-mono text-[#0047FF] font-bold uppercase">Organizational Reference</span><h3 class="font-bold mt-1">ACCESS DLSU Executive Board &amp; Faculty Adviser</h3><p class="text-xs text-neutral-600 mt-2">Association of Computer Engineering Students · Attests to leadership as AVP for Academics and curriculum support initiatives.</p></div>
          </div>
        </section>
      </main>

      <div id="cCaseModal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div class="bg-white border border-black rounded-lg max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-start gap-4 border-b border-black/15 pb-4">
            <div><span id="ccmCat" class="text-xs font-mono uppercase tracking-widest text-[#0047FF] font-semibold"></span><h3 id="ccmTitle" class="text-2xl font-bold mt-1"></h3></div>
            <button id="ccmClose" class="px-2.5 py-1 rounded border border-black/20 text-xs font-bold uppercase">ESC ✕</button>
          </div>
          <div class="space-y-3 text-sm leading-relaxed text-neutral-700">
            <div><p class="text-xs font-bold uppercase tracking-wider text-black mb-1">01 · Problem Context</p><p id="ccmProb"></p></div>
            <div><p class="text-xs font-bold uppercase tracking-wider text-black mb-1">02 · System Architecture</p><p id="ccmArch"></p></div>
            <div><p class="text-xs font-bold uppercase tracking-wider text-black mb-1">03 · Engineering Implementation</p><p id="ccmImpl"></p></div>
            <div class="p-3.5 rounded bg-neutral-100 border border-black/10"><p class="text-xs font-bold uppercase tracking-wider text-[#0047FF] mb-1">04 · Verification &amp; Outcome</p><p id="ccmOut" class="text-xs text-neutral-800"></p></div>
          </div>
        </div>
      </div>

      <div id="cAtsModal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div class="bg-white border border-black rounded-lg max-w-3xl w-full p-6 sm:p-10 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center border-b border-black/15 pb-4">
            <span class="text-xs font-mono uppercase tracking-widest text-[#0047FF] font-semibold">Single-Column ATS Resume View</span>
            <button id="catsClose" class="px-2.5 py-1 rounded border border-black/20 text-xs font-bold uppercase">Close ✕</button>
          </div>
          <div class="font-sans text-xs leading-relaxed space-y-4 text-black">
            <div class="border-b border-black pb-3">
              <h2 class="text-xl font-bold uppercase tracking-wide">Miguel Andrei B. Abad</h2>
              <p class="text-neutral-700">Cavite, Philippines · +63 977 652 9418 · abadandrei22@gmail.com · linkedin.com/in/miguel-andrei-abad-a8845532a</p>
            </div>
            <div><h3 class="font-bold uppercase tracking-wider border-b border-black/20 pb-1 mb-1.5">Education</h3><p><strong>De La Salle University – Manila</strong> | BS in Computer Engineering (2023 – Present) · Consistent Dean's Lister</p></div>
            <div><h3 class="font-bold uppercase tracking-wider border-b border-black/20 pb-1 mb-1.5">Technical Skills</h3><p><strong>Languages:</strong> C, C++, Python, Java, Kotlin, JavaScript, SQL, Verilog, MATLAB, HTML5/CSS3</p><p><strong>Frameworks &amp; ML:</strong> PyTorch, OpenCV, MediaPipe, Keras, Android SDK</p><p><strong>Hardware &amp; EDA:</strong> KiCad (4-Layer PCB), AutoCAD, PIC16F877A, ESP32, Arduino, 6-DOF IMU</p></div>
            <div>
              <h3 class="font-bold uppercase tracking-wider border-b border-black/20 pb-1 mb-1.5">Selected Engineering Projects</h3>
              <p class="mb-1"><strong>Real-Time FSL Sign Recognition via Wearable-Vision Fusion</strong> — Built an Android app fusing ESP32 6-DOF IMU telemetry and RGB camera feeds into a hybrid CNN-LSTM PyTorch model for Filipino Sign Language translation.</p>
              <p class="mb-1"><strong>Web-Based PDF Reader &amp; Catalog</strong> — Engineered an in-browser PDF reader with MangaDex &amp; Google Books REST API integration and SQL relational persistence.</p>
              <p class="mb-1"><strong>PIC16F877A Microcontroller Development Board</strong> — Designed a 4-layer PCB in KiCad with 5V regulation, 20MHz crystal oscillator, and ICSP header; passed full DRC.</p>
              <p><strong>Bit by Bit (SAP-1 Simulator)</strong> — Created an interactive SAP-1 computer architecture simulator visualizing T-state fetch-decode-execute cycles, 8-bit W-bus transfers, and ALU operations.</p>
            </div>
            <div><h3 class="font-bold uppercase tracking-wider border-b border-black/20 pb-1 mb-1.5">Leadership &amp; Service</h3><p><strong>Associate Vice President for Academics</strong> — ACCESS DLSU (Sept 2026 – Present) | <strong>Junior Officer</strong> (Nov 2025 – Sept 2026)</p></div>
          </div>
        </div>
      </div>
    `;

    cv.querySelector('#back3dBtn').addEventListener('click', () => document.getElementById('viewToggleBtn').click());
    cv.querySelectorAll('[data-c2]').forEach(b => b.addEventListener('click', () => {
      navigator.clipboard?.writeText(b.dataset.c2);
      showToast('Copied ' + b.dataset.c2);
    }));
    const fBtns = cv.querySelectorAll('.cf-btn'), cards = cv.querySelectorAll('.c-card');
    fBtns.forEach(b => b.addEventListener('click', () => {
      fBtns.forEach(x => { x.classList.remove('bg-[#111111]', 'text-white'); x.classList.add('border', 'border-black/20'); });
      b.classList.add('bg-[#111111]', 'text-white'); b.classList.remove('border', 'border-black/20');
      const f = b.dataset.cf;
      cards.forEach(c => c.classList.toggle('hidden', f !== 'all' && !c.dataset.tags.includes(f)));
    }));

    const cCaseModal = cv.querySelector('#cCaseModal');
    cards.forEach(card => card.addEventListener('click', () => {
      const p = projects.find(x => x.id === card.dataset.pid);
      if (!p) return;
      cv.querySelector('#ccmCat').textContent = p.cat;
      cv.querySelector('#ccmTitle').textContent = p.title;
      cv.querySelector('#ccmProb').textContent = p.problem;
      cv.querySelector('#ccmArch').textContent = p.arch;
      cv.querySelector('#ccmImpl').textContent = p.impl;
      cv.querySelector('#ccmOut').textContent = p.outcome;
      cCaseModal.classList.remove('hidden'); cCaseModal.classList.add('flex');
    }));
    cv.querySelector('#ccmClose').addEventListener('click', () => { cCaseModal.classList.add('hidden'); cCaseModal.classList.remove('flex'); });

    const cAtsModal = cv.querySelector('#cAtsModal');
    cv.querySelector('#openAtsBtn2D').addEventListener('click', () => { cAtsModal.classList.remove('hidden'); cAtsModal.classList.add('flex'); });
    cv.querySelector('#catsClose').addEventListener('click', () => { cAtsModal.classList.add('hidden'); cAtsModal.classList.remove('flex'); });
  }

  document.getElementById('viewToggleBtn').addEventListener('click', () => {
    isClassic = !isClassic;
    const cv = document.getElementById('classicViewContainer');
    if (isClassic) {
      renderFull2DClassic();
      cv.classList.remove('hidden');
      document.getElementById('hudOverlay').classList.add('hidden');
    } else {
      cv.classList.add('hidden');
      document.getElementById('hudOverlay').classList.remove('hidden');
    }
    onClassicChange(isClassic);
  });

  // GPS Minimap
  const radarCanvas = document.getElementById('radarCanvas');
  const radarCtx = radarCanvas.getContext('2d');
  const RADAR_SCALE = 136 / 1080;
  radarCanvas.addEventListener('click', (e) => {
    const rect = radarCanvas.getBoundingClientRect();
    const wx = ((e.clientX - rect.left) - 68) / RADAR_SCALE;
    const wz = ((e.clientY - rect.top) - 68) / RADAR_SCALE;
    const target = getZonesState().find(z => Math.hypot(wx - z.x, wz - z.z) < 55);
    if (target) {
      car.x = target.x;
      car.z = target.z + 22;
      car.y = terrain.getSurfaceHeight(car.x, car.z);
      car.vx = 0; car.vz = 0; car.vy = 0; car.speed = 0; car.heading = 0;
      showToast(`Warped to ${target.name}`);
    }
  });

  function updateMinimap() {
    const zones = getZonesState();
    radarCtx.clearRect(0, 0, 136, 136);
    radarCtx.fillStyle = 'rgba(82, 183, 136, 0.26)';
    radarCtx.strokeStyle = 'rgba(45, 106, 79, 0.45)';
    radarCtx.lineWidth = 1.2;
    radarCtx.beginPath();
    for (let a = 0; a <= 48; a++) {
      const ang = (a / 48) * Math.PI * 2;
      const ir = getIslandRadius(ang) * RADAR_SCALE;
      const px = 68 + Math.cos(ang) * ir, py = 68 + Math.sin(ang) * ir;
      if (a === 0) radarCtx.moveTo(px, py); else radarCtx.lineTo(px, py);
    }
    radarCtx.closePath();
    radarCtx.fill();
    radarCtx.stroke();

    radarCtx.strokeStyle = 'rgba(43, 45, 66, 0.45)';
    radarCtx.lineWidth = 2.0;
    ALL_ROAD_POLYLINES.forEach(poly => {
      radarCtx.beginPath();
      poly.forEach(([rx, rz], idx) => {
        if (idx === 0) radarCtx.moveTo(68 + rx * RADAR_SCALE, 68 + rz * RADAR_SCALE);
        else radarCtx.lineTo(68 + rx * RADAR_SCALE, 68 + rz * RADAR_SCALE);
      });
      radarCtx.stroke();
    });
    zones.forEach(z => {
      radarCtx.fillStyle = z.color;
      radarCtx.beginPath();
      radarCtx.arc(68 + z.x * RADAR_SCALE, 68 + z.z * RADAR_SCALE, 4.8, 0, Math.PI * 2);
      radarCtx.fill();
      radarCtx.strokeStyle = '#ffffff';
      radarCtx.lineWidth = 1.1;
      radarCtx.stroke();
    });
    const cx = 68 + car.x * RADAR_SCALE, cz = 68 + car.z * RADAR_SCALE;
    radarCtx.save();
    radarCtx.translate(cx, cz);
    radarCtx.rotate(-car.heading);
    radarCtx.fillStyle = '#111111';
    radarCtx.beginPath();
    radarCtx.moveTo(0, -5.5);
    radarCtx.lineTo(3.8, 4.2);
    radarCtx.lineTo(-3.8, 4.2);
    radarCtx.closePath();
    radarCtx.fill();
    radarCtx.restore();
  }

  return { showToast, updateMinimap };
}
