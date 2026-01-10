import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Dummy login logic
    if (email === 'admin@kopi.com' && password === 'admin123') {
      localStorage.setItem('adminToken', 'dummy-token-' + Date.now());
      navigate('/admin-dashboard');
    } else {
      setError('Email atau password salah');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 to-amber-800 flex items-center justify-center px-4">
      <Card className="shadow-lg p-8 max-w-md w-full border-0">
        <div className="text-center mb-8">
          <Lock size={48} className="mx-auto text-amber-900 mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Admin Login</h1>
          <p className="text-gray-600 text-sm mt-2">Kelola menu coffee shop Anda</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@kopi.com"
            />
          </div>

          <div className="mb-6">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-amber-900 text-white hover:bg-amber-800 py-6 text-base font-bold"
          >
            Login
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">Demo Credentials:</p>
          <p className="text-sm text-gray-800 text-center">
            <strong>Email:</strong> admin@kopi.com<br />
            <strong>Password:</strong> admin123
          </p>
        </div>
      </Card>
    </div>
  );
}
