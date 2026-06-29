import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './Home.css';

/* ─── DATA ──────────────────────────────────────────────────────────────── */

const NAV_ITEMS = [
  { label: 'Platform', href: '#features' },
  { label: 'Courses', href: '#courses' },
  { label: 'AI', href: '#ai' },
  { label: 'Journey', href: '#journey' },
  { label: 'FAQ', href: '#faq' },
];

const STATS = [
  { value: 1200, suffix: '+', label: 'Engineers Enrolled', icon: '🎓' },
  { value: 94, suffix: '%', label: 'Completion Rate', icon: '📈' },
  { value: 18000, suffix: '+', label: 'AI Conversations', icon: '🤖' },
  { value: 640, suffix: '+', label: 'Certificates Issued', icon: '🏅' },
];

const COURSES = [
  {
    title: 'MATLAB Programming',
    subtitle: 'Foundation Track',
    duration: '6 weeks',
    level: 'Beginner',
    rating: 4.9,
    students: 420,
    accent: '#FF6B00',
    tag: 'Most Popular',
    desc: 'Build engineering logic with scripts, functions, plotting, and numerical workflows.',
  },
  {
    title: 'Simulink',
    subtitle: 'Simulation Track',
    duration: '8 weeks',
    level: 'Intermediate',
    rating: 4.8,
    students: 310,
    accent: '#2563EB',
    tag: 'Industry Standard',
    desc: 'Model, simulate, and validate systems using professional block-based design flows.',
  },
  {
    title: 'Embedded C',
    subtitle: 'Systems Track',
    duration: '7 weeks',
    level: 'Intermediate',
    rating: 4.9,
    students: 280,
    accent: '#7C3AED',
    tag: 'High Demand',
    desc: 'Master microcontroller-ready C, memory, IO, timing, and practical firmware patterns.',
  },
  {
    title: 'Automotive Control',
    subtitle: 'Advanced Track',
    duration: '10 weeks',
    level: 'Advanced',
    rating: 4.9,
    students: 190,
    accent: '#059669',
    tag: 'Career Track',
    desc: 'Learn control fundamentals for real vehicle systems, calibration, and validation.',
  },
];

const FEATURES = [
  { icon: '🤖', title: 'Wisdomy AI', desc: 'Context-aware guidance for assignments, doubts, and revision support — available 24/7.', size: 'lg' },
  { icon: '📊', title: 'Live Analytics', desc: 'Real-time dashboards for students and admins with cohort-level insights.', size: 'sm' },
  { icon: '🏆', title: 'Leaderboard', desc: 'Performance rankings that motivate consistent progress.', size: 'sm' },
  { icon: '📋', title: 'Smart Assignments', desc: 'Practical submissions with auto-evaluation pipelines and deadline tracking.', size: 'md' },
  { icon: '🎓', title: 'Certificates', desc: 'Verified completion credentials that link directly to your profile.', size: 'md' },
  { icon: '⚡', title: 'Learning Streaks', desc: 'Daily consistency signals that build engineering habits.', size: 'sm' },
  { icon: '🔒', title: 'Role-Based Access', desc: 'Separate, focused experiences for students and admins.', size: 'sm' },
];

const JOURNEY_STEPS = [
  { step: '01', title: 'Register', desc: 'Create your student account in under 2 minutes.', icon: '✦' },
  { step: '02', title: 'Enroll', desc: 'Choose from engineering-focused course tracks.', icon: '◈' },
  { step: '03', title: 'Learn', desc: 'Study notes, MCQs, and AI-powered guidance.', icon: '◎' },
  { step: '04', title: 'Submit', desc: 'Practical assignments with real-world workflows.', icon: '◆' },
  { step: '05', title: 'Track', desc: 'Monitor attendance, progress, and leaderboard rank.', icon: '◉' },
  { step: '06', title: 'Certify', desc: 'Earn verified credentials on completion.', icon: '★' },
];

