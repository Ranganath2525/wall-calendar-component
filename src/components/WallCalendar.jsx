import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

/**
 * ENHANCED WALL CALENDAR COMPONENT (v2.0)
 * A premium, self-contained, interactive React physical-style wall calendar.
 * Features:
 * - Click + Drag range selection
 * - Simulated AI Smart Notes (keyword suggestions)
 * - Indian Holidays localization
 * - Premium UI/UX with high contrast & smooth animations
 * - Persistent notes (localStorage)
 */

// --- CONSTANTS ---

const MONTHS = [
  { name: 'January', keyword: 'snow mountains', vibe: '#3b82f6', image: 'https://images.unsplash.com/photo-1418985991508-e47386d96a71?auto=format&fit=crop&q=80&w=1200' },
  { name: 'February', keyword: 'winter forest', vibe: '#8b5cf6', image: 'https://images.unsplash.com/photo-1477601263568-184e1c6b7484?auto=format&fit=crop&q=80&w=1200' },
  { name: 'March', keyword: 'spring flowers', vibe: '#10b981', image: 'https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?auto=format&fit=crop&q=80&w=1200' },
  { name: 'April', keyword: 'green nature', vibe: '#ec4899', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1200' },
  { name: 'May', keyword: 'mountain greenery', vibe: '#22c55e', image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=1200' },
  { name: 'June', keyword: 'beach summer', vibe: '#06b6d4', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200' },
  { name: 'July', keyword: 'sunflower field', vibe: '#f59e0b', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1200' },
  { name: 'August', keyword: 'monsoon rain', vibe: '#fbbf24', image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=1200' },
  { name: 'September', keyword: 'autumn lake', vibe: '#d97706', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200' },
  { name: 'October', keyword: 'autumn leaves', vibe: '#ea580c', image: 'https://images.unsplash.com/photo-1507783548227-544c3b8fc055?auto=format&fit=crop&q=80&w=1200' },
  { name: 'November', keyword: 'foggy road', vibe: '#64748b', image: 'https://images.unsplash.com/photo-1503435824048-a799a3a84bf7?auto=format&fit=crop&q=80&w=1200' },
  { name: 'December', keyword: 'festive winter', vibe: '#ef4444', image: 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&q=80&w=1200' }
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Indian Holidays (Static approx for 2026/27)
const HOLIDAYS = {
  '0-1': "New Year's Day",
  '0-14': 'Pongal / Makar Sankranti',
  '0-26': 'Republic Day',
  '2-4': 'Holi',
  '7-15': 'Independence Day',
  '9-2': 'Gandhi Jayanti',
  '9-20': 'Dussehra',
  '10-8': 'Diwali',
  '11-25': 'Christmas'
};

const SMART_SUGGESTIONS = [
  { keyword: 'meeting', suggest: 'Team sync at 10 AM 📅' },
  { keyword: 'birthday', suggest: 'Reminder: Buy a gift 🎁' },
  { keyword: 'travel', suggest: 'Pack essentials & check flight ✈️' },
  { keyword: 'gym', suggest: 'Strength training session 🏋️' },
  { keyword: 'call', suggest: 'Follow-up call with client 📞' },
  { keyword: 'shopping', suggest: 'Grocery run: Milk, eggs, fruits 🛒' }
];

// --- UTILS ---

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
const formatDateKey = (year, month, day) => `${year}-${month}-${day}`;
const parseDateKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m, d);
};

// --- COMPONENT ---

const WallCalendar = () => {
  // --- STATE ---
  const [viewDate, setViewDate] = useState(new Date());
  const [selection, setSelection] = useState({ start: null, end: null });
  const [isDragging, setIsDragging] = useState(false);
  const [hoverDate, setHoverDate] = useState(null);
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('calendar_notes_v2');
    return saved ? JSON.parse(saved) : { months: {}, ranges: {} };
  });
  const [accentColor, setAccentColor] = useState(MONTHS[viewDate.getMonth()].vibe);
  const [activeNoteTab, setActiveNoteTab] = useState('month');
  const [isAnimating, setIsAnimating] = useState(false);
  const [animDirection, setAnimDirection] = useState('next'); // 'next' | 'prev'

  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const gridRef = useRef(null);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('calendar_notes_v2', JSON.stringify(notes));
  }, [notes]);

  // --- SELECTION LOGIC ---
  const sortedSelection = useMemo(() => {
    if (!selection.start || !selection.end) return selection;
    const s = selection.start;
    const e = selection.end;
    return s > e ? { start: e, end: s } : selection;
  }, [selection]);

  const rangeKey = useMemo(() => {
    if (!sortedSelection.start || !sortedSelection.end) return null;
    return `${formatDateKey(sortedSelection.start.getFullYear(), sortedSelection.start.getMonth(), sortedSelection.start.getDate())}_${formatDateKey(sortedSelection.end.getFullYear(), sortedSelection.end.getMonth(), sortedSelection.end.getDate())}`;
  }, [sortedSelection]);

  // --- THEME EXTRACTION ---
  const extractColor = useCallback(() => {
    if (!imgRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;

    try {
      canvas.width = 10;
      canvas.height = 10;
      ctx.drawImage(img, 0, 0, 10, 10);
      const data = ctx.getImageData(0, 0, 10, 10).data;
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]; g += data[i+1]; b += data[i+2];
      }
      const count = data.length / 4;
      setAccentColor(`rgb(${Math.round(r/count)}, ${Math.round(g/count)}, ${Math.round(b/count)})`);
    } catch (e) {
      setAccentColor(MONTHS[currentMonth].vibe);
    }
  }, [currentMonth]);

  // --- DRAG HANDLERS ---
  const handleMouseDown = (date) => {
    setIsDragging(true);
    setSelection({ start: date, end: date });
  };

  const handleMouseEnter = (date) => {
    if (isDragging) {
      setSelection(prev => ({ ...prev, end: date }));
    }
    setHoverDate(date);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (selection.start && selection.end && selection.start.getTime() !== selection.end.getTime()) {
        setActiveNoteTab('range');
      }
    }
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, selection]);

  // --- NAVIGATION ---
  const changeMonth = (offset) => {
    setAnimDirection(offset > 0 ? 'next' : 'prev');
    setIsAnimating(true);
    setTimeout(() => {
      const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
      setViewDate(next);
      setIsAnimating(false);
    }, 500);
  };

  // --- NOTE LOGIC ---
  const handleNoteChange = (type, val) => {
    if (type === 'month') {
      setNotes(prev => ({
        ...prev,
        months: { ...prev.months, [`${currentYear}-${currentMonth}`]: val }
      }));
    } else if (rangeKey) {
      setNotes(prev => ({
        ...prev,
        ranges: { ...prev.ranges, [rangeKey]: val }
      }));
    }
  };

  const getSmartSuggestion = (text) => {
    if (!text) return null;
    const lower = text.toLowerCase();
    return SMART_SUGGESTIONS.find(s => lower.includes(s.keyword));
  };

  // --- RENDER HELPERS ---
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

  const getDayStatus = (d) => {
    const date = new Date(currentYear, currentMonth, d);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    let isSelected = false;
    let isRangeMid = false;
    let isRangeStart = false;
    let isRangeEnd = false;

    const currentSelection = sortedSelection;

    if (currentSelection.start && currentSelection.end) {
      isRangeStart = date.toDateString() === currentSelection.start.toDateString();
      isRangeEnd = date.toDateString() === currentSelection.end.toDateString();
      isRangeMid = date > currentSelection.start && date < currentSelection.end;
      isSelected = isRangeStart || isRangeEnd;
    }

    return { isToday, isSelected, isRangeMid, isRangeStart, isRangeEnd };
  };

  const hasNote = (d) => {
    const date = new Date(currentYear, currentMonth, d);
    for (const [key, note] of Object.entries(notes.ranges)) {
      if (!note.trim()) continue;
      const [startKey, endKey] = key.split('_').map(parseDateKey);
      if (date >= startKey && date <= endKey) return true;
    }
    return false;
  };

  const currentMonthImage = MONTHS[currentMonth].image;

  return (
    <div className="min-h-screen bg-amber-50 p-4 md:p-10 flex items-center justify-center font-sans">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Container with shadow & depth */}
      <div 
        className="w-full max-w-6xl bg-[#fdf6ec] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col md:flex-row relative border-t-[10px] border-neutral-300 transform transition-all duration-500"
        style={{ '--accent': accentColor }}
      >
        {/* PHYSICAL DECORATOR: BINDING STRIP */}
        <div className="absolute top-0 left-0 w-full h-3 flex justify-around px-8 z-30 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="w-5 h-6 -mt-3 bg-neutral-400 rounded-b-full border-x-2 border-b-2 border-neutral-500 shadow-lg" />
          ))}
        </div>

        {/* --- LEFT SECTION: HERO --- */}
        <div className="md:w-5/12 relative h-56 md:h-auto overflow-hidden group">
          <img 
            ref={imgRef}
            src={currentMonthImage} 
            alt={MONTHS[currentMonth].name}
            crossOrigin="anonymous"
            onLoad={extractColor}
            className={`w-full h-full object-cover transition-opacity duration-700 transform ${isAnimating ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
          />
          {/* Enhanced Overlay for text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <div className={`absolute bottom-8 left-8 text-white transition-all duration-500 transform ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.8] mb-2 drop-shadow-lg">
              {MONTHS[currentMonth].name}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-light opacity-80 tracking-widest">{currentYear}</span>
              <div className="h-[2px] w-12 bg-white/40" />
            </div>
          </div>

          <button 
            onClick={() => { setViewDate(new Date()); setSelection({ start: null, end: null }); }}
            className="absolute top-8 right-8 px-6 py-2 bg-white/20 backdrop-blur-xl rounded-full text-xs font-bold uppercase tracking-widest border border-white/30 hover:bg-white/40 hover:scale-105 transition-all active:scale-95 z-40"
          >
            Today
          </button>
        </div>

        {/* --- RIGHT SECTION: CALENDAR --- */}
        <div className="md:w-7/12 flex flex-col p-6 md:p-12 relative bg-paper select-none">
          
          {/* NAV CONTROLS */}
          <div className="flex justify-between items-center mb-10">
            <div className="flex gap-4">
              <NavButton onClick={() => changeMonth(-1)} icon="prev" />
              <NavButton onClick={() => changeMonth(1)} icon="next" />
            </div>
            
            <div className="text-right">
              <span className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400 block mb-1">Calendar View</span>
              <span className="text-xl font-bold text-neutral-900">{MONTHS[currentMonth].name}</span>
            </div>
          </div>

          {/* GRID */}
          <div className={`transition-all duration-500 ${isAnimating ? `opacity-0 ${animDirection === 'next' ? 'translate-x-10' : '-translate-x-10'}` : 'opacity-100 translate-x-0'}`}>
            {/* Weekday Labels */}
            <div className="grid grid-cols-7 mb-6 border-b border-neutral-100 pb-2">
              {WEEKDAYS.map(day => (
                <div key={day} className="text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">{day}</div>
              ))}
            </div>

            <div 
              ref={gridRef}
              className="grid grid-cols-7 gap-y-2 relative"
            >
              {/* Prev Month Fill */}
              {[...Array(firstDay)].map((_, i) => (
                <div key={`p-${i}`} className="h-14 md:h-16 flex items-center justify-center text-neutral-200 opacity-30 text-sm font-medium">
                  {prevMonthDays - firstDay + i + 1}
                </div>
              ))}

              {/* Current Month Days */}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const date = new Date(currentYear, currentMonth, day);
                const { isToday, isSelected, isRangeMid, isRangeStart, isRangeEnd } = getDayStatus(day);
                const holiday = HOLIDAYS[`${currentMonth}-${day}`];
                const noted = hasNote(day);

                return (
                  <div 
                    key={day} 
                    className="relative h-14 md:h-16 flex items-center justify-center group cursor-pointer perspective-1000"
                    onMouseDown={(e) => { e.preventDefault(); handleMouseDown(date); }}
                    onMouseEnter={() => handleMouseEnter(date)}
                    onMouseUp={handleMouseUp}
                  >
                    {/* Range Band Background */}
                    {isRangeMid && (
                      <div className="absolute inset-y-1 left-0 right-0 bg-[var(--accent)] opacity-15 transition-all duration-200" />
                    )}
                    {isRangeStart && selection.end && selection.end > selection.start && (
                      <div className="absolute inset-y-1 left-1/2 right-0 bg-[var(--accent)] opacity-15 rounded-l-full" />
                    )}
                    {isRangeEnd && selection.start && selection.start < selection.end && (
                      <div className="absolute inset-y-1 left-0 right-1/2 bg-[var(--accent)] opacity-15 rounded-r-full" />
                    )}

                    {/* Day Number Interaction */}
                    <div 
                      className={`
                        z-10 w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-sm md:text-base font-bold transition-all duration-300 relative
                        ${isSelected ? 'bg-[var(--accent)] text-white shadow-lg scale-110' : 'text-gray-900 hover:bg-amber-100/50 hover:scale-110 active:scale-95'}
                        ${isToday && !isSelected ? 'text-[var(--accent)] ring-2 ring-[var(--accent)]/50 ring-offset-2' : ''}
                      `}
                    >
                      {day}
                      
                      {/* Note Indicator */}
                      {noted && (
                        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full shadow-sm animate-pulse ${isSelected ? 'bg-white' : 'bg-[var(--accent)]'}`} />
                      )}
                    </div>

                    {/* Holiday Dot */}
                    {holiday && (
                       <div className="absolute top-1 right-1 group/holiday z-40">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-sm" />
                          <div className="absolute bottom-full right-0 mb-3 px-3 py-1 bg-neutral-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/holiday:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-2xl scale-50 group-hover/holiday:scale-100 origin-bottom-right">
                            🇮🇳 {holiday}
                          </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* --- BOTTOM SECTION: NOTES --- */}
          <div className="mt-auto pt-10">
            <div className="flex items-center gap-8 mb-6">
              <TabButton active={activeNoteTab === 'month'} onClick={() => setActiveNoteTab('month')} label="Month Memo" />
              <TabButton active={activeNoteTab === 'range'} onClick={() => setActiveNoteTab('range')} disabled={!rangeKey} label="Range Intel" />
            </div>

            <div className="bg-white rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.03)] border border-neutral-100 p-5 min-h-[160px] flex flex-col relative transition-all duration-300">
              
              {activeNoteTab === 'month' ? (
                <div className="flex flex-col h-full animate-fade-in">
                  <textarea 
                    value={notes.months[`${currentYear}-${currentMonth}`] || ''}
                    onChange={(e) => handleNoteChange('month', e.target.value)}
                    placeholder={`Jot down thoughts for ${MONTHS[currentMonth].name}...`}
                    className="w-full bg-transparent border-none focus:ring-0 text-gray-800 font-medium placeholder:text-neutral-300 resize-none flex-grow"
                  />
                  <SuggestionChip text={notes.months[`${currentYear}-${currentMonth}`]} onApply={(val) => handleNoteChange('month', val)} />
                </div>
              ) : (
                <div className="flex flex-col h-full animate-fade-in">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                      {sortedSelection.start?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {sortedSelection.end?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    <button onClick={() => setSelection({ start: null, end: null })} className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter hover:underline">Clear Range</button>
                  </div>
                  <textarea 
                    value={notes.ranges[rangeKey] || ''}
                    onChange={(e) => handleNoteChange('range', e.target.value)}
                    placeholder="Describe this marked duration..."
                    className="w-full bg-transparent border-none focus:ring-0 text-gray-800 font-medium placeholder:text-neutral-300 resize-none flex-grow"
                  />
                  <SuggestionChip text={notes.ranges[rangeKey]} onApply={(val) => handleNoteChange('range', val)} />
                </div>
              )}

              {/* Decorative corner tag */}
              <div className="absolute top-[-1px] right-8 w-6 h-3 bg-[var(--accent)] rounded-b-md opacity-20 pointer-events-none" />
            </div>
          </div>

        </div>
      </div>

      {/* TEXTURE OVERLAY */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.05] grayscale bg-[url('https://www.transparenttextures.com/patterns/felt.png')] z-[60]" />
    </div>
  );
};

// --- SUB-COMPONENTS ---

const NavButton = ({ onClick, icon }) => (
  <button 
    onClick={onClick}
    className="w-10 h-10 flex items-center justify-center bg-white border border-neutral-100 rounded-xl shadow-sm text-neutral-600 hover:text-neutral-900 hover:shadow-md hover:scale-110 active:scale-95 transition-all"
  >
    {icon === 'prev' ? (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
    ) : (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
    )}
  </button>
);

const TabButton = ({ active, onClick, disabled, label }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`text-xs font-black uppercase tracking-[0.2em] transition-all pb-1 border-b-2 ${disabled ? 'opacity-20 cursor-not-allowed' : ''} ${active ? 'text-neutral-900 border-[var(--accent)]' : 'text-neutral-300 border-transparent hover:text-neutral-500'}`}
  >
    {label}
  </button>
);

const SuggestionChip = ({ text, onApply }) => {
  const suggestion = useMemo(() => {
    if (!text || text.length < 3) return null;
    const lower = text.toLowerCase();
    return SMART_SUGGESTIONS.find(s => lower.includes(s.keyword));
  }, [text]);

  if (!suggestion) return <div className="h-6" />;

  return (
    <div 
      onClick={() => onApply(suggestion.suggest)}
      className="flex items-center gap-2 cursor-pointer group animate-slide-up"
    >
      <div className="px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 rounded-full text-[10px] font-bold flex items-center gap-1.5 group-hover:bg-[var(--accent)]/20 transition-all">
        <span className="animate-pulse">✨</span>
        Smart Suggestion: <span className="font-black italic">"{suggestion.suggest}"</span>
      </div>
    </div>
  );
};

export default WallCalendar;
