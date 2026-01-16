import fs from 'fs';
import path from 'path';

// Read the existing Postman collection
const collectionPath = path.join(process.cwd(), 'hr_management_system_api.postman_collection.json');
const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// Function to find or create a folder in the collection
function findOrCreateFolder(collection, folderName) {
  let folder = collection.item.find(item => item.name === folderName);
  if (!folder) {
    folder = {
      name: folderName,
      item: []
    };
    collection.item.push(folder);
  }
  return folder;
}

// Add Payment Types folder and requests
const paymentTypesFolder = findOrCreateFolder(collection, 'Payment Types');

paymentTypesFolder.item = [
  {
    name: "Get All Payment Types",
    request: {
      method: "GET",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        }
      ],
      url: {
        raw: "{{baseUrl}}/api/payment-types",
        host: ["{{baseUrl}}"],
        path: ["api", "payment-types"]
      }
    }
  },
  {
    name: "Get Payment Type by ID",
    request: {
      method: "GET",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        }
      ],
      url: {
        raw: "{{baseUrl}}/api/payment-types/1",
        host: ["{{baseUrl}}"],
        path: ["api", "payment-types", "1"]
      }
    }
  },
  {
    name: "Create Payment Type",
    request: {
      method: "POST",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        },
        {
          key: "Content-Type",
          value: "application/json"
        }
      ],
      body: {
        mode: "raw",
        raw: JSON.stringify({
          name: "Basic Salary",
          payment_category: "earning",
          calculation_type: "fixed",
          formula: null,
          applies_to_all: false
        }, null, 2)
      },
      url: {
        raw: "{{baseUrl}}/api/payment-types",
        host: ["{{baseUrl}}"],
        path: ["api", "payment-types"]
      }
    }
  },
  {
    name: "Update Payment Type",
    request: {
      method: "PUT",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        },
        {
          key: "Content-Type",
          value: "application/json"
        }
      ],
      body: {
        mode: "raw",
        raw: JSON.stringify({
          name: "Updated Basic Salary",
          payment_category: "earning",
          calculation_type: "fixed",
          formula: null,
          applies_to_all: true
        }, null, 2)
      },
      url: {
        raw: "{{baseUrl}}/api/payment-types/1",
        host: ["{{baseUrl}}"],
        path: ["api", "payment-types", "1"]
      }
    }
  },
  {
    name: "Delete Payment Type",
    request: {
      method: "DELETE",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        }
      ],
      url: {
        raw: "{{baseUrl}}/api/payment-types/1",
        host: ["{{baseUrl}}"],
        path: ["api", "payment-types", "1"]
      }
    }
  },
  {
    name: "Activate Payment Type",
    request: {
      method: "PATCH",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        }
      ],
      url: {
        raw: "{{baseUrl}}/api/payment-types/1/activate",
        host: ["{{baseUrl}}"],
        path: ["api", "payment-types", "1", "activate"]
      }
    }
  }
];

// Add Staff Payment Structure folder and requests
const staffPaymentStructureFolder = findOrCreateFolder(collection, 'Staff Payment Structure');

