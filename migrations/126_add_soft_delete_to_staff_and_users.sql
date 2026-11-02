-- Migration: Add soft-delete support to staff and users
-- Description: deleted_at/deleted_by are orthogonal to the existing `status`
-- enum (active/inactive/terminated/on_leave) — a deleted row keeps whatever
-- status it had, deleted_at IS NOT NULL is the authoritative "hidden from
-- the UI everywhere except User Management" signal. Also drops the UNIQUE
-- constraint on users.email / staff_invitations.email so a deleted account's
-- email can be reused by a new hire; uniqueness among live (non-deleted)
-- accounts is enforced in application code instead. staff.employee_id stays
-- UNIQUE — it's auto-generated and monotonic, never needs to be freed.

ALTER TABLE staff
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN deleted_by INT NULL,
  ADD CONSTRAINT fk_staff_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id);

ALTER TABLE users
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN deleted_by INT NULL,
  ADD CONSTRAINT fk_users_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id);

-- Both tables already carry a separate non-unique `idx_email` index
-- (migrations/003, migrations/081), so dropping the UNIQUE index here is
-- enough to allow duplicate emails across rows without losing lookup speed.
ALTER TABLE users
  DROP INDEX email;

ALTER TABLE staff_invitations
  DROP INDEX email;
