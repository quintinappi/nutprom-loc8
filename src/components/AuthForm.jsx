import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { authService } from '../services/authService';

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getReadableErrorMessage = (error) => {
    console.log('Error details:', error);
    
    if (error.code === 'auth/network-request-failed') {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    if (error.code === 'auth/invalid-login-credentials' || 
        error.code === 'auth/invalid-credential' || 
        error.code === 'INVALID_LOGIN_CREDENTIALS') {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    
    if (error.code === 'auth/email-already-in-use') {
      return 'An account with this email already exists.';
    }
    
    return error.message || 'An unexpected error occurred. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log(`Starting ${isSignUp ? 'sign up' : 'sign in'} process for email:`, email);
      
      if (isSignUp) {
        await authService.signUp(email, password);
        toast.success('Account created successfully!');
      } else {
        await authService.signIn(email, password);
        toast.success('Signed in successfully!');
      }
      
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Authentication error:', error);
      const errorMessage = getReadableErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>{isSignUp ? 'Sign Up' : 'Login'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Enter your password"
                minLength={6}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Log In')}
            </Button>
          </form>
          <p className="text-center mt-4">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <Button
              variant="link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="ml-2"
              disabled={isLoading}
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;