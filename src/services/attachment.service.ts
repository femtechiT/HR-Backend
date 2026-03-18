import { pool } from '../config/database';
import path from 'path';
import fs from 'fs';

export interface Attachment {
  id: number;
  form_submission_id?: number;
  leave_request_id?: number;
  field_id?: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_at: Date;
}

export interface AttachmentInput {
  form_submission_id?: number;
  leave_request_id?: number;
  field_id?: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
}

export interface AttachmentEntity {
  entityType: 'leave_request' | 'form_submission' | 'staff' | 'appraisal';
  entityId: number;
}

/**
 * Unified Attachment Service
 * Handles file attachments for all entities (leave requests, forms, staff, etc.)
 * Uses a single table (form_attachments) with flexible foreign key references
 */
class AttachmentService {
  private static tableName = 'form_attachments';

  /**
   * Save attachments for an entity
   * @param files - Array of uploaded files from multer
   * @param entity - Entity type and ID to attach files to
   * @param fieldId - Optional field ID (for form attachments)
   */
  static async saveAttachments(
    files: Express.Multer.File[],
    entity: AttachmentEntity,
    fieldId?: number
  ): Promise<Attachment[]> {
    if (!files || files.length === 0) {
      return [];
    }

    const attachments: Attachment[] = [];

    for (const file of files) {
      // Use the actual file path from multer (file is already saved to disk)
      // The file.filename is just the basename, we need to construct the URL path
      const attachmentInput: AttachmentInput = {
        file_name: file.originalname,
        file_path: `/uploads/attachments/${path.basename(file.filename)}`,
        file_size: file.size,
        mime_type: file.mimetype
      };

      // Set the appropriate entity reference
      if (entity.entityType === 'leave_request') {
        attachmentInput.leave_request_id = entity.entityId;
      } else if (entity.entityType === 'form_submission') {
        attachmentInput.form_submission_id = entity.entityId;
        if (fieldId) {
          attachmentInput.field_id = fieldId;
        }
      }
      // Add more entity types as needed

      const attachment = await this.create(attachmentInput);
      attachments.push(attachment);
    }

    return attachments;
  }

  /**
   * Get all attachments for an entity
   */
  static async getAttachments(entity: AttachmentEntity): Promise<Attachment[]> {
    let query = `SELECT * FROM ${this.tableName} WHERE `;
    const params: any[] = [];

    if (entity.entityType === 'leave_request') {
      query += 'leave_request_id = ?';
      params.push(entity.entityId);
    } else if (entity.entityType === 'form_submission') {
      query += 'form_submission_id = ?';
      params.push(entity.entityId);
    }

    query += ' ORDER BY uploaded_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows as Attachment[];
  }

  /**
   * Delete an attachment by ID
   * Also removes the physical file
   */
  static async deleteAttachment(attachmentId: number): Promise<boolean> {
    // Get the attachment first to delete the file
    const attachment = await this.findById(attachmentId);
    if (!attachment) {
      return false;
    }

    // Delete physical file
    const filePath = path.join(process.cwd(), attachment.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    const result: any = await pool.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [attachmentId]
    );

    return result.affectedRows > 0;
  }

  /**
   * Delete all attachments for an entity
   */
  static async deleteByEntity(entity: AttachmentEntity): Promise<boolean> {
    let query = `DELETE FROM ${this.tableName} WHERE `;
    const params: any[] = [];

    if (entity.entityType === 'leave_request') {
      query += 'leave_request_id = ?';
      params.push(entity.entityId);
    } else if (entity.entityType === 'form_submission') {
      query += 'form_submission_id = ?';
      params.push(entity.entityId);
    }

    const result: any = await pool.execute(query, params);
    return result.affectedRows > 0;
  }

  /**
   * Find attachment by ID
   */
  static async findById(id: number): Promise<Attachment | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (rows as Attachment[])[0] || null;
  }

  /**
   * Create a single attachment record
   */
  static async create(attachmentData: AttachmentInput): Promise<Attachment> {
    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName}
       (form_submission_id, leave_request_id, field_id, file_name, file_path, file_size, mime_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        attachmentData.form_submission_id || null,
        attachmentData.leave_request_id || null,
        attachmentData.field_id || null,
        attachmentData.file_name,
        attachmentData.file_path,
        attachmentData.file_size || null,
        attachmentData.mime_type || null
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId);

    if (!createdItem) {
      throw new Error('Failed to create attachment');
    }

    return createdItem;
  }
}

export default AttachmentService;
