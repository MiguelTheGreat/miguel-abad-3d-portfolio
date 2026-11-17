export const STATION_DECK_H = 1.25;

export const DEFAULT_GUESTBOOK_NOTES = [
  { sender_name: 'Engr. Dela Cruz', message: 'Clean embedded AI & 4-layer KiCad PCB portfolio!' },
  { sender_name: 'ACCESS DLSU', message: 'Proud of our AVP for Academics — Animo La Salle!' }
];

export function loadGuestbookNotes() {
  try {
    return JSON.parse(localStorage.getItem('miguel_guestbook') || 'null') || [...DEFAULT_GUESTBOOK_NOTES];
  } catch {
    return [...DEFAULT_GUESTBOOK_NOTES];
  }
}

export function getZones(guestbookNotes) {
  return [
    {
      id: 'central', name: '01 // SELF-INTRODUCTION', x: 0, z: 0, radius: 28, color: '#E63946',
      title: 'MIGUEL ANDREI B. ABAD',
      subtitle: 'BS Computer Engineering (2023–Present) · De La Salle University – Manila',
      mainBody: 'Consistent Dean\'s Lister specializing in embedded systems, computer vision, and full-stack software engineering. Bridging low-level PCB hardware with intelligent software. Associate Vice President for Academics at ACCESS DLSU.',
      plaques: [
        { dx: -17, dz: -12, label: '01 // HARDWARE PILLAR', text: 'Embedded & PCB Design\n4-Layer KiCad · PIC16F877A · ESP32' },
        { dx: 17,  dz: -12, label: '02 // INTELLIGENCE PILLAR', text: 'Computer Vision & ML\nPyTorch CNN-LSTM · OpenCV · MediaPipe' },
        { dx: -17, dz: 19,  label: '03 // SOFTWARE PILLAR', text: 'Full-Stack & Mobile\nAndroid SDK · JS · SQL RDBMS · REST' },
        { dx: 17,  dz: 19,  label: 'ACADEMIC STANDING', text: 'DLSU Manila · Cavite, PH\nConsistent Dean\'s Lister' }
      ]
    },
    {
      id: 'north', name: '02 // ACADEMIC WORK SAMPLES', x: -55, z: -255, radius: 34, color: '#0077FF',
      title: 'SELECTED ENGINEERING ARTIFACTS',
      subtitle: 'Park in any glowing inspection bay below to inspect full case studies',
      mainBody: 'System architectures, hardware designs, and full-stack software implementations developed during my Computer Engineering coursework and research at De La Salle University – Manila.',
      plaques: [
        { dx: -20, dz: -15, label: 'FIG 04 // SAP-1 SIMULATOR', text: 'Bit by Bit — 8-Bit W-Bus\n6 T-States · 12-Bit CON · ALU' },
        { dx: 20,  dz: -15, label: '4 REAL ARTIFACTS', text: '01 FSL CNN-LSTM · 02 PIC16F877A PCB\n03 Web PDF Catalog · 04 SAP-1 Sim' }
      ]
    },
    {
      id: 'east', name: '03 // HARDWARE, PCB & RESUME', x: 270, z: -35, radius: 34, color: '#10b981',
      title: 'RESUME & HARDWARE MATRIX',
      subtitle: 'Drive across the 4-Layer PCB traces to light up the onboard LEDs!',
      mainBody: 'DLSU Manila BS Computer Engineering (Consistent Dean\'s Lister). Coursework: Embedded Systems, Microprocessor Systems & Architecture, Digital Logic Design, Signal Processing, Operating Systems, Feedback & Control Systems, Machine Learning.',
      plaques: [
        { dx: -19, dz: -14, label: '01 · LANGUAGES', text: 'C / C++, Python, Java, Kotlin\nJavaScript, SQL, Verilog, MATLAB' },
        { dx: 19,  dz: -14, label: '02 · FRAMEWORKS & ML', text: 'PyTorch, OpenCV, MediaPipe\nKeras, Android SDK' },
        { dx: -19, dz: 15,  label: '03 · HARDWARE & EDA', text: 'KiCad (Schematic & 4-Layer PCB)\nAutoCAD, PIC16F877A, ESP32, 6-DOF IMU' },
        { dx: 19,  dz: 15,  label: '04 · TOOLS & PLATFORMS', text: 'Git & GitHub, Android Studio\nVS Code, RESTful APIs, RDBMS / SQL' }
      ]
    },
    {
      id: 'west', name: '04 // SOFTWARE & LEADERSHIP', x: -260, z: 45, radius: 34, color: '#00B4D8',
      title: 'SOFTWARE ARCH & ACCESS DLSU',
      subtitle: 'Live 3D SAP-1 8-Bit W-Bus + Holographic Software & Leadership Arena',
      mainBody: 'Showcasing Web-Based PDF Reader & Digital Catalog, Bit by Bit SAP-1 Computer Simulator, and organizational leadership at ACCESS DLSU (Associate Vice President for Academics, Sept 2026–Present & Junior Officer, Nov 2025–Sept 2026).',
      plaques: [
        { dx: -19, dz: -14, label: 'INITIATIVE 01 & 02', text: 'Centralized Learning Repository\n& Peer-Led Technical Tutorials' },
        { dx: 19,  dz: -14, label: 'INITIATIVE 03 & 04', text: 'Academic Performance Research\n& Technical Reviewer Publications' }
      ]
    },
    {
      id: 'south', name: '05 // REFERENCES & CONTACT', x: 55, z: 260, radius: 30, color: '#FB5607',
      title: 'REFERENCES & SKY-GUESTBOOK',
      subtitle: 'DLSU ECE Faculty & ACCESS DLSU References · Direct Contact · ATS Resume',
      mainBody: 'Faculty Adviser for Embedded Systems & Wearable-Vision Sign Recognition Research (Dept. of Electronics & Computer Engineering, DLSU Manila) and ACCESS DLSU Executive Board & Faculty Adviser. Click "Leave Note / Links" above to download my Resume PDF!',
      plaques: [
        { dx: -17, dz: 10, label: 'DIRECT EMAIL & PHONE', text: 'abadandrei22@gmail.com\n+63 977 652 9418' },
        { dx: 17,  dz: 10, label: 'LINKEDIN & LOCATION', text: 'linkedin.com/in/miguel-andrei-abad\nCavite, Philippines' },
        { dx: -17, dz: -12, label: 'FACULTY REFERENCE', text: 'Dept. of Electronics & CpE\nDLSU Manila Thesis Adviser' },
        { dx: 17,  dz: -12, label: 'SKY-GUESTBOOK', text: guestbookNotes[0] ? `${guestbookNotes[0].sender_name}:\n"${guestbookNotes[0].message}"` : 'Open modal above to sign!' }
      ]
    }
  ];
}

