import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { ArrowLeft, Mail, Lock, User } from 'lucide-react';
import logoImg from 'figma:asset/28cc7f8b67ba61bb13e03c30f73fd05e9d3d8a2c.png';

interface LoginPageProps {
  onNavigate: (screen: string) => void;
  onLogin: (user: { name: string; role: 'Farm Owner' | 'Farm Worker' | 'Veterinarian' | 'Authority'; email: string }) => void;
}

export function LoginPage({ onNavigate, onLogin }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('farm-owner');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      // Default login credentials - map email to role
      let userRole: 'Farm Owner' | 'Farm Worker' | 'Veterinarian' | 'Authority' = 'Farm Owner';
      let userName = name || 'Demo User';
      
      if (email === 'farm@kavach.in' || email === '' || !email) {
        userRole = 'Farm Owner';
        userName = 'Rajesh Patel';
      } else if (email === 'vet@kavach.in') {
        userRole = 'Veterinarian';
        userName = 'Dr. Priya Sharma';
      } else if (email === 'authority@kavach.in') {
        userRole = 'Authority';
        userName = 'Suresh Kumar';
      }
      
      onLogin({ name: userName, role: userRole, email: email || 'farm@kavach.in' });
    } else {
      // Register flow - convert role string to proper type
      let userRole: 'Farm Owner' | 'Farm Worker' | 'Veterinarian' | 'Authority' = 'Farm Owner';
      
      if (role === 'vet') {
        userRole = 'Veterinarian';
      } else if (role === 'authority') {
        userRole = 'Authority';
      } else if (role === 'farm-worker') {
        userRole = 'Farm Worker';
      } else {
        userRole = 'Farm Owner';
      }
      
      onLogin({ name: name || 'Demo User', role: userRole, email: email || 'demo@kavach.in' });
    }
  };

  const handleGoogleLogin = () => {
    // Simulate Google login - default to farm owner
    onLogin({ name: 'Demo User', role: 'Farm Owner', email: 'demo@kavach.in' });
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Panel - Forest Green */}
      <div className="w-1/2 bg-[#1B5E42] p-16 flex flex-col justify-center relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative z-10">
          <img src={logoImg} alt="Kavach" className="h-14 mb-8" />
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Protect Your Farm with AI-Powered Biosecurity
          </h1>
          <p className="text-xl text-white/90 leading-relaxed">
            Advanced disease detection and biosecurity management for pig and poultry farms across India.
          </p>
        </div>
      </div>

      {/* Right Panel - White */}
      <div className="w-1/2 bg-white flex items-center justify-center p-12 relative">
        {/* Back to Home Button */}
        <button
          onClick={() => onNavigate('marketing')}
          className="absolute top-6 left-6 flex items-center gap-2 text-[#7A7A6E] hover:text-[#1B5E42] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm"></span>
        </button>

        {/* Form Card */}
        <Card className="w-full max-w-md bg-white rounded-3xl border border-[#E5E3DC] shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-[#7A7A6E] text-sm">
                {isLogin ? 'Sign in to access your dashboard' : 'Join Kavach and protect your farm'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A7A6E]" />
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-12 h-11 rounded-2xl border-[#E5E3DC] focus:border-[#1B5E42] focus:ring-[#1B5E42]"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A7A6E]" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-11 rounded-2xl border-[#E5E3DC] focus:border-[#1B5E42] focus:ring-[#1B5E42]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A7A6E]" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-11 rounded-2xl border-[#E5E3DC] focus:border-[#1B5E42] focus:ring-[#1B5E42]"
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">I am a</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-11 px-4 rounded-2xl border border-[#E5E3DC] focus:border-[#1B5E42] focus:ring-[#1B5E42] text-gray-900"
                  >
                    <option value="farm-owner">Farm Owner</option>
                    <option value="vet">Veterinarian</option>
                    <option value="authority">Government Authority</option>
                  </select>
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4 rounded border-[#E5E3DC] text-[#1B5E42] focus:ring-[#1B5E42]" />
                    <span className="text-sm text-[#7A7A6E]">Remember me</span>
                  </label>
                  <a href="#" className="text-sm text-[#1B5E42] hover:underline">
                    Forgot password?
                  </a>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 rounded-full text-white text-base"
                style={{
                  background: 'linear-gradient(90deg, #1B5E42 0%, #E8A838 100%)',
                }}
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E5E3DC]"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-white text-[#7A7A6E]">or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 rounded-full border-[#E5E3DC] hover:bg-[#F7F5F0] flex items-center justify-center gap-3"
                onClick={handleGoogleLogin}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </Button>

              <p className="text-center text-sm text-[#7A7A6E] mt-4">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[#1B5E42] font-medium hover:underline"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </form>

            <div className="mt-4 pt-4 border-t border-[#E5E3DC] text-center">
              <p className="text-xs text-[#7A7A6E]">
                Demo: farm@kavach.in · vet@kavach.in · authority@kavach.in
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}