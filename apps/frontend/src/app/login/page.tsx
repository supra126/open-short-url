import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

function LoginContent() {
  return (
    <div className="w-full max-w-md px-4">
      <LoginForm />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Suspense fallback={
        <div className="w-full max-w-md px-4">
          <div className="animate-pulse">Loading...</div>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}
