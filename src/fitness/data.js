// ============================================
// FITNESS APP — mock data + rule-based plan generator
// Personalized: 2× per day, mobility focus, kettlebell+rope+boxing+bike+yoga
// ============================================

window.FaOnboarding = {
  steps: [
    { id: 'welcome' },
    { id: 'name' },
    { id: 'sex' },
    { id: 'age' },
    { id: 'height' },
    { id: 'weight' },
    { id: 'goalWeight' },
    { id: 'goal' },
    { id: 'experience' },
    { id: 'equipment' },
    { id: 'twoPerDay' },
    { id: 'diet' },
    { id: 'days' },
    { id: 'review' }
  ]
};

window.FaGoals = [
  { id: 'cut',      title: 'Get back in shape',  desc: 'Lose fat, build endurance and feel light again.',         emoji: '🔥' },
  { id: 'muscle',   title: 'Build muscle',        desc: 'Gain lean mass with progressive overload.',              emoji: '💪' },
  { id: 'strength', title: 'Get stronger',        desc: 'Focus on compound lifts and raw force.',                 emoji: '🏋️' },
  { id: 'stability',title: 'Mobility & stability',desc: 'Move better, recover faster, build a body for life.',    emoji: '🧘' }
];

window.FaExperience = [
  { id: 'beginner', title: 'Just starting',     desc: 'Brand new or returning after a long break.' },
  { id: 'casual',   title: 'A bit of a base',   desc: 'I work out occasionally but not consistently.' },
  { id: 'regular',  title: 'Regular',           desc: 'I train at least 2–3× per week already.' },
  { id: 'advanced', title: 'Advanced',          desc: 'I&apos;ve been training seriously for years.' }
];

// EQUIPMENT IS NOW MULTI-SELECT
window.FaEquipment = [
  { id: 'bodyweight', title: 'Bodyweight',       desc: 'My own body, the floor and a wall.' },
  { id: 'yogamat',    title: 'Yoga mat',         desc: 'For mobility, core and floor work.' },
  { id: 'rope',       title: 'Jump rope',        desc: 'Cardio, footwork, conditioning.' },
  { id: 'boxing',     title: 'Boxing gloves',    desc: 'Shadow boxing, bag work and combos.' },
  { id: 'kettlebell', title: 'Kettlebell',       desc: 'Swings, goblets, presses, complexes.' },
  { id: 'bike',       title: 'Road bicycle',     desc: 'Long zone-2 rides outside, real cardio.' },
  { id: 'dumbbells',  title: 'Dumbbells',        desc: 'Hypertrophy and accessory work.' },
  { id: 'bands',      title: 'Resistance bands', desc: 'Pulls, mobility and warm-ups.' },
  { id: 'pullup',     title: 'Pull-up bar',      desc: 'Vertical pulling and hanging.' },
  { id: 'gym',        title: 'Full gym access',  desc: 'Machines, cables, the whole rack.' }
];

window.FaDiets = [
  { id: 'none',          title: 'No restrictions',    desc: 'I eat everything.' },
  { id: 'mediterranean', title: 'Mediterranean / Moroccan', desc: 'Tagines, couscous, olive oil, fish, vegetables.' },
  { id: 'halal',         title: 'Halal',              desc: 'Halal-only meat and ingredients.' },
  { id: 'vegetarian',    title: 'Vegetarian',         desc: 'No meat, dairy and eggs OK.' }
];

