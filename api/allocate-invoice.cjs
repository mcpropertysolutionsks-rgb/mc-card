'use strict';
const { allocateInvoiceNumber } = require('../backend/allocateInvoiceNumber.cjs');
const admin = require('firebase-admin');

module.exports = async (req,res) => {
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
 if(process.env.MCPS_INVOICE_ALLOCATION_ENABLED!=='true')return res.status(503).json({error:'Allocation disabled until history is reconciled'});
 try{
   const raw=process.env.MCPS_INVOICE_FIREBASE_SERVICE_ACCOUNT_JSON;
   if(!raw) return res.status(503).json({error:'Independent invoice database not configured'});
   const cred=JSON.parse(raw);
   if(!cred.project_id || cred.project_id!==process.env.MCPS_INVOICE_FIREBASE_PROJECT_ID)throw Error('Database project mismatch');
   if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(cred),projectId:cred.project_id});
   const match=/^Bearer (.+)$/.exec(req.headers.authorization||'');
   if(!match)return res.status(401).json({error:'Authentication required'});
   const token=await admin.auth().verifyIdToken(match[1],true);
   const allowed=(process.env.MCPS_INVOICE_ALLOWED_UIDS||'').split(',').map(x=>x.trim());
   if(!allowed.includes(token.uid))return res.status(403).json({error:'Not authorized'});
   const result=await allocateInvoiceNumber(admin.firestore(),{invoiceId:req.body?.invoiceId,prefix:req.body?.prefix});
   return res.status(200).json(result);
 }catch(err){
   console.error('Invoice allocation rejected:',err.message);
   return res.status(409).json({error:'Invoice allocation rejected. Verify authorization and reconciled sequence.'});
 }
};
