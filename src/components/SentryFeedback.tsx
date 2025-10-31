'use client';

import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { MessageSquare } from 'lucide-react';

/**
 * Sentry Feedback Widget Component
 *
 * Provides a floating button that opens Sentry's user feedback dialog
 * Allows users to report bugs and issues directly from your app
 */
export function SentryFeedbackWidget() {
  const [mounted, setMounted] = useState(false);
  const [_feedbackOpen, _setFeedbackOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openFeedback = () => {
    // Use Sentry's showReportDialog to open the feedback form
    Sentry.showReportDialog({
      title: 'Report an Issue',
      subtitle: 'Help us improve by reporting what went wrong',
      subtitle2: 'Our team will review your feedback and get back to you.',
      labelName: 'Name',
      labelEmail: 'Email',
      labelComments: 'What happened?',
      labelClose: 'Close',
      labelSubmit: 'Submit',
      errorGeneric: 'An error occurred. Please try again.',
      errorFormEntry: 'Some fields were invalid. Please correct and try again.',
      successMessage: 'Thank you for your feedback!',
    });
  };

  // Don't render on server
  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={openFeedback}
      className="fixed bottom-4 right-4 z-50 bg-[#00D9B5] hover:bg-[#00A893] text-[#0f172a] p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#00D9B5] focus:ring-offset-2"
      aria-label="Send feedback"
      title="Report an issue or send feedback"
    >
      <MessageSquare className="w-6 h-6" />
    </button>
  );
}

/**
 * Alternative: Inline Feedback Form Component
 *
 * For embedding feedback forms directly in your pages
 */
export function InlineFeedbackForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !message) {
      setError('Please fill in all fields');
      return;
    }

    try {
      // Create a feedback event in Sentry
      Sentry.captureMessage('User Feedback', {
        level: 'info',
        tags: {
          feedback_type: 'general',
        },
        contexts: {
          feedback: {
            name,
            email,
            message,
          },
        },
        user: {
          email,
          username: name,
        },
      });

      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');

      // Reset after 3 seconds
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
      console.error('Feedback submission error:', err);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md">
      <h3 className="text-xl font-semibold text-white mb-4">Send Feedback</h3>

      {submitted ? (
        <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 text-green-400">
          Thank you for your feedback! We'll review it shortly.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="feedback-name" className="block text-sm font-medium text-slate-300 mb-1">
              Name
            </label>
            <input
              id="feedback-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00D9B5] focus:border-transparent"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="feedback-email" className="block text-sm font-medium text-slate-300 mb-1">
              Email
            </label>
            <input
              id="feedback-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00D9B5] focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="feedback-message" className="block text-sm font-medium text-slate-300 mb-1">
              Message
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00D9B5] focus:border-transparent resize-none"
              placeholder="Describe the issue or share your feedback..."
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#00D9B5] hover:bg-[#00A893] text-[#0f172a] font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#00D9B5] focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            Submit Feedback
          </button>
        </form>
      )}
    </div>
  );
}
