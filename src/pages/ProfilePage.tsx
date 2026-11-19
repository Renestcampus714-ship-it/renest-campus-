import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck, RefreshCw, Save } from 'lucide-react';
import { ACCOMMODATION_TYPES } from '../constants/marketplace';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { mapFirebaseAuthError, resendVerificationEmail } from '../services/authService';
import { updateUserProfile } from '../services/userService';
import type { AccommodationType } from '../types/marketplace';
import { formatShortDate } from '../utils/marketplaceLogic';
import { profileUpdateSchema, type ProfileUpdateFormValues } from '../validations/schemas';

export function ProfilePage() {
  const { firebaseUser, profile, refreshProfile, refreshVerification } = useAuth();
  const { showToast } = useToast();
  const [sendingVerify, setSendingVerify] = useState(false);
  const [checkingVerify, setCheckingVerify] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: profile?.fullName || '',
      collegeName: profile?.collegeName || '',
      accommodationType: profile?.accommodationType || 'Hostel',
      phone: profile?.phone || '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName,
        collegeName: profile.collegeName,
        accommodationType: profile.accommodationType,
        phone: profile.phone || '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (values: ProfileUpdateFormValues) => {
    if (!firebaseUser) return;
    try {
      await updateUserProfile(firebaseUser.uid, {
        fullName: values.fullName,
        collegeName: values.collegeName,
        accommodationType: values.accommodationType as AccommodationType,
        phone: values.phone,
      });
      await refreshProfile();
      showToast('Profile updated', 'success', 'Your changes were saved to Firestore.');
    } catch (error) {
      showToast(
        'Could not update profile',
        'error',
        error instanceof Error ? error.message : undefined
      );
    }
  };

  const handleResend = async () => {
    setSendingVerify(true);
    try {
      await resendVerificationEmail();
      showToast('Verification email sent', 'success', 'Check your inbox for the verification link.');
    } catch (error) {
      showToast('Failed to send email', 'error', mapFirebaseAuthError(error));
    } finally {
      setSendingVerify(false);
    }
  };

  const handleRefreshVerification = async () => {
    setCheckingVerify(true);
    try {
      const verified = await refreshVerification();
      showToast(
        verified ? 'Email verified' : 'Still pending verification',
        verified ? 'success' : 'info'
      );
    } catch (error) {
      showToast('Could not check status', 'error', mapFirebaseAuthError(error));
    } finally {
      setCheckingVerify(false);
    }
  };

  return (
    <DashboardLayout
      title="Student Profile"
      subtitle="Manage your personal information, accommodation cluster, and email verification status."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-[#DDD7C9] bg-white p-6 lg:col-span-7">
          <h2 className="font-display text-lg font-semibold text-[#242B29]">
            Profile Details
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            <div>
              <label htmlFor="prof-email" className="block text-xs font-semibold text-[#242B29]">
                Registered Email (Read-only)
              </label>
              <input
                id="prof-email"
                type="email"
                disabled
                value={profile?.email || firebaseUser?.email || ''}
                className="mt-1.5 w-full rounded-lg border border-[#DDD7C9] bg-[#EDE9DF]/60 px-3.5 py-2.5 text-sm text-[#525C58]"
              />
            </div>

            <div>
              <label htmlFor="prof-fullname" className="block text-xs font-semibold text-[#242B29]">
                Full Name
              </label>
              <input
                id="prof-fullname"
                type="text"
                {...register('fullName')}
                className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 text-sm text-[#242B29]"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-700">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="prof-college" className="block text-xs font-semibold text-[#242B29]">
                College / University Name
              </label>
              <input
                id="prof-college"
                type="text"
                {...register('collegeName')}
                className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 text-sm text-[#242B29]"
              />
              {errors.collegeName && (
                <p className="mt-1 text-xs text-red-700">{errors.collegeName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="prof-accommodation"
                  className="block text-xs font-semibold text-[#242B29]"
                >
                  Accommodation Type
                </label>
                <select
                  id="prof-accommodation"
                  {...register('accommodationType')}
                  className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 text-sm text-[#242B29]"
                >
                  {ACCOMMODATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="prof-phone" className="block text-xs font-semibold text-[#242B29]">
                  Phone Number (Private)
                </label>
                <input
                  id="prof-phone"
                  type="tel"
                  {...register('phone')}
                  placeholder="+91 98XXXXXXXX"
                  className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 text-sm text-[#242B29]"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-700">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#174C3C] px-5 py-2.5 text-sm font-semibold text-[#F8F7F2] hover:bg-[#2F8065] disabled:opacity-60"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-xl border border-[#DDD7C9] bg-white p-6">
            <h2 className="font-display text-lg font-semibold text-[#242B29]">
              Account &amp; Verification Status
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-[#525C58]">Current Status</dt>
                <dd className="mt-0.5 font-semibold text-[#174C3C]">
                  {profile?.accountStatus || 'Registered User'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#525C58]">Email Verification</dt>
                <dd className="mt-0.5 text-[#242B29]">
                  {profile?.emailVerified ? 'Verified via Firebase Auth' : 'Pending email confirmation'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#525C58]">Member Since</dt>
                <dd className="mt-0.5 text-[#242B29]">
                  {formatShortDate(profile?.createdAt)}
                </dd>
              </div>
            </dl>

            {!profile?.emailVerified && (
              <div className="mt-5 space-y-2 border-t border-[#EDE9DF] pt-4">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={sendingVerify}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#174C3C] bg-white px-4 py-2 text-xs font-semibold text-[#174C3C] hover:bg-[#EDE9DF]"
                >
                  <MailCheck className="h-4 w-4" aria-hidden="true" />
                  {sendingVerify ? 'Sending...' : 'Resend Verification Email'}
                </button>
                <button
                  type="button"
                  onClick={handleRefreshVerification}
                  disabled={checkingVerify}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#174C3C] px-4 py-2 text-xs font-semibold text-[#F8F7F2] hover:bg-[#2F8065]"
                >
                  <RefreshCw className={`h-4 w-4 ${checkingVerify ? 'animate-spin' : ''}`} aria-hidden="true" />
                  {checkingVerify ? 'Checking...' : 'Refresh Verification Status'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
