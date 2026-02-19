# File Upload Documentation - HR Application

## Overview

The HR application uses **Multer** middleware for handling file uploads. Files are stored on the server's filesystem and metadata is tracked in the database.

---

## Table of Contents

1. [General File Upload Mechanism](#general-file-upload-mechanism)
2. [Upload Configuration](#upload-configuration)
3. [Leave Request File Uploads](#leave-request-file-uploads)
4. [Job Application File Uploads](#job-application-file-uploads)
5. [Form Submission File Uploads](#form-submission-file-uploads)
6. [Frontend Integration](#frontend-integration)
7. [API Examples](#api-examples)

---

## General File Upload Mechanism

### Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Frontend  │────▶│  Multer      │────▶│  Server Storage │
│  (FormData) │     │  Middleware  │     │  /uploads/       │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Database   │
                    │ (Metadata)   │
                    └──────────────┘
```

### Flow

1. **Frontend** sends `multipart/form-data` request with files
2. **Multer middleware** processes the upload
3. **File** is saved to `/uploads/` directory
4. **Metadata** (file name, path, size, type) is stored in database
5. **Response** returns file information

---

## Upload Configuration

### Central Upload Utility (`src/utils/upload.util.ts`)

```typescript
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/form-attachments');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xls|xlsx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type! Only images and documents are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

export default upload;
```

### Configuration Details

| Setting | Value | Description |
|---------|-------|-------------|
| **Storage** | Disk Storage | Files saved to `/uploads/form-attachments/` |
| **Filename** | `{fieldname}-{timestamp}-{random}.{ext}` | Unique filename generation |
| **File Size Limit** | 10MB | Maximum file size |
| **Allowed Types** | jpeg, jpg, png, gif, pdf, doc, docx, txt, xls, xlsx | Images and documents |

---

## Leave Request File Uploads

### Current Implementation

The leave request endpoint **accepts attachments** in the request body but **does not currently process file uploads**. The `attachments` field is received but not handled.

### Recommended Implementation

To add file upload support to leave requests, modify the endpoint:

**Backend - Updated Endpoint:**

```typescript
import upload from '../utils/upload.util';
import FormAttachmentModel from '../models/form-attachment.model';

// POST /api/leave - Create new leave request with attachments
router.post(
  '/',
  authenticateJWT,
  checkPermission('leave:create'),
  upload.array('attachments', 5), // Allow up to 5 files
  async (req: Request, res: Response) => {
    try {
      const {
        leave_type_id,
        start_date,
        end_date,
        reason
      } = req.body;

      // ... existing validation logic ...

      // Create form submission
      const newSubmission = await FormSubmissionModel.create({
        form_id: leaveFormId,
        user_id: userId!,
        submission_data: {
          leave_type_id,
          start_date,
          end_date,
          days_requested: requestedDays,
          reason,
          requested_by: userId!
        },
        status: 'submitted'
      });

      // Handle file attachments
      if (req.files && (req.files as Express.Multer.File[]).length > 0) {
        const files = req.files as Express.Multer.File[];
        
        // Save attachment metadata for each file
        for (const file of files) {
          await FormAttachmentModel.create({
            form_submission_id: newSubmission.id,
            field_id: 0, // Or map to specific form field
            file_name: file.originalname,
            file_path: file.path,
            file_size: file.size,
            mime_type: file.mimetype
          });
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Leave request submitted successfully',
        data: { 
          leaveRequest: newSubmission,
          attachments: req.files?.map(f => ({
            file_name: f.originalname,
            file_path: f.path,
            file_size: f.size
          }))
        }
      });
    } catch (error) {
      console.error('Create leave request error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);
```

---

## Job Application File Uploads

### Current Implementation

Job applications use a dedicated upload configuration for resume files.

**Route (`src/api/application-submission.route.ts`):**

```typescript
router.post('/', upload.single('resume'), submitJobApplication);
```

**Controller (`src/controllers/application-submission.controller.ts`):**

```typescript
// Custom storage for resumes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ storage: storage });

// In submitJobApplication controller:
let resumeFilePath = null;
if (req.file) {
  resumeFilePath = req.file.path;
}

// Save to database
await pool.execute(
  `INSERT INTO job_applications
   (job_posting_id, applicant_name, applicant_email, resume_file_path, cover_letter)
   VALUES (?, ?, ?, ?, ?)`,
  [job_posting_id, applicant_name, applicant_email, resumeFilePath, cover_letter]
);
```

---

## Form Submission File Uploads

### Database Model

Form attachments are stored in the `form_attachment` table:

```typescript
export interface FormAttachment {
  id: number;
  form_submission_id: number;
  field_id: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_at: Date;
}
```

### Usage Pattern

1. Submit form → Get `submission_id`
2. Upload files → Link to `submission_id`
3. Retrieve attachments → Query by `submission_id`

---

## Frontend Integration

### Sending Files with FormData

**Single File Upload:**

```javascript
const uploadFile = async (file, additionalData = {}) => {
  const formData = new FormData();
  
  // Append file
  formData.append('attachments', file);
  
  // Append other data
  Object.keys(additionalData).forEach(key => {
    formData.append(key, additionalData[key]);
  });

  const response = await api.post('/api/leave', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

// Usage
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

await uploadFile(file, {
  leave_type_id: 1,
  start_date: '2026-03-01',
  end_date: '2026-03-05',
  reason: 'Family vacation'
});
```

**Multiple File Upload:**

```javascript
const uploadMultipleFiles = async (files, additionalData = {}) => {
  const formData = new FormData();
  
  // Append multiple files (same field name)
  files.forEach(file => {
    formData.append('attachments', file);
  });
  
  // Append other data
  Object.keys(additionalData).forEach(key => {
    formData.append(key, additionalData[key]);
  });

  const response = await api.post('/api/leave', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

// Usage
const fileInput = document.querySelector('input[type="file"][multiple]');
const files = Array.from(fileInput.files);

await uploadMultipleFiles(files, {
  leave_type_id: 1,
  start_date: '2026-03-01',
  end_date: '2026-03-05',
  reason: 'Family vacation'
});
```

### React Component Example

```jsx
import React, { useState } from 'react';
import api from '../api';

const LeaveRequestForm = () => {
  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const data = new FormData();
      
      // Add form fields
      data.append('leave_type_id', formData.leave_type_id);
      data.append('start_date', formData.start_date);
      data.append('end_date', formData.end_date);
      data.append('reason', formData.reason);
      
      // Add files (multiple)
      files.forEach(file => {
        data.append('attachments', file);
      });

      const response = await api.post('/api/leave', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        alert('Leave request submitted successfully!');
        setFormData({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
        setFiles([]);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting request');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Other form fields */}
      
      <input
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={handleFileChange}
      />
      
      <p>Selected files: {files.length}</p>
      
      <button type="submit" disabled={uploading}>
        {uploading ? 'Submitting...' : 'Submit Request'}
      </button>
    </form>
  );
};

export default LeaveRequestForm;
```

### Upload Progress (Optional)

```javascript
const uploadWithProgress = async (file, formData, onProgress) => {
  const data = new FormData();
  data.append('attachments', file);
  
  // Add other form data
  Object.keys(formData).forEach(key => {
    data.append(key, formData[key]);
  });

  const response = await api.post('/api/leave', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgress(percentCompleted);
    }
  });

  return response.data;
};

// Usage
await uploadWithProgress(file, formData, (progress) => {
  console.log(`Upload progress: ${progress}%`);
});
```

---

## API Examples

### 1. Leave Request with Attachments

**Request:**

```http
POST /api/leave
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- leave_type_id: 1
- start_date: 2026-03-01
- end_date: 2026-03-05
- reason: Family vacation
- attachments: [file1.pdf, file2.jpg]
```

**Response:**

```json
{
  "success": true,
  "message": "Leave request submitted successfully",
  "data": {
    "leaveRequest": {
      "id": 15,
      "form_id": 5,
      "user_id": 123,
      "submission_data": {
        "leave_type_id": 1,
        "start_date": "2026-03-01",
        "end_date": "2026-03-05",
        "days_requested": 5,
        "reason": "Family vacation"
      },
      "status": "submitted"
    },
    "attachments": [
      {
        "file_name": "medical_certificate.pdf",
        "file_path": "/home/user/hrApp/uploads/form-attachments/attachments-1645283947123-482910347.pdf",
        "file_size": 245678
      },
      {
        "file_name": "supporting_doc.jpg",
        "file_path": "/home/user/hrApp/uploads/form-attachments/attachments-1645283947124-482910348.jpg",
        "file_size": 156789
      }
    ]
  }
}
```

### 2. Get Leave Request with Attachments

**Request:**

```http
GET /api/leave/15
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Leave request retrieved successfully",
  "data": {
    "leaveRequest": {
      "id": 15,
      "user_id": 123,
      "submission_data": {
        "leave_type_id": 1,
        "start_date": "2026-03-01",
        "end_date": "2026-03-05",
        "reason": "Medical leave"
      },
      "status": "approved"
    },
    "attachments": [
      {
        "id": 1,
        "file_name": "medical_certificate.pdf",
        "file_path": "/uploads/form-attachments/attachments-1645283947123-482910347.pdf",
        "file_size": 245678,
        "mime_type": "application/pdf",
        "uploaded_at": "2026-02-19T10:30:00Z"
      }
    ]
  }
}
```

### 3. Download Attachment

**Request:**

```http
GET /api/files/download/1
Authorization: Bearer <token>
```

**Implementation (if you create a download endpoint):**

```typescript
router.get('/files/download/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const attachment = await FormAttachmentModel.findById(req.params.id);
    
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check permissions (owner or admin)
    const isOwner = attachment.form_submission_id === req.currentUser?.id;
    const isAdmin = req.currentUser?.role_id === 1 || req.currentUser?.role_id === 2;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to download this file'
      });
    }

    res.download(attachment.file_path, attachment.file_name);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error downloading file'
    });
  }
});
```

---

## File Storage Structure

```
hrApp/
├── uploads/
│   ├── form-attachments/
│   │   ├── attachments-1645283947123-482910347.pdf
│   │   ├── attachments-1645283947124-482910348.jpg
│   │   └── ...
│   ├── resumes/
│   │   ├── resume-1645283947125-482910349.pdf
│   │   └── ...
│   └── documents/
│       └── ...
└── src/
    └── ...
```

---

## Best Practices

### 1. File Validation

```javascript
// Frontend validation before upload
const validateFile = (file) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Allowed: PDF, JPG, PNG');
  }

  if (file.size > maxSize) {
    throw new Error('File size exceeds 10MB limit');
  }

  return true;
};
```

### 2. Error Handling

```javascript
try {
  await uploadFile(file, formData);
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error
    alert(error.response.data.message);
  } else if (error.response?.status === 413) {
    // File too large
    alert('File size exceeds the limit');
  } else if (error.response?.status === 415) {
    // Unsupported media type
    alert('Invalid file type');
  } else {
    // Server error
    alert('Upload failed. Please try again.');
  }
}
```

### 3. File Preview

```javascript
const previewFile = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('file-preview');
    if (file.type.startsWith('image/')) {
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview" />`;
    } else if (file.type === 'application/pdf') {
      preview.innerHTML = `<embed src="${e.target.result}" type="application/pdf" />`;
    }
  };
  reader.readAsDataURL(file);
};
```

---

## Summary

| Feature | Status | Notes |
|---------|--------|-------|
| **General Upload** | ✅ Implemented | Uses Multer, 10MB limit |
| **Leave Attachments** | ⚠️ Partial | Accepts `attachments` field but doesn't process files yet |
| **Job Application Resume** | ✅ Implemented | Dedicated upload in `application-submission` |
| **Form Attachments** | ✅ Implemented | `form_attachment` model available |
| **File Download** | ❌ Not Implemented | Need to create download endpoint |

---

## Next Steps for Leave Attachments

1. **Update leave request POST endpoint** to use `upload.array('attachments', 5)`
2. **Save attachment metadata** to `form_attachment` table
3. **Include attachments in response** when getting leave requests
4. **Create download endpoint** for attachments
5. **Add frontend file upload UI** with validation
