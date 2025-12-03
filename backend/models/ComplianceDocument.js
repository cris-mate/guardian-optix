/**
 * ComplianceDocument Model
 *
 * MongoDB schema for compliance documents (policies, procedures, training materials, etc.)
 */

const mongoose = require('mongoose');

const ComplianceDocumentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Document name is required'],
      trim: true,
      maxlength: [200, 'Document name cannot exceed 200 characters'],
    },
    category: {
      type: String,
      enum: ['policies', 'procedures', 'training', 'health-safety', 'contracts', 'templates', 'other'],
      required: [true, 'Category is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    fileType: {
      type: String,
      required: [true, 'File type is required'],
      enum: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'png', 'other'],
    },
    fileSize: {
      type: Number, // bytes
      required: [true, 'File size is required'],
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    filePath: {
      type: String,
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader is required'],
    },
    version: {
      type: String,
      default: '1.0',
      trim: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
    },
    acknowledgements: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      acknowledgedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes
ComplianceDocumentSchema.index({ name: 'text', description: 'text' });
ComplianceDocumentSchema.index({ category: 1, isActive: 1 });
ComplianceDocumentSchema.index({ createdAt: -1 });

// Virtual for formatted file size
ComplianceDocumentSchema.virtual('formattedFileSize').get(function () {
  const bytes = this.fileSize;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
});

// Ensure virtuals are included in JSON output
ComplianceDocumentSchema.set('toJSON', { virtuals: true });
ComplianceDocumentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ComplianceDocument', ComplianceDocumentSchema);