// ── Exercise library (expanded for kettlebell, rope, boxing, bike, yoga) ──
window.FaExerciseLib = {
  // Kettlebell (12 kg)
  kbswing:      { name: 'Kettlebell swing',         muscle: 'Glutes · Hams · Core', emoji: '🏋️', eq: 'kettlebell' },
  kbgoblet:     { name: 'Goblet squat (KB)',        muscle: 'Quads · Glutes',       emoji: '🏋️', eq: 'kettlebell' },
  kbpress:      { name: 'Single-arm KB press',      muscle: 'Shoulders',            emoji: '🏋️', eq: 'kettlebell' },
  kbrow:        { name: 'KB bent-over row',         muscle: 'Back',                 emoji: '🏋️', eq: 'kettlebell' },
  kbcleanpress: { name: 'KB clean & press',         muscle: 'Full body',            emoji: '🏋️', eq: 'kettlebell' },
  kbrdl:        { name: 'KB Romanian deadlift',     muscle: 'Hamstrings · Glutes',  emoji: '🏋️', eq: 'kettlebell' },
  kbhalo:       { name: 'KB halo',                  muscle: 'Shoulder mobility',    emoji: '🏋️', eq: 'kettlebell' },
  kbturkish:    { name: 'Turkish get-up (light)',   muscle: 'Full body stability',  emoji: '🏋️', eq: 'kettlebell' },
  kbsuitcase:   { name: 'Suitcase carry',           muscle: 'Core · Grip',          emoji: '🏋️', eq: 'kettlebell' },

  // Jump rope
  rope:         { name: 'Jump rope · steady',       muscle: 'Cardio',               emoji: '🪢', eq: 'rope' },
  ropealt:      { name: 'Alternate-foot rope',      muscle: 'Cardio · Footwork',    emoji: '🪢', eq: 'rope' },
  ropehigh:     { name: 'High-knees rope',          muscle: 'Cardio',               emoji: '🪢', eq: 'rope' },
  ropedouble:   { name: 'Double-unders (try)',      muscle: 'Cardio · Power',       emoji: '🪢', eq: 'rope' },

  // Boxing
  shadowbox:    { name: 'Shadow boxing rounds',     muscle: 'Cardio · Coordination',emoji: '🥊', eq: 'boxing' },
  boxcombo:     { name: '1-2-3-2 combo drills',     muscle: 'Power · Footwork',     emoji: '🥊', eq: 'boxing' },
  boxslip:      { name: 'Slip & roll defense',      muscle: 'Core · Mobility',      emoji: '🥊', eq: 'boxing' },
  boxfoot:      { name: 'Footwork ladder',          muscle: 'Agility',              emoji: '🥊', eq: 'boxing' },

  // Bike (road)
  bikez2:       { name: 'Zone-2 ride (easy)',       muscle: 'Cardio base',          emoji: '🚴', eq: 'bike' },
  bikez4:       { name: 'Zone-4 intervals',         muscle: 'Cardio · Power',       emoji: '🚴', eq: 'bike' },
  bikehill:     { name: 'Rolling hills ride',       muscle: 'Legs · Cardio',        emoji: '🚴', eq: 'bike' },

  // Yoga & mobility
  sunsalute:    { name: 'Sun salutations',          muscle: 'Full body flow',       emoji: '🧘', eq: 'yogamat' },
  downdog:      { name: 'Downward dog hold',        muscle: 'Hamstrings · Shoulders',emoji: '🧘', eq: 'yogamat' },
  catcow:       { name: 'Cat-cow',                  muscle: 'Spine mobility',       emoji: '🧘', eq: 'yogamat' },
  pigeon:       { name: 'Pigeon pose',              muscle: 'Hips',                 emoji: '🧘', eq: 'yogamat' },
  worldsgreat:  { name: 'World&apos;s greatest stretch', muscle: 'Full body mobility', emoji: '🧘', eq: 'yogamat' },
  thoracic:     { name: 'Thoracic openers',         muscle: 'Upper back',           emoji: '🧘', eq: 'yogamat' },
  hipflexor:    { name: 'Hip-flexor stretch',       muscle: 'Hips',                 emoji: '🧘', eq: 'yogamat' },

  // Bodyweight
  pushup:        { name: 'Push-ups',                muscle: 'Chest · Triceps',     emoji: '🤸', eq: 'bodyweight' },
  pikepush:      { name: 'Pike push-ups',           muscle: 'Shoulders',           emoji: '🤸', eq: 'bodyweight' },
  bwsquat:       { name: 'Bodyweight squat',        muscle: 'Legs',                emoji: '🦵', eq: 'bodyweight' },
  lunge:         { name: 'Reverse lunges',          muscle: 'Legs · Glutes',       emoji: '🦵', eq: 'bodyweight' },
  glutebridge:   { name: 'Glute bridge',            muscle: 'Glutes · Core',       emoji: '🍑', eq: 'bodyweight' },
  plank:         { name: 'Forearm plank',           muscle: 'Core',                emoji: '🪵', eq: 'bodyweight' },
  sideplank:     { name: 'Side plank',              muscle: 'Obliques',            emoji: '🪵', eq: 'bodyweight' },
  deadbug:       { name: 'Dead bug',                muscle: 'Core stability',      emoji: '🪲', eq: 'bodyweight' },
  birddog:       { name: 'Bird-dog',                muscle: 'Core · Low back',     emoji: '🐦', eq: 'bodyweight' },
  mountainclimb: { name: 'Mountain climbers',       muscle: 'Cardio · Core',       emoji: '⛰️', eq: 'bodyweight' },
  burpee:        { name: 'Burpees',                 muscle: 'Full body cardio',    emoji: '🔥', eq: 'bodyweight' },
  hollow:        { name: 'Hollow body hold',        muscle: 'Core',                emoji: '🪵', eq: 'bodyweight' },
  walk:          { name: 'Easy walk',               muscle: 'Recovery',            emoji: '🚶', eq: 'bodyweight' }
};

