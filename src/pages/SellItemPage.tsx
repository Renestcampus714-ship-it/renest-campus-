import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, ImagePlus, Trash2, UploadCloud } from 'lucide-react';
import {
  CATEGORY_NAMES,
  DEHRADUN_LOCATIONS,
  ITEM_CONDITIONS,
  VALIDATION_LIMITS,
} from '../constants/marketplace';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MainLayout } from '../layouts/MainLayout';
import {
  createListing,
  fetchListingById,
  generateNewListingId,
  updateListing,
} from '../services/listingService';
import { uploadListingImageWithFallback } from '../services/storageService';
import type { ItemCondition, MarketplaceCategory } from '../types/marketplace';
import { validateImageFile } from '../utils/marketplaceLogic';
import { listingSchema, type ListingFormValues } from '../validations/schemas';

interface LocalImageItem {
  id: string;
  previewUrl: string;
  file?: File;
  uploadedUrl?: string;
  source: 'existing' | 'firebase-storage' | 'compressed-fallback';
}

export function SellItemPage() {
  const { id: editListingId } = useParams<{ id: string }>();
  const isEditMode = Boolean(editListingId);
  const { firebaseUser, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [draftListingId] = useState<string>(() => editListingId || generateNewListingId());
  const [images, setImages] = useState<LocalImageItem[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);
  const [unauthorizedEdit, setUnauthorizedEdit] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [allowFallbackStorage, setAllowFallbackStorage] = useState(true);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema) as never,
    defaultValues: {
      title: '',
      description: '',
      category: CATEGORY_NAMES[0],
      price: 500,
      condition: ITEM_CONDITIONS[1],
      location: DEHRADUN_LOCATIONS[0],
    },
  });

  useEffect(() => {
    if (!editListingId || !firebaseUser) {
      setLoadingExisting(false);
      return;
    }

    let cancelled = false;
    setLoadingExisting(true);
    fetchListingById(editListingId)
      .then((item) => {
        if (cancelled) return;
        if (!item) {
          showToast('Listing not found', 'error');
          navigate('/my-listings');
          return;
        }
        if (item.sellerId !== firebaseUser.uid) {
          setUnauthorizedEdit(true);
          setLoadingExisting(false);
          return;
        }
        reset({
          title: item.title,
          description: item.description,
          category: item.category,
          price: item.price,
          condition: item.condition,
          location: item.location,
        });
        setImages(
          item.images.map((url, index) => ({
            id: `existing-${index}`,
            previewUrl: url,
            uploadedUrl: url,
            source: 'existing',
          }))
        );
        setLoadingExisting(false);
      })
      .catch((err) => {
        if (cancelled) return;
        showToast(
          'Could not load listing',
          'error',
          err instanceof Error ? err.message : undefined
        );
        setLoadingExisting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [editListingId, firebaseUser, navigate, reset, showToast]);

  const handleSelectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const nextItems: LocalImageItem[] = [];
    for (const file of files) {
      const check = validateImageFile(
        file,
        images.length + nextItems.length
      );
      if (!check.valid) {
        setImageError(check.error || 'Invalid image file.');
        break;
      }
      nextItems.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        previewUrl: URL.createObjectURL(file),
        file,
        source: 'firebase-storage',
      });
    }

    if (nextItems.length > 0) {
      setImages((prev) => [...prev, ...nextItems]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (imageId: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === imageId);
      if (target && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((i) => i.id !== imageId);
    });
  };

  const onSubmit = async (values: ListingFormValues) => {
    if (!firebaseUser || !profile) {
      showToast('Authentication required', 'error', 'Please sign in first.');
      return;
    }

    setImageError(null);
    setStorageNotice(null);

    try {
      const finalUrls: string[] = [];
      const pendingFiles = images.filter((img) => img.file);
      let completedCount = 0;

      for (const img of images) {
        if (img.uploadedUrl) {
          finalUrls.push(img.uploadedUrl);
          continue;
        }
        if (img.file) {
          const outcome = await uploadListingImageWithFallback(
            firebaseUser.uid,
            draftListingId,
            img.file,
            allowFallbackStorage,
            (pct) => {
              const overall = Math.round(
                ((completedCount + pct / 100) / Math.max(1, pendingFiles.length)) * 100
              );
              setUploadProgress(overall);
            }
          );
          completedCount += 1;
          finalUrls.push(outcome.url);
          if (outcome.warning) {
            setStorageNotice(outcome.warning);
          }
        }
      }

      setUploadProgress(null);

      if (isEditMode && editListingId) {
        await updateListing(
          editListingId,
          {
            title: values.title,
            description: values.description,
            category: values.category as MarketplaceCategory,
            price: Number(values.price),
            condition: values.condition as ItemCondition,
            location: values.location,
            images: finalUrls,
          },
          profile
        );
        showToast('Listing updated', 'success', 'Changes saved to Firestore.');
        navigate(`/listing/${editListingId}`);
      } else {
        const createdId = await createListing(
          {
            listingId: draftListingId,
            title: values.title,
            description: values.description,
            category: values.category as MarketplaceCategory,
            price: Number(values.price),
            condition: values.condition as ItemCondition,
            location: values.location,
            images: finalUrls,
          },
          profile
        );
        showToast('Listing published', 'success', 'Your item is now live in the marketplace.');
        navigate(`/listing/${createdId}`);
      }
    } catch (error) {
      setUploadProgress(null);
      const message = error instanceof Error ? error.message : 'Failed to save listing.';
      setImageError(message);
      showToast('Could not save listing', 'error', message);
    }
  };

  if (loadingExisting) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="h-96 animate-pulse rounded-2xl bg-[#EDE9DF]" />
        </div>
      </MainLayout>
    );
  }

  if (unauthorizedEdit) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 text-center">
          <h1 className="font-display text-2xl font-bold text-[#242B29]">
            Permission Denied
          </h1>
          <p className="mt-2 text-sm text-[#525C58]">
            You can only edit listings that belong to your own account.
          </p>
          <Link
            to="/my-listings"
            className="mt-6 inline-flex rounded-lg bg-[#174C3C] px-5 py-2.5 text-sm font-semibold text-[#F8F7F2]"
          >
            Go to My Listings
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          to={isEditMode ? '/my-listings' : '/marketplace'}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#525C58] hover:text-[#174C3C]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {isEditMode ? 'Back to My Listings' : 'Back to Marketplace'}
        </Link>

        <div className="mt-4 rounded-2xl border border-[#DDD7C9] bg-white p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-[#242B29] sm:text-3xl">
            {isEditMode ? 'Edit Listing' : 'Sell an Item'}
          </h1>
          <p className="mt-1.5 text-sm text-[#525C58]">
            {isEditMode
              ? 'Update item details, pricing, condition, or photos.'
              : 'List a study desk, appliance, textbook, or room essential for nearby students.'}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5" noValidate>
            <div>
              <label htmlFor="sell-title" className="block text-xs font-semibold text-[#242B29]">
                Product Title
              </label>
              <input
                id="sell-title"
                type="text"
                placeholder="e.g. Foldable Wooden Study Table & Chair"
                {...register('title')}
                className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-700">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="sell-category"
                  className="block text-xs font-semibold text-[#242B29]"
                >
                  Category
                </label>
                <select
                  id="sell-category"
                  {...register('category')}
                  className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
                >
                  {CATEGORY_NAMES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-xs text-red-700">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="sell-condition"
                  className="block text-xs font-semibold text-[#242B29]"
                >
                  Product Condition
                </label>
                <select
                  id="sell-condition"
                  {...register('condition')}
                  className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
                >
                  {ITEM_CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
                {errors.condition && (
                  <p className="mt-1 text-xs text-red-700">{errors.condition.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="sell-price" className="block text-xs font-semibold text-[#242B29]">
                  Asking Price (INR ₹)
                </label>
                <input
                  id="sell-price"
                  type="number"
                  min={0}
                  max={VALIDATION_LIMITS.maxPrice}
                  {...register('price')}
                  className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 font-mono text-sm tabular-nums text-[#242B29] focus:border-[#174C3C] focus:outline-none"
                />
                {errors.price && (
                  <p className="mt-1 text-xs text-red-700">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="sell-location"
                  className="block text-xs font-semibold text-[#242B29]"
                >
                  Campus / Hostel Handover Location
                </label>
                <select
                  id="sell-location"
                  {...register('location')}
                  className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
                >
                  {DEHRADUN_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                {errors.location && (
                  <p className="mt-1 text-xs text-red-700">{errors.location.message}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="sell-description"
                className="block text-xs font-semibold text-[#242B29]"
              >
                Product Description
              </label>
              <textarea
                id="sell-description"
                rows={4}
                placeholder="Mention age of item, dimensions, any wear and tear, and preferred move-out handover window..."
                {...register('description')}
                className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] p-3.5 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-700">{errors.description.message}</p>
              )}
            </div>

            {/* Product Photographs Upload */}
            <div className="rounded-xl border border-[#DDD7C9] bg-[#F8F7F2] p-5">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-sm font-semibold text-[#242B29]">
                    Product Photographs (up to 5 photos)
                  </h2>
                  <p className="text-xs text-[#525C58]">
                    JPG, PNG, or WebP · Max 5 MB per photo · Uploads to Firebase Storage
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={images.length >= VALIDATION_LIMITS.maxImagesPerListing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#174C3C] bg-white px-3.5 py-2 text-xs font-semibold text-[#174C3C] hover:bg-[#174C3C] hover:text-[#F8F7F2] disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  Select Photos
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleSelectFiles}
                  className="hidden"
                  aria-label="Select product photographs"
                />
              </div>

              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {images.map((img, idx) => (
                    <div
                      key={img.id}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-[#D4CEC0] bg-white"
                    >
                      <img
                        src={img.previewUrl}
                        alt={`Selected preview ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        aria-label={`Remove photo ${idx + 1}`}
                        className="absolute right-1.5 top-1.5 rounded-md bg-white/90 p-1.5 text-red-700 shadow-xs hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="mt-4 flex items-start gap-2.5 text-xs text-[#525C58] cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowFallbackStorage}
                  onChange={(e) => setAllowFallbackStorage(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#D4CEC0] accent-[#174C3C]"
                />
                <span>
                  Use clearly labelled compressed JPEG fallback if Firebase Storage bucket rules are not yet initialized in Firebase Console.
                </span>
              </label>

              {uploadProgress !== null && (
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-[#174C3C]">
                    <span>Uploading photographs...</span>
                    <span className="tabular-nums">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#DDD7C9]">
                    <div
                      className="h-full bg-[#174C3C] transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {storageNotice && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{storageNotice}</span>
                </div>
              )}

              {imageError && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{imageError}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#EDE9DF] pt-5">
              <Link
                to={isEditMode ? '/my-listings' : '/marketplace'}
                className="rounded-lg border border-[#D4CEC0] bg-white px-5 py-2.5 text-sm font-semibold text-[#242B29] hover:bg-[#EDE9DF]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#174C3C] px-6 py-2.5 text-sm font-semibold text-[#F8F7F2] hover:bg-[#2F8065] disabled:opacity-60 transition-colors"
              >
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                {isSubmitting
                  ? isEditMode
                    ? 'Saving Changes...'
                    : 'Publishing Listing...'
                  : isEditMode
                  ? 'Save Changes'
                  : 'Publish Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
