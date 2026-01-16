import { pool } from './config/database';

async function createAppraisalTables() {
  const connection = await pool.getConnection();
  
  try {
    console.log('Creating appraisal-related tables...');
    
    // Create metrics_library table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS metrics_library (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        data_type ENUM('numeric', 'percentage', 'boolean', 'rating') NOT NULL,
        formula TEXT,
        data_source VARCHAR(255),
        categories JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_created_by (created_by),
        INDEX idx_is_active (is_active)
      )
    `);
    console.log('✓ Created metrics_library table');

    // Create kpi_definitions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS kpi_definitions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        formula TEXT,
        weight DECIMAL(5,2) DEFAULT 0.00,
        metric_ids JSON,
        categories JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_created_by (created_by),
        INDEX idx_is_active (is_active)
      )
    `);
    console.log('✓ Created kpi_definitions table');

    // Create appraisal_templates table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS appraisal_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        kpi_ids JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_created_by (created_by),
        INDEX idx_is_active (is_active)
      )
    `);
    console.log('✓ Created appraisal_templates table');

    // Create targets table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS targets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kpi_id INT NOT NULL,
        employee_id INT NOT NULL,
        department_id INT NULL,
        template_id INT NULL,
        target_type ENUM('minimum', 'standard', 'stretch') NOT NULL,
        target_value DECIMAL(10,2) NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (kpi_id) REFERENCES kpi_definitions(id),
        FOREIGN KEY (employee_id) REFERENCES staff(id),
        FOREIGN KEY (department_id) REFERENCES branches(id),
        FOREIGN KEY (template_id) REFERENCES appraisal_templates(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        INDEX idx_employee_id (employee_id),
        INDEX idx_kpi_id (kpi_id),
        INDEX idx_template_id (template_id)
      )
    `);
    console.log('✓ Created targets table');

    // Create kpi_assignments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS kpi_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        kpi_definition_id INT NOT NULL,
        cycle_start_date DATE NOT NULL,
        cycle_end_date DATE NOT NULL,
        assigned_by INT NOT NULL,
        custom_target_value DECIMAL(10,2) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (kpi_definition_id) REFERENCES kpi_definitions(id),
        FOREIGN KEY (assigned_by) REFERENCES users(id),
        INDEX idx_user_id (user_id),
        INDEX idx_kpi_definition_id (kpi_definition_id)
      )
    `);
    console.log('✓ Created kpi_assignments table');

    // Create kpi_scores table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS kpi_scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kpi_assignment_id INT NOT NULL,
        calculated_value DECIMAL(10,2) NOT NULL,
        achievement_percentage DECIMAL(5,2) NOT NULL,
        weighted_score DECIMAL(5,2) NOT NULL,
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        manually_overridden BOOLEAN DEFAULT FALSE,
        override_value DECIMAL(10,2) NULL,
        override_reason TEXT NULL,
        override_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (kpi_assignment_id) REFERENCES kpi_assignments(id),
        FOREIGN KEY (override_by) REFERENCES users(id),
        INDEX idx_kpi_assignment_id (kpi_assignment_id),
        INDEX idx_calculated_at (calculated_at)
      )
    `);
    console.log('✓ Created kpi_scores table');

    // Create appraisal_cycles table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS appraisal_cycles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        template_id INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status ENUM('draft', 'active', 'completed', 'cancelled') DEFAULT 'draft',
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES appraisal_templates(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        INDEX idx_template_id (template_id),
        INDEX idx_status (status),
        INDEX idx_dates (start_date, end_date)
      )
    `);
    console.log('✓ Created appraisal_cycles table');

    // Create appraisal_assignments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS appraisal_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        appraisal_cycle_id INT NOT NULL,
        status ENUM('pending', 'in_progress', 'submitted', 'reviewed', 'completed') DEFAULT 'pending',
        assigned_by INT NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES staff(id),
        FOREIGN KEY (appraisal_cycle_id) REFERENCES appraisal_cycles(id),
        FOREIGN KEY (assigned_by) REFERENCES users(id),
        INDEX idx_employee_id (employee_id),
        INDEX idx_appraisal_cycle_id (appraisal_cycle_id),
        INDEX idx_status (status)
      )
    `);
    console.log('✓ Created appraisal_assignments table');

    // Create performance_scores table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS performance_scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        kpi_id INT NOT NULL,
        template_id INT NOT NULL,
        score DECIMAL(10,2) NOT NULL,
        achieved_value DECIMAL(10,2) NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        calculated_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES staff(id),
        FOREIGN KEY (kpi_id) REFERENCES kpi_definitions(id),
        FOREIGN KEY (template_id) REFERENCES appraisal_templates(id),
        FOREIGN KEY (calculated_by) REFERENCES users(id),
        INDEX idx_employee_id (employee_id),
        INDEX idx_kpi_id (kpi_id),
        INDEX idx_template_id (template_id),
        INDEX idx_calculated_at (calculated_at)
      )
    `);
    console.log('✓ Created performance_scores table');

    // Create roles_permissions table (if not exists) - using the existing table structure
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS roles_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        permission VARCHAR(255) NOT NULL,
        allow_deny ENUM('allow', 'deny') DEFAULT 'allow',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id),
        INDEX idx_role_permission (role_id, permission)
      )
    `);
    console.log('✓ Created/updated roles_permissions table');

    console.log('\nAll appraisal-related tables created successfully!');

    // Insert default permissions for appraisal system
    const permissions = [
      'appraisal_template.read',
      'appraisal_template.create', 
      'appraisal_template.update',
      'appraisal_template.delete',
      'metric.read',
      'metric.create',
      'metric.update', 
      'metric.delete',
      'kpi.read',
      'kpi.create',
      'kpi.update',
      'kpi.delete',
      'target.read',
      'target.create',
      'target.update',
      'target.delete',
      'appraisal.read',
      'appraisal.create',
      'appraisal.update',
      'appraisal.submit',
      'performance.read'
    ];
    
    for (const permission of permissions) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO roles_permissions (role_id, permission, allow_deny) VALUES (1, ?, 'allow')`,
          [permission]
        );
      } catch (err) {
        console.log(`Could not insert permission ${permission}, possibly already exists`);
      }
    }

    console.log('Default permissions inserted for appraisal system');

    // Insert default data for metrics library
    const defaultMetrics = [
      {
        name: 'Attendance Rate',
        description: 'Percentage of days present vs total working days',
        data_type: 'percentage',
        formula: '(present_days / total_working_days) * 100',
        data_source: 'attendance_module',
        categories: ['Teacher', 'Sales', 'Inventory', 'Technician'],
        is_active: true,
        created_by: 1
      },
      {
        name: 'Leave Utilization',
        description: 'Percentage of leave days utilized vs allocated',
        data_type: 'percentage',
        formula: '(used_leave_days / allocated_leave_days) * 100',
        data_source: 'leave_module',
        categories: ['Teacher', 'Sales', 'Inventory', 'Technician'],
        is_active: true,
        created_by: 1
      },
      {
        name: 'Compliance Score',
        description: 'Score based on compliance with company policies',
        data_type: 'rating',
        formula: 'average(compliance_incidents)',
        data_source: 'hr_module',
        categories: ['Teacher', 'Sales', 'Inventory', 'Technician'],
        is_active: true,
        created_by: 1
      }
    ];

    for (const metric of defaultMetrics) {
      try {
        await connection.execute(
          `INSERT INTO metrics_library (name, description, data_type, formula, data_source, categories, is_active, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            metric.name,
            metric.description,
            metric.data_type,
            metric.formula,
            metric.data_source,
            JSON.stringify(metric.categories),
            metric.is_active,
            metric.created_by
          ]
        );
      } catch (err) {
        console.log(`Could not insert default metric ${metric.name}, possibly already exists`);
      }
    }

    console.log('Default metrics inserted');

    // Insert default KPI definitions
    const defaultKpis = [
      {
        name: 'Reliability Score',
        description: 'Combination of attendance and punctuality metrics',
        formula: '(attendance_rate * 0.6) + (punctuality_score * 0.4)',
        weight: 30.00,
        metric_ids: [1], // Attendance Rate
        categories: ['Teacher', 'Sales', 'Inventory', 'Technician'],
        is_active: true,
        created_by: 1
      },
      {
        name: 'Compliance Rate',
        description: 'Adherence to company policies and procedures',
        formula: 'compliance_score',
        weight: 20.00,
        metric_ids: [3], // Compliance Score
        categories: ['Teacher', 'Sales', 'Inventory', 'Technician'],
        is_active: true,
        created_by: 1
      }
    ];

    for (const kpi of defaultKpis) {
      try {
        await connection.execute(
          `INSERT INTO kpi_definitions (name, description, formula, weight, metric_ids, categories, is_active, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            kpi.name,
            kpi.description,
            kpi.formula,
            kpi.weight,
            JSON.stringify(kpi.metric_ids),
            JSON.stringify(kpi.categories),
            kpi.is_active,
            kpi.created_by
          ]
        );
      } catch (err) {
        console.log(`Could not insert default KPI ${kpi.name}, possibly already exists`);
      }
    }

    console.log('Default KPIs inserted');

    // Insert default appraisal templates
    const defaultTemplates = [
      {
        name: 'Teacher Appraisal Template',
        description: 'Performance evaluation for teaching staff',
        category: 'Teacher',
        kpi_ids: [1, 2], // Reliability Score, Compliance Rate
        is_active: true,
        created_by: 1
      },
      {
        name: 'Sales Executive Appraisal Template',
        description: 'Performance evaluation for sales staff',
        category: 'Sales',
        kpi_ids: [1, 2], // Reliability Score, Compliance Rate
        is_active: true,
        created_by: 1
      },
      {
        name: 'Inventory Officer Appraisal Template',
        description: 'Performance evaluation for inventory staff',
        category: 'Inventory',
        kpi_ids: [1, 2], // Reliability Score, Compliance Rate
        is_active: true,
        created_by: 1
      },
      {
        name: 'Technician Appraisal Template',
        description: 'Performance evaluation for technical staff',
        category: 'Technician',
        kpi_ids: [1, 2], // Reliability Score, Compliance Rate
        is_active: true,
        created_by: 1
      }
    ];

    for (const template of defaultTemplates) {
      try {
        await connection.execute(
          `INSERT INTO appraisal_templates (name, description, category, kpi_ids, is_active, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            template.name,
            template.description,
            template.category,
            JSON.stringify(template.kpi_ids),
            template.is_active,
            template.created_by
          ]
        );
      } catch (err) {
        console.log(`Could not insert default template ${template.name}, possibly already exists`);
      }
    }

    console.log('Default appraisal templates inserted');

    // Ensure all existing permissions are properly set for the admin role
    const allPermissions = [
      // Existing permissions
      'staff:create', 'staff:read', 'staff:update', 'staff:delete',
      'form:create', 'form:read', 'form:update', 'form:delete',
      'form_submission:create', 'form_submission:read', 'form_submission:update', 'form_submission:delete',
      'leave:create', 'leave:read', 'leave:update', 'leave:delete',
      'attendance:create', 'attendance:read', 'attendance:update', 'attendance:delete',
      'payment_type:create', 'payment_type:read', 'payment_type:update', 'payment_type:delete',
      'staff_payment_structure:create', 'staff_payment_structure:read', 'staff_payment_structure:update', 'staff_payment_structure:delete',
      'payroll_run:create', 'payroll_run:read', 'payroll_run:update', 'payroll_run:delete',
      'payroll_record:create', 'payroll_record:read', 'payroll_record:update', 'payroll_record:delete',
      'payslip:create', 'payslip:read', 'payslip:update', 'payslip:delete',
      // New appraisal permissions
      'appraisal_template.read', 'appraisal_template.create', 'appraisal_template.update', 'appraisal_template.delete',
      'metric.read', 'metric.create', 'metric.update', 'metric.delete',
      'kpi.read', 'kpi.create', 'kpi.update', 'kpi.delete',
      'target.read', 'target.create', 'target.update', 'target.delete',
      'appraisal.read', 'appraisal.create', 'appraisal.update', 'appraisal.submit',
      'performance.read'
    ];

    for (const permission of allPermissions) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO role_permissions (role_id, permission, granted_by, granted_at, created_at, updated_at) VALUES (1, ?, 1, NOW(), NOW(), NOW())`,
          [permission]
        );
      } catch (err) {
        console.log(`Could not insert permission ${permission}, possibly already exists`);
      }
    }

    console.log('All permissions updated for admin role');

    // Add new column for self-assessment KPIs if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE kpi_definitions
        ADD COLUMN IF NOT EXISTS is_self_assessment BOOLEAN DEFAULT FALSE
      `);
      console.log('Added is_self_assessment column to kpi_definitions table');
    } catch (err) {
      console.log('Could not add is_self_assessment column, possibly already exists');
    }

    // Run the default metrics and KPIs setup
    const { createDefaultMetricsAndKPIs } = await import('./services/appraisal-calculation.service');
    await createDefaultMetricsAndKPIs();
    console.log('Default metrics and KPIs created successfully');

  } catch (error) {
    console.error('Error creating appraisal tables:', error);
    throw error;
  } finally {
    connection.release();
  }
}

createAppraisalTables()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });