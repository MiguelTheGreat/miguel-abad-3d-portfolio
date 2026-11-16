import 'dotenv/config';
import bcrypt from 'bcryptjs';
import db, { initSchema } from './db.js';

export function seedDatabase({ force = false } = {}) {
  initSchema();

  const existingProfile = db.prepare('SELECT COUNT(*) as count FROM profile').get();
  if (existingProfile.count > 0 && !force) {
    return false;
  }

  const runSeed = db.transaction(() => {
    if (force) {
      db.exec(`
        DELETE FROM profile;
        DELETE FROM education;
        DELETE FROM skills;
        DELETE FROM projects;
        DELETE FROM experiences;
        DELETE FROM "references";
        DELETE FROM messages;
        DELETE FROM analytics_events;
        DELETE FROM admin_users;
      `);
    }

    // 1. Profile
    db.prepare(`
      INSERT INTO profile (full_name, tagline, location, email, phone, linkedin_url, summary, summary_secondary, resume_pdf_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Miguel Andrei B. Abad',
      'Computer Engineering undergraduate specializing in embedded systems, computer vision, and full-stack software engineering.',
      'Cavite, Philippines',
      'abadandrei22@gmail.com',
      '+63 977 652 9418',
      'https://www.linkedin.com/in/miguel-andrei-abad-a8845532a/',
      'I am an undergraduate Computer Engineering student at De La Salle University – Manila focused on bridging low-level hardware systems with intelligent software. My engineering work spans custom PCB design, microcontroller firmware integration, multi-modal sensor telemetry fusion, and deep learning pipelines for real-time gesture recognition.',
      'Alongside hardware and machine learning development, I build responsive, data-driven web and mobile applications backed by relational databases and RESTful architectures. Outside the lab, I serve as Associate Vice President for Academics at ACCESS DLSU, leading peer mentorship and technical resource initiatives for the engineering community.',
      '/Miguel_Andrei_Abad_Resume.pdf'
    );

    // 2. Education
    db.prepare(`
      INSERT INTO education (institution, degree, period, honors, coursework_json)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'De La Salle University – Manila',
      'Bachelor of Science in Computer Engineering',
      '2023 – Present',
      "Consistent Dean's Lister",
      JSON.stringify([
        'Embedded Systems',
        'Microprocessor Systems & Architecture',
        'Digital Logic Design',
        'Signal Processing',
        'Operating Systems',
        'Feedback and Control Systems',
        'Machine Learning'
      ])
    );

    // 3. Skills
    const insertSkill = db.prepare('INSERT INTO skills (category, items_json, sort_order) VALUES (?, ?, ?)');
    insertSkill.run('Programming Languages', JSON.stringify([
      'C / C++', 'Python', 'Java', 'Kotlin', 'JavaScript', 'SQL', 'Verilog', 'MATLAB', 'HTML5 / CSS3'
    ]), 1);
    insertSkill.run('Frameworks & Libraries', JSON.stringify([
      'PyTorch', 'OpenCV', 'MediaPipe', 'Keras', 'Android SDK'
    ]), 2);
    insertSkill.run('Hardware & EDA', JSON.stringify([
      'KiCad (Schematic & PCB)', 'AutoCAD', 'PIC Microcontrollers', 'ESP32', 'Arduino', '6-DOF IMU Sensors', 'Embedded Integration'
    ]), 3);
    insertSkill.run('Tools & Platforms', JSON.stringify([
      'Git & GitHub', 'Android Studio', 'VS Code', 'RESTful APIs', 'RDBMS / SQL'
    ]), 4);

    // 4. Projects (Academic Work Samples)
    const insertProject = db.prepare(`
      INSERT INTO projects (slug, title, status, category, filter_tags, overview, technologies_json, bullets_json, diagram_type, media_url, zone_coords_json, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertProject.run(
      'fsl-sign-recognition',
      'Real-Time FSL Sign Recognition via Wearable-Vision Fusion',
      'Ongoing Thesis / Research',
      'Multi-Modal Embedded AI & Computer Vision',
      'ml hardware',
      'An ongoing Computer Engineering research implementation designed to bridge the communication gap for the Filipino Deaf community by combining wearable inertial sensing with computer vision on mobile hardware.',
      JSON.stringify(['Python', 'PyTorch', 'Android SDK', 'OpenCV', 'MediaPipe', 'ESP32', '6-DOF IMU', 'CNN-LSTM']),
      JSON.stringify([
        'Architected a native Android application fusing wearable ESP32 6-DOF IMU sensor telemetry with real-time camera feeds for multi-modal spatial motion tracking.',
        'Developed and trained a hybrid CNN-LSTM neural network in PyTorch to classify dynamic sign gestures using synchronized spatio-temporal datasets.',
        'Engineered an end-to-end gloss-to-text post-processing pipeline to translate discrete model predictions into structured, natural language output.'
      ]),
      'fsl-fusion',
      '',
      JSON.stringify({ zone: 'east-lab', x: 46, y: 5, z: -12 }),
      1
    );

    insertProject.run(
      'pic16f877a-dev-board',
      'PIC16F877A Microcontroller Development Board',
      'Hardware / EDA',
      'Hardware Prototyping & PCB Layout',
      'hardware',
      'A custom-engineered microcontroller breakout and prototyping board built from schematic capture through multi-layer PCB routing to support embedded systems laboratory applications.',
      JSON.stringify(['KiCad', 'Schematic Capture', '4-Layer PCB Layout', 'PIC16F877A', 'Hardware Prototyping', 'DRC']),
      JSON.stringify([
        'Designed a custom PIC16F877A breakout board featuring integrated 5V voltage regulation, an external 20MHz crystal oscillator circuit, and an ICSP programming interface.',
        'Routed a 4-layer printed circuit board (PCB) in KiCad with dedicated internal power and ground planes to minimize signal noise and ensure power integrity.',
        'Verified manufacturing readiness and electrical clearance through complete Design Rule Checks (DRC) and Gerber file generation.'
      ]),
      'pcb-4layer',
      '',
      JSON.stringify({ zone: 'east-lab', x: 60, y: 7, z: -4 }),
      2
    );

    insertProject.run(
      'web-pdf-reader-catalog',
      'Web-Based PDF Reader & Digital Catalog',
      'Full-Stack Web',
      'Full-Stack Web Engineering & RDBMS',
      'software',
      'A full-stack web application enabling users to upload, organize, and read digital documents in-browser with automated metadata enrichment and persistent library state.',
      JSON.stringify(['JavaScript', 'SQL', 'HTML5', 'CSS3', 'RESTful APIs', 'RDBMS', 'CRUD']),
      JSON.stringify([
        'Built a responsive in-browser PDF reader featuring dynamic document rendering, custom file upload pipelines, zoom controls, and chapter navigation.',
        'Integrated MangaDex and Google Books REST APIs asynchronously to retrieve and display rich bibliographic metadata and cover assets dynamically.',
        'Designed normalized relational SQL database schemas and executed CRUD queries to persist reading history, library records, and user uploads.'
      ]),
      'pdf-catalog',
      '',
      JSON.stringify({ zone: 'east-lab', x: 60, y: 7, z: 10 }),
      3
    );

    insertProject.run(
      'sap1-computer-simulator',
      'Bit by Bit — Interactive SAP-1 Computer Simulator',
      'Computer Architecture',
      'Computer Architecture & Digital Logic',
      'hardware software',
      'An interactive educational simulator built to demystify low-level microprocessor execution, control signals, and bus-organized computer architecture for undergraduate engineering students.',
      JSON.stringify(['JavaScript', 'HTML5', 'CSS3', 'Computer Architecture', 'SAP-1', 'Digital Logic']),
      JSON.stringify([
        'Implemented cycle-accurate simulation of the Simple-As-Possible (SAP-1) 8-bit architecture across all six T-states of the instruction fetch-decode-execute cycle.',
        'Visualized real-time data transfers across the 8-bit W-bus between the Program Counter, Memory Address Register, 16x8 RAM, Instruction Register, Accumulator, and Adder/Subtractor ALU.',
        'Displayed live 12-bit Controller-Sequencer control words (CON) and binary/hexadecimal register states to reinforce Digital Logic and Microprocessor coursework.'
      ]),
      'sap1-bus',
      '',
      JSON.stringify({ zone: 'east-lab', x: 46, y: 5, z: 14 }),
      4
    );

    // 5. Experiences (Leadership & Service - ACCESS DLSU)
    const insertExp = db.prepare(`
      INSERT INTO experiences (organization, role, period, bullets_json, artifacts_json)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertExp.run(
      'ACCESS DLSU — Association of Computer Engineering Students',
      'Associate Vice President for Academics',
      'Sept 2026 – Present',
      JSON.stringify([
        'Spearhead college-wide academic assistance programs, peer-led technical tutorials, and structured reviewer distribution drives serving Computer Engineering undergraduates.',
        'Conduct secondary quantitative and qualitative research to evaluate student performance trends and formulate data-backed academic support strategies.',
        'Architect, curate, and maintain centralized digital learning repositories to optimize coursework resource discovery across year levels.'
      ]),
      JSON.stringify([
        {
          code: 'INITIATIVE 01',
          title: 'Centralized Learning Repository',
          description: 'Structured digital archive indexing lecture notes, lab primers, and curated problem sets by course code for instant student access.'
        },
        {
          code: 'INITIATIVE 02',
          title: 'Peer-Led Technical Tutorials',
          description: 'Organized hands-on review clinics for microprocessor systems, digital logic design, and C/Python programming fundamentals.'
        },
        {
          code: 'INITIATIVE 03',
          title: 'Academic Performance Research',
          description: 'Collected and analyzed student feedback metrics to identify bottleneck courses and deploy targeted tutorial interventions.'
        },
        {
          code: 'INITIATIVE 04',
          title: 'Technical Reviewer Publications',
          description: 'Authored and quality-checked high-yield examination reviewers distributed across the undergraduate CpE batch.'
        }
      ])
    );

    insertExp.run(
      'ACCESS DLSU — Association of Computer Engineering Students',
      'Junior Officer for Academics',
      'Nov 2025 – Sept 2026',
      JSON.stringify([
        'Authored comprehensive technical reviewers, formula sheets, and structured study guides covering foundational Computer Engineering courses (Digital Logic, Circuits, and Programming).',
        'Facilitated peer review sessions prior to departmental examinations to strengthen student mastery of core hardware and software concepts.'
      ]),
      JSON.stringify([])
    );

    // 6. References
    const insertRef = db.prepare(`
      INSERT INTO "references" (name, title, organization, email, relationship)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertRef.run(
      'Department of Electronics & Computer Engineering',
      'Faculty / Thesis Reference',
      'De La Salle University – Manila',
      'Contact details provided upon formal request',
      'Faculty Adviser for Embedded Systems & Wearable-Vision Sign Recognition Research. Can attest to hardware prototyping, machine learning engineering, and academic standing.'
    );

    insertRef.run(
      'ACCESS DLSU Executive Board & Faculty Adviser',
      'Organizational Reference',
      'Association of Computer Engineering Students',
      'Contact details provided upon formal request',
      'Can attest to leadership as Associate Vice President for Academics, curriculum support execution, team management, and student research initiatives.'
    );

    // 7. Initial Public Sky-Guestbook Notes
    const insertMsg = db.prepare(`
      INSERT INTO messages (sender_name, sender_email, company, subject, message, is_public_guestbook, is_approved)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertMsg.run(
      'DLSU ECE Engineering Cohort',
      'access@dlsu.edu.ph',
      'ACCESS DLSU',
      'Guestbook Note',
      'Impressive wearable-vision fusion pipeline and clean Swiss balloon flight world! Wishing you the best on the FSL thesis.',
      1,
      1
    );

    insertMsg.run(
      'Technical Recruiter',
      'talent@engineering-partner.ph',
      'Embedded Systems Partner',
      'Guestbook Note',
      'Love the dual 3D flight + ATS-ready 2D classic view toggle. Great showcase of KiCad PCB and PyTorch skills.',
      1,
      1
    );

    // 8. Admin User
    const adminUser = process.env.ADMIN_USERNAME || 'miguel';
    const adminPass = process.env.ADMIN_PASSWORD || 'dlsu-cpe-2026';
    const hash = bcrypt.hashSync(adminPass, 10);
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(adminUser, hash);
  });

  runSeed();
  return true;
}

// Allow running directly: `node src/seed.js` or `node src/seed.js --force`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  const force = process.argv.includes('--force');
  const seeded = seedDatabase({ force });
  console.log(seeded ? 'Database seeded successfully.' : 'Database already seeded (use --force to reseed).');
}
