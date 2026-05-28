'use client';

import { Credential } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Eye, Trash2, FileText } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface CredentialCardProps {
  credential: Credential;
  onShare: () => void;
  onView: () => void;
  onDelete: () => void;
}

export default function CredentialCard({
  credential,
  onShare,
  onView,
  onDelete,
}: CredentialCardProps) {
  const credentialIcons: Record<string, React.ReactNode> = {
    aadhaar: <FileText className="w-8 h-8" />,
    pan: <FileText className="w-8 h-8" />,
    license: <FileText className="w-8 h-8" />,
    passport: <FileText className="w-8 h-8" />,
  };

  const getGradient = (type: string) => {
    const gradients: Record<string, string> = {
      aadhaar: 'from-blue-600 to-blue-400',
      pan: 'from-purple-600 to-purple-400',
      license: 'from-amber-600 to-amber-400',
      passport: 'from-green-600 to-green-400',
    };
    return gradients[type] || 'from-blue-600 to-blue-400';
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 border-border h-full flex flex-col overflow-hidden relative group">
        {/* Background Gradient */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${getGradient(credential.type)} opacity-5 group-hover:opacity-10 transition-opacity`}
        />

        {/* Content */}
        <div className="relative z-10 space-y-4 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getGradient(
                  credential.type
                )} text-white flex items-center justify-center`}
              >
                {credentialIcons[credential.type]}
              </div>
              <div>
                <p className="font-semibold capitalize">{credential.type}</p>
                <p className="text-xs text-muted-foreground">
                  Issued {new Date(credential.issueDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {credential.status === 'active' && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 text-xs font-medium">
                <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400" />
                Active
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-2 text-sm">
            {credential.metadata.firstName && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  {credential.metadata.firstName} {credential.metadata.lastName}
                </span>
              </p>
            )}
            {credential.metadata.dateOfBirth && (
              <p className="text-xs text-muted-foreground">
                DOB: {credential.metadata.dateOfBirth}
              </p>
            )}
            {credential.expiryDate && (
              <p className="text-xs text-muted-foreground">
                Expires: {new Date(credential.expiryDate).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Proof Info */}
          <div className="bg-muted/50 rounded p-2 space-y-1 mt-auto">
            <p className="text-xs font-medium text-muted-foreground">Proof Hash</p>
            <p className="text-xs font-mono text-foreground truncate">
              {credential.proofHash.slice(0, 18)}...
            </p>
          </div>
        </div>

        {/* Actions - always visible for accessibility / touch devices */}
        <div
          className="relative z-20 flex gap-2 pt-4 border-t border-border mt-4"
        >
          <Button
            size="sm"
            variant="outline"
            onClick={onView}
            className="flex-1 gap-2 h-8"
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">View</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onShare}
            className="flex-1 gap-2 h-8"
          >
            <Share2 className="w-3 h-3" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="flex-1 gap-2 h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Revoke</span>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
