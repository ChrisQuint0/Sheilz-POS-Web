"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Mock login delay
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f9fafb] p-4 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#C2456A]/[0.03] blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-[#e08a4f]/[0.03] blur-3xl" />
      </div>

      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl shadow-[#C2456A]/5 border border-gray-100 p-8 z-10 relative">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-24 h-24 mb-6 relative drop-shadow-sm">
            <Image 
              src="/sheilz_pos_logo.png" 
              alt="Sheilz Coffee Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-[#3a2b27] mb-2">Sheilz Coffee POS</h1>
          <p className="text-[13px] text-gray-500 font-medium">
            Sign in to access the management dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[13px] font-bold text-[#3a2b27] uppercase tracking-wider">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@sheilz.com" 
                required
                className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:border-[#C2456A] focus:ring-[#C2456A]/20 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[13px] font-bold text-[#3a2b27] uppercase tracking-wider">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                required
                className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:border-[#C2456A] focus:ring-[#C2456A]/20 transition-colors"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 mt-6 bg-[#C2456A] hover:bg-[#a33858] text-white shadow-md shadow-[#C2456A]/20 text-sm font-semibold transition-all group"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

      </div>
    </div>
  );
}