const TESTIMONIALS = [
  {
    name: 'Aarav Patil',
    role: 'Mechanical Engineering, Final Year',
    college: 'VIIT Pune',
    text: 'MATLAB and Simulink actually made sense once I did the practical assignments. Wisdomy helped me revise faster than any textbook.',
    rating: 5,
    initials: 'AP',
    color: '#FF6B00',
  },
  {
    name: 'Neha Sharma',
    role: 'Electronics Engineering',
    college: 'MIT Aurangabad',
    text: 'One platform for attendance, notes, MCQs, and certificates. Everything engineering learning should be.',
    rating: 5,
    initials: 'NS',
    color: '#2563EB',
  },
  {
    name: 'Rohan Deshmukh',
    role: 'Automotive Systems Learner',
    college: 'COEP Pune',
    text: 'The automotive control content bridged the classroom-to-industry gap. It gave me real confidence for project interviews.',
    rating: 5,
    initials: 'RD',
    color: '#7C3AED',
  },
];

const FAQS = [
  {
    q: 'Is Netwisdome only for engineering students?',
    a: 'The platform is purpose-built around engineering workflows — MATLAB, Simulink, Embedded C, and automotive control systems. It\'s optimized for engineering learners who want practical, career-ready skills.',
  },
  {
    q: 'Can admins manage courses and batches independently?',
    a: 'Yes. The admin dashboard provides full control over learning operations — course creation, batch management, attendance, and analytics — completely separate from the student experience.',
  },
  {
    q: 'Does Wisdomy AI replace instructors?',
    a: 'No. Wisdomy supports students with real-time guidance and clarification. Instructors own the teaching and evaluation experience. AI is a learning accelerator, not a replacement.',
  },
  {
    q: 'Are certificates verified and downloadable?',
    a: 'Students receive verified completion certificates tied to their profile. Each certificate includes course details and completion metadata.',
  },
  {
    q: 'What devices does Netwisdome support?',
    a: 'Netwisdome is fully responsive across desktop, tablet, and mobile. The learning experience adapts seamlessly regardless of device.',
  },
];

/* ─── COUNTER ────────────────────────────────────────────────────────────── */
const AnimatedCounter = ({ value, suffix, active }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start;
    let id;
    const dur = 1800;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setCount(Math.floor(ease(p) * value));
      if (p < 1) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [active, value]);
  return <span>{count.toLocaleString()}{suffix}</span>;
};

/* ─── HOOK: scroll reveal ─────────────────────────────────────────────────── */
const useReveal = (threshold = 0.15) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
};

/* ─── COMPONENT ──────────────────────────────────────────────────────────── */
const CHAT_SCENARIO = [
  { sender: 'ai', text: 'Hi Rahul! How can I help with your engineering learning today? 👋', typing: false },
  { sender: 'student', text: "I'm getting an error in my MATLAB script — undefined variable in the loop", typing: false },
  { sender: 'ai', text: '', typing: true },
  { sender: 'ai', text: "That usually means the variable wasn't initialized before the loop. Try declaring it as result = [] before your for statement. Want me to walk through the full fix?", typing: false },
  { sender: 'student', text: 'Yes please!', typing: false },
  { sender: 'ai', text: '', typing: true },
  { sender: 'ai', text: 'Sure! Declare result = []; before the loop begins. This instantiates the variable so the loop can safely append elements. Let me know if that resolves the error!', typing: false }
];

