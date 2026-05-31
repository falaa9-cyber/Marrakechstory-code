// ============================================
// FITNESS APP — main shell, onboarding, 5 tab screens
// Personalized: 2× per day, kettlebell + rope + boxing + bike + yoga
// ============================================

const { useState, useEffect, useMemo, useRef } = React;
const I = window.FaIcons;

const STORAGE_KEY = 'fa.profile.v2';
function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}
function saveProfile(p) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch (e) {}
}

// ════════════════════════════════════════════════════════════
//  ONBOARDING
// ════════════════════════════════════════════════════════════

function OnboardingChoice({ icon, title, desc, selected, onClick, multi }) {
  return (
    <button className={`fa-onb-choice ${selected ? 'sel' : ''}`} onClick={onClick}>
      {icon ? <div className="ic">{icon}</div> : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t">{title}</div>
        {desc ? <div className="d">{desc}</div> : null}
      </div>
      <div className="tick" style={multi ? { borderRadius: 6 } : null}>
        <I.Check size={14} stroke={2.6} />
      </div>
    </button>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 52, height: 32, borderRadius: 999,
        background: value ? 'var(--fa-success)' : 'var(--fa-sep-strong)',
        border: 'none', padding: 0, position: 'relative',
        transition: 'background 0.2s ease'
      }}>
      <div style={{
        position: 'absolute', top: 2,
        left: value ? 22 : 2,
        width: 28, height: 28, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.18)',
        transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1)'
      }} />
    </button>
  );
}

