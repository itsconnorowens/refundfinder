'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Mail, FileText, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClaimStatusModalProps {
  claimId: string;
}

export function ClaimStatusModal({ claimId }: ClaimStatusModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          className="flex-1 text-lg py-6 border-slate-600 text-slate-300 hover:text-white hover:border-slate-500"
          size="lg"
        >
          Check Claim Status
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-slate-800 border border-slate-700 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <Dialog.Title className="text-xl font-semibold text-white">
                  Claim Status Information
                </Dialog.Title>
              </div>
              <Dialog.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-5 w-5 text-slate-400 hover:text-white" />
                <span className="sr-only">Close</span>
              </Dialog.Close>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <Dialog.Description className="text-slate-300 leading-relaxed">
                To check the status of your claim, please contact us with your claim ID. Our team will provide you with the latest updates.
              </Dialog.Description>

              {/* Claim ID Display */}
              <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">Your Claim ID</span>
                </div>
                <div className="font-mono text-lg font-semibold text-white bg-slate-900 rounded px-3 py-2 select-all">
                  {claimId}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Copy and include this ID in your email
                </p>
              </div>

              {/* Contact Information */}
              <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-5 h-5 text-green-400" />
                  <h3 className="font-semibold text-green-400">Contact Us</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-green-300 font-medium">Email:</span>
                    <a
                      href="mailto:claims@flghtly.com"
                      className="text-green-400 hover:text-green-300 underline transition-colors"
                    >
                      claims@flghtly.com
                    </a>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-green-300 font-medium">Subject:</span>
                    <span className="text-green-400 font-mono text-xs">
                      Claim Status Inquiry - {claimId}
                    </span>
                  </div>
                </div>
              </div>

              {/* What to Include */}
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <h4 className="font-medium text-white mb-2">What to Include in Your Email:</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Your claim ID (above)</li>
                  <li>• Your full name</li>
                  <li>• Flight number and date</li>
                  <li>• Any specific questions about your claim</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  window.location.href = `mailto:claims@flghtly.com?subject=Claim Status Inquiry - ${claimId}&body=Hello,%0D%0A%0D%0AI would like to inquire about the status of my claim.%0D%0A%0D%0AClaim ID: ${claimId}%0D%0A%0D%0AThank you.`;
                }}
                className="flex-1"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1 border-slate-600 text-slate-300 hover:text-white hover:border-slate-500"
              >
                Close
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
