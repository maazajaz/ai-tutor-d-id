import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

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
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🎓 AI Digital Tutor
          </h1>
          <p className="text-gray-600">
            {isLogin ? 'Welcome back!' : 'Join our learning community'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Your name"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
              authLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 transform hover:scale-105'
            } text-white shadow-lg`}
          >
            {authLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </div>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setEmail('')
                setPassword('')
                setDisplayName('')
              }}
              className="ml-2 text-green-600 hover:text-green-700 font-semibold transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <div className="mt-8 text-center">
          <div className="text-xs text-gray-500 space-y-1">
            <p>🌟 Personalized learning experience</p>
            <p>🗣️ English & Hinglish support</p>
            <p>🎮 Interactive 3D avatar teacher</p>
          </div>
        </div>
      </div>
    </div>
  )
}
