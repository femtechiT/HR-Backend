import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { pool } from '../config/database';
import AttachmentService from '../services/attachment.service';

export interface UploadedFile {
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

/**
 * Upload files for leave request
 * Note: This endpoint is now deprecated in favor of uploading with leave request submission
 * Files uploaded here are not associated with any leave request
 * POST /api/leave/upload
 */
export const uploadLeaveFiles = async (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const files = req.files as Express.Multer.File[];
    const uploadedFiles: UploadedFile[] = [];

    // Process each uploaded file
    for (const file of files) {
      const uploadedFile: UploadedFile = {
        file_name: file.originalname,
        file_path: `/uploads/leave-requests/${path.basename(file.filename)}`,
        file_size: file.size,
        mime_type: file.mimetype,
        uploaded_at: new Date().toISOString()
      };
      uploadedFiles.push(uploadedFile);
    }

    return res.status(200).json({
      success: true,
      message: 'Files uploaded successfully. Note: These files are not yet attached to any leave request.',
      data: {
        files: uploadedFiles
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload files'
    });
  }
};

/**
 * Get files for a leave request
 * GET /api/leave/:id/files
 */
export const getLeaveRequestFiles = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const leaveRequestId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

    if (isNaN(leaveRequestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave request ID'
      });
    }

    // Get leave request to check ownership
    const [rows]: any = await pool.execute(
      'SELECT user_id FROM leave_requests WHERE id = ?',
      [leaveRequestId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    const leaveRequest = rows[0];
    const currentUserId = (req as any).currentUser?.id;
    const currentUserRole = (req as any).currentUser?.role_id;

    // Allow access if: user is the owner, OR user is admin (role 1 or 2)
    const isAdmin = currentUserRole === 1 || currentUserRole === 2;
    const isOwner = leaveRequest.user_id === currentUserId;
    const userHasPermission = (req as any).permissions?.includes('leave:read');
    
    console.log('[Leave Files] Access check:', {
      leaveRequestId,
      leaveRequestUserId: leaveRequest.user_id,
      currentUserId,
      currentUserRole,
      isAdmin,
      isOwner,
      hasPermission: userHasPermission
    });
    
    if (!isOwner && !isAdmin && !userHasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this request'
      });
    }

    // Get attachments using the new AttachmentService
    const attachments = await AttachmentService.getAttachments({
      entityType: 'leave_request',
      entityId: leaveRequestId
    });

    console.log('[Leave Files] Found attachments:', attachments.length);
    
    return res.json({
      success: true,
      data: {
        files: attachments
      }
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch files'
    });
  }
};

/**
 * Delete a file from leave request
 * DELETE /api/leave/:id/files/:fileIndex
 */
export const deleteLeaveRequestFile = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const fileIndexParam = req.params.fileIndex;
    const leaveRequestId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    const fileIndex = parseInt(Array.isArray(fileIndexParam) ? fileIndexParam[0] : fileIndexParam);

    if (isNaN(leaveRequestId) || isNaN(fileIndex)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID or file index'
      });
    }

    // Get leave request
    const [rows]: any = await pool.execute(
      'SELECT user_id, status FROM leave_requests WHERE id = ?',
      [leaveRequestId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    const leaveRequest = rows[0];
    const currentUserId = (req as any).currentUser?.id;

    // Check permission - owner or admin
    const userHasPermission = (req as any).permissions?.includes('leave:delete');
    if (leaveRequest.user_id !== currentUserId && !userHasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete files from this request'
      });
    }

    // Can only delete if request is still in 'submitted' or 'pending' status
    if (!['submitted', 'pending'].includes(leaveRequest.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete files from approved/rejected requests'
      });
    }

    // Get all attachments for this leave request
    const attachments = await AttachmentService.getAttachments({
      entityType: 'leave_request',
      entityId: leaveRequestId
    });

    if (fileIndex < 0 || fileIndex >= attachments.length) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Get the file to delete
    const fileToDelete = attachments[fileIndex];

    // Delete using AttachmentService (handles both DB record and physical file)
    const deleted = await AttachmentService.deleteAttachment(fileToDelete.id);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete file'
      });
    }

    return res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
};

/**
 * Serve uploaded files
 * GET /uploads/leave-requests/:filename
 * Also supports: GET /uploads/attachments/:filename
 */
export const serveLeaveFile = async (req: Request, res: Response) => {
  try {
    const filename = Array.isArray(req.params.filename)
      ? req.params.filename[0]
      : req.params.filename;

    // Try both possible paths (legacy leave-requests and new attachments)
    const possiblePaths = [
      path.join(process.cwd(), 'uploads', 'leave-requests', filename),
      path.join(process.cwd(), 'uploads', 'attachments', filename)
    ];

    const filePath = possiblePaths.find(p => fs.existsSync(p));

    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Send file
    return res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving file:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to serve file'
    });
  }
};
