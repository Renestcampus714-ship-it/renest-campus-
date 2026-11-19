import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  listingSchema,
  registerSchema,
  reportSchema,
  enquirySchema,
  transactionCreateSchema,
} from './src/validations/schemas';
import { VALIDATION_LIMITS } from './src/constants/marketplace';

const rulesContent = fs.readFileSync('./firestore.rules', 'utf8');

test('firestore.rules enforces default-deny catch-all and Eight Pillars primitives', () => {
  assert.match(rulesContent, /rules_version = '2';/);
  assert.match(rulesContent, /match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}/);
  assert.match(rulesContent, /function isValidId\(id\)/);
  assert.match(rulesContent, /function isValidUserProfile\(data\)/);
  assert.match(rulesContent, /function isValidListing\(data\)/);
  assert.match(rulesContent, /function isValidEnquiry\(data\)/);
  assert.match(rulesContent, /function isValidTransaction\(data\)/);
  assert.match(rulesContent, /function isValidNotification\(data\)/);
  assert.match(rulesContent, /function isValidReport\(data\)/);
});

test('firestore.rules protects all 7 collections and isolates PII', () => {
  for (const col of [
    'users/{uid}',
    'listings/{listingId}',
    'enquiries/{enquiryId}',
    'transactions/{transactionId}',
    'notifications/{notificationId}',
    'reports/{reportId}',
    'categories/{categoryId}',
  ]) {
    assert.ok(rulesContent.includes(`match /${col}`), `Missing match block for ${col}`);
  }
  assert.match(rulesContent, /match \/users\/\{uid\}[\s\S]*?allow list: if false;/);
  assert.match(rulesContent, /request\.auth\.token\.email_verified == true/);
  assert.match(rulesContent, /existing\(\)\.transactionStatus != 'Completed'/);
  assert.match(rulesContent, /existing\(\)\.transactionStatus != 'Cancelled'/);
  assert.match(rulesContent, /data\.serviceFee is number && data\.serviceFee == 40/);
});

test('Dirty Dozen adversarial payload validation checks reject invalid inputs', () => {
  // Weak password (< 8 chars)
  assert.equal(
    registerSchema.safeParse({
      fullName: 'Test Student',
      email: 'student@example.com',
      collegeName: 'DBS Global University',
      accommodationType: 'Hostel',
      password: 'short',
      confirmPassword: 'short',
    }).success,
    false
  );

  // Oversized listing description (> 2000 chars)
  assert.equal(
    listingSchema.safeParse({
      title: 'Study Desk',
      description: 'x'.repeat(VALIDATION_LIMITS.descriptionMax + 10),
      category: 'Study tables and furniture',
      price: 1200,
      condition: 'Good',
      location: 'Prem Nagar',
    }).success,
    false
  );

  // Negative price
  assert.equal(
    listingSchema.safeParse({
      title: 'Study Desk',
      description: 'Valid description for study desk.',
      category: 'Study tables and furniture',
      price: -10,
      condition: 'Good',
      location: 'Prem Nagar',
    }).success,
    false
  );

  // Empty enquiry message
  assert.equal(enquirySchema.safeParse({ message: 'hi' }).success, false);

  // Invalid handover location
  assert.equal(
    transactionCreateSchema.safeParse({ handoverLocation: 'A' }).success,
    false
  );

  // Short report description
  assert.equal(
    reportSchema.safeParse({ reason: 'Suspected spam', description: 'bad' }).success,
    false
  );
});