// ── 7-day template: mobility + 2-per-day for Faisal ─────────
window.FaWeekTemplates = {
  stability_2pd: [
    { day: 'Mon', title: 'Strength + Boxing',
      am: { title: 'Yoga flow', minutes: 22, calories: 110, focus: ['Mobility'], exercises: [
        { id: 'sunsalute',  sets: 3, reps: '5 flows',     rest: '—' },
        { id: 'worldsgreat',sets: 2, reps: '4 each side', rest: '—' },
        { id: 'pigeon',     sets: 2, reps: '60s each side', rest: '—' },
        { id: 'thoracic',   sets: 2, reps: '8 reps',      rest: '—' }
      ]},
      pm: { title: 'Kettlebell + 3 boxing rounds', minutes: 35, calories: 360, focus: ['Strength','Boxing'], exercises: [
        { id: 'kbhalo',     sets: 2, reps: '6 each way',   rest: '30s' },
        { id: 'kbgoblet',   sets: 4, reps: '10',           rest: '60s' },
        { id: 'kbswing',    sets: 4, reps: '15',           rest: '60s' },
        { id: 'kbpress',    sets: 3, reps: '8 each side',  rest: '60s' },
        { id: 'shadowbox',  sets: 3, reps: '3 min round',  rest: '60s' },
        { id: 'boxcombo',   sets: 2, reps: '2 min',        rest: '60s' }
      ]}},
    { day: 'Tue', title: 'Bike + Rope',
      am: { title: 'Zone-2 bike ride', minutes: 40, calories: 380, focus: ['Cardio base'], exercises: [
        { id: 'bikez2', sets: 1, reps: '40 min steady', rest: '—' }
      ]},
      pm: { title: 'Rope intervals + core', minutes: 22, calories: 280, focus: ['Cardio','Core'], exercises: [
        { id: 'rope',      sets: 5, reps: '60s on / 30s off', rest: '—' },
        { id: 'ropealt',   sets: 3, reps: '45s on / 30s off', rest: '—' },
        { id: 'plank',     sets: 3, reps: '45s hold',         rest: '30s' },
        { id: 'sideplank', sets: 3, reps: '30s each side',    rest: '30s' },
        { id: 'hollow',    sets: 3, reps: '20s hold',         rest: '30s' }
      ]}},
    { day: 'Wed', title: 'Active recovery',
      am: { title: 'Yoga & mobility flow', minutes: 25, calories: 120, focus: ['Mobility','Recovery'], exercises: [
        { id: 'catcow',    sets: 2, reps: '10 slow',        rest: '—' },
        { id: 'sunsalute', sets: 3, reps: '5 flows',        rest: '—' },
        { id: 'downdog',   sets: 3, reps: '45s hold',       rest: '—' },
        { id: 'pigeon',    sets: 2, reps: '60s each side',  rest: '—' },
        { id: 'hipflexor', sets: 2, reps: '45s each side',  rest: '—' }
      ]},
      pm: { title: 'Easy walk with the baby', minutes: 30, calories: 130, focus: ['Recovery'], exercises: [
        { id: 'walk', sets: 1, reps: '30 min easy', rest: '—' }
      ]}},
    { day: 'Thu', title: 'Full body + Boxing',
      am: { title: 'Bodyweight HIIT', minutes: 20, calories: 230, focus: ['Cardio','Full body'], exercises: [
        { id: 'mountainclimb', sets: 4, reps: '40s on / 20s off', rest: '—' },
        { id: 'burpee',        sets: 4, reps: '30s on / 30s off', rest: '—' },
        { id: 'pushup',        sets: 3, reps: '10–15',            rest: '45s' },
        { id: 'bwsquat',       sets: 3, reps: '20',               rest: '45s' }
      ]},
      pm: { title: 'KB complex + 4 boxing rounds', minutes: 35, calories: 360, focus: ['Strength','Boxing'], exercises: [
        { id: 'kbswing',     sets: 4, reps: '20',          rest: '45s' },
        { id: 'kbcleanpress',sets: 4, reps: '5 each side', rest: '60s' },
        { id: 'kbrdl',       sets: 3, reps: '10',          rest: '60s' },
        { id: 'shadowbox',   sets: 4, reps: '3 min round', rest: '60s' },
        { id: 'boxslip',     sets: 2, reps: '90s drill',   rest: '30s' }
      ]}},
    { day: 'Fri', title: 'Long ride + Core',
      am: { title: 'Long ride (Z2 with bursts)', minutes: 55, calories: 520, focus: ['Endurance'], exercises: [
        { id: 'bikez2',  sets: 1, reps: '40 min easy + bursts', rest: '—' },
        { id: 'bikehill',sets: 1, reps: '15 min rolling',       rest: '—' }
      ]},
      pm: { title: 'Core & stretch wind-down', minutes: 22, calories: 130, focus: ['Core','Mobility'], exercises: [
        { id: 'deadbug',   sets: 3, reps: '10 each side',  rest: '30s' },
        { id: 'birddog',   sets: 3, reps: '10 each side',  rest: '30s' },
        { id: 'sideplank', sets: 3, reps: '40s each side', rest: '30s' },
        { id: 'pigeon',    sets: 2, reps: '60s each side', rest: '—' },
        { id: 'thoracic',  sets: 2, reps: '8 reps',        rest: '—' }
      ]}},
    { day: 'Sat', title: 'Strength + Skill',
      am: { title: 'KB full body', minutes: 30, calories: 320, focus: ['Strength'], exercises: [
        { id: 'kbhalo',    sets: 2, reps: '6 each way',   rest: '30s' },
        { id: 'kbgoblet',  sets: 4, reps: '10',           rest: '60s' },
        { id: 'kbrow',     sets: 4, reps: '10 each side', rest: '60s' },
        { id: 'kbpress',   sets: 3, reps: '8 each side',  rest: '60s' },
        { id: 'kbturkish', sets: 2, reps: '3 each side',  rest: '90s' },
        { id: 'kbsuitcase',sets: 3, reps: '30m each side',rest: '60s' }
      ]},
      pm: { title: 'Rope skill + shadow boxing', minutes: 25, calories: 270, focus: ['Skill','Cardio'], exercises: [
        { id: 'rope',       sets: 3, reps: '90s steady',   rest: '30s' },
        { id: 'ropealt',    sets: 3, reps: '60s',          rest: '30s' },
        { id: 'ropedouble', sets: 4, reps: '30s practice', rest: '60s' },
        { id: 'boxfoot',    sets: 3, reps: '90s',          rest: '30s' },
        { id: 'shadowbox',  sets: 2, reps: '3 min round',  rest: '60s' }
      ]}},
    { day: 'Sun', title: 'Rest',
      am: { title: 'Optional gentle yoga', minutes: 15, calories: 70, focus: ['Recovery'], exercises: [
        { id: 'sunsalute', sets: 2, reps: '5 flows',       rest: '—' },
        { id: 'pigeon',    sets: 2, reps: '60s each side', rest: '—' }
      ]},
      pm: { title: 'Family time — rest', minutes: 0, calories: 0, focus: ['Rest'], rest: true, exercises: [] }
    }
  ]
};