staffPaymentStructureFolder.item = [
  {
    name: "Get Staff Payment Structure",
    request: {
      method: "GET",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        }
      ],
      url: {
        raw: "{{baseUrl}}/api/staff-payment-structure/1",
        host: ["{{baseUrl}}"],
        path: ["api", "staff-payment-structure", "1"]
      }
    }
  },
  {
    name: "Add Payment to Staff",
    request: {
      method: "POST",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        },
        {
          key: "Content-Type",
          value: "application/json"
        }
      ],
      body: {
        mode: "raw",
        raw: JSON.stringify({
          payment_type_id: 1,
          value: 50000,
          effective_from: "2026-01-01",
          effective_to: null
        }, null, 2)
      },
      url: {
        raw: "{{baseUrl}}/api/staff-payment-structure/1/payment",
        host: ["{{baseUrl}}"],
        path: ["api", "staff-payment-structure", "1", "payment"]
      }
    }
  },
  {
    name: "Update Staff Payment",
    request: {
      method: "PUT",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        },
        {
          key: "Content-Type",
          value: "application/json"
        }
      ],
      body: {
        mode: "raw",
        raw: JSON.stringify({
          value: 55000,
          effective_from: "2026-01-01"
        }, null, 2)
      },
      url: {
        raw: "{{baseUrl}}/api/staff-payment-structure/1/payment/1",
        host: ["{{baseUrl}}"],
        path: ["api", "staff-payment-structure", "1", "payment", "1"]
      }
    }
  },
  {
    name: "Remove Payment from Staff",
    request: {
      method: "DELETE",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        }
      ],
      url: {
        raw: "{{baseUrl}}/api/staff-payment-structure/1/payment/1",
        host: ["{{baseUrl}}"],
        path: ["api", "staff-payment-structure", "1", "payment", "1"]
      }
    }
  }
];

// Add Payroll Runs folder and requests
const payrollRunsFolder = findOrCreateFolder(collection, 'Payroll Runs');

payrollRunsFolder.item = [
  {
    name: "Get All Payroll Runs",
    request: {
      method: "GET",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        }
      ],
      url: {
        raw: "{{baseUrl}}/api/payroll-runs",
        host: ["{{baseUrl}}"],
        path: ["api", "payroll-runs"]
      }
    }
  },
  {
    name: "Get Payroll Run by ID",
    request: {
      method: "GET",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        }
      ],
      url: {
        raw: "{{baseUrl}}/api/payroll-runs/1",
        host: ["{{baseUrl}}"],
        path: ["api", "payroll-runs", "1"]
      }
    }
  },
  {
    name: "Create Payroll Run",
    request: {
      method: "POST",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        },
        {
          key: "Content-Type",
          value: "application/json"
        }
      ],
      body: {
        mode: "raw",
        raw: JSON.stringify({
          month: 1,
          year: 2026,
          branch_id: 1,
          notes: "January 2026 payroll run"
        }, null, 2)
      },
      url: {
        raw: "{{baseUrl}}/api/payroll-runs",
        host: ["{{baseUrl}}"],
        path: ["api", "payroll-runs"]
      }
    }
  },
  {
    name: "Update Payroll Run",
    request: {
      method: "PUT",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        },
        {
          key: "Content-Type",
          value: "application/json"
        }
      ],
      body: {
        mode: "raw",
        raw: JSON.stringify({
          status: "draft",
          notes: "Updated January 2026 payroll run"
        }, null, 2)
      },
      url: {
        raw: "{{baseUrl}}/api/payroll-runs/1",
        host: ["{{baseUrl}}"],
        path: ["api", "payroll-runs", "1"]
      }
    }
  },
  {
    name: "Execute Payroll Run",
    request: {
      method: "POST",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        }
      ],
      url: {
        raw: "{{baseUrl}}/api/payroll-runs/1/execute",
        host: ["{{baseUrl}}"],
        path: ["api", "payroll-runs", "1", "execute"]
      }
    }
  },
  {
    name: "Delete Payroll Run",
    request: {
      method: "DELETE",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        }
      ],
      url: {
        raw: "{{baseUrl}}/api/payroll-runs/1",
        host: ["{{baseUrl}}"],
        path: ["api", "payroll-runs", "1"]
      }
    }
  }
];

// Add Payroll Records folder and requests
const payrollRecordsFolder = findOrCreateFolder(collection, 'Payroll Records');

