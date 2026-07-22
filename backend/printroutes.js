const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const PrintRequest = require('../models/PrintRequest');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// ─── Rate limiter: stop spam submissions ───
// Max 8 print requests per 15 minutes from the same IP address
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { success: false, message: 'Too many requests. Please try again after some time.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Multer setup: where & how uploaded PDFs are stored ───
const uploadsFolder = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsFolder)) fs.mkdirSync(uploadsFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsFolder),
  filename: (req, file, cb) => {
    const reqId = 'REQ-' + Date.now().toString(36).toUpperCase().slice(-6);
    req.generatedRequestId = reqId; // save it so the route handler can reuse it
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${reqId}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max, same as frontend
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

// ─── Nodemailer transporter ───
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── POST /api/print-requests — create a new print request (PUBLIC, rate-limited) ───
router.post('/', submitLimiter, upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'PDF file is required' });
    }

    const reqId = req.generatedRequestId;
    const body = req.body;

    const newRequest = await PrintRequest.create({
      requestId: reqId,
      fileName: req.file.originalname,
      fileSize: (req.file.size / 1024 / 1024).toFixed(2) + ' MB',
      filePath: req.file.path,
      copies: body.copies || 1,
      paperSize: body.paperSize || 'A4',
      printType: body.printType || 'Black & White',
      printStyle: body.printStyle || 'Single-Sided',
      pageRange: body.pageRange || 'All Pages',
      bindingRequired: body.bindingRequired === 'true',
      laminationRequired: body.laminationRequired === 'true',
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail || '',
      instructions: body.instructions || '',
    });

    // ── Email to OWNER with the actual PDF attached ──
    try {
      await transporter.sendMail({
        from: `"Prime Computers Website" <${process.env.EMAIL_USER}>`,
        to: process.env.OWNER_EMAIL,
        subject: `New Print Request ${reqId} — ${newRequest.customerName}`,
        html: `
          <h2>New Print Request: ${reqId}</h2>
          <p><b>Customer:</b> ${newRequest.customerName} (${newRequest.customerPhone})</p>
          <p><b>File:</b> ${newRequest.fileName} (${newRequest.fileSize})</p>
          <p><b>Copies:</b> ${newRequest.copies}</p>
          <p><b>Paper Size:</b> ${newRequest.paperSize}</p>
          <p><b>Print Type:</b> ${newRequest.printType}</p>
          <p><b>Print Style:</b> ${newRequest.printStyle}</p>
          <p><b>Page Range:</b> ${newRequest.pageRange}</p>
          <p><b>Binding:</b> ${newRequest.bindingRequired ? 'Yes' : 'No'}</p>
          <p><b>Lamination:</b> ${newRequest.laminationRequired ? 'Yes' : 'No'}</p>
          <p><b>Instructions:</b> ${newRequest.instructions || 'None'}</p>
          <p><b>Submitted At:</b> ${newRequest.createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
        `,
        attachments: [{ filename: newRequest.fileName, path: newRequest.filePath }],
      });
    } catch (mailErr) {
      console.error('Owner email failed:', mailErr.message);
    }

    // ── Confirmation email to CUSTOMER (only if they gave an email) ──
    if (newRequest.customerEmail) {
      try {
        await transporter.sendMail({
          from: `"Prime Computers" <${process.env.EMAIL_USER}>`,
          to: newRequest.customerEmail,
          subject: `Print Request Received — ${reqId}`,
          html: `
            <h2>Thanks, ${newRequest.customerName}!</h2>
            <p>We've received your print request. Here are the details:</p>
            <p><b>Request ID:</b> ${reqId} <i>(save this to track your order)</i></p>
            <p><b>File:</b> ${newRequest.fileName}</p>
            <p><b>Copies:</b> ${newRequest.copies} | <b>Type:</b> ${newRequest.printType} | <b>Paper:</b> ${newRequest.paperSize}</p>
            <p>We'll start working on it shortly. You can check your order status anytime using your Request ID.</p>
            <p>— Prime Computers, Chandipura, Junnar</p>
          `,
        });
      } catch (mailErr) {
        console.error('Customer email failed:', mailErr.message);
      }
    }

    res.status(201).json({ success: true, requestId: reqId, data: newRequest });
  } catch (err) {
    console.error('Error creating print request:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/print-requests — list ALL requests (ADMIN ONLY) ───
router.get('/', adminAuth, async (req, res) => {
  try {
    const requests = await PrintRequest.find().sort({ createdAt: -1 });
    const withUrls = requests.map((r) => ({
      ...r.toObject(),
      fileUrl: `/uploads/${path.basename(r.filePath)}`,
    }));
    res.json({ success: true, count: withUrls.length, data: withUrls });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/print-requests/:requestId — get one request (PUBLIC — used by customer tracker) ───
// Only returns safe fields, not the full internal record.
router.get('/:requestId', async (req, res) => {
  try {
    const r = await PrintRequest.findOne({ requestId: req.params.requestId });
    if (!r) return res.status(404).json({ success: false, message: 'Request not found' });

    res.json({
      success: true,
      data: {
        requestId: r.requestId,
        fileName: r.fileName,
        copies: r.copies,
        paperSize: r.paperSize,
        printType: r.printType,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PATCH /api/print-requests/:requestId — update status (ADMIN ONLY) ───
router.patch('/:requestId', adminAuth, async (req, res) => {
  try {
    const updated = await PrintRequest.findOneAndUpdate(
      { requestId: req.params.requestId },
      { status: req.body.status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/print-requests/:requestId — delete a request (ADMIN ONLY) ───
router.delete('/:requestId', adminAuth, async (req, res) => {
  try {
    const deleted = await PrintRequest.findOneAndDelete({ requestId: req.params.requestId });
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });

    // also remove the PDF file from disk
    if (deleted.filePath && fs.existsSync(deleted.filePath)) {
      fs.unlinkSync(deleted.filePath);
    }

    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
