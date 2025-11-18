import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import logoWhite from '../assets/logo_white.svg'

export const Login = ({ onToggleMode }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const { signIn, signUp, authLoading } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (!isLogin && !displayName) {
      setError('Please enter your display name')
      return
    }

    try {
      let result
      if (isLogin) {
        result = await signIn(email, password)
      } else {
        result = await signUp(email, password, { display_name: displayName })
      }

      if (result.error) {
        setError(result.error.message)
      } else if (!isLogin) {
        setError('')
        alert('Check your email for verification link!')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-[#120903] to-[#2f1b04] text-white overflow-hidden flex items-center justify-center px-4 py-10 sm:py-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-72 h-72 bg-amber-500/30 blur-3xl -top-20 -left-10"></div>
        <div className="absolute w-96 h-96 bg-yellow-400/20 blur-[140px] bottom-0 right-0"></div>
      </div>

      <div className="relative w-full max-w-5xl">
        <div className="grid md:grid-cols-2 rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_35px_120px_rgba(0,0,0,0.65)]">
          {/* Brand Panel */}
          <div className="p-8 md:p-12 bg-gradient-to-b from-black via-[#1b0c02] to-[#2f1600] flex flex-col gap-10 text-amber-50 text-center md:text-left">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
                <div className="bg-white/10 border border-white/20 rounded-3xl p-4 md:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
                  <img src={logoWhite} alt="Sharda Informatics" className="h-20 md:h-24 w-auto" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.45em] text-amber-200/80">Informatics360.ai</p>
                  <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mt-2">AI Digital Tutor</h1>
                  <p className="text-sm text-amber-100/80 mt-2">Sharda Informatics • Engineering Learners</p>
                </div>
              </div>

              <p className="text-base md:text-lg text-amber-100/90 leading-relaxed">
                Unlock immersive, avatar-powered lessons with real-time diagrams, whiteboard drawings, and Hinglish-friendly explanations.
              </p>

              <a
                href="https://informatics360.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-amber-200 hover:text-amber-100 transition-colors justify-center md:justify-start"
              >
                Visit Informatics360.ai
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>

            <div className="space-y-4 text-sm text-amber-100/80">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <span className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-lg">🧠</span>
                <p>Personalized study plans with instant quizzes and progress tracking.</p>
              </div>
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <span className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-lg">🎙️</span>
                <p>Bilingual chat (English + Hinglish) powered by a lifelike AI avatar.</p>
              </div>
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <span className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-lg">🎨</span>
                <p>Smart whiteboard for instant diagrams, flowcharts, and code visuals.</p>
              </div>
            </div>
          </div>

          {/* Auth Form */}
          <div className="p-6 md:p-10 bg-black/70 text-white flex flex-col justify-center">
            <div className="mb-8 text-center md:text-left">
              <p className="text-xs uppercase tracking-[0.4em] text-amber-200/70 mb-3">{isLogin ? 'Welcome back' : 'Create account'}</p>
              <h2 className="text-3xl font-bold mb-2">{isLogin ? 'Sign in to learn' : 'Join the classroom'}</h2>
              <p className="text-amber-100/70 text-sm">
                {isLogin ? 'Continue your personalized learning journey.' : 'Get full access to immersive AI tutoring.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-amber-100 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/15 text-white placeholder:text-amber-200/50 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/40 outline-none"
                    placeholder="Your name"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-amber-100 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/15 text-white placeholder:text-amber-200/50 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/40 outline-none"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-100 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/15 text-white placeholder:text-amber-200/50 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/40 outline-none"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="p-3 rounded-2xl border border-red-400/40 bg-red-500/10 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className={`w-full py-3.5 rounded-2xl font-semibold transition-all text-black shadow-[0_20px_45px_rgba(0,0,0,0.45)] ${
                  authLoading
                    ? 'bg-white/30 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 hover:brightness-110'
                }`}
              >
                {authLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-black/40 border-t-transparent rounded-full animate-spin"></div>
                    {isLogin ? 'Signing in…' : 'Creating account…'}
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-amber-200/80">
              <p>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError('')
                    setEmail('')
                    setPassword('')
                    setDisplayName('')
                  }}
                  className="ml-2 text-amber-300 hover:text-amber-100 font-semibold transition-colors"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>

            <div className="mt-8 text-xs text-amber-200/70 space-y-1 text-center md:text-left">
              <p>🌟 Personalized learning journeys with progress sync</p>
              <p>🗣️ Hinglish & English explanations</p>
              <p>🎮 Interactive avatar and whiteboard-ready diagrams</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
