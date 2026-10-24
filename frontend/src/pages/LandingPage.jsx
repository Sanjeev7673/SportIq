import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, ChevronDown, Menu, Play, Trophy, Users, X, Zap } from 'lucide-react';

const slides = [
  { kicker: 'THE GAME IS OUR PASSION', title: <>PLAY WITH<br /><em>PASSION.</em></>, text: 'Every match has a story. Every player has a purpose. This is where the next chapter begins.', image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=2200&q=90', number: '01' },
  { kicker: 'BUILT FOR THE BIG MOMENTS', title: <>CHASE THE<br /><em>VICTORY.</em></>, text: 'Train smarter, compete harder and bring your team together for the moments that matter.', image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=2200&q=90', number: '02' },
  { kicker: 'YOUR TEAM. YOUR LEGACY.', title: <>RISE ABOVE<br /><em>THE GAME.</em></>, text: 'A new perspective on athletic performance, talent discovery and the future of sport.', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=2200&q=90', number: '03' }
];
const fixtures = [
  { competition: 'SPORTIQ LEAGUE', date: 'OCT 28 · 18:30', home: 'NORTH CITY', away: 'RED UNITED', a: 'NC', b: 'RU' },
  { competition: 'CHAMPIONS CUP', date: 'OCT 30 · 20:00', home: 'ATHLETIC FC', away: 'BLUE STARS', a: 'AF', b: 'BS' },
  { competition: 'WEEKEND SERIES', date: 'NOV 02 · 16:00', home: 'EAST ROVERS', away: 'WEST ATHLETIC', a: 'ER', b: 'WA' }
];
const stories = [
  { tag: 'PERFORMANCE', title: 'The details that make the difference', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=85' },
  { tag: 'TEAM CULTURE', title: 'Stronger together, on and off the pitch', image: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=900&q=85' },
  { tag: 'NEXT GENERATION', title: 'Discover the talent shaping tomorrow', image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=900&q=85' }
];

export default function LandingPage() {
  const [active, setActive] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const slide = slides[active];

  useEffect(() => {
    const nodes = document.querySelectorAll('.ts-reveal');
    if (!('IntersectionObserver' in window)) { nodes.forEach(n => n.classList.add('ts-visible')); return; }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('ts-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    nodes.forEach(n => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  const move = (direction) => setActive(current => (current + direction + slides.length) % slides.length);

  return (
    <main className="topscorer-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto+Condensed:wght@300;400;500;600;700&display=swap');
        :root{--ts-red:#f71601;--ts-black:#090808;--ts-paper:#ecebec;--ts-muted:#afaFAF;--ts-blush:#ccb9b7}
        .topscorer-page{background:var(--ts-paper);color:var(--ts-black);font-family:'Roboto Condensed',sans-serif;overflow:hidden}
        .topscorer-page *{box-sizing:border-box}
        .ts-display{font-family:Oswald,'Arial Narrow',sans-serif;text-transform:uppercase;font-weight:700;letter-spacing:-.035em}
        .ts-topbar{height:38px;background:#090808;color:#bdbdbd;display:flex;align-items:center;justify-content:space-between;padding:0 5.5%;font-size:10px;letter-spacing:.13em;text-transform:uppercase}
        .ts-header{height:88px;display:flex;align-items:center;justify-content:space-between;padding:0 5.5%;background:#ecebec;position:relative;z-index:20;border-bottom:1px solid #09080812}
        .ts-logo{display:flex;align-items:center;gap:12px;color:#090808;text-decoration:none;font-family:Oswald,sans-serif;font-weight:700;font-size:28px;letter-spacing:-.04em}
        .ts-logo-mark{width:42px;height:42px;display:grid;place-items:center;background:var(--ts-red);color:white}
        .ts-nav{display:flex;gap:30px;align-items:center}
        .ts-nav a,.ts-login{color:#090808;text-decoration:none;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;transition:color .25s}
        .ts-nav a:hover,.ts-login:hover{color:var(--ts-red)}
        .ts-cta{display:inline-flex;align-items:center;justify-content:center;gap:13px;padding:15px 21px;background:var(--ts-red);color:#fff;text-decoration:none;text-transform:uppercase;font-size:10px;font-weight:700;letter-spacing:.13em;transition:background .25s,color .25s,gap .25s}
        .ts-cta:hover{background:#090808;color:white;gap:20px}
        .ts-hero{min-height:650px;position:relative;background:#090808;color:white;isolation:isolate;display:flex;align-items:center}
        .ts-hero-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-3;animation:ts-image-in 1.15s cubic-bezier(.2,.7,.2,1) both}
        .ts-hero:before{content:'';position:absolute;inset:0;z-index:-2;background:linear-gradient(90deg,rgba(5,5,5,.92) 0%,rgba(5,5,5,.76) 43%,rgba(5,5,5,.16) 100%),linear-gradient(0deg,rgba(0,0,0,.42),transparent 45%)}
        .ts-hero-content{width:100%;padding:86px 8.5% 96px;position:relative}
        .ts-kicker{display:flex;align-items:center;gap:13px;color:#ccb9b7;font-size:10px;font-weight:700;letter-spacing:.25em;text-transform:uppercase}
        .ts-kicker:before{content:'';width:36px;height:2px;background:var(--ts-red)}
        .ts-hero h1{font-size:clamp(65px,9.1vw,138px);line-height:.89;margin:25px 0 23px;max-width:900px;animation:ts-title-in .75s .1s both}
        .ts-hero h1 em{font-style:normal;color:var(--ts-red)}
        .ts-hero p{max-width:420px;color:#d0cece;font-size:16px;line-height:1.7;margin:0 0 30px;animation:ts-rise .7s .25s both}
        .ts-hero-actions{display:flex;gap:12px;flex-wrap:wrap;animation:ts-rise .7s .35s both}
        .ts-outline{display:inline-flex;align-items:center;gap:12px;border:1px solid #ffffff80;color:white;text-decoration:none;padding:14px 20px;font-size:10px;text-transform:uppercase;letter-spacing:.13em;font-weight:700;transition:all .25s}
        .ts-outline:hover{background:white;color:#090808}
        .ts-slider-ui{position:absolute;right:5.5%;bottom:36px;display:flex;align-items:center;gap:13px}
        .ts-slide-count{font-family:Oswald,sans-serif;font-size:12px;letter-spacing:.1em;margin-right:10px}
        .ts-slide-count span{color:#ffffff65}
        .ts-arrow{height:42px;width:42px;border:1px solid #ffffff70;color:white;background:#09080830;display:grid;place-items:center;cursor:pointer;transition:background .2s,border .2s}
        .ts-arrow:hover{background:var(--ts-red);border-color:var(--ts-red)}
        .ts-progress{height:4px;width:100%;background:#090808}
        .ts-progress span{display:block;height:100%;width:33.333%;background:var(--ts-red);transition:transform .45s cubic-bezier(.2,.7,.2,1)}
        .ts-section{padding:92px 8.5%}
        .ts-section-head{display:flex;align-items:end;justify-content:space-between;gap:30px;margin-bottom:40px}
        .ts-eyebrow{color:var(--ts-red);font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;margin-bottom:12px}
        .ts-section h2{font-size:clamp(38px,5vw,68px);line-height:.98;margin:0}
        .ts-section-intro{max-width:360px;color:#666;font-size:14px;line-height:1.7;margin:0}
        .ts-reveal{opacity:0;transform:translateY(28px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.7,.2,1)}
        .ts-reveal.ts-visible{opacity:1;transform:translateY(0)}
        .ts-feature-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2px;background:#d2cece}
        .ts-feature{background:#ecebec;padding:30px;min-height:245px;transition:background .3s,color .3s,transform .3s}
        .ts-feature:hover{background:#090808;color:white;transform:translateY(-5px)}
        .ts-feature-icon{width:48px;height:48px;background:var(--ts-red);color:white;display:grid;place-items:center;margin-bottom:35px}
        .ts-feature h3{font:600 24px/1.12 Oswald,sans-serif;text-transform:uppercase;margin:0 0 12px}
        .ts-feature p{font-size:14px;line-height:1.65;color:#777;margin:0}
        .ts-feature:hover p{color:#bbb}
        .ts-fixtures{background:#090808;color:white}
        .ts-fixtures .ts-section-intro{color:#aaa}
        .ts-match-list{border-top:1px solid #ffffff30}
        .ts-match{display:grid;grid-template-columns:1fr 1.8fr 1fr;align-items:center;gap:22px;padding:23px 0;border-bottom:1px solid #ffffff30;transition:padding .25s}
        .ts-match:hover{padding-left:10px;padding-right:10px}
        .ts-match-meta{font-size:10px;color:#aaa;letter-spacing:.14em;text-transform:uppercase;line-height:1.8}
        .ts-match-teams{display:flex;align-items:center;justify-content:center;gap:20px}
        .ts-team{display:flex;align-items:center;gap:11px;font-size:11px;font-weight:700;letter-spacing:.07em}
        .ts-team-badge{height:42px;width:42px;background:#242222;color:white;border:1px solid #ffffff20;display:grid;place-items:center;font:600 14px Oswald,sans-serif}
        .ts-vs{color:var(--ts-red);font:700 14px Oswald,sans-serif}
        .ts-match .ts-cta{justify-self:end;padding:12px 15px}
        .ts-story-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
        .ts-story{background:#fff;overflow:hidden}
        .ts-story-image{height:230px;overflow:hidden;background:#ddd}
        .ts-story-image img{height:100%;width:100%;object-fit:cover;transition:transform .65s cubic-bezier(.2,.7,.2,1),filter .4s}
        .ts-story:hover .ts-story-image img{transform:scale(1.07);filter:saturate(1.15)}
        .ts-story-body{padding:24px}
        .ts-story-body h3{font:600 24px/1.12 Oswald,sans-serif;text-transform:uppercase;margin:10px 0 18px}
        .ts-story-link{display:inline-flex;align-items:center;gap:8px;color:#090808;text-decoration:none;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;transition:gap .25s,color .25s}
        .ts-story-link:hover{gap:15px;color:var(--ts-red)}
        .ts-cta-band{margin:0 8.5% 90px;padding:58px 6%;background:var(--ts-red);color:white;display:flex;align-items:center;justify-content:space-between;gap:25px}
        .ts-cta-band h2{font-size:clamp(38px,5vw,64px);line-height:.95;margin:0}
        .ts-cta-band .ts-cta{background:#090808}
        .ts-footer{background:#ccb9b7;padding:36px 8.5%;display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
        .ts-footer p{margin:0;color:#625452;font-size:11px}
        .ts-footer-links{display:flex;gap:20px}
        .ts-footer-links a{color:#090808;text-decoration:none;text-transform:uppercase;font-size:10px;font-weight:700;letter-spacing:.1em}
        @keyframes ts-image-in{from{opacity:.45;transform:scale(1.06)}to{opacity:1;transform:scale(1)}}
        @keyframes ts-title-in{from{opacity:0;transform:translateY(28px);clip-path:inset(0 0 100% 0)}to{opacity:1;transform:translateY(0);clip-path:inset(0 0 0 0)}}
        @keyframes ts-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:900px){.ts-nav{gap:15px}.ts-nav a{font-size:10px}.ts-section{padding:70px 6%}.ts-hero-content{padding-left:7%;padding-right:7%}.ts-feature-grid,.ts-story-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ts-feature:last-child,.ts-story:last-child{grid-column:span 2}.ts-cta-band{margin-left:6%;margin-right:6%}}
        @media(max-width:640px){.ts-topbar{padding:0 5%;font-size:8px}.ts-header{height:72px;padding:0 5%}.ts-logo{font-size:24px}.ts-logo-mark{width:36px;height:36px}.ts-nav{display:none;position:absolute;top:72px;left:0;right:0;background:#ecebec;padding:22px 6%;border-top:1px solid #ddd;flex-direction:column;align-items:flex-start}.ts-nav.ts-nav-open{display:flex}.ts-header .ts-cta{padding:12px;font-size:9px}.ts-login{display:none}.ts-hero{min-height:600px}.ts-hero-content{padding:80px 6% 100px}.ts-hero h1{font-size:clamp(58px,16vw,90px)}.ts-hero p{font-size:14px}.ts-slider-ui{right:6%;bottom:22px}.ts-section{padding:60px 6%}.ts-section-head{display:block}.ts-section-intro{margin-top:20px}.ts-feature-grid,.ts-story-grid{grid-template-columns:1fr}.ts-feature:last-child,.ts-story:last-child{grid-column:auto}.ts-feature{min-height:210px}.ts-match{grid-template-columns:1fr auto;gap:14px}.ts-match-teams{grid-column:1/-1;grid-row:1;justify-content:flex-start}.ts-match-meta{grid-column:1;grid-row:2}.ts-match .ts-cta{grid-column:2;grid-row:2}.ts-story-image{height:220px}.ts-cta-band{margin:0 6% 60px;padding:36px 7%;align-items:flex-start;flex-direction:column}.ts-footer{padding:30px 6%}}
        @media(prefers-reduced-motion:reduce){.topscorer-page *, .topscorer-page *:before,.topscorer-page *:after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}.ts-reveal{opacity:1;transform:none}}
      `}</style>

      <div className="ts-topbar"><span>SportIQ · The home of sporting excellence</span><span>Train hard. Play smart. Rise together.</span></div>
      <header className="ts-header">
        <Link to="/" className="ts-logo"><span className="ts-logo-mark"><Activity size={24}/></span><span>SPORT<span style={{color:'var(--ts-red)'}}>IQ</span></span></Link>
        <nav className={`ts-nav ${menuOpen ? 'ts-nav-open' : ''}`}>
          <a href="#about" onClick={()=>setMenuOpen(false)}>The Club</a><a href="#fixtures" onClick={()=>setMenuOpen(false)}>Fixtures</a><a href="#news" onClick={()=>setMenuOpen(false)}>Latest News</a><a href="#performance" onClick={()=>setMenuOpen(false)}>Performance</a>
        </nav>
        <div style={{display:'flex',alignItems:'center',gap:18}}><Link className="ts-login" to="/login">Sign in</Link><Link className="ts-cta" to="/register">Join the team <ArrowRight size={14}/></Link><button aria-label={menuOpen?'Close menu':'Open menu'} onClick={()=>setMenuOpen(!menuOpen)} style={{border:0,background:'transparent',cursor:'pointer',display:'grid',placeItems:'center'}} className="ts-menu-button">{menuOpen?<X size={21}/>:<Menu size={21}/>}</button></div>
      </header>

      <section className="ts-hero" aria-label="Featured SportIQ stories">
        <img key={slide.image} className="ts-hero-bg" src={slide.image} alt="Athletes competing in a stadium"/>
        <div className="ts-hero-content" key={slide.number}>
          <div className="ts-kicker">{slide.kicker}</div>
          <h1 className="ts-display">{slide.title}</h1>
          <p>{slide.text}</p>
          <div className="ts-hero-actions"><Link className="ts-cta" to="/register">Discover SportIQ <ArrowRight size={15}/></Link><a className="ts-outline" href="#about"><Play size={14}/> Explore the club</a></div>
        </div>
        <div className="ts-slider-ui"><div className="ts-slide-count"><span>{slide.number}</span> / 03</div><button className="ts-arrow" aria-label="Previous slide" onClick={()=>move(-1)}><ArrowLeft size={17}/></button><button className="ts-arrow" aria-label="Next slide" onClick={()=>move(1)}><ArrowRight size={17}/></button></div>
      </section>
      <div className="ts-progress"><span style={{transform:`translateX(${active*100}%)`}}/></div>

      <section id="about" className="ts-section">
        <div className="ts-section-head ts-reveal"><div><div className="ts-eyebrow">More than a game</div><h2 className="ts-display">BUILT ON TEAMWORK.<br/>DRIVEN BY AMBITION.</h2></div><p className="ts-section-intro">SportIQ brings athletes, coaches and talent scouts into one connected sporting ecosystem. Find your edge and make every session count.</p></div>
        <div className="ts-feature-grid">
          <article className="ts-feature ts-reveal"><div className="ts-feature-icon"><Trophy size={23}/></div><h3>Compete to win</h3><p>Turn commitment into consistency and take your performance to the next level.</p></article>
          <article className="ts-feature ts-reveal"><div className="ts-feature-icon"><Zap size={23}/></div><h3>Train with insight</h3><p>Track speed, stamina, strength, agility and accuracy with AI-assisted analysis.</p></article>
          <article className="ts-feature ts-reveal"><div className="ts-feature-icon"><Users size={23}/></div><h3>Find your team</h3><p>Give athletes visibility and help coaches and scouts discover emerging potential.</p></article>
        </div>
      </section>

      <section id="fixtures" className="ts-section ts-fixtures">
        <div className="ts-section-head ts-reveal"><div><div className="ts-eyebrow">Mark your calendar</div><h2 className="ts-display">UPCOMING FIXTURES</h2></div><p className="ts-section-intro">Every game is a new opportunity. Follow the schedule and get ready for the next challenge.</p></div>
        <div className="ts-match-list">{fixtures.map((fixture,i)=><article className="ts-match ts-reveal" key={fixture.competition}><div className="ts-match-meta">{fixture.competition}<br/><span style={{color:'#fff'}}><CalendarDays size={12} style={{display:'inline',verticalAlign:'-2px',marginRight:6}}/>{fixture.date}</span></div><div className="ts-match-teams"><div className="ts-team"><span className="ts-team-badge">{fixture.a}</span><span>{fixture.home}</span></div><span className="ts-vs">VS</span><div className="ts-team"><span className="ts-team-badge">{fixture.b}</span><span>{fixture.away}</span></div></div><Link className="ts-cta" to="/register">Match centre <ArrowUpRight size={14}/></Link></article>)}</div>
      </section>

      <section id="news" className="ts-section">
        <div className="ts-section-head ts-reveal"><div><div className="ts-eyebrow">Inside SportIQ</div><h2 className="ts-display">THE LATEST STORIES</h2></div><p className="ts-section-intro">Ideas, training insights and stories about the people who make sport special.</p></div>
        <div className="ts-story-grid">{stories.map((story,i)=><article className="ts-story ts-reveal" key={story.title}><div className="ts-story-image"><img src={story.image} alt={story.title} loading="lazy"/></div><div className="ts-story-body"><div className="ts-eyebrow">{story.tag}</div><h3>{story.title}</h3><Link className="ts-story-link" to="/register">Read the story <ArrowRight size={14}/></Link></div></article>)}</div>
      </section>

      <section id="performance" className="ts-cta-band ts-reveal"><div><div className="ts-eyebrow" style={{color:'#fff'}}>Your next chapter starts now</div><h2 className="ts-display">READY TO MAKE<br/>YOUR MARK?</h2></div><Link className="ts-cta" to="/register">Become a member <ArrowRight size={15}/></Link></section>
      <footer className="ts-footer"><Link to="/" className="ts-logo"><span className="ts-logo-mark"><Activity size={21}/></span><span>SPORT<span style={{color:'var(--ts-red)'}}>IQ</span></span></Link><p>© 2026 SportIQ · Made for the next generation of athletes.</p><div className="ts-footer-links"><Link to="/login">Sign in</Link><Link to="/register">Register</Link></div></footer>
    </main>
  );
}