// ── Meal plan (Mediterranean/Moroccan) tuned for ~2200 kcal / 2-per-day ──
window.FaMealPlan = {
  stability_mediterranean: {
    targets: { kcal: 2200, p: 160, c: 220, f: 75 },
    meals: [
      { when: 'Breakfast', emoji: '🥣',
        title: 'Yogurt bowl with honey, almonds, dates & eggs',
        desc: 'Greek yogurt, drizzle of orange-blossom honey, 10 almonds, 2 medjool dates, 2 boiled eggs, mint.',
        kcal: 510, p: 32, c: 50, f: 18 },
      { when: 'Snack', emoji: '🍊',
        title: 'Orange, mint tea & walnuts',
        desc: 'A small orange, mint tea (no sugar), 6 walnut halves.',
        kcal: 200, p: 4,  c: 22, f: 11 },
      { when: 'Lunch', emoji: '🍲',
        title: 'Chicken tagine with vegetables & bulgur',
        desc: 'Chicken thigh tagine, carrots, courgette, olives, preserved lemon. Bulgur and a fresh salad.',
        kcal: 620, p: 46, c: 68, f: 16 },
      { when: 'Pre-workout', emoji: '🍌',
        title: 'Banana with a spoon of almond butter',
        desc: 'Easy carbs + a little fat for the PM session.',
        kcal: 230, p: 6,  c: 30, f: 10 },
      { when: 'Snack', emoji: '🥒',
        title: 'Hummus, cucumber & cherry tomatoes',
        desc: '3 tbsp hummus, cucumber slices, cherry tomatoes, zaatar.',
        kcal: 220, p: 9,  c: 22, f: 11 },
      { when: 'Dinner', emoji: '🐟',
        title: 'Grilled sardines with chermoula & lentils',
        desc: 'Sardines with chermoula marinade, lentil salad, grilled peppers, olive oil drizzle.',
        kcal: 560, p: 50, c: 32, f: 22 }
    ]
  }
};

