'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../components/auth-provider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { setUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call custom login endpoint which sets the HTTPOnly session cookie
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed verification');
      }

      setUser(data.user);
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${data.user.fullName}`,
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = error.message;
      if (errorMessage === 'Configuration') {
        errorMessage = 'Server Configuration Error: Please ensure AUTH_SECRET is set in Vercel and NEXTAUTH_URL exactly matches the live domain, then trigger a redeploy.';
      } else if (errorMessage === 'CredentialsSignin') {
        errorMessage = 'Invalid email or password. Please check your credentials and ensure the email is entirely lowercase.';
      }

      toast({
        title: 'Login failed',
        description: errorMessage || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full h-24 w-24 relative flex items-center justify-center">
              <Image src="/logo.png" alt="Logo" fill className="object-contain p-2" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">H TECHNOLOGIES LTD</CardTitle>
            <CardDescription className="mt-2">
              Sign in to your account to continue
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
