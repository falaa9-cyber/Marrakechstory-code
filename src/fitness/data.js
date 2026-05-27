// ============================================
// FITNESS APP — mock data + rule-based plan generator
// (Hybrid: deterministic rules here + AI tweaks later)
// ============================================

// ── Onboarding step definitions ─────────────────────────────
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
    { id: 'diet' },
    { id: 'days' },
    { id: 'review' }
  ]
};

window.FaGoals = [
  { id: 'cut',      title: 'Get back in shape',  desc: 'Lose fat, build endurance and feel light again.',         emoji: '🔥' },
  { id: 'muscle',   title: 'Build muscle',        desc: 'Gain lean mass with progressive overload.',              emoji: '💪' },
  { id: 'strength', title: 'Get stronger',        desc: 'Focus on compound lifts and raw force.',                 emoji: '🏋️' },
  { id: 'stability',title: 'Stability & mobility',desc: 'Core, balance, flexibility and longevity.',              emoji: '🧘' }
];

window.FaExperience = [
  { id: 'beginner', title: 'Just starting',     desc: 'Brand new or returning after a long break.' },
  { id: 'casual',   title: 'A bit of a base',   desc: 'I work out occasionally but not consistently.' },
  { id: 'regular',  title: 'Regular',           desc: 'I train at least 2–3× per week already.' },
  { id: 'advanced', title: 'Advanced',          desc: 'Lifting / running seriously for years.' }
];

window.FaEquipment = [
  { id: 'gym',       title: 'Full gym',          desc: 'Machines, free weights, cables — everything.' },
  { id: 'home',      title: 'Home + basics',     desc: 'Dumbbells, bands, maybe a pull-up bar.' },
  { id: 'bodyweight',title: 'Bodyweight only',   desc: 'No equipment. Just me and the floor.' },
  { id: 'mix',       title: 'A mix',             desc: 'Sometimes gym, sometimes home.' }
];

window.FaDiets = [
  { id: 'none',          title: 'No restrictions',    desc: 'I eat everything.' },
  { id: 'mediterranean', title: 'Mediterranean / Moroccan', desc: 'Tagines, couscous, olive oil, fish, vegetables.' },
  { id: 'halal',         title: 'Halal',              desc: 'Halal-only meat and ingredients.' },
  { id: 'vegetarian',    title: 'Vegetarian',         desc: 'No meat, dairy and eggs OK.' }
];

// ── Exercise library (home + basic equipment friendly) ──────
window.FaExerciseLib = {
  pushup:        { name: 'Push-ups',                muscle: 'Chest · Triceps',     emoji: '🤸' },
  inclinepush:   { name: 'Incline push-ups',        muscle: 'Upper chest',         emoji: '🤸' },
  dbpress:       { name: 'Dumbbell floor press',    muscle: 'Chest',               emoji: '🏋️' },
  dbrow:         { name: 'Bent-over dumbbell row',  muscle: 'Back · Biceps',       emoji: '🏋️' },
  bandrow:       { name: 'Resistance band row',     muscle: 'Back',                emoji: '🪢' },
  dbcurl:        { name: 'Dumbbell biceps curl',    muscle: 'Biceps',              emoji: '💪' },
  dbshoulder:    { name: 'Dumbbell shoulder press', muscle: 'Shoulders',           emoji: '🏋️' },
  lateralraise:  { name: 'Lateral raises',          muscle: 'Side delts',          emoji: '🏋️' },
  goblet:        { name: 'Goblet squat',            muscle: 'Quads · Glutes',      emoji: '🏋️' },
  bwsquat:       { name: 'Bodyweight squats',       muscle: 'Legs',                emoji: '🦵' },
  rdldb:         { name: 'Dumbbell Romanian DL',    muscle: 'Hamstrings · Glutes', emoji: '🏋️' },
  lunge:         { name: 'Reverse lunges',          muscle: 'Quads · Glutes',      emoji: '🦵' },
  glutebridge:   { name: 'Glute bridge',            muscle: 'Glutes · Hamstrings', emoji: '🍑' },
  plank:         { name: 'Forearm plank',           muscle: 'Core',                emoji: '🪵' },
  deadbug:       { name: 'Dead bug',                muscle: 'Core · Stability',    emoji: '🪲' },
  birddog:       { name: 'Bird-dog',                muscle: 'Core · Lower back',   emoji: '🐦' },
  mountainclimb: { name: 'Mountain climbers',       muscle: 'Cardio · Core',       emoji: '⛰️' },
  jumpjack:      { name: 'Jumping jacks',           muscle: 'Cardio',              emoji: '⚡' },
  burpee:        { name: 'Burpees',                 muscle: 'Full body cardio',    emoji: '🔥' },
  hiitsprint:    { name: 'High-knees',              muscle: 'Cardio',              emoji: '🏃' },
  stretch:       { name: 'Full-body stretch',       muscle: 'Mobility',            emoji: '🧘' },
  catcow:        { name: 'Cat-cow',                 muscle: 'Spine mobility',      emoji: '🧘' }
};

