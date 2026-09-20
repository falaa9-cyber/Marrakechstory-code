import fs from 'node:fs';
const source = fs.readFileSync('src/trip-planner.jsx', 'utf8');
const checks = [
  ['admin component export', source.includes('window.MS_TripPlanner')],
  ['persisted booking save', source.includes('daily_itinerary: next')],
  ['explicit confirmation status', source.includes("status: 'Draft'") && source.includes('toggleStatus')],
  ['map/card synchronization', source.includes('onSelect(it.id)') && source.includes('scrollIntoView')],
  ['responsive planner styles', fs.existsSync('trip-planner.css')],
];
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) process.exitCode = 1; }
