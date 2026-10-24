import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, ArrowRight, ArrowUpRight, BrainCircuit, TrendingUp,
  Search, Scale, Trophy, Zap, Users, Play, Target, Menu
} from 'lucide-react';
import Button from '../components/common/Button';

const features = [
  { icon: BrainCircuit, number: '01', title: 'AI talent intelligence', text: 'Turn performance data into a clear picture of athletic potential with position-aware scoring.' },
  { icon: TrendingUp, number: '02', title: 'Performance, over time', text: 'Track speed, stamina, strength, agility and accuracy as athletes push their limits.' },
  { icon: Scale, number: '03', title: 'Compare the details', text: 'Bring athlete metrics together to spot strengths, opportunities and emerging talent.' },
  { icon: Search, number: '04', title: 'Scout the next star', text: 'Build prospect shortlists, follow progress and make more informed recruitment decisions.' },
];

const roles = [
  { label: 'ATHLETES', title: 'Make your hard work visible.', text: 'Build your profile, track progress and understand where your performance can go next.', to: '/register' },
  { label: 'COACHES', title: 'Build a stronger squad.', text: 'Compare athletes, identify development areas and shape more focused training plans.', to: '/register' },
  { label: 'SCOUTS', title: 'Find potential before everyone else.', text: 'Discover prospects, compare performance and keep your shortlist organised.', to: '/register' },
];

