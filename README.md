# Miguel Andrei B. Abad — Interactive 3D Hot Air Balloon Career e-Portfolio

Full-stack interactive 3D hot air balloon exploration portfolio built with **Three.js**, **Cannon-es**, **Web Audio API**, **Node.js / Express**, and **SQLite (`better-sqlite3`)**, preserving 100% of the minimalist Swiss Helvetica Career e-Portfolio data and offering an instant **2D Classic View** toggle and **Owner Admin Dashboard (`/admin`)**.

---

## Project Structure

```
├── package.json          # Root scripts (dev, build, start, seed, install:all)
├── .env.example          # Environment variable template
├── server/
│   ├── package.json
│   ├── src/
│   │   ├── index.js      # Express API + static/uploads + production client serving
│   │   ├── db.js         # SQLite relational schema (8 tables + admin_users)
│   │   ├── seed.js       # Idempotent seeder pre-populated from e-Portfolio HTML
│   │   ├── resumePdf.js  # Dynamic ATS-formatted PDF generator (pdfkit)
│   │   ├── middleware/auth.js
│   │   └── routes/       # public.js, auth.js, admin.js
└── client/
    ├── package.json
    ├── vite.config.js    # Dev proxy (/api, /uploads, PDF) + multi-page build
    ├── index.html        # 3D Flight Mode + Helvetica HUD + 2D Classic View
    ├── admin.html        # Owner Admin Dashboard (/admin)
    └── src/
        ├── main.js       # Three.js + Cannon-es loop, radar, altimeter, telemetry
        ├── admin.js      # Admin CMS, multer uploads, messages, analytics
        ├── audio/SoundEngine.js
        ├── world/BalloonRig.js
        ├── world/PortfolioWorld.js
        └── ui/           # ZoneModals.js, ClassicView.js
```

---

## Quick Start (Local Development)

1. **Configure Environment**
   ```bash
   cp .env.example .env
   ```

2. **Install All Dependencies**
   ```bash
   npm run install:all
   ```

3. **Seed the SQLite Database** (also runs automatically on first server start)
   ```bash
   npm run seed
   ```

4. **Run Development Servers** (Express API on `:3001` + Vite Client on `:5173`)
   ```bash
   npm run dev
   ```
   - Open `http://localhost:5173` for the 3D Balloon Portfolio & 2D Classic View.
   - Open `http://localhost:5173/admin.html` for the Owner Admin Dashboard.
   - Downloadable ATS Resume PDF: `http://localhost:3001/Miguel_Andrei_Abad_Resume.pdf`

---

## Production Build & Deployment

```bash
npm run build
NODE_ENV=production npm start
```

Express will serve the built `/client/dist` bundle alongside `/api/*`, `/uploads/*`, and `/Miguel_Andrei_Abad_Resume.pdf` on `PORT` (default `3001`).

---

## Controls

| Action | Desktop | Mobile |
| :--- | :--- | :--- |
| Steer | `WASD` or `Arrow Keys` | Virtual Thumbstick |
| Ignite Burner (Ascend) | `Spacebar` | `BURN ▲` Button |
| Vent Hot Air (Descend) | `Shift` or `C` | `VENT ▼` Button |
| Open Active Zone | `Enter` | Tap Zone Prompt |
| Reset Position | `R` | — |
