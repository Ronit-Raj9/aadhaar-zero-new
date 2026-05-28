'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEnrollment } from '@/contexts/EnrollmentContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navbar } from '@/components/Navbar';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function EnrollmentStep1() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data, updatePersonalInfo, currentStep } = useEnrollment();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { firstName, lastName, dateOfBirth, email, phone } = data.personalInfo;

    if (!firstName || !lastName || !dateOfBirth || !email || !phone) {
      toast.error('Please fill in all fields');
      return;
    }

    // Basic email validation
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push('/enroll/step2');
    } catch (error) {
      toast.error('Failed to proceed');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              <h1 className="text-3xl font-bold">Personal Information</h1>
            </div>
            <p className="text-muted-foreground">
              Let's start by collecting your basic personal information
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step 1 of 4</span>
              <span>25%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-1/4 bg-blue-600 transition-all duration-300" />
            </div>
          </div>

          {/* Form */}
          <Card className="p-8 border-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={data.personalInfo.firstName}
                    onChange={(e) => updatePersonalInfo({ firstName: e.target.value })}
                    disabled={isSubmitting}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={data.personalInfo.lastName}
                    onChange={(e) => updatePersonalInfo({ lastName: e.target.value })}
                    disabled={isSubmitting}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob" className="text-sm font-medium">
                  Date of Birth *
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={data.personalInfo.dateOfBirth}
                  onChange={(e) => updatePersonalInfo({ dateOfBirth: e.target.value })}
                  disabled={isSubmitting}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={data.personalInfo.email}
                  onChange={(e) => updatePersonalInfo({ email: e.target.value })}
                  disabled={isSubmitting}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={data.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo({ phone: e.target.value })}
                  disabled={isSubmitting}
                  className="h-10"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  disabled={isSubmitting}
                  variant="outline"
                  className="flex-1 h-10 gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Next Step
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </>
  );
}