payrollRecordsFolder.item = [
  {
    name: "Get All Payroll Records",
    request: {
      method: "GET",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        }
      ],
      url: {
        raw: "{{baseUrl}}/api/payroll-records",
        host: ["{{baseUrl}}"],
        path: ["api", "payroll-records"]
      }
    }
  },
  {
    name: "Get Payroll Record by ID",
    request: {
      method: "GET",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        }
      ],
      url: {
        raw: "{{baseUrl}}/api/payroll-records/1",
        host: ["{{baseUrl}}"],
        path: ["api", "payroll-records", "1"]
      }
    }
  },
  {
    name: "Get Staff Payroll History",
    request: {
      method: "GET",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        }
      ],
      url: {
        raw: "{{baseUrl}}/api/payroll-records/staff/1/history",
        host: ["{{baseUrl}}"],
        path: ["api", "payroll-records", "staff", "1", "history"]
      }
    }
  },
  {
    name: "Update Payroll Record",
    request: {
      method: "PUT",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        },
        {
          key: "Content-Type",
          value: "application/json"
        }
      ],
      body: {
        mode: "raw",
        raw: JSON.stringify({
          earnings: {
            "Basic Salary": 50000,
            "HRA": 15000
          },
          deductions: {
            "PF": 6000,
            "Tax": 3000
          },
          gross_pay: 65000,
          total_deductions: 9000,
          net_pay: 56000
        }, null, 2)
      },
      url: {
        raw: "{{baseUrl}}/api/payroll-records/1",
        host: ["{{baseUrl}}"],
        path: ["api", "payroll-records", "1"]
      }
    }
  },
  {
    name: "Delete Payroll Record",
    request: {
      method: "DELETE",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        }
      ],
      url: {
        raw: "{{baseUrl}}/api/payroll-records/1",
        host: ["{{baseUrl}}"],
        path: ["api", "payroll-records", "1"]
      }
    }
  }
];

// Add Payslips folder and requests
const payslipsFolder = findOrCreateFolder(collection, 'Payslips');

payslipsFolder.item = [
  {
    name: "View Payslip",
    request: {
      method: "GET",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        }
      ],
      url: {
        raw: "{{baseUrl}}/api/payslips/view/1/1",
        host: ["{{baseUrl}}"],
        path: ["api", "payslips", "view", "1", "1"]
      }
    }
  },
  {
    name: "Download Payslip",
    request: {
      method: "GET",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        }
      ],
      url: {
        raw: "{{baseUrl}}/api/payslips/download/1/1",
        host: ["{{baseUrl}}"],
        path: ["api", "payslips", "download", "1", "1"]
      }
    }
  },
  {
    name: "Send Payslip by Email",
    request: {
      method: "POST",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        }
      ],
      url: {
        raw: "{{baseUrl}}/api/payslips/send/1/1",
        host: ["{{baseUrl}}"],
        path: ["api", "payslips", "send", "1", "1"]
      }
    }
  }
];

// Add Branch Global Attendance folder and requests
const branchGlobalAttendanceFolder = findOrCreateFolder(collection, 'Branch Global Attendance');

branchGlobalAttendanceFolder.item = [
  {
    name: "Update Global Attendance Mode",
    request: {
      method: "POST",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        },
        {
          key: "Content-Type",
          value: "application/json"
        }
      ],
      body: {
        mode: "raw",
        raw: JSON.stringify({
          attendance_mode: "multiple_locations"  // or "branch_based"
        }, null, 2)
      },
      url: {
        raw: "{{baseUrl}}/api/branches/global-attendance-mode",
        host: ["{{baseUrl}}"],
        path: ["api", "branches", "global-attendance-mode"]
      }
    }
  },
  {
    name: "Get Global Attendance Mode Status",
    request: {
      method: "GET",
      header: [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}"
        }
      ],
      url: {
        raw: "{{baseUrl}}/api/branches/global-attendance-mode",
        host: ["{{baseUrl}}"],
        path: ["api", "branches", "global-attendance-mode"]
      }
    }
  }
];

// Write the updated collection back to the file
fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
console.log('Postman collection updated with payroll and global attendance mode endpoints!');