export const PORTFOLIO_PROJECTS = [
  {
    id: 'fsl', filter: 'ml hardware', status: 'Ongoing Thesis / Research', cat: 'MULTI-MODAL EMBEDDED AI',
    title: 'Real-Time FSL Sign Recognition via Wearable-Vision Fusion',
    desc: 'Native Android application fusing wearable ESP32 6-DOF IMU sensor telemetry with live camera feeds via a hybrid CNN-LSTM network to translate Filipino Sign Language gestures into structured text.',
    tags: ['PyTorch', 'Android SDK', 'OpenCV', 'MediaPipe', 'ESP32 / IMU'],
    problem: 'Single-modality vision sign recognition degrades under rapid hand occlusion and variable lighting, while pure IMU gloves struggle to capture facial/spatial grammar markers in Filipino Sign Language (FSL).',
    arch: 'Synchronizes 6-DOF inertial streams (accelerometer + gyroscope) transmitted from an ESP32 wearable node with 21-point hand/pose landmarks extracted via MediaPipe & OpenCV on Android.',
    impl: 'Trained a hybrid spatial-temporal CNN-LSTM architecture in PyTorch to classify continuous dynamic sign sequences, deployed on-device for low-latency gloss-to-text translation.',
    outcome: 'Establishes an end-to-end multi-modal mobile inference pipeline capable of robust gesture recognition across varying ambient conditions.',
    svg: `<svg class="w-full max-w-md h-32" viewBox="0 0 420 130" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="10" y="15" width="95" height="38" rx="4" fill="#fff"/><text x="57" y="37" text-anchor="middle" font-size="9" font-weight="bold" stroke="none" fill="#111">ESP32 + 6-DOF IMU</text><rect x="10" y="75" width="95" height="38" rx="4" fill="#fff"/><text x="57" y="97" text-anchor="middle" font-size="9" font-weight="bold" stroke="none" fill="#111">RGB Camera Feed</text><path d="M105 34 H135 V55 H155 M105 94 H135 V73 H155" stroke="#0047FF" stroke-width="1.75"/><rect x="155" y="38" width="115" height="52" rx="4" stroke="#0047FF" stroke-width="2" fill="#fff"/><text x="212" y="67" text-anchor="middle" font-size="9.5" font-weight="bold" stroke="none" fill="#0047FF">CNN-LSTM MODEL</text><path d="M270 64 H305" stroke="#0047FF" stroke-width="1.75"/><rect x="308" y="38" width="102" height="52" rx="4" fill="#fff"/><text x="359" y="67" text-anchor="middle" font-size="9" font-weight="bold" stroke="none" fill="#111">Gloss-to-Text</text></svg>`
  },
  {
    id: 'pcb', filter: 'hardware', status: 'Hardware / EDA', cat: 'SCHEMATIC CAPTURE & PCB LAYOUT',
    title: 'PIC16F877A Microcontroller Development Board',
    desc: 'Custom 4-layer printed circuit board breakout platform featuring integrated 5V voltage regulation, external 20MHz crystal oscillator circuitry, dedicated power/ground planes, and ICSP programming header verified via full DRC.',
    tags: ['KiCad', '4-Layer PCB', 'PIC16F877A', 'DRC Verified'],
    problem: 'Breadboarded PIC16F877A prototypes suffer from parasitic capacitance around the 20MHz oscillator, loose ICSP connections, and noisy analog reference rails.',
    arch: '4-layer PCB stackup (Signal / GND / VCC / Signal) designed in KiCad with dedicated unbroken ground and 5V power planes to minimize loop inductance and EMI.',
    impl: 'Integrated an LDO 5V regulator with bulk/decoupling capacitor network placed within 2mm of VDD pins, guard-ringed 20MHz crystal oscillator load capacitors, master clear (MCLR) reset protection, and broken-out PORTA–PORTE headers.',
    outcome: 'Passed 100% of KiCad Design Rule Checks (DRC) with zero unrouted nets or clearance violations, ready for Gerber fabrication.',
    svg: `<svg class="w-full max-w-md h-32" viewBox="0 0 420 130" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="65" y="10" width="290" height="110" rx="6" stroke-width="2" fill="#fff"/><rect x="92" y="26" width="56" height="32" rx="2"/><text x="120" y="45" text-anchor="middle" font-size="8" font-weight="bold" stroke="none" fill="#111">5V LDO</text><rect x="92" y="72" width="56" height="32" rx="2"/><text x="120" y="91" text-anchor="middle" font-size="8" font-weight="bold" stroke="none" fill="#111">ICSP 6-PIN</text><rect x="178" y="25" width="76" height="80" rx="3" stroke="#0047FF" stroke-width="2"/><text x="216" y="67" text-anchor="middle" font-size="9" font-weight="bold" stroke="none" fill="#0047FF">PIC16F877A</text><path d="M148 42 H178 M148 88 H178 M254 45 H280 M254 85 H280" stroke="#0047FF"/><rect x="280" y="26" width="54" height="32" rx="2"/><text x="307" y="45" text-anchor="middle" font-size="8" font-weight="bold" stroke="none" fill="#111">20MHz XTAL</text><rect x="280" y="72" width="54" height="32" rx="2"/><text x="307" y="91" text-anchor="middle" font-size="8" font-weight="bold" stroke="none" fill="#111">I/O PORTS</text></svg>`
  },
  {
    id: 'pdf', filter: 'software', status: 'Full-Stack Web', cat: 'WEB ENGINEERING & DATABASE DESIGN',
    title: 'Web-Based PDF Reader & Digital Catalog',
    desc: 'Responsive in-browser document reader with custom upload pipelines, chapter navigation, asynchronous MangaDex & Google Books REST API metadata retrieval, and SQL persistence for user libraries.',
    tags: ['JavaScript', 'SQL RDBMS', 'REST APIs', 'HTML5 / CSS3'],
    problem: 'Local PDF collections and serialized reading materials lack unified metadata indexing, bookmark persistence, and clean browser-based reading ergonomics.',
    arch: 'Decoupled client-side document viewport paired with asynchronous REST API connectors (MangaDex & Google Books) and a normalized SQL relational database schema.',
    impl: 'Built dynamic file ingestion and pagination controls in JavaScript, automated cover/synopsis enrichment via external REST endpoints, and structured SQL queries for user shelves and reading progress.',
    outcome: 'Delivered a cohesive full-stack reading platform combining responsive UI design with reliable relational state management.',
    svg: `<svg class="w-full max-w-md h-32" viewBox="0 0 420 130" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="18" y="16" width="160" height="98" rx="4" fill="#fff"/><rect x="78" y="42" width="90" height="62" rx="2" stroke="#0047FF"/><text x="123" y="75" text-anchor="middle" font-size="8.5" font-weight="bold" stroke="none" fill="#0047FF">PDF Viewport</text><path d="M178 46 H245" stroke="#0047FF"/><path d="M178 88 H245" stroke="#111"/><rect x="245" y="22" width="155" height="40" rx="4" stroke="#0047FF" fill="#fff"/><text x="322" y="45" text-anchor="middle" font-size="8.5" font-weight="bold" stroke="none" fill="#0047FF">MangaDex &amp; Books API</text><rect x="245" y="70" width="155" height="40" rx="4" fill="#fff"/><text x="322" y="93" text-anchor="middle" font-size="8.5" font-weight="bold" stroke="none" fill="#111">Relational SQL RDBMS</text></svg>`
  },
  {
    id: 'sap1', filter: 'hardware software', status: 'Computer Architecture', cat: 'MICROPROCESSOR SIMULATOR',
    title: 'Bit by Bit — Interactive SAP-1 Computer Simulator',
    desc: 'Educational microprocessor architecture visualizer simulating Simple-As-Possible (SAP-1) T-state fetch-decode-execute cycles, 8-bit W-bus transfers, control word bitmasks, and ALU arithmetic operations.',
    tags: ['JavaScript', 'Digital Logic', 'SAP-1 Architecture', 'HTML5 / CSS3'],
    problem: 'Students learning computer architecture often struggle to visualize how micro-instructions and control matrix signals orchestrate register transfers across a shared bus during T1–T6 clock states.',
    arch: 'Cycle-accurate state machine modeling the SAP-1 8-bit W-bus, Program Counter (PC), MAR, 16x8 RAM, Instruction Register (IR), Accumulator (A), B Register, Adder/Subtractor ALU, and 12-bit Control Word.',
    impl: 'Engineered step-by-step clock pulsing, live binary/hex register inspection, custom assembly program loading (LDA, ADD, SUB, OUT, HLT), and visual highlighting of active bus lines.',
    outcome: 'Provides an intuitive, zero-install browser lab environment that reinforces digital logic and microprocessor fundamentals.',
    svg: `<svg class="w-full max-w-md h-32" viewBox="0 0 420 130" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="210" y1="12" x2="210" y2="118" stroke="#0047FF" stroke-width="3.5"/><rect x="45" y="18" width="110" height="24" rx="2" fill="#fff"/><text x="100" y="33" text-anchor="middle" font-size="8" font-weight="bold" stroke="none" fill="#111">Program Counter</text><rect x="45" y="52" width="110" height="24" rx="2" fill="#fff"/><text x="100" y="67" text-anchor="middle" font-size="8" font-weight="bold" stroke="none" fill="#111">MAR &amp; 16x8 RAM</text><rect x="265" y="18" width="110" height="24" rx="2" fill="#fff"/><text x="320" y="33" text-anchor="middle" font-size="8" font-weight="bold" stroke="none" fill="#111">Accumulator (A)</text><rect x="265" y="52" width="110" height="24" rx="2" stroke="#0047FF" fill="#fff"/><text x="320" y="67" text-anchor="middle" font-size="8" font-weight="bold" stroke="none" fill="#0047FF">Adder / Sub ALU</text></svg>`
  }
];
