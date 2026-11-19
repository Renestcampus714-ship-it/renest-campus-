# ReNest Campus Security Specification (Phase 0)

## 1. Data Invariants

1. **Identity & PII Isolation**: A `users/{uid}` document is readable and writable exclusively by the authenticated user whose `request.auth.uid == uid`. Blanket user listing (`allow list` on `/users`) is forbidden. Public listings never store raw seller email addresses or phone numbers.
2. **Ownership Integrity**: Every listing in `/listings/{listingId}` must bind `sellerId == request.auth.uid` on creation and preserve `sellerId` and `createdAt` immutably on update. Only the listing owner may update or delete their listing.
3. **Privilege & Verification Integrity**: Users cannot self-assign `accountStatus: "Email Verified"` unless `request.auth.token.email_verified == true`. Users cannot add shadow fields (`role`, `isAdmin`, `verifiedInstitution`).
4. **Enquiry Privacy & State Integrity**: An enquiry can only be created by an authenticated buyer (`buyerId == request.auth.uid`) against an existing listing (`exists(/listings/{listingId})`) where `buyerId != sellerId`. Only the enquiry's `buyerId` or `sellerId` may read it. Only the seller may accept/decline/respond; only the buyer may close their pending enquiry.
5. **Transaction Integrity & Terminal Locking**: A transaction can only be created for an existing listing and enquiry, with `serviceFee == 40`, immutable participants (`buyerId`, `sellerId`, `listingId`, `enquiryId`), and cannot be modified once `transactionStatus` reaches a terminal state (`Completed` or `Cancelled`).
6. **Notification & Report Scoping**: Notifications are readable and markable as read exclusively by `resource.data.userId == request.auth.uid`. Reports are readable only by `reportedBy == request.auth.uid` and must start with `status == "Open"`.
7. **Temporal & Volumetric Integrity**: All `createdAt` and `updatedAt` fields must equal `request.time`. All strings and arrays have bounded lengths (`images.size() <= 5`, `favouriteIds.size() <= 100`, `recentlyViewedIds.size() <= 20`).

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Shadow Field Injection on User Profile**: Creating `users/{uid}` with extra field `isAdmin: true`.
2. **Spoofed Email Verification Status**: Creating `users/{uid}` with `accountStatus: "Email Verified"` when `request.auth.token.email_verified == false`.
3. **Cross-User Profile Read/Update**: User B attempting `get` or `update` on `users/{userA}`.
4. **UID / Email Ownership Hijack**: Updating `users/{uid}` to change `uid` or `email`.
5. **Seller Spoofing on Listing Creation**: User B creating a listing with `sellerId: userA`.
6. **Unauthorized Listing Edit/Delete**: User B updating or deleting User A's listing.
7. **Unbounded Image Array / Oversized Description**: Creating a listing with 10 images or a 10,000-char description.
8. **Enquiry Against Non-Existent Listing**: Creating an enquiry referencing a bogus `listingId`.
9. **Self-Enquiry Abuse**: Seller creating an enquiry with `buyerId == sellerId` on their own listing.
10. **Cross-User Enquiry Eavesdropping**: User C reading or listing enquiries between Buyer A and Seller B.
11. **Terminal Transaction Tampering**: Updating a `Completed` or `Cancelled` transaction back to `Accepted` or altering `itemPrice`.
12. **Path Variable Poisoning**: Writing to `/listings/../../etc/passwd` or a 300-character invalid ID.
