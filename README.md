# Transformation Tracker

Enterprise-grade Transformation Tracking Platform — Demo for **Northwind Airlines · Northwind 2030 Program**.

## Tech Stack

- React 18 + TypeScript
- Vite 6
- Tailwind CSS 3
- Recharts 2
- Lucide Icons
- React Router v6
- Radix UI primitives

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build |

## Netlify Deployment

**Build command:** `npm run build`  
**Publish directory:** `dist`

The included `netlify.toml` configures redirect rules for client-side routing.

## Screens

| Route | Description |
|---|---|
| `/dashboard` | Executive Dashboard with KPIs, charts, top measures |
| `/portfolio` | Measure Portfolio table with search & filtering |
| `/portfolio/:id` | Measure Detail with DI lifecycle, impact tracking, risks |

## Mock Data

50 realistic transformation measures across:
- 6 Business Units
- 12 Divisions
- 8 Workstreams
- All DI levels (DI0–DI5)
- Revenue, Cost and Structural categories
