import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowDown, ArrowRight, ArrowUpRight, BrainCircuit, BarChart3, Menu, Play, ScanLine, ShieldCheck, X } from 'lucide-react';

const slides = [
 { kicker:'AI-POWERED SPORTS INTELLIGENCE', title:<>EVERY TALENT<br/><em>HAS A MOMENT.</em></>, line:'Every talent has a moment to rise.', image:'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=2400&q=90', n:'01', label:'THE NEXT GENERATION' },
 { kicker:'SEE THE GAME DIFFERENTLY', title:<>TRAIN SMARTER.<br/><em>RISE HIGHER.</em></>, line:'The future belongs to those who keep moving.', image:'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=2400&q=90', n:'02', label:'PERFORMANCE REIMAGINED' },
 { kicker:'YOUR POTENTIAL, IN FOCUS', title:<>MAKE EVERY<br/><em>MOVE COUNT.</em></>, line:'Potential is only the beginning.', image:'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=2400&q=90', n:'03', label:'BUILT FOR ATHLETES' }
];
const features = [
 {n:'01',Icon:ScanLine,title:'AI MOVEMENT ANALYSIS',text:'Explore movement patterns and technique with computer vision and pose estimation from video.'},
 {n:'02',Icon:BarChart3,title:'PERFORMANCE INSIGHTS',text:'Bring key performance indicators into focus and understand progress over time.'},
 {n:'03',Icon:BrainCircuit,title:'TALENT DISCOVERY',text:'Help coaches and scouts discover emerging potential with structured athlete profiles.'},
 {n:'04',Icon:ShieldCheck,title:'ATHLETE FIRST',text:'Keep athletes at the centre with clear feedback, responsible AI and continuous improvement.'}
];
export default function LandingPage(){
 const [active,setActive]=useState(0); const [menuOpen,setMenuOpen]=useState(false); const slide=slides[active];
 useEffect(()=>{const nodes=document.querySelectorAll('.sq-reveal');if(!('IntersectionObserver'in window)){nodes.forEach(n=>n.classList.add('sq-visible'));return;}const ob=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('sq-visible');ob.unobserve(e.target);}}),{threshold:.12});nodes.forEach(n=>ob.observe(n));return()=>ob.disconnect();},[]);
 useEffect(()=>{const t=window.setInterval(()=>setActive(v=>(v+1)%slides.length),7500);return()=>window.clearInterval(t);},[]);
 const move=d=>setActive(v=>(v+d+slides.length)%slides.length);const close=()=>setMenuOpen(false);
 return <main className="sportiq-cinema">
 <section className="sq-hero"><img key={slide.image} className="sq-hero-image" src={slide.image} alt="Athlete training at golden hour"/>
 <div className="sq-motion-scene" aria-hidden="true">
   <div className="sq-runner-glow"></div>
   <svg className="sq-runner" viewBox="0 0 220 300" role="presentation">
    <g className="sq-runner-shadow"><ellipse cx="112" cy="262" rx="66" ry="8" fill="#ff251f" opacity=".2"/></g>
    <g className="sq-runner-limb sq-arm-back"><path d="M105 78 L80 102 L64 127" fill="none" stroke="#d9d7d2" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/><path d="M64 127 L56 139" fill="none" stroke="#ff251f" strokeWidth="11" strokeLinecap="round"/></g>
    <g className="sq-runner-limb sq-leg-back"><path d="M111 132 L86 179 L54 218" fill="none" stroke="#c9c7c1" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/><path d="M54 218 L29 220" fill="none" stroke="#ff251f" strokeWidth="12" strokeLinecap="round"/></g>
    <g className="sq-runner-core">
     <circle cx="117" cy="38" r="18" fill="#f8f6f2"/>
     <path d="M105 59 Q120 53 132 65 L145 112 L119 137 L91 111 Z" fill="#ff251f"/>
     <path d="M105 68 L119 72 L129 105 L116 112 L101 91 Z" fill="#d91c18" opacity=".8"/>
    </g>
    <g className="sq-runner-limb sq-arm-front"><path d="M128 70 L151 89 L174 74" fill="none" stroke="#f8f6f2" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/><path d="M174 74 L181 63" fill="none" stroke="#ff251f" strokeWidth="10" strokeLinecap="round"/></g>
    <g className="sq-runner-limb sq-leg-front"><path d="M120 132 L148 169 L177 197" fill="none" stroke="#f8f6f2" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/><path d="M177 197 L200 190" fill="none" stroke="#ff251f" strokeWidth="12" strokeLinecap="round"/></g>
   </svg>
   <div className="sq-motion-trail"></div>
   <div className="sq-live-tag"><i></i> LIVE MOVEMENT ANALYSIS</div>
   <div className="sq-data-card sq-data-top"><span>POSE DETECTION</span><strong>ACTIVE</strong><div className="sq-skeleton-bars"><i/><i/><i/><i/><i/><i/><i/></div></div>
   <div className="sq-data-card sq-data-bottom"><span>RUNNING FORM</span><strong>87<small>/100</small></strong><div className="sq-data-meter"><i/></div><em>STRIDE · BALANCE · SPEED</em></div>
   <div className="sq-scan-line"></div>
 </div>
 <header className="sq-header"><Link to="/" className="sq-brand">SPORTIQ<small>PERFORMANCE / {slide.n}</small></Link><div className="sq-header-right"><span className="sq-mono">SOUND OFF</span><button className="sq-menu" onClick={()=>setMenuOpen(true)} aria-label="Open navigation"><span className="sq-menu-lines"><i/><i/></span><span className="sq-mono">MENU</span></button></div></header>
 <div className="sq-location sq-mono">{slide.label}</div><div className="sq-hero-content" key={slide.n+'copy'}><div className="sq-kicker">{slide.kicker}</div><h1 className="sq-display">{slide.title}</h1><p className="sq-hero-copy">{slide.line}</p><div className="sq-hero-actions"><Link to="/register" className="sq-primary">Enter SportIQ <ArrowUpRight size={14}/></Link><a href="#intelligence" className="sq-secondary"><Play size={13}/> Explore the platform</a></div></div>
 <a href="#intelligence" className="sq-scroll"><span>SCROLL</span><ArrowDown size={13}/></a><div className="sq-hero-bottom"><p>{slide.line}</p><span className="sq-mono">AI / MOVEMENT / POTENTIAL</span></div><div className="sq-slider"><span className="sq-slider-count"><b>{slide.n}</b> / 03</span><button onClick={()=>move(-1)} aria-label="Previous slide"><ArrowRight className="sq-prev" size={14}/></button><button onClick={()=>move(1)} aria-label="Next slide"><ArrowRight size={14}/></button></div></section>
 <div className="sq-progress"><span style={{width:((active+1)/slides.length*100)+'%'}}/></div>
 {menuOpen&&<nav className="sq-nav-overlay"><button onClick={close} aria-label="Close menu"><X size={28}/></button><span className="sq-eyebrow">Move with purpose</span><a href="#intelligence" onClick={close}>The intelligence</a><a href="#approach" onClick={close}>Our approach</a><a href="#journey" onClick={close}>The journey</a><Link to="/login" onClick={close}>Sign in</Link><Link to="/register" onClick={close}>Get started</Link></nav>}
 <section id="intelligence" className="sq-section"><div className="sq-section-head sq-reveal"><div><div className="sq-eyebrow">More than numbers</div><h2 className="sq-display">THE GAME.<br/>UNDERSTOOD.</h2></div><p className="sq-section-intro">SportIQ brings AI-assisted analysis, athlete performance and talent discovery into one connected experience. Turn the details of movement into insights that help athletes and coaches make their next move with confidence.</p></div><div className="sq-capabilities">{features.map(({n,Icon,title,text})=><article className="sq-capability sq-reveal" key={n}><span className="sq-capability-num">{n} / CAPABILITY</span><div className="sq-capability-icon"><Icon size={28}/></div><h3>{title}</h3><p>{text}</p></article>)}</div></section>
 <section id="approach" className="sq-manifesto"><div className="sq-manifesto-image"><img src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=85" alt="Athletes training together" loading="lazy"/><span className="sq-mono">BUILT FOR THE NEXT GENERATION</span></div><div className="sq-manifesto-content sq-reveal"><div className="sq-eyebrow">Our point of view</div><h2 className="sq-display">POTENTIAL<br/>IS <em>EVERYWHERE.</em></h2><p>Talent isn't limited by geography, access or the size of a stadium. SportIQ helps athletes understand strengths, helps coaches make informed decisions and makes performance insight more accessible.</p><p>AI can reveal patterns and support decisions. Human judgment remains at the centre of every sporting journey.</p><div className="sq-stat-row"><div className="sq-stat"><strong>01</strong><span>ATHLETE FIRST</span></div><div className="sq-stat"><strong>AI</strong><span>ASSISTED INSIGHT</span></div><div className="sq-stat"><strong>∞</strong><span>ROOM TO GROW</span></div></div></div></section>
 <section id="journey" className="sq-section sq-how"><div className="sq-section-head sq-reveal"><div><div className="sq-eyebrow">From movement to momentum</div><h2 className="sq-display">YOUR GAME.<br/>YOUR JOURNEY.</h2></div><p className="sq-section-intro">A clearer way to explore performance—approachable for athletes, useful for coaches and ready to grow with every session.</p></div><div className="sq-steps"><article className="sq-step sq-reveal"><div className="sq-step-num">01</div><h3>Capture the moment</h3><p>Start with athlete details and training video where the relevant analysis workflow is available.</p></article><article className="sq-step sq-reveal"><div className="sq-step-num">02</div><h3>Explore the insight</h3><p>Use AI-assisted movement analysis and performance indicators to understand technique and development areas.</p></article><article className="sq-step sq-reveal"><div className="sq-step-num">03</div><h3>Build what comes next</h3><p>Turn observations into informed training goals and keep human coaching at the heart of improvement.</p></article></div></section>
 <section className="sq-cta-band sq-reveal"><div><div className="sq-eyebrow">Your next chapter starts here</div><h2 className="sq-display">READY TO<br/>RISE?</h2></div><Link to="/register" className="sq-primary">Start your SportIQ journey <ArrowRight size={15}/></Link></section>
 <footer className="sq-footer"><Link to="/" className="sq-footer-brand">SPORT<span>IQ</span></Link><p>© {new Date().getFullYear()} SPORTIQ · EVERY TALENT HAS A MOMENT TO RISE.</p><div className="sq-footer-links"><a href="#intelligence">Platform</a><a href="#approach">Our approach</a><Link to="/login">Sign in</Link><Link to="/register">Register</Link></div></footer></main>;
}
