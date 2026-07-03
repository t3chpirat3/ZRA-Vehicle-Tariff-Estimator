// Spot-check hybrid Third Schedule totals
const tests = [
  { label: 'Hybrid Sedan 5+ | 1001-1500cc', cd: 9677.58,  ed: 8387.24,  carbon: 123.20 },
  { label: 'Hybrid Sedan 5+ | 1501-2500cc', cd: 9517.70,  ed: 12373.01, carbon: 246.40 },
  { label: 'Hybrid SUV   5+ | 1501-2500cc', cd: 14276.54, ed: 18559.51, carbon: 246.40 },
  { label: 'Hybrid Sedan 2-5| 0-1000cc',    cd: 14113.14, ed: 12231.38, carbon: 123.20 },
  { label: 'Hybrid SUV  2-5 | 3001cc+',     cd: 32292.19, ed: 41979.84, carbon: 484.00 },
];
console.log('=== Hybrid Third Schedule Spot-Check ===\n');
tests.forEach(t => {
  const total = t.cd + t.ed + t.carbon;
  console.log(t.label);
  console.log(`  CD: ${t.cd.toFixed(2)}  ED: ${t.ed.toFixed(2)}  Carbon: ${t.carbon.toFixed(2)}`);
  console.log(`  TOTAL: ${total.toFixed(2)} ZMW\n`);
});