function Stepper({ value, onChange, min = 0, max = 999, step = 1, suffix }) {
  return (
    <div className="fa-step">
      <button onClick={() => onChange(Math.max(min, value - step))}><I.Minus size={16} /></button>
      <div className="v">{value}{suffix ? <span className="fa-muted" style={{ marginLeft: 4, fontWeight: 600 }}>{suffix}</span> : null}</div>
      <button onClick={() => onChange(Math.min(max, value + step))}><I.Plus size={16} /></button>
    </div>
  );
}

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState({
    name: '', sex: 'male', age: 30, height: 175, weight: 80, goalWeight: 72,
    goal: 'stability', experience: 'casual', equipment: ['bodyweight'],
    twoPerDay: false, diet: 'mediterranean', daysPerWeek: 4
  });
  const set = (k, v) => setP(prev => ({ ...prev, [k]: v }));
  const toggleEq = (id) => setP(prev => ({
    ...prev,
    equipment: prev.equipment.includes(id)
      ? prev.equipment.filter(e => e !== id)
      : [...prev.equipment, id]
  }));
  const steps = window.FaOnboarding.steps;
  const cur = steps[step].id;
  const last = step === steps.length - 1;
  const first = step === 0;

  const next = () => setStep(s => Math.min(steps.length - 1, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));
  const finish = () => {
    const profile = { ...p, onboarded: true };
    saveProfile(profile);
    onDone(profile);
  };

  const canContinue = () => {
    if (cur === 'name') return p.name.trim().length >= 1;
    if (cur === 'equipment') return p.equipment.length >= 1;
    return true;
  };

  return (
    <div className="fa-onb">
      <div className="fa-onb-top">
        {first
          ? <span style={{ width: 60 }} />
          : <button className="fa-onb-back" onClick={back}><I.ChevL size={20} /></button>}
        <div className="fa-onb-progress">
          {steps.map((_, i) => (
            <div key={i} className={`seg ${i < step ? 'done' : ''} ${i === step ? 'cur' : ''}`} />
          ))}
        </div>
        <span style={{ width: 60 }} />
      </div>

      <div className="fa-onb-body">
        {cur === 'welcome' && (
          <>
            <div style={{ marginTop: 40, marginBottom: 20, fontSize: 64, textAlign: 'center' }}>🏃‍♂️</div>
            <div className="fa-onb-eyebrow fa-text-center">Welcome</div>
            <div className="fa-onb-h fa-text-center">Your shape,<br/>your story.</div>
            <div className="fa-onb-s fa-text-center">Tell me a bit about you and I&apos;ll build a workout and food plan made for your body, your goal and the way you live.</div>
          </>
        )}

        {cur === 'name' && (
          <>
            <div className="fa-onb-eyebrow">First things first</div>
            <div className="fa-onb-h">What should I call you?</div>
            <div className="fa-onb-s">Just a first name is fine.</div>
            <div className="fa-field" style={{ padding: '18px 18px' }}>
              <input autoFocus value={p.name} onChange={e => set('name', e.target.value)} placeholder="Your name" style={{ textAlign: 'left', fontSize: 20 }} />
            </div>
          </>
        )}

        {cur === 'sex' && (
          <>
            <div className="fa-onb-eyebrow">A little context</div>
            <div className="fa-onb-h">Are you…</div>
            <div className="fa-onb-s">Used only to estimate your daily energy needs.</div>
            <div className="fa-onb-cards">
              <OnboardingChoice title="Male" selected={p.sex === 'male'} onClick={() => set('sex', 'male')} icon={<span style={{ fontSize: 22 }}>♂</span>} />
              <OnboardingChoice title="Female" selected={p.sex === 'female'} onClick={() => set('sex', 'female')} icon={<span style={{ fontSize: 22 }}>♀</span>} />
            </div>
          </>
        )}

        {cur === 'age' && (
          <>
            <div className="fa-onb-eyebrow">About you</div>
            <div className="fa-onb-h">How old are you?</div>
            <div className="fa-onb-s">We&apos;ll use this to dial in your calorie target.</div>
            <div className="fa-card fa-row-between" style={{ padding: '18px 22px' }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>Age</span>
              <Stepper value={p.age} onChange={v => set('age', v)} min={14} max={90} suffix="yr" />
            </div>
          </>
        )}

        {cur === 'height' && (
          <>
            <div className="fa-onb-eyebrow">Body</div>
            <div className="fa-onb-h">How tall are you?</div>
            <div className="fa-onb-s">In centimeters.</div>
            <div className="fa-card fa-row-between" style={{ padding: '18px 22px' }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>Height</span>
              <Stepper value={p.height} onChange={v => set('height', v)} min={130} max={230} suffix="cm" />
            </div>
          </>
        )}

        {cur === 'weight' && (
          <>
            <div className="fa-onb-eyebrow">Body</div>
            <div className="fa-onb-h">What do you weigh today?</div>
            <div className="fa-onb-s">No judgment — this is just your starting line.</div>
            <div className="fa-card fa-row-between" style={{ padding: '18px 22px' }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>Current weight</span>
              <Stepper value={p.weight} onChange={v => set('weight', v)} min={35} max={250} suffix="kg" />
            </div>
          </>
        )}

        {cur === 'goalWeight' && (
          <>
            <div className="fa-onb-eyebrow">Target</div>
            <div className="fa-onb-h">Where would you like to be?</div>
            <div className="fa-onb-s">Pick a weight that feels good for you, not a number from a magazine.</div>
            <div className="fa-card fa-row-between" style={{ padding: '18px 22px' }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>Goal weight</span>
              <Stepper value={p.goalWeight} onChange={v => set('goalWeight', v)} min={35} max={250} suffix="kg" />
            </div>
            <div className="fa-card fa-mt-12" style={{ padding: 16 }}>
              <div className="fa-card-sub">
                That&apos;s a <strong style={{ color: 'var(--fa-accent)' }}>{Math.abs(p.weight - p.goalWeight).toFixed(1)} kg</strong> {p.goalWeight < p.weight ? 'loss' : p.goalWeight > p.weight ? 'gain' : 'maintenance'}.
                A healthy pace is about 0.5–1 kg per week.
              </div>
            </div>
          </>
        )}

        {cur === 'goal' && (
          <>
            <div className="fa-onb-eyebrow">Your focus</div>
            <div className="fa-onb-h">What do you want most?</div>
            <div className="fa-onb-s">Pick the one that matters today — you can change it any time.</div>
            <div className="fa-onb-cards">
              {window.FaGoals.map(g => (
                <OnboardingChoice key={g.id}
                  title={g.title} desc={g.desc}
                  icon={<span style={{ fontSize: 22 }}>{g.emoji}</span>}
                  selected={p.goal === g.id}
                  onClick={() => set('goal', g.id)} />
              ))}
            </div>
          </>
        )}

        {cur === 'experience' && (
          <>
            <div className="fa-onb-eyebrow">Your level</div>
            <div className="fa-onb-h">How much do you train now?</div>
            <div className="fa-onb-s">Honest answers make better plans.</div>
            <div className="fa-onb-cards">
              {window.FaExperience.map(g => (
                <OnboardingChoice key={g.id} title={g.title} desc={g.desc}
                  icon={<I.Bolt size={20} />}
                  selected={p.experience === g.id}
                  onClick={() => set('experience', g.id)} />
              ))}
            </div>
          </>
        )}

        {cur === 'equipment' && (
          <>
            <div className="fa-onb-eyebrow">Your gear · pick all</div>
            <div className="fa-onb-h">What do you have?</div>
            <div className="fa-onb-s">Tap everything you can use. Your plan rotates between them.</div>
            <div className="fa-onb-cards">
              {window.FaEquipment.map(g => {
                const icon = { rope: <I.Rope size={20}/>, boxing: <I.Boxing size={20}/>, kettlebell: <I.Dumbbell size={20}/>,
                  bike: <I.Bike size={20}/>, yogamat: <I.Yoga size={20}/>, dumbbells: <I.Dumbbell size={20}/>,
                  bodyweight: <I.Bolt size={20}/>, bands: <I.Refresh size={20}/>, pullup: <I.Bolt size={20}/>, gym: <I.Dumbbell size={20}/>
                }[g.id];
                return (
                  <OnboardingChoice key={g.id} title={g.title} desc={g.desc}
                    icon={icon} multi selected={p.equipment.includes(g.id)}
                    onClick={() => toggleEq(g.id)} />
                );
              })}
            </div>
          </>
        )}

        {cur === 'twoPerDay' && (
          <>
            <div className="fa-onb-eyebrow">Frequency</div>
            <div className="fa-onb-h">Train twice a day?</div>
            <div className="fa-onb-s">A short mobility / cardio session in the morning and a longer strength or skill session later. Great for fat loss + mobility.</div>
            <div className="fa-card fa-row-between" style={{ padding: '18px 22px' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Two-a-day mode</div>
                <div className="fa-muted" style={{ fontSize: 13, marginTop: 2 }}>AM + PM sessions</div>
              </div>
              <Toggle value={p.twoPerDay} onChange={v => set('twoPerDay', v)} />
            </div>
          </>
        )}

        {cur === 'diet' && (
          <>
            <div className="fa-onb-eyebrow">Food</div>
            <div className="fa-onb-h">Any food preferences?</div>
            <div className="fa-onb-s">We&apos;ll keep meals familiar and easy to cook.</div>
            <div className="fa-onb-cards">
              {window.FaDiets.map(g => (
                <OnboardingChoice key={g.id} title={g.title} desc={g.desc}
                  icon={<I.Apple size={20} />}
                  selected={p.diet === g.id}
                  onClick={() => set('diet', g.id)} />
              ))}
            </div>
          </>
        )}

        {cur === 'days' && (
          <>
            <div className="fa-onb-eyebrow">Schedule</div>
            <div className="fa-onb-h">How many days a week?</div>
            <div className="fa-onb-s">Consistency matters more than intensity. Pick what you&apos;ll actually do.</div>
            <div className="fa-card fa-row-between" style={{ padding: '18px 22px' }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>Training days</span>
              <Stepper value={p.daysPerWeek} onChange={v => set('daysPerWeek', v)} min={2} max={7} suffix="/wk" />
            </div>
          </>
        )}

        {cur === 'review' && (() => {
          const gear = p.equipment.map(id => window.FaEquipment.find(e => e.id === id)?.title).filter(Boolean);
          return (
            <>
              <div style={{ marginTop: 20, marginBottom: 16, fontSize: 56, textAlign: 'center' }}>✨</div>
              <div className="fa-onb-eyebrow fa-text-center">All set</div>
              <div className="fa-onb-h fa-text-center">Your plan is ready.</div>
              <div className="fa-onb-s fa-text-center">A {window.FaGoals.find(g => g.id === p.goal)?.title.toLowerCase()} plan, {p.daysPerWeek}× per week{p.twoPerDay ? ', AM + PM' : ''}.</div>

              <div className="fa-list fa-mt-16">
                <div className="fa-list-row">
                  <div className="fa-list-icon" style={{ background: 'var(--fa-accent)' }}><I.Target size={16}/></div>
                  <div className="fa-list-text">
                    <div className="fa-list-title">{p.weight} kg → {p.goalWeight} kg</div>
                    <div className="fa-list-sub">{Math.abs(p.weight - p.goalWeight).toFixed(1)} kg to go</div>
                  </div>
                </div>
                <div className="fa-list-row">
                  <div className="fa-list-icon" style={{ background: 'var(--fa-success)' }}><I.Flame size={16}/></div>
                  <div className="fa-list-text">
                    <div className="fa-list-title">~{window.FaUtils.estimateDailyCalories(p)} kcal / day</div>
                    <div className="fa-list-sub">Estimated daily target for your goal</div>
                  </div>
                </div>
                <div className="fa-list-row">
                  <div className="fa-list-icon" style={{ background: 'var(--fa-blue)' }}><I.Calendar size={16}/></div>
                  <div className="fa-list-text">
                    <div className="fa-list-title">{p.daysPerWeek} days · {p.twoPerDay ? 'twice daily' : 'once daily'}</div>
                    <div className="fa-list-sub">{gear.slice(0, 3).join(' · ')}{gear.length > 3 ? ` + ${gear.length - 3} more` : ''}</div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      <div className="fa-onb-foot">
        {last
          ? <button className="fa-btn" onClick={finish}>Let&apos;s go <I.ChevR size={16}/></button>
          : <button className="fa-btn" disabled={!canContinue()} style={{ opacity: canContinue() ? 1 : 0.5 }} onClick={next}>
              {first ? 'Get started' : 'Continue'} <I.ChevR size={16}/>
            </button>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  ACTIVITY RINGS
// ════════════════════════════════════════════════════════════

function ActivityRings({ move = 0.78, exercise = 0.55, stand = 0.92 }) {
  const ring = (frac, r, color) => {
    const c = 2 * Math.PI * r;
    return (
      <circle cx="100" cy="100" r={r} fill="none" stroke={color}
        strokeWidth="16" strokeLinecap="round"
        strokeDasharray={`${c * Math.min(frac, 1)} ${c}`}
        transform="rotate(-90 100 100)" />
    );
  };
  const bg = (r) => <circle cx="100" cy="100" r={r} fill="none" stroke="#F2F2F7" strokeWidth="16" />;
  return (
    <svg className="fa-rings" viewBox="0 0 200 200">
      {bg(82)} {bg(62)} {bg(42)}
      {ring(move, 82, 'var(--fa-ring-move)')}
      {ring(exercise, 62, 'var(--fa-ring-exercise)')}
      {ring(stand, 42, 'var(--fa-ring-stand)')}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════
//  REST TIMER MODAL
// ════════════════════════════════════════════════════════════

function RestTimer({ seconds = 60, onClose }) {
  const [left, setLeft] = useState(seconds);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [paused]);
  useEffect(() => { if (left === 0) setTimeout(onClose, 600); }, [left, onClose]);

  const r = 100, c = 2 * Math.PI * r;
  const offset = c * (1 - left / seconds);
  const mm = String(Math.floor(left / 60)).padStart(1, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className="fa-timer-modal" onClick={onClose}>
      <div className="fa-timer-inner" onClick={e => e.stopPropagation()}>
        <div className="fa-timer-label">Rest</div>
        <svg className="fa-timer-svg" viewBox="0 0 240 240">
          <circle className="bg-ring" cx="120" cy="120" r={r} fill="none" strokeWidth="14"/>
          <circle className="fg-ring" cx="120" cy="120" r={r} fill="none" strokeWidth="14"
            strokeDasharray={c} strokeDashoffset={offset}
            transform="rotate(-90 120 120)" />
        </svg>
        <div className="fa-timer-num">{mm}:{ss}</div>
        <div className="fa-timer-actions">
          <button onClick={() => setPaused(p => !p)}>
            {paused ? <I.Play size={14}/> : <I.Pause size={14}/>} {paused ? 'Resume' : 'Pause'}
          </button>
          <button className="stop" onClick={onClose}><I.X size={14}/> End</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  AI TWEAK SHEET
// ════════════════════════════════════════════════════════════

function AiSheet({ context, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const quick = [
    { label: '🛏️  Make it easier today',    p: 'Make this workout 20% lighter — I slept badly.' },
    { label: '🔥  Make it harder',          p: 'Make this 20% harder, I&apos;m feeling strong today.' },
    { label: '⏱️  I only have 20 minutes',  p: 'Compress this into the most effective 20 minutes I can do right now.' },
    { label: '🚴  Swap for a bike ride',    p: 'Replace today&apos;s workout with a road bike session of similar effort.' }
  ];

  const run = (q) => {
    const text = q || prompt;
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    // Stub: real implementation calls Claude via /api/tweak.
    // For now we generate a sensible local response so the UX is complete.
    setTimeout(() => {
      const lines = [
        `Got it. Here&apos;s a tweak for ${context?.title || 'today'}:`,
        '',
        '• Cut the kettlebell sets from 4 → 3 to save time',
        '• Keep the 3 boxing rounds but make them 2 minutes each',
        '• Add a 5-minute mobility cooldown — pigeon, world&apos;s greatest stretch, thoracic openers',
        '',
        'Want me to apply it?'
      ].join('\n');
      setResult(lines);
      setLoading(false);
    }, 700);
  };

  return (
    <>
      <div className="fa-sheet-backdrop" onClick={onClose}/>
      <div className="fa-sheet" onClick={e => e.stopPropagation()}>
        <div className="fa-sheet-grab"/>
        <h3>Tweak with AI</h3>
        <p className="lead">Tell me how you feel today, or pick one. I&apos;ll adapt the plan around it.</p>

        <div className="fa-sheet-quick">
          {quick.map(q => (
            <button key={q.label} onClick={() => run(q.p)}>{q.label}</button>
          ))}
        </div>

        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. tired today, knee a bit sore, want to focus on core" />

        <button className="fa-btn fa-mt-12" disabled={loading || !prompt.trim()}
          style={{ opacity: (loading || !prompt.trim()) ? 0.5 : 1 }}
          onClick={() => run()}>
          <I.Sparkle size={16}/> {loading ? 'Thinking…' : 'Suggest a tweak'}
        </button>

        {result && (
          <div className="fa-ai-result">
            <div className="label"><I.Sparkle size={11}/> Suggested</div>
            <p style={{ whiteSpace: 'pre-line' }}>{result}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="fa-btn fa-btn-sm" onClick={onClose}>Apply</button>
              <button className="fa-btn fa-btn-sm fa-btn-secondary" onClick={() => { setResult(null); setPrompt(''); }}>Try another</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════
//  SHARED: AM/PM SESSION CARD
// ════════════════════════════════════════════════════════════

function SessionCard({ when, session, done, onStart, onToggle }) {
  if (!session) return null;
  return (
    <div className={`fa-sess ${when} ${done ? 'done' : ''}`}>
      <div className="badge">{when === 'am' ? <I.Sunrise size={20}/> : <I.Sunset size={20}/>}</div>
      <div className="info">
        <div className="when">{when === 'am' ? 'Morning' : 'Evening'} · {session.minutes} min</div>
        <div className="ttl">{session.title}</div>
        <div className="meta">~{session.calories} kcal · {session.focus.join(' · ')}</div>
      </div>
      <button className="play" onClick={done ? onToggle : onStart} aria-label={done ? 'Mark as not done' : 'Start session'}>
        {done ? <I.Check size={16} stroke={3}/> : <I.Play size={13}/>}
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  TODAY
// ════════════════════════════════════════════════════════════

function TodayScreen({ profile, onGoTo, sessionsDone, toggleSession }) {
  const todayIdx = window.FaUtils.todayIndex();
  const week = window.FaUtils.weekFor(profile);
  const today = week[todayIdx];
  const meals = window.FaUtils.mealsFor(profile).meals;
  const lostKg = (window.FaWeightHistory[0].w - window.FaWeightHistory[window.FaWeightHistory.length - 1].w).toFixed(1);
  const [water, setWater] = useState(3);
  const waterTarget = 8;

  return (
    <div className="fa-screen">
      <div className="fa-screen-top">
        <span className="fa-date">{window.FaUtils.dayLabel()}</span>
        <div className="fa-avatar">{window.FaUtils.initials(profile.name || 'You')}</div>
      </div>
      <h1 className="fa-title-lg">Hi {(profile.name || 'there').split(' ')[0]}.</h1>

      <div className="fa-section-label" style={{ marginTop: 4 }}>Today&apos;s sessions</div>
      <SessionCard when="am" session={today.am}
        done={!!sessionsDone[`${todayIdx}-am`]}
        onStart={() => onGoTo('workouts')}
        onToggle={() => toggleSession(`${todayIdx}-am`)} />
      {profile.twoPerDay && today.pm && (
        <SessionCard when="pm" session={today.pm}
          done={!!sessionsDone[`${todayIdx}-pm`]}
          onStart={() => onGoTo('workouts')}
          onToggle={() => toggleSession(`${todayIdx}-pm`)} />
      )}

      <div className="fa-stats">
        <div className="fa-stat">
          <div className="label">Weight</div>
          <div className="value">{profile.weight}<span className="unit">kg</span></div>
          <div className="delta down"><I.ChevDown size={12}/> {lostKg} kg this cycle</div>
        </div>
        <div className="fa-stat">
          <div className="label">Streak</div>
          <div className="value">12<span className="unit">days</span></div>
          <div className="delta"><I.Flame size={12}/> personal best</div>
        </div>
      </div>

      <div className="fa-section-label">Water</div>
      <div className="fa-card">
        <div className="fa-row-between">
          <div>
            <div className="fa-card-title">{(water * 0.25).toFixed(2)} L of 2.0 L</div>
            <div className="fa-card-sub">{water}/{waterTarget} cups · keep going</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="fa-btn-icon" onClick={() => setWater(Math.max(0, water - 1))}><I.Minus size={16}/></button>
            <button className="fa-btn-icon" onClick={() => setWater(Math.min(waterTarget, water + 1))} style={{ background: 'var(--fa-blue)', color: '#fff' }}><I.Plus size={16}/></button>
          </div>
        </div>
        <div className="fa-water-bar">
          {Array.from({ length: waterTarget }).map((_, i) => (
            <div key={i} className={`fa-water-cup ${i < water ? 'full' : ''}`}>
              <I.Water size={14}/>
            </div>
          ))}
        </div>
      </div>

      <div className="fa-section-label">Activity</div>
      <div className="fa-card">
        <ActivityRings move={0.78} exercise={0.55} stand={0.92} />
        <div className="fa-rings-legend">
          <div className="l"><span className="dot" style={{ background: 'var(--fa-ring-move)' }}/> Move 420/540</div>
          <div className="l"><span className="dot" style={{ background: 'var(--fa-ring-exercise)' }}/> Exercise 17/30</div>
          <div className="l"><span className="dot" style={{ background: 'var(--fa-ring-stand)' }}/> Stand 11/12</div>
        </div>
      </div>

      <div className="fa-section-label">Next meal</div>
      <div className="fa-meal" onClick={() => onGoTo('meals')} style={{ cursor: 'pointer' }}>
        <div className="fa-meal-thumb">{meals[2].emoji}</div>
        <div className="fa-meal-info">
          <div className="fa-meal-when">{meals[2].when}</div>
          <div className="fa-meal-title">{meals[2].title}</div>
          <div className="fa-meal-desc">{meals[2].desc}</div>
          <div className="fa-meal-macros">
            <span className="fa-macro-chip">{meals[2].kcal} kcal</span>
            <span className="fa-macro-chip">{meals[2].p}g P</span>
            <span className="fa-macro-chip">{meals[2].c}g C</span>
            <span className="fa-macro-chip">{meals[2].f}g F</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  WORKOUTS
// ════════════════════════════════════════════════════════════

function WorkoutsScreen({ profile }) {
  const week = window.FaUtils.weekFor(profile);
  const todayIdx = window.FaUtils.todayIndex();
  const [sel, setSel] = useState(todayIdx);
  const [block, setBlock] = useState('am');
  const [done, setDone] = useState({});
  const [timer, setTimer] = useState(null);
  const [ai, setAi] = useState(false);

  const w = week[sel];
  const cur = w[block] || w.am;
  const toggleDone = (i) => setDone(prev => ({ ...prev, [`${sel}-${block}-${i}`]: !prev[`${sel}-${block}-${i}`] }));

  const hasPM = profile.twoPerDay && w.pm;

  return (
    <div className="fa-screen">
      <div className="fa-screen-top">
        <span className="fa-date">{window.FaUtils.dayLabel()}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="fa-btn-icon" onClick={() => setAi(true)} title="Tweak with AI" style={{ color: 'var(--fa-accent)' }}>
            <I.Sparkle size={18}/>
          </button>
          <button className="fa-btn-icon" onClick={() => setTimer(60)} title="Rest timer">
            <I.Timer size={18}/>
          </button>
        </div>
      </div>
      <h1 className="fa-title-lg">Workouts</h1>

      <div className="fa-days">
        {week.map((d, i) => (
          <button key={i}
            className={`fa-day ${i === sel ? 'today' : ''} ${i < todayIdx ? 'done' : ''}`}
            onClick={() => { setSel(i); setDone({}); setBlock('am'); }}>
            <span className="dl">{d.day.slice(0,3).toUpperCase()}</span>
            <span className="dn">{i+1}</span>
            <span className="ds" />
          </button>
        ))}
      </div>

      {hasPM && (
        <div className="fa-seg fa-mt-16">
          <button className={block === 'am' ? 'active' : ''} onClick={() => setBlock('am')}>
            ☀️ Morning · {w.am.minutes}m
          </button>
          <button className={block === 'pm' ? 'active' : ''} onClick={() => setBlock('pm')}>
            🌙 Evening · {w.pm.minutes}m
          </button>
        </div>
      )}

      <div className="fa-card-lg fa-mt-16" style={{
        background: cur.exercises.length === 0
          ? 'linear-gradient(150deg, #6E6E73, #8E8E93)'
          : block === 'am'
            ? 'linear-gradient(150deg, #FFB169, #FF6B35)'
            : 'linear-gradient(150deg, #6E63E3, #AF52DE)',
        color: '#fff'
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.9 }}>
          {w.day} · {block === 'am' ? 'Morning' : 'Evening'}
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4 }}>{cur.title}</div>
        <div style={{ fontSize: 14, marginTop: 6, opacity: 0.92 }}>
          {cur.exercises.length === 0
            ? 'No workout planned. Rest is part of the program.'
            : `${cur.minutes} min · ~${cur.calories} kcal · ${cur.focus.join(' · ')}`}
        </div>
        {cur.exercises.length > 0 && (
          <button className="cta" style={{
            marginTop: 14, background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', padding: '10px 16px', borderRadius: 999, fontWeight: 600, fontSize: 14, display: 'inline-flex', gap: 6, alignItems: 'center'
          }} onClick={() => setTimer(60)}>
            <I.Play size={12}/> Begin
          </button>
        )}
      </div>

      {cur.exercises.length > 0 && <>
        <div className="fa-section-label">Exercises</div>
        <div className="fa-card">
          {cur.exercises.map((ex, i) => {
            const meta = window.FaExerciseLib[ex.id] || { name: ex.id, muscle: '' };
            const key = `${sel}-${block}-${i}`;
            return (
              <div key={i} className="fa-ex-row">
                <div className="fa-ex-thumb" style={{ fontSize: 24 }}>{meta.emoji}</div>
                <div className="fa-ex-info">
                  <div className="fa-ex-name">{meta.name}</div>
                  <div className="fa-ex-meta">{ex.sets} × {ex.reps} · rest {ex.rest} · {meta.muscle}</div>
                </div>
                <button className={`fa-ex-check ${done[key] ? 'done' : ''}`} onClick={() => toggleDone(i)}>
                  {done[key] && <I.Check size={14} stroke={3}/>}
                </button>
              </div>
            );
          })}
        </div>
      </>}

      {timer != null && <RestTimer seconds={timer} onClose={() => setTimer(null)}/>}
      {ai && <AiSheet context={cur} onClose={() => setAi(false)}/>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MEALS
// ════════════════════════════════════════════════════════════

function MealsScreen({ profile }) {
  const plan = window.FaUtils.mealsFor(profile);
  const [ai, setAi] = useState(false);
  const totals = plan.meals.reduce((acc, m) => ({
    kcal: acc.kcal + m.kcal, p: acc.p + m.p, c: acc.c + m.c, f: acc.f + m.f
  }), { kcal: 0, p: 0, c: 0, f: 0 });

  const pPct = Math.round((totals.p * 4 / totals.kcal) * 100);
  const cPct = Math.round((totals.c * 4 / totals.kcal) * 100);
  const fPct = 100 - pPct - cPct;

  return (
    <div className="fa-screen">
      <div className="fa-screen-top">
        <span className="fa-date">{window.FaUtils.dayLabel()}</span>
        <button className="fa-btn-icon" onClick={() => setAi(true)} style={{ color: 'var(--fa-accent)' }}>
          <I.Sparkle size={18}/>
        </button>
      </div>
      <h1 className="fa-title-lg">Meals</h1>

      <div className="fa-card-lg" style={{ background: 'linear-gradient(150deg, #FF6B35, #FF8E5C)', color: '#fff' }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.92 }}>Daily target</div>
        <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 4, lineHeight: 1 }}>
          {totals.kcal}<span style={{ fontSize: 16, fontWeight: 600, marginLeft: 4 }}>kcal</span>
        </div>
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[['Protein', totals.p, pPct, '#FFFFFF'],
            ['Carbs',   totals.c, cPct, 'rgba(255,255,255,0.78)'],
            ['Fats',    totals.f, fPct, 'rgba(255,255,255,0.55)']].map(([n, v, pct, col]) => (
            <div key={n}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.9 }}>{n}</div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.018em', marginTop: 2 }}>{v}g</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>{pct}%</div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.25)', borderRadius: 999, marginTop: 4 }}>
                <div style={{ width: `${pct}%`, background: col, height: '100%', borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fa-section-label">Mediterranean · Moroccan style</div>
      {plan.meals.map((m, i) => (
        <div key={i} className="fa-meal">
          <div className="fa-meal-thumb">{m.emoji}</div>
          <div className="fa-meal-info">
            <div className="fa-meal-when">{m.when}</div>
            <div className="fa-meal-title">{m.title}</div>
            <div className="fa-meal-desc">{m.desc}</div>
            <div className="fa-meal-macros">
              <span className="fa-macro-chip">{m.kcal} kcal</span>
              <span className="fa-macro-chip">{m.p}g P</span>
              <span className="fa-macro-chip">{m.c}g C</span>
              <span className="fa-macro-chip">{m.f}g F</span>
            </div>
          </div>
        </div>
      ))}

      <button className="fa-btn fa-btn-secondary fa-mt-16" onClick={() => setAi(true)}>
        <I.Sparkle size={16}/> Swap to a new menu
      </button>

      {ai && <AiSheet context={{ title: 'today&apos;s meals' }} onClose={() => setAi(false)}/>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  PROGRESS
// ════════════════════════════════════════════════════════════

function ProgressChart({ data }) {
  if (!data || data.length < 2) return null;
  const W = 320, H = 160, PAD = 30, PADX = 10;
  const ws = data.map(d => d.w);
  const min = Math.min(...ws) - 0.5;
  const max = Math.max(...ws) + 0.5;
  const x = (i) => PADX + (i / (data.length - 1)) * (W - PADX * 2);
  const y = (v) => PAD + (1 - (v - min) / (max - min)) * (H - PAD - 20);
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.w).toFixed(1)}`).join(' ');
  const area = `${path} L ${x(data.length - 1).toFixed(1)} ${H - 20} L ${x(0).toFixed(1)} ${H - 20} Z`;
  return (
    <svg className="fa-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="fa-area-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.32"/>
          <stop offset="100%" stopColor="#FF6B35" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <g className="grid">
        {[0, 0.33, 0.66, 1].map((f, i) => (
          <line key={i} x1={PADX} x2={W - PADX} y1={PAD + f * (H - PAD - 20)} y2={PAD + f * (H - PAD - 20)} />
        ))}
      </g>
      <path className="area" d={area} />
      <path className="line" d={path} />
      {data.map((d, i) => (
        <circle key={i} className="dot" cx={x(i)} cy={y(d.w)} r={i === data.length - 1 ? 5 : 3} />
      ))}
      <g className="axis">
        <text x={PADX} y={H - 4}>{data[0].d}</text>
        <text x={W - PADX} y={H - 4} textAnchor="end">{data[data.length - 1].d}</text>
        <text x={W - PADX} y={20} textAnchor="end">{max.toFixed(1)} kg</text>
        <text x={W - PADX} y={H - 24} textAnchor="end">{min.toFixed(1)} kg</text>
      </g>
    </svg>
  );
}

function ProgressScreen({ profile }) {
  const [tab, setTab] = useState('weight');
  const h = window.FaWeightHistory;
  const start = h[0].w, cur = h[h.length - 1].w, target = profile.goalWeight;
  const totalToLose = Math.abs(start - target);
  const lostSoFar = Math.abs(start - cur);
  const pct = Math.min(100, Math.max(0, Math.round((lostSoFar / totalToLose) * 100)));

  return (
    <div className="fa-screen">
      <div className="fa-screen-top">
        <span className="fa-date">{window.FaUtils.dayLabel()}</span>
        <button className="fa-btn-icon"><I.Plus size={18}/></button>
      </div>
      <h1 className="fa-title-lg">Progress</h1>

      <div className="fa-seg">
        <button className={tab === 'weight' ? 'active' : ''} onClick={() => setTab('weight')}>Weight</button>
        <button className={tab === 'photos' ? 'active' : ''} onClick={() => setTab('photos')}>Photos</button>
        <button className={tab === 'measure' ? 'active' : ''} onClick={() => setTab('measure')}>Measurements</button>
      </div>

      {tab === 'weight' && <>
        <div className="fa-card fa-mt-16">
          <div className="fa-row-between" style={{ alignItems: 'flex-end' }}>
            <div>
              <div className="fa-section-label" style={{ margin: 0 }}>Current</div>
              <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
                {cur.toFixed(1)}<span style={{ fontSize: 16, fontWeight: 600, color: 'var(--fa-text-3)', marginLeft: 4 }}>kg</span>
              </div>
              <div style={{ color: 'var(--fa-success)', fontWeight: 600, fontSize: 13, display: 'inline-flex', gap: 4, alignItems: 'center', marginTop: 4 }}>
                <I.ChevDown size={12}/> {(start - cur).toFixed(1)} kg total
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="fa-section-label" style={{ margin: 0 }}>Goal</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.018em' }}>{target} kg</div>
              <div className="fa-pill" style={{ marginTop: 6 }}>{pct}% there</div>
            </div>
          </div>
          <div className="fa-mt-16">
            <ProgressChart data={h} />
          </div>
        </div>

        <div className="fa-section-label">Weekly history</div>
        <div className="fa-list">
          {[...h].reverse().slice(0, 6).map((d, i, arr) => {
            const prev = arr[i + 1];
            const diff = prev ? d.w - prev.w : 0;
            return (
              <div key={i} className="fa-list-row">
                <div className="fa-list-icon" style={{ background: diff <= 0 ? 'var(--fa-success)' : 'var(--fa-warn)' }}>
                  <I.Scale size={14}/>
                </div>
                <div className="fa-list-text">
                  <div className="fa-list-title">{d.w.toFixed(1)} kg</div>
                  <div className="fa-list-sub">{d.d}</div>
                </div>
                <div className="fa-list-trail" style={{ color: diff <= 0 ? 'var(--fa-success)' : 'var(--fa-warn)', fontWeight: 600 }}>
                  {diff <= 0 ? '' : '+'}{diff.toFixed(1)} kg
                </div>
              </div>
            );
          })}
        </div>
      </>}

      {tab === 'photos' && <>
        <div className="fa-mt-16 fa-photos">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="fa-photo">
              <span className="tag">Week {Math.ceil(i/2)}</span>
              <I.Camera size={28}/>
            </div>
          ))}
        </div>
        <button className="fa-btn fa-mt-20"><I.Camera size={16}/> Add today&apos;s photos</button>
        <div className="fa-card-sub fa-mt-12 fa-text-center">Front · side · back. Same time, same light, weekly.</div>
      </>}

      {tab === 'measure' && <>
        <div className="fa-mt-16 fa-list">
          {[
            ['Chest',  '104 cm', '−1.5 cm'],
            ['Waist',  '98 cm',  '−4.0 cm'],
            ['Hips',   '103 cm', '−2.0 cm'],
            ['Arm',    '36 cm',  '+0.5 cm'],
            ['Thigh',  '62 cm',  '−1.0 cm']
          ].map(([n, v, d]) => (
            <div key={n} className="fa-list-row">
              <div className="fa-list-icon" style={{ background: 'var(--fa-accent)' }}><I.Ruler size={14}/></div>
              <div className="fa-list-text">
                <div className="fa-list-title">{n}</div>
                <div className="fa-list-sub">Last updated 5 days ago</div>
              </div>
              <div className="fa-list-trail" style={{ fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
        <button className="fa-btn fa-mt-20"><I.Ruler size={16}/> Update measurements</button>
      </>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  PROFILE
// ════════════════════════════════════════════════════════════

function ProfileScreen({ profile, onReset, onUpdate }) {
  const bmi = window.FaUtils.bmi(profile.weight, profile.height);
  const goal = window.FaGoals.find(g => g.id === profile.goal);
  const diet = window.FaDiets.find(d => d.id === profile.diet);
  const equipNames = (profile.equipment || []).map(id => window.FaEquipment.find(e => e.id === id)?.title).filter(Boolean);
  const kcal = window.FaUtils.estimateDailyCalories(profile);
  const [ai, setAi] = useState(false);

  return (
    <div className="fa-screen">
      <div className="fa-screen-top">
        <span className="fa-date">Profile</span>
        <button className="fa-btn-icon"><I.Settings size={18}/></button>
      </div>

      <div className="fa-card-lg fa-text-center" style={{ paddingTop: 28, paddingBottom: 22 }}>
        <div style={{
          width: 84, height: 84, borderRadius: '50%', margin: '0 auto 12px',
          background: 'linear-gradient(135deg, var(--fa-accent), var(--fa-accent-2))',
          display: 'grid', placeItems: 'center', color: '#fff', fontSize: 30, fontWeight: 700,
          boxShadow: '0 12px 28px rgba(255,107,53,0.30)'
        }}>
          {window.FaUtils.initials(profile.name || 'You')}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.018em' }}>{profile.name || 'You'}</div>
        <div className="fa-muted" style={{ fontSize: 14, marginTop: 2 }}>
          {profile.age} yr · {profile.height} cm · BMI {bmi}
        </div>
        <div className="fa-pill" style={{ marginTop: 10 }}>{goal?.emoji} {goal?.title}</div>
      </div>

      <div className="fa-section-label">Your plan</div>
      <div className="fa-list">
        <div className="fa-list-row">
          <div className="fa-list-icon" style={{ background: 'var(--fa-accent)' }}><I.Target size={14}/></div>
          <div className="fa-list-text">
            <div className="fa-list-title">Goal weight</div>
            <div className="fa-list-sub">{profile.weight} kg → {profile.goalWeight} kg</div>
          </div>
          <I.ChevR size={16} style={{ color: 'var(--fa-text-4)' }} />
        </div>
        <div className="fa-list-row">
          <div className="fa-list-icon" style={{ background: 'var(--fa-success)' }}><I.Flame size={14}/></div>
          <div className="fa-list-text">
            <div className="fa-list-title">Daily calories</div>
            <div className="fa-list-sub">~{kcal} kcal target</div>
          </div>
          <I.ChevR size={16} style={{ color: 'var(--fa-text-4)' }} />
        </div>
        <div className="fa-list-row">
          <div className="fa-list-icon" style={{ background: 'var(--fa-blue)' }}><I.Calendar size={14}/></div>
          <div className="fa-list-text">
            <div className="fa-list-title">Training schedule</div>
            <div className="fa-list-sub">{profile.daysPerWeek} days · {profile.twoPerDay ? 'twice daily' : 'once daily'}</div>
          </div>
          <I.ChevR size={16} style={{ color: 'var(--fa-text-4)' }} />
        </div>
        <div className="fa-list-row">
          <div className="fa-list-icon" style={{ background: 'var(--fa-warn)' }}><I.Dumbbell size={14}/></div>
          <div className="fa-list-text">
            <div className="fa-list-title">Your gear</div>
            <div className="fa-list-sub">{equipNames.join(' · ') || 'None selected'}</div>
          </div>
          <I.ChevR size={16} style={{ color: 'var(--fa-text-4)' }} />
        </div>
        <div className="fa-list-row">
          <div className="fa-list-icon" style={{ background: 'var(--fa-purple)' }}><I.Apple size={14}/></div>
          <div className="fa-list-text">
            <div className="fa-list-title">Food style</div>
            <div className="fa-list-sub">{diet?.title}</div>
          </div>
          <I.ChevR size={16} style={{ color: 'var(--fa-text-4)' }} />
        </div>
      </div>

      <div className="fa-section-label">Preferences</div>
      <div className="fa-list">
        <div className="fa-list-row">
          <div className="fa-list-icon" style={{ background: '#FF9500' }}><I.Bell size={14}/></div>
          <div className="fa-list-text">
            <div className="fa-list-title">Reminders</div>
            <div className="fa-list-sub">Workouts & meals</div>
          </div>
          <I.ChevR size={16} style={{ color: 'var(--fa-text-4)' }} />
        </div>
        <button className="fa-list-row" onClick={() => setAi(true)}>
          <div className="fa-list-icon" style={{ background: '#5856D6' }}><I.Sparkle size={14}/></div>
          <div className="fa-list-text">
            <div className="fa-list-title">Tweak my plan with AI</div>
            <div className="fa-list-sub">Ask for changes any time</div>
          </div>
          <I.ChevR size={16} style={{ color: 'var(--fa-text-4)' }} />
        </button>
        <div className="fa-list-row">
          <div className="fa-list-icon" style={{ background: 'var(--fa-text-3)' }}><I.Edit size={14}/></div>
          <div className="fa-list-text">
            <div className="fa-list-title">Edit profile</div>
            <div className="fa-list-sub">Name, age, body data</div>
          </div>
          <I.ChevR size={16} style={{ color: 'var(--fa-text-4)' }} />
        </div>
      </div>

      <button className="fa-btn fa-btn-secondary fa-mt-20" onClick={onReset}>
        <I.Logout size={16}/> Reset & start onboarding again
      </button>
      <div className="fa-card-sub fa-mt-12 fa-text-center">v0.2 · design preview · mock data</div>

      {ai && <AiSheet context={{ title: 'whole plan' }} onClose={() => setAi(false)}/>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  TAB BAR
// ════════════════════════════════════════════════════════════

function TabBar({ tab, onTab }) {
  const items = [
    { id: 'today',    label: 'Today',    Icon: I.Today },
    { id: 'workouts', label: 'Workouts', Icon: I.Dumbbell },
    { id: 'meals',    label: 'Meals',    Icon: I.Fork },
    { id: 'progress', label: 'Progress', Icon: I.Chart },
    { id: 'profile',  label: 'Me',       Icon: I.Profile }
  ];
  return (
    <nav className="fa-tabbar">
      {items.map(it => (
        <button key={it.id}
          className={`fa-tab ${tab === it.id ? 'active' : ''}`}
          onClick={() => onTab(it.id)}>
          <it.Icon size={24} />
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

function App() {
  const [profile, setProfile] = useState(() => loadProfile());
  const [tab, setTab] = useState('today');
  const [sessionsDone, setSessionsDone] = useState({});
  const toggleSession = (key) => setSessionsDone(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (!profile) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('demo') === '1') {
        const p = window.FaDefaultProfile;
        saveProfile(p);
        setProfile(p);
      }
    }
  }, []);

  if (!profile || !profile.onboarded) {
    return <Onboarding onDone={(p) => { setProfile(p); setTab('today'); }} />;
  }

  return (
    <div className="fa-app">
      {tab === 'today'    && <TodayScreen   profile={profile} onGoTo={setTab} sessionsDone={sessionsDone} toggleSession={toggleSession} />}
      {tab === 'workouts' && <WorkoutsScreen profile={profile} />}
      {tab === 'meals'    && <MealsScreen    profile={profile} />}
      {tab === 'progress' && <ProgressScreen profile={profile} />}
      {tab === 'profile'  && <ProfileScreen  profile={profile}
                                onUpdate={(p) => { saveProfile(p); setProfile(p); }}
                                onReset={() => { localStorage.removeItem(STORAGE_KEY); setProfile(null); }} />}
      <TabBar tab={tab} onTab={setTab} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
