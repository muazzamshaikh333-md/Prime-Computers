const mongoose = require('mongoose');

const printRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true },

    // File info
    fileName: { type: String, required: true },
    fileSize: { type: String },
    filePath: { type: String, required: true }, // where the PDF is stored on the server

    // Print options
    copies: { type: Number, default: 1 },
    paperSize: { type: String, default: 'A4' },
    printType: { type: String, default: 'Black & White' }, // bw / color
    printStyle: { type: String, default: 'Single-Sided' },
    pageRange: { type: String, default: 'All Pages' },
    bindingRequired: { type: Boolean, default: false },
    laminationRequired: { type: Boolean, default: false },

    // Customer info
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String, default: '' },
    instructions: { type: String, default: '' },

    // Status tracking
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Ready', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model('PrintRequest', printRequestSchema);