// ── Default profile pre-filled for Faisal ───────────────────
window.FaDefaultProfile = {
  name: 'Faisal',
  sex: 'male',
  age: 37,
  height: 178,
  weight: 90,
  goalWeight: 70,
  goal: 'stability',
  experience: 'regular',
  equipment: ['rope', 'boxing', 'yogamat', 'bike', 'kettlebell', 'bodyweight'],
  twoPerDay: true,
  diet: 'mediterranean',
  daysPerWeek: 6,
  onboarded: true
};

// ── Mock weight history (last 8 weeks) — starting at 92, now 90 ──
window.FaWeightHistory = [
  { d: '8w ago', w: 92.4 },
  { d: '7w ago', w: 91.9 },
  { d: '6w ago', w: 91.3 },
  { d: '5w ago', w: 91.0 },
  { d: '4w ago', w: 90.6 },
  { d: '3w ago', w: 90.4 },
  { d: '2w ago', w: 90.2 },
  { d: '1w ago', w: 90.1 },
  { d: 'Now',   w: 90.0 }
];

// ── Helpers ─────────────────────────────────────────────────
window.FaUtils = {
  todayIndex() {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  },
  dayLabel() {
    return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  },
  initials(name) {
    if (!name) return 'U';
    const p = name.trim().split(/\s+/);
    return (p[0][0] + (p[1]?.[0] || '')).toUpperCase();
  },
  bmi(w, h) {
    if (!w || !h) return 0;
    return +(w / Math.pow(h/100, 2)).toFixed(1);
  },
  estimateDailyCalories({ sex, age, height, weight, goal, daysPerWeek, twoPerDay }) {
    const s = sex === 'male' ? 5 : -161;
    const bmr = 10*weight + 6.25*height - 5*age + s;
    const days = daysPerWeek || 3;
    const act = 1.3 + days * 0.04 + (twoPerDay ? 0.12 : 0);
    let tdee = bmr * act;
    if (goal === 'cut') tdee -= 450;
    if (goal === 'stability') tdee -= 550;
    if (goal === 'muscle') tdee += 250;
    return Math.round(tdee / 10) * 10;
  },
  // Pick the right week template based on profile
  weekFor(profile) {
    return window.FaWeekTemplates.stability_2pd;
  },
  mealsFor(profile) {
    return window.FaMealPlan.stability_mediterranean;
  }
};
