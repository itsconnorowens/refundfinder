'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';

export default function DocumentUploadPage() {
  const router = useRouter();
  const params = useParams();
  const claimId = params.claimId as string;

  // Get payment intent ID from URL params
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const paymentIntentId = searchParams?.get('paymentIntentId') || '';

  const [boardingPass, setBoardingPass] = useState<File | null>(null);
  const [delayProof, setDelayProof] = useState<File | null>(null);
  const [bookingReference, setBookingReference] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (type: 'boardingPass' | 'delayProof', file: File | null) => {
    if (type === 'boardingPass') {
      setBoardingPass(file);
    } else {
      setDelayProof(file);
    }
    // Clear error for this field
    setErrors(prev => ({ ...prev, [type]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!boardingPass) {
      newErrors.boardingPass = 'Boarding pass is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('claimId', claimId);
      if (boardingPass) formData.append('boardingPass', boardingPass);
      if (delayProof) formData.append('delayProof', delayProof);
      if (bookingReference) formData.append('bookingReference', bookingReference);

      const response = await fetch('/api/upload-documents', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const uploadData = await response.json();
        console.log('Documents uploaded successfully:', uploadData);

        // Now create the claim with the uploaded documents
        // The create-claim API will pull all data from the payment intent
        // We just need to tell it the claim ID and document URLs
        try {
          const claimResponse = await fetch('/api/finalize-claim', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              claimId,
              paymentIntentId,
              boardingPassUrl: uploadData.documentUrls?.boardingPassUrl,
              delayProofUrl: uploadData.documentUrls?.delayProofUrl,
              bookingReference,
            }),
          });

          if (claimResponse.ok) {
            // Redirect to success page
            router.push(`/success?claimId=${claimId}`);
          } else {
            const claimError = await claimResponse.json();
            console.error('Failed to create claim:', claimError);
            // Redirect anyway - documents are uploaded, we can create claim manually if needed
            router.push(`/success?claimId=${claimId}&warning=claim_pending`);
          }
        } catch (claimError) {
          console.error('Error finalizing claim:', claimError);
          // Redirect anyway - documents are uploaded
          router.push(`/success?claimId=${claimId}&warning=claim_pending`);
        }
      } else {
        const data = await response.json();
        setErrors({ submit: data.message || 'Upload failed' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrors({ submit: 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    // Redirect to success page without uploading
    router.push(`/success?claimId=${claimId}&documentsSkipped=true`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600">
              Claim ID: <span className="font-mono font-semibold text-purple-600">{claimId}</span>
            </p>
          </div>

          {/* Document Upload Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Upload Your Documents
              </h2>
              <p className="text-gray-600 mb-6">
                To file your claim, we need your boarding pass. Delay proof is optional but helpful.
              </p>
            </div>

            {/* Boarding Pass */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Boarding Pass <span className="text-red-500">*</span>
              </label>
              <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                errors.boardingPass ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-purple-400'
              } transition-colors`}>
                <input
                  type="file"
                  id="boardingPass"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileChange('boardingPass', e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="boardingPass" className="cursor-pointer">
                  {boardingPass ? (
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{boardingPass.name}</span>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </label>
              </div>
              {errors.boardingPass && (
                <p className="text-red-600 text-sm mt-1">{errors.boardingPass}</p>
              )}
            </div>

            {/* Booking Reference */}
            <div>
              <label htmlFor="bookingReference" className="block text-sm font-medium text-gray-700 mb-2">
                Booking Reference (Optional)
              </label>
              <input
                type="text"
                id="bookingReference"
                placeholder="e.g., ABC123"
                value={bookingReference}
                onChange={(e) => setBookingReference(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">Found in your confirmation email (helps speed up processing)</p>
            </div>

            {/* Delay Proof */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delay Proof (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  id="delayProof"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileChange('delayProof', e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="delayProof" className="cursor-pointer">
                  {delayProof ? (
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{delayProof.name}</span>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-gray-600">Email, screenshot, or any proof you have</p>
                      <p className="text-xs text-gray-500 mt-1">We can use flight data if you don't have this</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                I'll email these later
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {uploading ? 'Uploading...' : 'Submit Documents'}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Missing your boarding pass? Email it to <a href="mailto:claims@flghtly.com" className="text-purple-600 hover:underline">claims@flghtly.com</a> with your claim ID
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