export default function LandingPage() {
  return (
    <main className="sportiq-motion min-h-screen overflow-hidden bg-[#f1efeb] text-[#151515]">\n      <style>{`
        @keyframes sportiq-rise { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sportiq-slide { from { opacity: 0; transform: translateX(-34px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes sportiq-zoom { from { opacity: 0; transform: scale(1.07); } to { opacity: 1; transform: scale(1); } }
        @keyframes sportiq-float { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-12px) rotate(1deg); } }
        @keyframes sportiq-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(243,38,22,.32); } 50% { box-shadow: 0 0 0 12px rgba(243,38,22,0); } }
        @keyframes sportiq-sheen { 0%, 65% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }
        .sportiq-motion .motion-rise { animation: sportiq-rise .8s cubic-bezier(.2,.75,.25,1) both; }
        .sportiq-motion .motion-slide { animation: sportiq-slide .85s cubic-bezier(.2,.75,.25,1) both; }
        .sportiq-motion .motion-zoom { animation: sportiq-zoom 1.2s cubic-bezier(.2,.75,.25,1) both; }
        .sportiq-motion .motion-delay-1 { animation-delay: .12s; }
        .sportiq-motion .motion-delay-2 { animation-delay: .24s; }
        .sportiq-motion .motion-float { animation: sportiq-float 5s ease-in-out infinite; }
        .sportiq-motion .motion-pulse { animation: sportiq-pulse 2.4s ease-out infinite; }
        .sportiq-motion .motion-card { transition: transform .35s cubic-bezier(.2,.75,.25,1), box-shadow .35s, background-color .3s; }
        .sportiq-motion .motion-card:hover { transform: translateY(-9px); box-shadow: 0 22px 45px rgba(0,0,0,.12); }
        .sportiq-motion .motion-image { transition: transform .8s cubic-bezier(.2,.75,.25,1), filter .5s; }
        .sportiq-motion .motion-image:hover { transform: scale(1.035); filter: saturate(1.15); }
        .sportiq-motion .motion-link { transition: gap .25s, transform .25s, background-color .25s, color .25s; }
        .sportiq-motion .motion-link:hover { gap: 1rem; }
        .sportiq-motion .motion-meter { transform-origin: left; animation: sportiq-rise 1s ease-out both; }
        .sportiq-motion .motion-sheen { position: relative; overflow: hidden; }
        .sportiq-motion .motion-sheen:after { content: ''; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 20%, rgba(255,255,255,.12) 48%, transparent 70%); transform: translateX(-120%); animation: sportiq-sheen 5s ease-in-out infinite; pointer-events: none; }
        @media (prefers-reduced-motion: reduce) { .sportiq-motion *, .sportiq-motion *:before, .sportiq-motion *:after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: .01ms !important; } }
      `}</style>

      <header className="relative z-20 border-b border-black/10 bg-[#f1efeb]">
        <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <Link to="/" className="flex items-center gap-2.5" aria-label="SportIQ home">
            <span className="flex h-10 w-10 items-center justify-center bg-[#f32616] text-white"><Activity size={23} strokeWidth={2.5} /></span>
            <span className="font-display text-2xl font-black tracking-tight">SPORT<span className="text-[#f32616]">IQ</span><span className="ml-2 align-top text-[9px] font-bold tracking-[.22em] text-black/45">AI</span></span>
          </Link>
          <div className="hidden items-center gap-8 text-[11px] font-extrabold uppercase tracking-[.16em] md:flex">
            <a href="#platform" className="transition hover:text-[#f32616]">Platform</a>
            <a href="#intelligence" className="transition hover:text-[#f32616]">AI Intelligence</a>
            <a href="#ecosystem" className="transition hover:text-[#f32616]">For You</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden text-xs font-extrabold uppercase tracking-wider sm:inline-flex">Sign in</Link>
            <Link to="/register" className="inline-flex items-center gap-2 bg-[#f32616] px-4 py-3 text-[10px] font-black uppercase tracking-[.12em] text-white transition hover:bg-black">Join SportIQ <ArrowRight size={14} /></Link>
          </div>
        </nav>
      </header>

      <section className="relative isolate min-h-[650px] overflow-hidden bg-[#151515] text-white lg:min-h-[690px]">
        <img src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=2200&q=85" alt="Football stadium under floodlights" className="motion-zoom absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/85 to-black/20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/65 via-transparent to-black/10" />
        <div className="absolute right-[-3rem] top-[-5rem] -z-10 select-none font-display text-[22rem] font-black leading-none text-white/[.045]">IQ</div>
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-5 py-20 sm:px-8 lg:min-h-[690px] lg:grid-cols-[1.1fr_.9fr] lg:px-12 lg:py-24">
          <div className="max-w-3xl">
            <div className="motion-rise mb-7 flex items-center gap-3 text-[10px] font-black uppercase tracking-[.25em] text-[#ff493b]"><span className="h-[2px] w-9 bg-[#f32616]" /> The future of athletic performance</div>
            <h1 className="motion-slide font-display text-5xl font-black uppercase leading-[.94] tracking-[-.055em] sm:text-7xl lg:text-[6.3rem]">Talent is<br />everywhere.<br /><span className="text-[#f32616]">Data finds it.</span></h1>
            <p className="motion-rise motion-delay-1 mt-7 max-w-xl text-base leading-7 text-white/70 sm:text-lg">A smarter way for athletes, coaches and scouts to understand performance, uncover potential and make the next move count.</p>
            <div className="motion-rise motion-delay-2 mt-9 flex flex-wrap gap-3">
              <Link to="/register" className="motion-link inline-flex items-center gap-3 bg-[#f32616] px-6 py-4 text-xs font-black uppercase tracking-[.12em] transition hover:bg-white hover:text-black">Explore SportIQ <ArrowRight size={16} /></Link>
              <a href="#platform" className="inline-flex items-center gap-3 border border-white/40 px-6 py-4 text-xs font-black uppercase tracking-[.12em] transition hover:border-white hover:bg-white hover:text-black"><Play size={15} /> Discover the platform</a>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/20 pt-5 text-[10px] font-bold uppercase tracking-[.15em] text-white/55">
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 bg-[#f32616]" /> Athlete-first analytics</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 bg-[#f32616]" /> AI-assisted insights</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 bg-[#f32616]" /> Built for every role</span>
            </div>
          </div>
          <div className="relative hidden min-h-[420px] lg:block">
            <div className="absolute right-0 top-7 w-[78%] overflow-hidden border border-white/15 bg-white/5 backdrop-blur-sm">
              <img src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=900&q=85" alt="Athletes competing on the pitch" className="motion-image h-[365px] w-full object-cover grayscale-[25%]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-6"><div className="text-[10px] font-black uppercase tracking-[.2em] text-[#ff493b]">Performance insight</div><div className="mt-2 font-display text-3xl font-black uppercase">See beyond<br />the scoreboard.</div></div>
            </div>
            <div className="motion-float absolute bottom-2 left-0 w-56 border-l-4 border-[#f32616] bg-[#f1efeb] p-5 text-black shadow-2xl">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[.18em] text-black/50"><span>Talent index</span><Target size={16} className="text-[#f32616]" /></div>
              <div className="mt-2 font-display text-5xl font-black">0–100</div>
              <p className="mt-2 text-xs leading-5 text-black/60">Position-aware scoring. Clearer development goals.</p>
            </div>
            <div className="motion-float absolute right-[-8px] top-0 flex h-20 w-20 items-center justify-center rounded-full bg-[#f32616] text-center text-[10px] font-black uppercase leading-4 tracking-wider">Train<br />Analyse<br />Rise</div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 h-2 w-1/3 bg-[#f32616]" />
      </section>

      <section id="platform" className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="mb-3 text-[10px] font-black uppercase tracking-[.25em] text-[#f32616]">One platform. More perspective.</p><h2 className="font-display text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl">Built for the<br />work behind the win.</h2></div>
          <p className="max-w-md text-sm leading-6 text-black/60">From everyday training to talent discovery, bring the details together and turn performance into progress.</p>
        </div>
        <div className="grid gap-px border border-black/10 bg-black/10 sm:grid-cols-2 xl:grid-cols-4">
          {features.map(({ icon: Icon, number, title, text }) => (
            <article key={number} className="motion-card group bg-[#f1efeb] p-7 transition-colors duration-300 hover:bg-[#171717] hover:text-white sm:p-8">
              <div className="flex items-start justify-between"><span className="flex h-12 w-12 items-center justify-center bg-[#f32616] text-white"><Icon size={22} /></span><span className="font-display text-sm font-black text-black/25 group-hover:text-white/30">{number}</span></div>
              <h3 className="mt-10 font-display text-xl font-black uppercase leading-tight">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-black/60 group-hover:text-white/60">{text}</p>
              <div className="mt-7 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.15em] text-[#f32616]">Learn more <ArrowUpRight size={14} /></div>
            </article>
          ))}
        </div>
      </section>

      <section id="intelligence" className="bg-[#171717] text-white">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-12 lg:py-20">
          <div><p className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.25em] text-[#ff493b]"><Zap size={14} /> Intelligence in every metric</p><h2 className="font-display text-4xl font-black uppercase leading-[.98] tracking-tight sm:text-6xl">Numbers tell a story.<br /><span className="text-[#f32616]">We help you read it.</span></h2><p className="mt-6 max-w-lg text-sm leading-7 text-white/60">Track key physical attributes, follow progress over time and use AI-assisted scoring as one more perspective in athlete development—not a replacement for expert judgement.</p><Link to="/register" className="mt-8 inline-flex items-center gap-3 bg-white px-5 py-4 text-[10px] font-black uppercase tracking-[.15em] text-black transition hover:bg-[#f32616] hover:text-white">Start your journey <ArrowRight size={15} /></Link></div>
          <div className="grid grid-cols-2 gap-3">
            {[{ label: 'Speed', value: 'Track' }, { label: 'Stamina', value: 'Build' }, { label: 'Strength', value: 'Measure' }, { label: 'Agility', value: 'Improve' }].map((item, i) => <div key={item.label} className="motion-card border border-white/15 p-5 sm:p-7"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[.18em] text-white/50">{item.label}</span><span className="text-xs text-[#f32616]">0{i + 1}</span></div><div className="mt-7 font-display text-2xl font-black uppercase sm:text-3xl">{item.value}</div><div className="mt-4 h-1 bg-white/10"><div className="motion-meter h-1 bg-[#f32616]" style={{ width: [ '76%', '64%', '85%', '70%' ][i] }} /></div></div>)}
          </div>
        </div>
      </section>

      <section id="ecosystem" className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mb-10"><p className="mb-3 text-[10px] font-black uppercase tracking-[.25em] text-[#f32616]">Your game. Your goals.</p><h2 className="font-display text-4xl font-black uppercase tracking-tight sm:text-5xl">One ecosystem.<br />Every perspective.</h2></div>
        <div className="grid gap-4 lg:grid-cols-3">
          {roles.map((role, i) => <article key={role.label} className="motion-card relative flex min-h-[280px] flex-col border border-black/10 bg-white/40 p-7 sm:p-9"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[.2em] text-[#f32616]">{role.label}</span><span className="font-display text-4xl font-black text-black/10">0{i + 1}</span></div><h3 className="mt-9 max-w-xs font-display text-2xl font-black uppercase leading-tight">{role.title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-black/60">{role.text}</p><Link to={role.to} className="mt-auto flex items-center gap-2 pt-7 text-[10px] font-black uppercase tracking-[.15em] hover:text-[#f32616]">Get started <ArrowRight size={14} /></Link></article>)}
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-7 bg-[#f32616] p-8 text-white sm:p-12 lg:flex-row lg:items-center lg:p-16">
          <div><p className="mb-3 text-[10px] font-black uppercase tracking-[.25em] text-white/70">The next move starts here</p><h2 className="font-display text-4xl font-black uppercase leading-none sm:text-5xl">Your potential.<br />Your next level.</h2></div>
          <Link to="/register" className="motion-link motion-pulse inline-flex w-fit items-center gap-3 bg-black px-6 py-4 text-[10px] font-black uppercase tracking-[.15em] transition hover:bg-white hover:text-black">Join SportIQ <ArrowRight size={15} /></Link>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-[#e7e4df]">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 px-5 py-7 sm:px-8 md:flex-row md:items-center lg:px-12">
          <Link to="/" className="font-display text-xl font-black tracking-tight">SPORT<span className="text-[#f32616]">IQ</span></Link>
          <p className="text-xs text-black/50">© 2026 SportIQ AI Talent Platform. Built for the next generation of athletes.</p>
          <div className="flex gap-5 text-[10px] font-black uppercase tracking-[.15em]"><Link to="/login" className="hover:text-[#f32616]">Sign in</Link><Link to="/register" className="hover:text-[#f32616]">Create account</Link></div>
        </div>
      </footer>
    </main>
  );
}
