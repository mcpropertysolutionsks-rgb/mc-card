'use strict';

/**
 * MCPS central invoice allocation helper (NOT wired to the public app).
 *
 * Call ONLY from an authenticated, authorized server endpoint using
 * firebase-admin Firestore. Never expose Admin credentials to the browser.
 *
 * Before use, reconcile historic invoice numbers and manually initialize:
 * invoiceSequences/{PREFIX} = { next: <first UNUSED number>, reconciled: true }
 * Example: invoiceSequences/AC = {next: 9, reconciled: true}
 *
 * Documents:
 * invoiceAssignments/{invoiceId} -> {prefix, number, invoiceNo, createdAt}
 * issuedInvoiceNumbers/{PREFIX-0009} -> {invoiceId, createdAt}
 *
 * A successful allocation is never deleted or reused, including cancellations.
 */
function validateInvoiceId(invoiceId) {
  if (typeof invoiceId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(invoiceId)) {
    throw new Error('A stable, safe invoiceId is required');
  }
  return invoiceId;
}
function validatePrefix(prefix) {
  if (typeof prefix !== 'string' || !/^[A-Z][A-Z0-9]{1,9}$/.test(prefix)) {
    throw new Error('A registered uppercase customer prefix is required');
  }
  return prefix;
}

/**
 * @param {FirebaseFirestore.Firestore} db initialized Admin Firestore
 * @param {{invoiceId: string, prefix: string}} request
 * @returns {Promise<{invoiceNo:string, number:number, existing:boolean}>}
 */
async function allocateInvoiceNumber(db, { invoiceId, prefix }) {
  invoiceId = validateInvoiceId(invoiceId);
  prefix = validatePrefix(prefix);
  if (!db || typeof db.runTransaction !== 'function') throw new Error('Firestore is required');

  const assignmentRef = db.collection('invoiceAssignments').doc(invoiceId);
  const sequenceRef = db.collection('invoiceSequences').doc(prefix);

  return db.runTransaction(async tx => {
    // Reads must precede all writes in a Firestore transaction.
    const [assignmentSnap, sequenceSnap] = await Promise.all([
      tx.get(assignmentRef), tx.get(sequenceRef)
    ]);

    if (assignmentSnap.exists) {
      const prior = assignmentSnap.data();
      if (prior.prefix !== prefix) {
        throw new Error('Invoice already assigned to another customer prefix');
      }
      return { invoiceNo: prior.invoiceNo, number: prior.number, existing: true };
    }

    if (!sequenceSnap.exists || sequenceSnap.get('reconciled') !== true) {
      throw new Error('Invoice sequence not reconciled; allocation blocked');
    }
    const next = sequenceSnap.get('next');
    if (!Number.isSafeInteger(next) || next < 1 || next > 999999999) {
      throw new Error('Invalid or exhausted invoice sequence');
    }
    const invoiceNo = prefix + '-' + String(next).padStart(4, '0');
    const issuedRef = db.collection('issuedInvoiceNumbers').doc(invoiceNo);
    const issuedSnap = await tx.get(issuedRef);
    if (issuedSnap.exists) {
      throw new Error('Number already registered; reconcile sequence before retry');
    }

    const createdAt = new Date().toISOString();
    tx.create(assignmentRef, { prefix, number: next, invoiceNo, createdAt });
    tx.create(issuedRef, { invoiceId, createdAt });
    tx.update(sequenceRef, { next: next + 1, updatedAt: createdAt });
    return { invoiceNo, number: next, existing: false };
  });
}

module.exports = { allocateInvoiceNumber };
