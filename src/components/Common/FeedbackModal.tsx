import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  MessageSquareHeart,
  Star,
  Send,
  CheckCircle2,
  Inbox,
  Trash2,
  RefreshCw,
  Download,
  Database,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { UserProfile } from '../../types';
import {
  submitUserFeedback,
  fetchAllFeedback,
  deleteFeedbackSubmission,
  UserFeedback,
} from '../../services/feedbackService';
import { isSupabaseConfigured } from '../../services/supabaseClient';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  initialTab?: 'submit' | 'inbox';
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  user,
  initialTab = 'submit',
}) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'inbox'>(initialTab);
  const [rating, setRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [category, setCategory] = useState<
    'general' | 'bug' | 'feature_request' | 'audio_quality' | 'appreciation'
  >('general');
  const [message, setMessage] = useState<string>('');
  const [email, setEmail] = useState<string>(user.isGuest ? '' : user.email);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Inbox state
  const [feedbackList, setFeedbackList] = useState<UserFeedback[]>([]);
  const [isLoadingInbox, setIsLoadingInbox] = useState<boolean>(false);
  const [inboxFilter, setInboxFilter] = useState<string>('all');
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const loadFeedbackList = useCallback(async () => {
    setIsLoadingInbox(true);
    try {
      const data = await fetchAllFeedback();
      setFeedbackList(data);
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setIsLoadingInbox(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadFeedbackList();
      if (initialTab) {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, initialTab, loadFeedbackList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await submitUserFeedback({
        user_id: user.id,
        user_name: user.name || user.username,
        user_email: email.trim() || user.email || null,
        category,
        rating,
        message: message.trim(),
      });
      setStatusMessage(res.message);
      setIsSubmitted(true);
      loadFeedbackList();
    } catch (err) {
      console.error(err);
      setStatusMessage('Feedback submitted! Thank you.');
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setMessage('');
    setActiveTab('inbox');
  };

  const handleDeleteItem = async (id: string) => {
    await deleteFeedbackSubmission(id);
    setFeedbackList((prev) => prev.filter((f) => f.id !== id));
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(feedbackList, null, 2);
    navigator.clipboard.writeText(dataStr);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const filteredFeedback = feedbackList.filter((f) => {
    if (inboxFilter === 'all') return true;
    return f.category === inboxFilter;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'bug':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30';
      case 'feature_request':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30';
      case 'audio_quality':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'appreciation':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div
      id="feedback-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        id="feedback-modal-card"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  User Feedback & Suggestions
                </h3>
                {isSupabaseConfigured() ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Supabase Synced
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    Local Storage
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submit user feedback or view received submissions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-slate-100 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('submit')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'submit'
                ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Feedback</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('inbox');
              loadFeedbackList();
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'inbox'
                ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Feedback Inbox</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'inbox'
                  ? 'bg-white/20 text-white dark:text-slate-950'
                  : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {feedbackList.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {activeTab === 'submit' ? (
            <div>
              {isSubmitted ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    Feedback Received!
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                    {statusMessage}
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs transition cursor-pointer shadow-sm"
                    >
                      View in Feedback Inbox
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Star Rating */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      How would you rate your listening experience?
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = (hoveredRating || rating) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className="p-1 transition-transform hover:scale-110 cursor-pointer"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                active
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-300 dark:text-slate-600 hover:text-slate-400'
                              }`}
                            />
                          </button>
                        );
                      })}
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400 ml-2">
                        {rating === 5 && 'Outstanding!'}
                        {rating === 4 && 'Great experience'}
                        {rating === 3 && 'Good / Needs tuning'}
                        {rating === 2 && 'Fair / Found issues'}
                        {rating === 1 && 'Needs improvement'}
                      </span>
                    </div>
                  </div>

                  {/* Category Pills */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Category
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'general', label: 'General' },
                        { id: 'audio_quality', label: 'Audio Quality & Playback' },
                        { id: 'feature_request', label: 'Feature Request' },
                        { id: 'bug', label: 'Bug Report' },
                        { id: 'appreciation', label: 'Love & Appreciation' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                            category === cat.id
                              ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/50 shadow-xs font-semibold'
                              : 'bg-slate-100 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Your Message or Suggestion <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what you liked, what songs you'd love added, or any improvements you'd like to see..."
                      className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition resize-none"
                    />
                  </div>

                  {/* Email (Optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email{' '}
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        (Optional, if you'd like a response)
                      </span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('inbox')}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Inbox className="w-3.5 h-3.5" />
                      <span>View received feedback ({feedbackList.length})</span>
                    </button>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !message.trim()}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 disabled:opacity-50 text-white dark:text-slate-950 font-bold text-xs transition shadow-md shadow-emerald-500/20 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <span>Submitting...</span>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Feedback</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Inbox / Admin Viewer Tab */
            <div className="space-y-4">
              {/* Storage explanation banner */}
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Where to see submitted feedback:
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                    2 Central Locations
                  </span>
                </div>
                <ul className="space-y-1 text-[11px] list-disc list-inside text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
                  <li>
                    <strong className="text-slate-900 dark:text-white">1. In-App Inbox (Here):</strong>{' '}
                    All feedback is instantly listed below, viewable in real-time by you.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-white">2. Supabase Cloud Database:</strong>{' '}
                    If configured, submissions sync to the{' '}
                    <code className="px-1 py-0.5 rounded bg-emerald-100 dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-mono text-[10px]">
                      app_feedback
                    </code>{' '}
                    table in your Supabase dashboard (Table Editor).
                  </li>
                </ul>
              </div>

              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                {/* Category Filter */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'bug', label: 'Bugs' },
                    { id: 'feature_request', label: 'Features' },
                    { id: 'audio_quality', label: 'Audio' },
                    { id: 'appreciation', label: 'Appreciation' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setInboxFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                        inboxFilter === f.id
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-transparent font-bold'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Refresh and Export Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadFeedbackList}
                    disabled={isLoadingInbox}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
                    title="Refresh feedback submissions"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInbox ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJson}
                    disabled={feedbackList.length === 0}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                    title="Copy all feedback as JSON to clipboard"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{copiedNotification ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                </div>
              </div>

              {/* Submissions List */}
              {isLoadingInbox ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
                  <p className="text-xs">Loading feedback submissions...</p>
                </div>
              ) : filteredFeedback.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Inbox className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No feedback submissions found
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    {inboxFilter !== 'all'
                      ? `No items match the "${inboxFilter}" category filter.`
                      : 'When users submit feedback or suggestions, they will be listed here instantly.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('submit')}
                    className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                  >
                    Write a test feedback
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFeedback.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/90 space-y-2.5 transition hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                              {item.user_name || 'Anonymous Listener'}
                            </span>
                            {item.user_email && (
                              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                ({item.user_email})
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${getCategoryBadge(
                                item.category
                              )}`}
                            >
                              {item.category.replace('_', ' ')}
                            </span>
                          </div>
                          {/* Rating Stars */}
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= item.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-300 dark:text-slate-700'
                                }`}
                              />
                            ))}
                            <span className="text-[10px] font-mono text-slate-400 ml-1">
                              {item.rating}/5
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(item.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                            title="Delete this feedback entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Feedback Body */}
                      <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-white dark:bg-slate-900/90 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                        {item.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
