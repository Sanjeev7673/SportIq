import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BrainCircuit,
  TrendingUp,
  ShieldCheck,
  Search,
  Scale,
  Award,
  ArrowRight,
  Zap,
  Users,
  ChevronRight
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import ThemeToggle from '../components/common/ThemeToggle';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100 selection:bg-cyan-500 selection:text-white transition-colors duration-200">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/60 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sport<span className="text-cyan-500 dark:text-cyan-400">IQ</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle size="sm" />
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm" icon={ArrowRight}>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-6 text-center radial-bg overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-semibold mb-6 animate-pulse">
            <Zap className="w-3.5 h-3.5" /> Next-Generation AI Sports Talent Analytics
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight sm:leading-none mb-6">
            Identify, Analyze & Elevate <br />
            <span className="bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 dark:from-cyan-400 dark:via-teal-300 dark:to-blue-500 bg-clip-text text-transparent">
              Athletic Talent with AI
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Empower athletes, coaches, and scouts with multidimensional performance tracking, position-weighted AI scoring algorithms, and automated training intelligence.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/register">
              <Button variant="primary" size="lg" icon={ArrowRight}>
                Join Platform Free
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                Explore Portal
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mt-20 text-left">
          <Card hover className="relative group overflow-hidden">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 w-fit mb-4">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">AI Talent Scoring</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Position-specific 5-pillar weighting model calculating potential indexes from 0 to 100.
            </p>
          </Card>

          <Card hover className="relative group overflow-hidden">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 w-fit mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">Performance Tracking</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Log speed, stamina, strength, agility, and accuracy to generate chronological progression trends.
            </p>
          </Card>

          <Card hover className="relative group overflow-hidden">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 w-fit mb-4">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">Player Comparison</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Side-by-side radar overlay comparing up to 5 athletes across physical & AI benchmarks.
            </p>
          </Card>

          <Card hover className="relative group overflow-hidden">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 w-fit mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">Scout Shortlisting</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Filter prospective recruits by talent threshold, track prospects, and add private evaluations.
            </p>
          </Card>
        </div>
      </section>

      {/* Role Personas Section */}
      <section className="py-20 px-6 border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-950/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
              Built for the Entire Sports Ecosystem
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl mx-auto">
              Specialized tools and interactive dashboards tailored for every sporting stakeholder.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card hover className="border-t-2 border-t-cyan-500">
              <Badge variant="primary" className="mb-4">For Athletes</Badge>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display mb-2">Showcase Your Potential</h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 mb-6">
                <li className="flex items-center gap-2">✓ Create verified athletic profile</li>
                <li className="flex items-center gap-2">✓ Log session metrics and match data</li>
                <li className="flex items-center gap-2">✓ Receive instant AI talent breakdown</li>
                <li className="flex items-center gap-2">✓ Follow coach workout recommendations</li>
              </ul>
              <Link to="/register">
                <Button variant="outline" size="sm" className="w-full">Get Athlete Access</Button>
              </Link>
            </Card>

            <Card hover className="border-t-2 border-t-blue-500">
              <Badge variant="primary" className="mb-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">For Coaches</Badge>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display mb-2">Develop Squad Champions</h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 mb-6">
                <li className="flex items-center gap-2">✓ Squad performance monitoring</li>
                <li className="flex items-center gap-2">✓ Multi-player comparison radar</li>
                <li className="flex items-center gap-2">✓ Prescribe structured training drills</li>
                <li className="flex items-center gap-2">✓ AI-driven weakness identification</li>
              </ul>
              <Link to="/register">
                <Button variant="outline" size="sm" className="w-full">Get Coach Access</Button>
              </Link>
            </Card>

            <Card hover className="border-t-2 border-t-purple-500">
              <Badge variant="primary" className="mb-4 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">For Scouts</Badge>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display mb-2">Discover Next-Gen Stars</h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 mb-6">
                <li className="flex items-center gap-2">✓ Filter by AI Talent Score & age</li>
                <li className="flex items-center gap-2">✓ Maintain private recruitment shortlists</li>
                <li className="flex items-center gap-2">✓ Attach confidential scouting notes</li>
                <li className="flex items-center gap-2">✓ Head-to-head prospect analysis</li>
              </ul>
              <Link to="/register">
                <Button variant="outline" size="sm" className="w-full">Get Scout Access</Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        <p>© 2026 SportIQ AI Talent Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};
export default LandingPage;
