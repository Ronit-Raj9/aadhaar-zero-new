'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { EnrollmentData } from '@/lib/types';

const STORAGE_KEY = 'aadhaar_enrollment_state';

const initialEnrollmentData: EnrollmentData = {
  personalInfo: {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
  },
  document: {
    type: 'aadhaar',
  },
  liveness: {
    status: 'not-started',
  },
  consent: {
    agreedToTerms: false,
    agreedToDataUsage: false,
  },
};

interface EnrollmentContextType {
  data: EnrollmentData;
  currentStep: number;
  updateStep: (step: number) => void;
  updatePersonalInfo: (info: Partial<EnrollmentData['personalInfo']>) => void;
  updateDocument: (doc: Partial<EnrollmentData['document']>) => void;
  updateLiveness: (liveness: Partial<EnrollmentData['liveness']>) => void;
  updateConsent: (consent: Partial<EnrollmentData['consent']>) => void;
  resetEnrollment: () => void;
}

const EnrollmentContext = createContext<EnrollmentContextType | undefined>(undefined);

export function EnrollmentProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<EnrollmentData>(initialEnrollmentData);
  const [currentStep, setCurrentStep] = useState(0);

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.data) setData(parsed.data);
        if (typeof parsed.currentStep === 'number') setCurrentStep(parsed.currentStep);
      }
    } catch {
      // Ignore hydration errors
    }
  }, []);

  // Persist to sessionStorage on every change (strip non-serializable File objects)
  useEffect(() => {
    try {
      const serializableData = {
        ...data,
        document: {
          ...data.document,
          file: undefined, // File objects are not JSON-serializable
        },
        liveness: {
          ...data.liveness,
          videoFile: undefined, // File objects are not JSON-serializable
        },
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ data: serializableData, currentStep }));
    } catch {
      // Quota exceeded or SSR
    }
  }, [data, currentStep]);

  const updateStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const updatePersonalInfo = useCallback((info: Partial<EnrollmentData['personalInfo']>) => {
    setData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        ...info,
      },
    }));
  }, []);

  const updateDocument = useCallback((doc: Partial<EnrollmentData['document']>) => {
    setData((prev) => ({
      ...prev,
      document: {
        ...prev.document,
        ...doc,
      },
    }));
  }, []);

  const updateLiveness = useCallback((liveness: Partial<EnrollmentData['liveness']>) => {
    setData((prev) => ({
      ...prev,
      liveness: {
        ...prev.liveness,
        ...liveness,
      },
    }));
  }, []);

  const updateConsent = useCallback((consent: Partial<EnrollmentData['consent']>) => {
    setData((prev) => ({
      ...prev,
      consent: {
        ...prev.consent,
        ...consent,
      },
    }));
  }, []);

  const resetEnrollment = useCallback(() => {
    setData(initialEnrollmentData);
    setCurrentStep(0);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const value: EnrollmentContextType = {
    data,
    currentStep,
    updateStep,
    updatePersonalInfo,
    updateDocument,
    updateLiveness,
    updateConsent,
    resetEnrollment,
  };

  return <EnrollmentContext.Provider value={value}>{children}</EnrollmentContext.Provider>;
}

export function useEnrollment(): EnrollmentContextType {
  const context = useContext(EnrollmentContext);
  if (!context) {
    throw new Error('useEnrollment must be used within EnrollmentProvider');
  }
  return context;
}