// ── 7-day weekly template by goal (home+basic equipment, weight loss focus) ──
window.FaWeekTemplates = {
  cut: [
    { day: 'Mon', title: 'Full body strength',    type: 'strength', minutes: 35, calories: 280, focus: ['Chest','Back','Legs'],
      exercises: [
        { id: 'pushup', sets: 3, reps: '8–12', rest: '60s' },
        { id: 'dbrow',  sets: 3, reps: '10 each side', rest: '60s' },
        { id: 'goblet', sets: 3, reps: '12', rest: '75s' },
        { id: 'glutebridge', sets: 3, reps: '15', rest: '45s' },
        { id: 'plank',  sets: 3, reps: '40s hold', rest: '30s' }
      ]
    },
    { day: 'Tue', title: 'HIIT cardio + core',    type: 'cardio',   minutes: 25, calories: 320, focus: ['Cardio','Core'],
      exercises: [
        { id: 'jumpjack',      sets: 4, reps: '45s on / 15s off', rest: '—' },
        { id: 'mountainclimb', sets: 4, reps: '40s on / 20s off', rest: '—' },
        { id: 'burpee',        sets: 4, reps: '30s on / 30s off', rest: '—' },
        { id: 'hiitsprint',    sets: 4, reps: '40s on / 20s off', rest: '—' },
        { id: 'deadbug',       sets: 3, reps: '10 each side', rest: '45s' }
      ]
    },
    { day: 'Wed', title: 'Active recovery',       type: 'mobility', minutes: 20, calories: 90,  focus: ['Mobility'],
      exercises: [
        { id: 'catcow',  sets: 2, reps: '10 slow', rest: '—' },
        { id: 'birddog', sets: 2, reps: '8 each side', rest: '—' },
        { id: 'stretch', sets: 1, reps: '10 min flow', rest: '—' }
      ]
    },
    { day: 'Thu', title: 'Upper body push/pull',  type: 'strength', minutes: 35, calories: 270, focus: ['Chest','Back','Arms'],
      exercises: [
        { id: 'dbpress',      sets: 3, reps: '10', rest: '60s' },
        { id: 'bandrow',      sets: 3, reps: '12', rest: '60s' },
        { id: 'dbshoulder',   sets: 3, reps: '10', rest: '60s' },
        { id: 'dbcurl',       sets: 3, reps: '12', rest: '45s' },
        { id: 'lateralraise', sets: 3, reps: '12', rest: '45s' }
      ]
    },
    { day: 'Fri', title: 'HIIT + lower core',     type: 'cardio',   minutes: 25, calories: 310, focus: ['Cardio','Core'],
      exercises: [
        { id: 'jumpjack',      sets: 4, reps: '40s on / 20s off', rest: '—' },
        { id: 'burpee',        sets: 4, reps: '30s on / 30s off', rest: '—' },
        { id: 'mountainclimb', sets: 4, reps: '40s on / 20s off', rest: '—' },
        { id: 'plank',         sets: 3, reps: '45s hold', rest: '30s' }
      ]
    },
    { day: 'Sat', title: 'Lower body & glutes',   type: 'strength', minutes: 35, calories: 290, focus: ['Legs','Glutes'],
      exercises: [
        { id: 'goblet',      sets: 4, reps: '10', rest: '75s' },
        { id: 'rdldb',       sets: 3, reps: '12', rest: '60s' },
        { id: 'lunge',       sets: 3, reps: '10 each leg', rest: '60s' },
        { id: 'glutebridge', sets: 3, reps: '15', rest: '45s' },
        { id: 'bwsquat',     sets: 2, reps: '20', rest: '45s' }
      ]
    },
    { day: 'Sun', title: 'Rest day',              type: 'rest',     minutes: 0,  calories: 0,   focus: ['Recovery'],
      exercises: []
    }
  ]
};

