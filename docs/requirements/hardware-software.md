# Hardware & Software Requirements

## AyurSutra — Development and Deployment Requirements

---

## 1. Development Environment (Per Team Member)

### Hardware

| Component | Minimum | Recommended |
|---|---|---|
| CPU | Dual-core, 2.0 GHz | Quad-core, 2.5 GHz+ |
| RAM | 8 GB | 16 GB |
| Storage | 20 GB free | 50 GB SSD |
| Internet | Broadband | Broadband |

### Software

| Software | Version | Purpose |
|---|---|---|
| Operating System | macOS 12+, Windows 11, Ubuntu 22+ | Development host |
| Node.js | 20+ (LTS) | Frontend runtime |
| npm | 10+ | Frontend package manager |
| Python | 3.11+ | Backend runtime (Phase 2) |
| Git | 2.40+ | Version control |
| VS Code or equivalent | Latest | Code editor |
| Postman | Latest | API testing |
| Browser (Chrome/Firefox) | Latest | UI testing |

### Phase 2 Additional Software

| Software | Version | Purpose |
|---|---|---|
| MySQL Server | 8.0+ | Database |
| MySQL Workbench | 8.0+ | Database management |
| Docker Desktop | Latest | Containerised development (optional) |

---

## 2. Phase 1 Runtime Requirements

Phase 1 is a frontend-only prototype that runs entirely in the browser.

| Requirement | Details |
|---|---|
| Node.js | Required to run the Vite development server |
| Browser | Any modern browser with ES2020+ support |
| Network | Not required (all data is in localStorage) |
| Database | Not required |
| Backend | Not required |

**To run Phase 1:**
```bash
cd frontend
npm install
npm run dev
```

---

## 3. Phase 2 Runtime Requirements

| Requirement | Details |
|---|---|
| Node.js 20+ | Frontend |
| Python 3.11+ | FastAPI backend |
| MySQL 8.0 | Database |
| pip / venv | Python dependency management |
| Google Gemini API key | For AI scheduling recommendations |

---

## 4. Production Infrastructure (Future — Phase 3+)

| Component | Technology |
|---|---|
| Frontend hosting | Vercel / Netlify / Nginx |
| Backend hosting | AWS EC2 / DigitalOcean / GCP Cloud Run |
| Database | Managed MySQL (AWS RDS, PlanetScale, or similar) |
| SSL/TLS | Let's Encrypt or cloud-managed |
| CI/CD | GitHub Actions |
| Monitoring | Basic uptime monitoring |

---

## 5. Third-Party Services

| Service | Purpose | Phase |
|---|---|---|
| Google Gemini API | AI scheduling recommendations | Phase 2 |
| (Optional) SMTP/email provider | Patient appointment notifications | Phase 3 |
| (Optional) SMS gateway | Appointment reminders | Phase 3 |

---

## 6. Browser Support

The prototype targets modern evergreen browsers:

| Browser | Minimum Version |
|---|---|
| Chrome | 100+ |
| Firefox | 100+ |
| Safari | 16+ |
| Edge | 100+ |

Internet Explorer is not supported.
