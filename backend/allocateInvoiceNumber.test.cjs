'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { allocateInvoiceNumber } = require('./allocateInvoiceNumber.cjs');

function fakeFirestore(initial = {}) {
  const records = new Map(Object.entries(initial));
  const ref = path => ({ path });
  const db = {
    collection(name) { return { doc(id) { return ref(name + '/' + id); } }; },
    async runTransaction(fn) {
      const writes = [];
      const tx = {
        async get(reference) {
          const data = records.get(reference.path);
          return { exists: !!data, data: () => structuredClone(data), get: k => data?.[k] };
        },
        create(reference, data) { writes.push(['create', reference.path, data]); },
        update(reference, data) { writes.push(['update', reference.path, data]); },
      };
      const result = await fn(tx);
      for (const [action, path, data] of writes) {
        if (action === 'create' && records.has(path)) throw new Error('Already exists');
        records.set(path, { ...records.get(path), ...data });
      }
      return result;
    }
  };
  return { db, records };
}

test('fails closed before historical reconciliation', async () => {
  const { db } = fakeFirestore({ 'invoiceSequences/AC': { next: 6, reconciled: false } });
  await assert.rejects(allocateInvoiceNumber(db, { invoiceId: 'inv1', prefix: 'AC' }), /not reconciled/);
});

test('allocates unique sequential numbers and retains assignments', async () => {
  const { db, records } = fakeFirestore({ 'invoiceSequences/AC': { next: 6, reconciled: true } });
  const a = await allocateInvoiceNumber(db, { invoiceId: 'inv1', prefix: 'AC' });
  assert.deepEqual({ number: a.number, invoiceNo: a.invoiceNo, existing: a.existing }, { number: 6, invoiceNo: 'AC-0006', existing: false });
  const again = await allocateInvoiceNumber(db, { invoiceId: 'inv1', prefix: 'AC' });
  assert.equal(again.invoiceNo, 'AC-0006');
  assert.equal(again.existing, true);
  const b = await allocateInvoiceNumber(db, { invoiceId: 'inv2', prefix: 'AC' });
  assert.equal(b.invoiceNo, 'AC-0007');
  assert.equal(records.get('invoiceSequences/AC').next, 8);
});

test('refuses duplicate number in historic registry', async () => {
  const { db } = fakeFirestore({
    'invoiceSequences/AC': { next: 6, reconciled: true },
    'issuedInvoiceNumbers/AC-0006': { invoiceId: 'legacy' }
  });
  await assert.rejects(allocateInvoiceNumber(db, { invoiceId: 'inv1', prefix: 'AC' }), /already registered/);
});

test('rejects invalid prefix and cross-client reassignment', async () => {
  const { db } = fakeFirestore({
    'invoiceSequences/AC': { next: 6, reconciled: true },
    'invoiceSequences/XY': { next: 6, reconciled: true }
  });
  await assert.rejects(allocateInvoiceNumber(db, { invoiceId: 'inv1', prefix: 'ac' }), /prefix/);
  await allocateInvoiceNumber(db, { invoiceId: 'inv1', prefix: 'AC' });
  await assert.rejects(allocateInvoiceNumber(db, { invoiceId: 'inv1', prefix: 'XY' }), /another customer/);
});

test('rejects missing sequence and invalid sequence value', async () => {
  const a = fakeFirestore();
  await assert.rejects(allocateInvoiceNumber(a.db, { invoiceId: 'inv1', prefix: 'AC' }), /not reconciled/);
  const b = fakeFirestore({ 'invoiceSequences/AC': { next: -1, reconciled: true } });
  await assert.rejects(allocateInvoiceNumber(b.db, { invoiceId: 'inv1', prefix: 'AC' }), /Invalid/);
});