// ── Meal library (Mediterranean / Moroccan, light) ──────────
window.FaMealPlan = {
  cut_mediterranean: {
    targets: { kcal: 1850, p: 140, c: 180, f: 60 },
    meals: [
      { when: 'Breakfast', emoji: '🥣',
        title: 'Greek yogurt with honey, almonds & dates',
        desc: 'Plain Greek yogurt, drizzle of orange-blossom honey, 10 almonds, 2 medjool dates, fresh mint.',
        kcal: 380, p: 22, c: 48, f: 11 },
      { when: 'Snack', emoji: '🍊',
        title: 'Orange, mint tea & a handful of walnuts',
        desc: 'A small fresh orange, hot mint tea (no sugar), 6 walnut halves.',
        kcal: 180, p: 4,  c: 22, f: 9 },
      { when: 'Lunch', emoji: '🍲',
        title: 'Chicken tagine with vegetables & bulgur',
        desc: 'Chicken thigh tagine with carrots, courgette, olives and preserved lemon. Side of bulgur and salad.',
        kcal: 560, p: 42, c: 58, f: 16 },
      { when: 'Snack', emoji: '🥒',
        title: 'Hummus, cucumber & cherry tomatoes',
        desc: '3 tbsp hummus, sliced cucumber, cherry tomatoes, sprinkle of zaatar.',
        kcal: 210, p: 8,  c: 22, f: 10 },
      { when: 'Dinner', emoji: '🐟',
        title: 'Grilled sardines with chermoula & lentils',
        desc: 'Sardines (or any white fish) with chermoula marinade, side of lentil salad and grilled peppers.',
        kcal: 520, p: 48, c: 30, f: 18 }
    ]
  }
};

// ── Default user profile (used when onboarding skipped) ─────
window.FaDefaultProfile = {
  name: 'Faisal',
  sex: 'male',
  age: 30,
  height: 178,
  weight: 86,
  goalWeight: 76,
  goal: 'cut',
  experience: 'casual',
  equipment: 'home',
  diet: 'mediterranean',
  daysPerWeek: 5,
  onboarded: true
};

// ── Mock weight history (last 8 weeks) ─────────────────────
window.FaWeightHistory = [
  { d: '8w ago', w: 91.2 },
  { d: '7w ago', w: 90.6 },
  { d: '6w ago', w: 89.9 },
  { d: '5w ago', w: 89.4 },
  { d: '4w ago', w: 88.5 },
  { d: '3w ago', w: 87.8 },
  { d: '2w ago', w: 87.1 },
  { d: '1w ago', w: 86.4 },
  { d: 'Now',   w: 86.0 }
];

// ── Helpers ─────────────────────────────────────────────────
window.FaUtils = {
  todayIndex() {
    // 0 = Monday in our template
    const d = new Date().getDay(); // 0=Sun..6=Sat
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
  // Rough Mifflin-St Jeor BMR + activity, with deficit/surplus by goal
  estimateDailyCalories({ sex, age, height, weight, goal, daysPerWeek }) {
    const s = sex === 'male' ? 5 : -161;
    const bmr = 10*weight + 6.25*height - 5*age + s;
    const act = 1.3 + (daysPerWeek || 3) * 0.04;
    let tdee = bmr * act;
    if (goal === 'cut') tdee -= 450;
    if (goal === 'muscle') tdee += 300;
    return Math.round(tdee / 10) * 10;
  }
};