const Home = () => {
  const [loaded, setLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const [statsRef, statsVisible] = useReveal(0.2);
  const [dashActive, setDashActive] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [chatMessages, setChatMessages] = useState([CHAT_SCENARIO[0]]);

  // Trigger page load animation states
  useEffect(() => {
    setLoaded(true);
  }, []);

  // Smooth scroll lerping implementation (Apple/Lenis feel)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    let target = window.scrollY;
    let current = window.scrollY;
    const ease = 0.085;
    let active = false;

    const onWheel = (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      target = Math.max(0, Math.min(target + e.deltaY, document.documentElement.scrollHeight - window.innerHeight));
      if (!active) {
        active = true;
        requestAnimationFrame(update);
      }
    };

    const update = () => {
      const diff = target - current;
      current += diff * ease;
      if (Math.abs(diff) > 0.4) {
        window.scrollTo(0, current);
        requestAnimationFrame(update);
      } else {
        window.scrollTo(0, target);
        active = false;
      }
    };

    const onScroll = () => {
      if (!active) {
        target = window.scrollY;
        current = window.scrollY;
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Custom magnetic & trailing cursor effect (Desktop only)
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const cursor = document.createElement('div');
    cursor.className = 'nw-custom-cursor';
    const ring = document.createElement('div');
    ring.className = 'nw-custom-cursor-ring';
    document.body.appendChild(cursor);
    document.body.appendChild(ring);
    document.body.classList.add('nw-custom-cursor-active');

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    };

    const updateRing = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      requestAnimationFrame(updateRing);
    };

    const onMouseOver = (e) => {
      const target = e.target;
      if (!target) return;
      if (
        target.closest('a') ||
        target.closest('button') ||
        target.closest('.nw-btn') ||
        target.closest('.nw-course-card') ||
        target.closest('.nw-bento__card') ||
        target.closest('.nw-stat-card') ||
        target.closest('.nw-faq__item button')
      ) {
        ring.classList.add('nw-custom-cursor-ring--hover');
        cursor.classList.add('nw-custom-cursor--hover');
      } else {
        ring.classList.remove('nw-custom-cursor-ring--hover');
        cursor.classList.remove('nw-custom-cursor--hover');
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseover', onMouseOver);
    const animId = requestAnimationFrame(updateRing);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      cancelAnimationFrame(animId);
      cursor.remove();
      ring.remove();
      document.body.classList.remove('nw-custom-cursor-active');
    };
  }, []);

  // Card 3D tilt handlers
  const handleCardMouseMove = useCallback((e) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const angleX = (yc - y) / 12; 
    const angleY = (x - xc) / 12;
    card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.02, 1.02, 1.02)`;
    card.style.setProperty('--mx', `${x}px`);
    card.style.setProperty('--my', `${y}px`);
  }, []);

  const handleCardMouseLeave = useCallback((e) => {
    const card = e.currentTarget;
    card.style.transform = '';
  }, []);

  // Scroll reveal observer for section items
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('nw-reveal--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    const elements = document.querySelectorAll('.nw-reveal-section');
    elements.forEach((el) => observer.observe(el));
    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Mouse move handler for hero parallax
  const handleMouseMove = useCallback((e) => {
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX / innerWidth - 0.5) * 35;
    const y = (e.clientY / innerHeight - 0.5) * 35;
    setMousePos({ x, y });
  }, []);

  // Trigger dashboard animations on mount
  useEffect(() => {
    const t = setTimeout(() => setDashActive(true), 400);
    return () => clearTimeout(t);
  }, []);

  // AI chat loop simulation
  useEffect(() => {
    let timer;
    let scenarioIndex = 1;
    let isMounted = true;

    const playNext = () => {
      if (!isMounted) return;
      if (scenarioIndex >= CHAT_SCENARIO.length) {
        timer = setTimeout(() => {
          if (!isMounted) return;
          setChatMessages([CHAT_SCENARIO[0]]);
          scenarioIndex = 1;
          playNext();
        }, 8000);
        return;
      }

      const nextMsg = CHAT_SCENARIO[scenarioIndex];
      const delay = nextMsg.typing ? 850 : (nextMsg.sender === 'student' ? 2000 : 1500);

      timer = setTimeout(() => {
        if (!isMounted) return;
        setChatMessages((prev) => {
          const base = prev.filter(m => !m.typing);
          return [...base, nextMsg];
        });
        scenarioIndex++;
        playNext();
      }, delay);
    };

    playNext();
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Navbar shrink and show/hide on scroll
  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 20);
      if (currentY > 150 && currentY > lastY && !menuOpen) {
        setNavVisible(false);
      } else {
        setNavVisible(true);
      }
      lastY = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Auto-rotate testimonials
  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <div className={`nw-page${loaded ? ' nw-page--loaded' : ''}`}>

      {/* ── NAVBAR ────────────────────────────────────────────────────────── */}
      <header className={`nw-nav${scrolled ? ' nw-nav--scrolled' : ''}${!navVisible ? ' nw-nav--hidden' : ''}`} role="banner">
        <div className="nw-nav__inner">
          <a href="#home" className="nw-brand" aria-label="Netwisdome home">
            <div className="nw-brand__mark">
              <img src={logo} alt="" loading="lazy" aria-hidden="true" />
            </div>
            <span className="nw-brand__name">NETWISDOME</span>
          </a>

          <nav className={`nw-nav__links${menuOpen ? ' nw-nav__links--open' : ''}`} aria-label="Main navigation">
            {NAV_ITEMS.map(({ label, href }) => (
              <a key={label} href={href} onClick={closeMenu}>{label}</a>
            ))}
            <div className="nw-nav__mobile-actions">
              <Link to="/student/login" className="nw-btn nw-btn--ghost" onClick={closeMenu}>Student Login</Link>
              <Link to="/admin/login" className="nw-btn nw-btn--primary" onClick={closeMenu}>Admin Login</Link>
            </div>
          </nav>

          <div className="nw-nav__actions">
            <Link to="/student/login" className="nw-btn nw-btn--ghost">Student Login</Link>
            <Link to="/admin/login" className="nw-btn nw-btn--primary">
              Admin Login
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>

          <button
            className="nw-nav__hamburger"
            onClick={() => setMenuOpen(p => !p)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className={`nw-hamburger${menuOpen ? ' nw-hamburger--open' : ''}`}>
              <span /><span /><span />
            </span>
          </button>
        </div>
        {menuOpen && <div className="nw-nav__overlay" onClick={closeMenu} aria-hidden="true" />}
      </header>

      <main id="home">

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section
          className="nw-hero"
          aria-labelledby="hero-heading"
          onMouseMove={handleMouseMove}
          style={{
            '--mx': `${mousePos.x}px`,
            '--my': `${mousePos.y}px`
          }}
        >
          {/* Animated background */}
          <div className="nw-hero__bg" aria-hidden="true">
            <div className="nw-orb nw-orb--orange" />
            <div className="nw-orb nw-orb--blue" />
            <div className="nw-orb nw-orb--violet" />
            <div className="nw-grid-pattern" />
          </div>

          <div className="nw-container nw-hero__grid">
            {/* Left: Copy */}
            <div className="nw-hero__copy">
              <div className="nw-eyebrow">
                <span className="nw-eyebrow__dot" aria-hidden="true" />
                AI-Powered Engineering LMS
              </div>

              <h1 id="hero-heading" className="nw-hero__headline">
                Learn Engineering.<br />
                <span className="nw-gradient-text">Think Industry.</span><br />
                Get Certified.
              </h1>

              <p className="nw-hero__sub">
                Netwisdome combines MATLAB, Simulink, Embedded C, and automotive control systems with AI-powered guidance, practical assignments, and real progress visibility — in one focused platform.
              </p>

              <div className="nw-hero__actions">
                <Link to="/student/login" className="nw-btn nw-btn--hero-primary">
                  Start Learning Free
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <a href="#courses" className="nw-btn nw-btn--hero-ghost">
                  Explore Courses
                </a>
                <a href="#ai" className="nw-btn nw-btn--hero-ai">
                  <span className="nw-btn__ai-pulse" aria-hidden="true" />
                  Meet Wisdomy AI
                </a>
              </div>

              <div className="nw-hero__social-proof">
                <div className="nw-avatars" aria-hidden="true">
                  {['AP','NS','RD','MK','PS'].map((i, idx) => (
                    <div key={i} className="nw-avatar" style={{'--idx': idx}}>{i}</div>
                  ))}
                </div>
                <span><strong>1,200+</strong> engineers already learning</span>
              </div>
            </div>

            {/* Right: Dashboard Illustration */}
            <div className="nw-hero__visual" aria-hidden="true">
              <div className="nw-dashboard">
                {/* Top bar */}
                <div className="nw-dashboard__bar">
                  <div className="nw-dots"><span /><span /><span /></div>
                  <div className="nw-dashboard__url">netwisdome.com/dashboard</div>
                  <div className="nw-dashboard__icons">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    <div className="nw-notif-badge">3</div>
                  </div>
                </div>

                <div className="nw-dashboard__body">
                  {/* Sidebar */}
                  <div className="nw-dashboard__sidebar">
                    <div className="nw-sidebar__logo">NW</div>
                    <nav className="nw-sidebar__nav">
                      {['⊞','◎','✦','⊡','◈','★','⊕'].map((icon, i) => (
                        <div key={i} className={`nw-sidebar__item${i === 0 ? ' nw-sidebar__item--active' : ''}`}>{icon}</div>
                      ))}
                    </nav>
                  </div>

                  {/* Main content */}
                  <div className="nw-dashboard__main">
                    {/* Profile row */}
                    <div className="nw-dash-profile">
                      <div className="nw-dash-profile__avatar">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <div className="nw-dash-profile__info">
                        <strong>Rahul Sharma</strong>
                        <span>Engineering Track · Batch 2025</span>
                      </div>
                      <div className="nw-dash-profile__streak">
                        <span>🔥</span>
                        <strong>14</strong>
                        <span>day streak</span>
                      </div>
                    </div>

                    {/* Progress cards row */}
                    <div className="nw-dash-row">
                      <div className="nw-dash-progress-card">
                        <div className="nw-dash-progress-card__header">
                          <span>MATLAB</span>
                          <strong>86%</strong>
                        </div>
                        <div className="nw-progress-bar">
                          <div className="nw-progress-bar__fill" style={{width: dashActive ? '86%' : '0%', '--color': '#FF6B00'}} />
                        </div>
                        <div className="nw-dash-progress-card__sub">Week 5 of 6 · 2 assignments pending</div>
                      </div>
                      <div className="nw-dash-progress-card">
                        <div className="nw-dash-progress-card__header">
                          <span>Simulink</span>
                          <strong>42%</strong>
                        </div>
                        <div className="nw-progress-bar">
                          <div className="nw-progress-bar__fill" style={{width: dashActive ? '42%' : '0%', '--color': '#2563EB'}} />
                        </div>
                        <div className="nw-dash-progress-card__sub">Week 3 of 8 · On track</div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="nw-dash-metrics">
                      <div className="nw-dash-metric nw-dash-metric--orange">
                        <div className="nw-dash-metric__icon">🏆</div>
                        <div className="nw-dash-metric__val">#04</div>
                        <div className="nw-dash-metric__lbl">Leaderboard</div>
                      </div>
                      <div className="nw-dash-metric nw-dash-metric--blue">
                        <div className="nw-dash-metric__icon">📋</div>
                        <div className="nw-dash-metric__val">12/14</div>
                        <div className="nw-dash-metric__lbl">Assignments</div>
                      </div>
                      <div className="nw-dash-metric nw-dash-metric--green">
                        <div className="nw-dash-metric__icon">📅</div>
                        <div className="nw-dash-metric__val">92%</div>
                        <div className="nw-dash-metric__lbl">Attendance</div>
                      </div>
                      <div className="nw-dash-metric nw-dash-metric--violet">
                        <div className="nw-dash-metric__icon">🤖</div>
                        <div className="nw-dash-metric__val">Live</div>
                        <div className="nw-dash-metric__lbl">Wisdomy AI</div>
                      </div>
                    </div>

                    {/* Mini chart */}
                    <div className="nw-dash-chart">
                      <div className="nw-dash-chart__header">Weekly Activity</div>
                      <div className="nw-dash-chart__bars">
                        {[40, 65, 55, 80, 70, 90, 85].map((h, i) => (
                          <div key={i} className="nw-dash-chart__bar-wrap" style={{'--i': i}}>
                            <div className="nw-dash-chart__bar" style={{'--h': dashActive ? `${h}%` : '4%'}} />
                            <span>{['M','T','W','T','F','S','S'][i]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating widgets */}
              <div className="nw-float-widget nw-float-widget--tl">
                <span>🎓</span>
                <div>
                  <strong>Certificate Earned!</strong>
                  <span>Embedded C — Grade A</span>
                </div>
              </div>
              <div className="nw-float-widget nw-float-widget--br">
                <div className="nw-float-widget__ai-dot" />
                <div>
                  <strong>Wisdomy AI</strong>
                  <span>Answering your doubt…</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TRUSTED BY ────────────────────────────────────────────────── */}
        <section className="nw-trusted" aria-label="Trusted by engineering colleges">
          <div className="nw-container">
            <p className="nw-trusted__label">Trusted by students from</p>
            <div className="nw-trusted__logos">
              {['VIIT Pune', 'MIT Aurangabad', 'COEP Pune', 'PICT Pune', 'VIT Vellore', 'NIT Nagpur', 'BITS Pilani'].map(name => (
                <div key={name} className="nw-trusted__logo">{name}</div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ─────────────────────────────────────────────────────── */}
        <section className="nw-stats" ref={statsRef} aria-label="Platform statistics">
          <div className="nw-container nw-stats__grid">
            {STATS.map(({ value, suffix, label, icon }) => (
              <div className="nw-stat-card" key={label} onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
                <div className="nw-stat-card__icon">{icon}</div>
                <div className="nw-stat-card__value">
                  <AnimatedCounter value={value} suffix={suffix} active={statsVisible} />
                </div>
                <div className="nw-stat-card__label">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── COURSES ───────────────────────────────────────────────────── */}
        <section className="nw-courses nw-reveal-section" id="courses" aria-labelledby="courses-heading">
          <div className="nw-container">
            <div className="nw-section-head">
              <span className="nw-eyebrow nw-eyebrow--center">
                <span className="nw-eyebrow__dot" aria-hidden="true" />
                Engineering Curriculum
              </span>
              <h2 id="courses-heading">Courses built around<br /><span className="nw-gradient-text">real industry workflows</span></h2>
              <p>Every course is designed with practical assignments, AI support, and career-ready outcomes.</p>
            </div>

            <div className="nw-courses__grid">
              {COURSES.map((c) => (
                <article className="nw-course-card" key={c.title} style={{'--accent': c.accent}} onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
                  <div className="nw-course-card__visual">
                    <div className="nw-course-card__accent-bar" />
                    <div className="nw-course-card__tag">{c.tag}</div>
                    <div className="nw-course-card__icon">{c.title.charAt(0)}</div>
                  </div>
                  <div className="nw-course-card__body">
                    <div className="nw-course-card__meta">
                      <span className={`nw-badge nw-badge--${c.level.toLowerCase()}`}>{c.level}</span>
                      <span className="nw-course-card__duration">⏱ {c.duration}</span>
                    </div>
                    <div className="nw-course-card__subtitle">{c.subtitle}</div>
                    <h3>{c.title}</h3>
                    <p>{c.desc}</p>
                    <div className="nw-course-card__footer">
                      <div className="nw-course-card__rating">
                        {'★'.repeat(5)}
                        <strong>{c.rating}</strong>
                        <span>({c.students})</span>
                      </div>
                      <a href="#contact" className="nw-course-card__cta">
                        Enroll Now
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES BENTO ────────────────────────────────────────────── */}
        <section className="nw-features nw-reveal-section" id="features" aria-labelledby="features-heading">
          <div className="nw-container">
            <div className="nw-section-head">
              <span className="nw-eyebrow nw-eyebrow--center">
                <span className="nw-eyebrow__dot" aria-hidden="true" />
                Platform Features
              </span>
              <h2 id="features-heading">Everything in one<br /><span className="nw-gradient-text">engineering OS</span></h2>
            </div>

            <div className="nw-bento">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className={`nw-bento__card nw-bento__card--${f.size}`}
                  style={{'--delay': `${i * 0.08}s`}}
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                >
                  <div className="nw-bento__icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                  {f.size === 'lg' && (
                    <div className="nw-bento__ai-preview" aria-hidden="true">
                      <div className="nw-chat-msg nw-chat-msg--student">
                        How do I tune a PID controller in Simulink?
                      </div>
                      <div className="nw-chat-msg nw-chat-msg--ai">
                        <span className="nw-chat-ai-badge">Wisdomy</span>
                        Start with Kp = 1.0, then use the step response to identify…
                        <span className="nw-typing-cursor" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WISDOMY AI ────────────────────────────────────────────────── */}
        <section className="nw-ai nw-reveal-section" id="ai" aria-labelledby="ai-heading">
          <div className="nw-container nw-ai__grid">
            <div className="nw-ai__copy">
              <span className="nw-eyebrow">
                <span className="nw-eyebrow__dot nw-eyebrow__dot--ai" aria-hidden="true" />
                Wisdomy AI
              </span>
              <h2 id="ai-heading">Your AI study partner,<br /><span className="nw-gradient-text">always available</span></h2>
              <p>Wisdomy understands engineering context. Ask about MATLAB errors, Simulink model debugging, automotive control theory, or Embedded C memory management — and get expert-level guidance instantly.</p>
              <ul className="nw-ai__bullets">
                {['Context-aware engineering answers', 'Assignment guidance without spoilers', 'Concept revision before exams', 'Code-level debugging help'].map(b => (
                  <li key={b}><span aria-hidden="true">✦</span>{b}</li>
                ))}
              </ul>
              <a href="#contact" className="nw-btn nw-btn--primary nw-btn--hero-primary">
                Try Wisdomy AI
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>

            <div className="nw-ai__chat" aria-hidden="true">
              <div className="nw-chat-window">
                <div className="nw-chat-window__header">
                  <div className="nw-chat-window__avatar">W</div>
                  <div>
                    <strong>Wisdomy AI</strong>
                    <span className="nw-chat-window__status">Online · Engineering Assistant</span>
                  </div>
                </div>
                <div className="nw-chat-window__msgs">
                  {chatMessages.map((msg, i) => (
                    msg.typing ? (
                      <div key={i} className="nw-chat-bubble nw-chat-bubble--ai nw-chat-bubble--typing">
                        <span /><span /><span />
                      </div>
                    ) : (
                      <div
                        key={i}
                        className={`nw-chat-bubble nw-chat-bubble--${msg.sender}`}
                      >
                        {msg.text.includes('result = []') ? (
                          <>
                            That usually means the variable wasn't initialized before the loop. Try declaring it as <code>result = []</code> before your <code>for</code> statement. Want me to walk through the fix?
                          </>
                        ) : msg.text}
                      </div>
                    )
                  ))}
                </div>
                <div className="nw-chat-window__input">
                  <input type="text" placeholder="Ask Wisdomy anything…" readOnly />
                  <button type="button" aria-label="Send">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── JOURNEY ───────────────────────────────────────────────────── */}
        <section className="nw-journey nw-reveal-section" id="journey" aria-labelledby="journey-heading">
          <div className="nw-container">
            <div className="nw-section-head">
              <span className="nw-eyebrow nw-eyebrow--center">
                <span className="nw-eyebrow__dot" aria-hidden="true" />
                Student Journey
              </span>
              <h2 id="journey-heading">From zero to<br /><span className="nw-gradient-text">career-certified</span></h2>
            </div>

            <div className="nw-journey__steps">
              {JOURNEY_STEPS.map((step, i) => (
                <div className="nw-journey__step" key={step.step} style={{'--i': i}}>
                  <div className="nw-journey__connector" aria-hidden="true" />
                  <div className="nw-journey__node">
                    <span className="nw-journey__icon">{step.icon}</span>
                    <span className="nw-journey__num">{step.step}</span>
                  </div>
                  <div className="nw-journey__content">
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ──────────────────────────────────────────────── */}
        <section className="nw-testimonials nw-reveal-section" aria-labelledby="testimonials-heading">
          <div className="nw-container">
            <div className="nw-section-head">
              <span className="nw-eyebrow nw-eyebrow--center">
                <span className="nw-eyebrow__dot" aria-hidden="true" />
                Success Stories
              </span>
              <h2 id="testimonials-heading">Engineers who<br /><span className="nw-gradient-text">made the leap</span></h2>
            </div>

            <div className="nw-testimonials__track">
              {TESTIMONIALS.map((t, i) => (
                <article
                  className={`nw-testimonial-card${i === activeTestimonial ? ' nw-testimonial-card--active' : ''}`}
                  key={t.name}
                  style={{'--accent': t.color}}
                  aria-hidden={i !== activeTestimonial}
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                >
                  <div className="nw-testimonial-card__quote">"</div>
                  <p>{t.text}</p>
                  <div className="nw-testimonial-card__footer">
                    <div className="nw-testimonial-card__avatar" style={{background: t.color}}>{t.initials}</div>
                    <div>
                      <strong>{t.name}</strong>
                      <span>{t.role}</span>
                      <span>{t.college}</span>
                    </div>
                    <div className="nw-stars" aria-label={`${t.rating} out of 5 stars`}>{'★'.repeat(t.rating)}</div>
                  </div>
                </article>
              ))}
            </div>

            <div className="nw-testimonials__dots" role="tablist" aria-label="Testimonial navigation">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  className={`nw-dot${i === activeTestimonial ? ' nw-dot--active' : ''}`}
                  onClick={() => setActiveTestimonial(i)}
                  role="tab"
                  aria-selected={i === activeTestimonial}
                  aria-label={`View testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section className="nw-faq nw-reveal-section" id="faq" aria-labelledby="faq-heading">
          <div className="nw-container nw-faq__grid">
            <div className="nw-faq__copy">
              <span className="nw-eyebrow">
                <span className="nw-eyebrow__dot" aria-hidden="true" />
                FAQ
              </span>
              <h2 id="faq-heading">Answers before<br />you step inside</h2>
              <p>Everything you need to know about the platform, AI, and your learning journey.</p>
            </div>
            <div className="nw-faq__list">
              {FAQS.map((faq, i) => (
                <div
                  className={`nw-faq__item${openFaq === i ? ' nw-faq__item--open' : ''}`}
                  key={faq.q}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    id={`faq-q-${i}`}
                    aria-controls={`faq-a-${i}`}
                  >
                    <span>{faq.q}</span>
                    <svg className="nw-faq__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  <div
                    className="nw-faq__answer"
                    id={`faq-a-${i}`}
                    role="region"
                    aria-labelledby={`faq-q-${i}`}
                  >
                    <p>{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <section className="nw-cta nw-reveal-section" id="contact" aria-labelledby="cta-heading">
          <div className="nw-cta__bg" aria-hidden="true">
            <div className="nw-orb nw-orb--cta-orange" />
            <div className="nw-orb nw-orb--cta-blue" />
          </div>
          <div className="nw-container nw-cta__inner">
            <span className="nw-eyebrow nw-eyebrow--light nw-eyebrow--center">
              <span className="nw-eyebrow__dot" aria-hidden="true" />
              Start Today
            </span>
            <h2 id="cta-heading">Your engineering career<br /><span className="nw-gradient-text-light">starts with one course</span></h2>
            <p>Join 1,200+ engineers already learning MATLAB, Simulink, Embedded C, and automotive control systems on Netwisdome.</p>
            <div className="nw-cta__actions">
              <Link to="/student/login" className="nw-btn nw-btn--cta-primary">
                Start Learning Free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link to="/admin/login" className="nw-btn nw-btn--cta-ghost">Admin Portal</Link>
            </div>
            <p className="nw-cta__note">No credit card required · Free to start</p>
          </div>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="nw-footer" role="contentinfo">
        <div className="nw-container nw-footer__grid">
          <div className="nw-footer__brand">
            <a href="#home" className="nw-brand nw-brand--footer" aria-label="Netwisdome home">
              <div className="nw-brand__mark">
                <img src={logo} alt="" loading="lazy" aria-hidden="true" />
              </div>
              <span className="nw-brand__name">NETWISDOME</span>
            </a>
            <p>AI-powered LMS for engineering education. Practical learning, real outcomes, verified credentials.</p>
            <div className="nw-footer__socials">
              <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="mailto:info@netwisdome.com" aria-label="Email us">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </a>
            </div>
          </div>

          <div className="nw-footer__col">
            <h3>Courses</h3>
            <a href="#courses">MATLAB Programming</a>
            <a href="#courses">Simulink</a>
            <a href="#courses">Embedded C</a>
            <a href="#courses">Automotive Control</a>
          </div>

          <div className="nw-footer__col">
            <h3>Platform</h3>
            <a href="#features">Features</a>
            <a href="#ai">Wisdomy AI</a>
            <a href="#journey">Learning Journey</a>
            <Link to="/student/login">Student Login</Link>
            <Link to="/admin/login">Admin Login</Link>
          </div>

          <div className="nw-footer__col">
            <h3>Contact</h3>
            <a href="mailto:info@netwisdome.com">info@netwisdome.com</a>
            <a href="tel:+919999999999">+91 99999 99999</a>
            <p className="nw-footer__newsletter-label">Stay updated</p>
            <div className="nw-footer__newsletter">
              <input type="email" placeholder="your@email.com" aria-label="Email for newsletter" />
              <button type="button" aria-label="Subscribe">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="nw-footer__bottom">
          <div className="nw-container">
            <span>© 2026 Netwisdome. All rights reserved.</span>
            <span>AI-Powered Engineering LMS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;