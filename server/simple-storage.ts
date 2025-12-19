import bcrypt from "bcrypt";
import { LeadScoringEngine } from "./leadScoring";
import { MENU_ITEMS } from "../shared/permissions";

// Use the same database connection as the rest of the app
import { sql, db } from "./db";
// Import Drizzle ORM components for leads queries
import {
  leads,
  customers,
  leadTypes,
  roles,
  users,
  customerFiles,
} from "../shared/schema";
import type { CustomerFile, InsertCustomerFile } from "../shared/schema";
import { eq, desc, and } from "drizzle-orm";

export class SimpleStorage {
  async getUserByEmail(email: string) {
    try {
      console.log("🔍 Querying database for user with email:", email);
      const users =
        await sql`SELECT * FROM users WHERE email = ${email} AND is_active = true`;
      console.log("🔍 Database query completed, found users:", users.length);
      const user = users[0];
      if (user) {
        console.log("🔍 User found with id:", user.id);
      } else {
        console.log("🔍 No user found with this email");
      }
      return user;
    } catch (error) {
      console.error("❌ Error getting user by email:", error);
      throw error;
    }
  }

  async getUser(id: number) {
    try {
      console.log(`👤 Looking up user with ID: ${id}`);
      const [user] = await sql`SELECT * FROM users WHERE id = ${id}`;
      console.log(
        `👤 User lookup result:`,
        user
          ? `found user ${user.id} with tenant ${user.tenant_id}`
          : "not found",
      );
      return user;
    } catch (error) {
      console.error("Error getting user by id:", error);
      throw error;
    }
  }

  async getTenant(id: number) {
    try {
      const [tenant] = await sql`SELECT * FROM tenants WHERE id = ${id}`;
      return tenant;
    } catch (error) {
      console.error("Error getting tenant:", error);
      throw error;
    }
  }

  async getTenantById(id: number) {
    return this.getTenant(id);
  }

  async getTenantBySubdomain(subdomain: string) {
    try {
      const [tenant] =
        await sql`SELECT * FROM tenants WHERE subdomain = ${subdomain}`;
      return tenant;
    } catch (error) {
      console.error("Error getting tenant by subdomain:", error);
      throw error;
    }
  }

  async createTenant(tenant: any) {
    try {
      const [newTenant] = await sql`
        INSERT INTO tenants (company_name, subdomain, contact_email, contact_phone, address, is_active)
        VALUES (${tenant.companyName}, ${tenant.subdomain}, ${tenant.contactEmail}, 
                ${tenant.contactPhone || null}, ${tenant.address || null}, ${tenant.isActive})
        RETURNING *
      `;
      return newTenant;
    } catch (error) {
      console.error("Error creating tenant:", error);
      throw error;
    }
  }

  async createUser(user: any) {
    try {
      console.log("Creating user with data:", {
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      });

      // First create the user
      const [newUser] = await sql`
        INSERT INTO users (email, password, role, tenant_id, role_id, first_name, last_name, phone, is_active, is_email_verified, password_reset_required)
        VALUES (${user.email}, ${user.password}, ${user.role || "tenant_admin"}, ${user.tenantId || null}, 
                ${user.roleId || null}, ${user.firstName}, ${user.lastName}, ${user.phone || null}, 
                ${user.isActive !== false}, ${user.isEmailVerified || false}, ${user.passwordResetRequired || false})
        RETURNING *
      `;

      // If this is a tenant_admin, automatically assign Owner role
      if ((user.role === "tenant_admin" || !user.role) && user.tenantId) {
        await this.assignOwnerRoleToTenantAdmin(newUser.id, user.tenantId);
      }

      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async assignOwnerRoleToTenantAdmin(userId: number, tenantId: number) {
    try {
      console.log(
        `👑 Auto-assigning Owner role to user ${userId} in tenant ${tenantId}`,
      );

      // Get or create Owner role for this tenant
      let ownerRoleId: number;
      const [existingOwnerRole] = await sql`
        SELECT id FROM roles 
        WHERE tenant_id = ${tenantId} AND name = 'Owner' AND is_default = true
        LIMIT 1
      `;

      if (existingOwnerRole) {
        ownerRoleId = existingOwnerRole.id;
      } else {
        // Create Owner role with full permissions - get all permissions from MENU_ITEMS
        // This includes all dashboard widgets and page permissions
        const ownerPermissions: Record<string, string[]> = {};
        
        // Assign all permissions from MENU_ITEMS (includes all dashboard widgets)
        Object.entries(MENU_ITEMS).forEach(([key, config]) => {
          ownerPermissions[key] = [...config.actions];
        });
        
        console.log(`✅ Owner role permissions generated:`, Object.keys(ownerPermissions).length, "permission keys");

        const [ownerRole] = await sql`
          INSERT INTO roles (tenant_id, name, description, permissions, is_active, is_default, created_at, updated_at)
          VALUES (
            ${tenantId},
            'Owner',
            'Full system access - automatically created during registration',
            ${JSON.stringify(ownerPermissions)},
            true,
            true,
            NOW(),
            NOW()
          )
          RETURNING id
        `;
        ownerRoleId = ownerRole.id;
      }

      // Assign the Owner role to the user
      await sql`
        UPDATE users 
        SET role_id = ${ownerRoleId}, updated_at = NOW()
        WHERE id = ${userId}
      `;

      console.log(`✅ User ${userId} assigned Owner role ${ownerRoleId}`);
    } catch (error) {
      console.error(`❌ Failed to assign Owner role:`, error);
      // Don't throw here - user creation should succeed even if role assignment fails
    }
  }

  async getAllSubscriptionPlans() {
    try {
      const plans =
        await sql`SELECT * FROM subscription_plans WHERE is_active = true`;
      return plans;
    } catch (error) {
      console.error("Error getting subscription plans:", error);
      throw error;
    }
  }

  async testConnection() {
    try {
      await sql`SELECT 1`;
      return true;
    } catch (error) {
      console.error("Database connection test failed:", error);
      return false;
    }
  }

  // Password reset token management
  async createPasswordResetToken(
    userId: number,
    token: string,
    expiresAt: Date,
  ) {
    try {
      console.log(
        "🔐 Creating password reset token for user:",
        userId,
        "expires:",
        expiresAt.toISOString(),
      );
      const expiresAtString = expiresAt.toISOString();
      const [resetToken] = await sql`
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES (${userId}, ${token}, ${expiresAtString})
        RETURNING *
      `;
      console.log("✅ Password reset token created successfully");
      return resetToken;
    } catch (error) {
      console.error("❌ Error creating password reset token:", error);
      throw error;
    }
  }

  async getPasswordResetToken(token: string) {
    try {
      const [resetToken] = await sql`
        SELECT prt.*, u.email, u.first_name, u.last_name, u.id as user_id
        FROM password_reset_tokens prt
        JOIN users u ON prt.user_id = u.id
        WHERE prt.token = ${token} 
        AND prt.used_at IS NULL 
        AND prt.expires_at > NOW()
      `;
      return resetToken;
    } catch (error) {
      console.error("Error getting password reset token:", error);
      throw error;
    }
  }

  async markTokenAsUsed(tokenId: number) {
    try {
      await sql`
        UPDATE password_reset_tokens 
        SET used_at = NOW() 
        WHERE id = ${tokenId}
      `;
    } catch (error) {
      console.error("Error marking token as used:", error);
      throw error;
    }
  }

  async updateUserPassword(userId: number, hashedPassword: string) {
    try {
      await sql`
        UPDATE users 
        SET password = ${hashedPassword}
        WHERE id = ${userId}
      `;
    } catch (error) {
      console.error("Error updating user password:", error);
      throw error;
    }
  }

  async cleanupExpiredTokens() {
    try {
      await sql`
        DELETE FROM password_reset_tokens 
        WHERE expires_at < NOW()
      `;
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error);
      throw error;
    }
  }

  // Customer management methods - working version
  // async getCustomersByTenant({
  //   tenantId,
  //   search = "",
  //   status = "",
  //   startDate = "",
  //   endDate = "",
  //   sortBy = "created_at",
  //   sortOrder = "desc",
  //   limit = 50,
  //   offset = 0,
  // }: {
  //   tenantId: number;
  //   search?: string;
  //   status?: string;
  //   startDate?: string;
  //   endDate?: string;
  //   sortBy?: string;
  //   sortOrder?: string;
  //   limit?: number;
  //   offset?: number;
  // }) {
  //   try {
  //     let whereClauses = sql`c.tenant_id = ${tenantId}`;

  //     if (search) {
  //       whereClauses = sql`${whereClauses} AND (
  //         LOWER(c.name) LIKE ${"%" + search.toLowerCase() + "%"}
  //         OR LOWER(c.email) LIKE ${"%" + search.toLowerCase() + "%"}
  //         OR c.phone LIKE ${"%" + search + "%"}
  //       )`;
  //     }

  //     if (status) {
  //       whereClauses = sql`${whereClauses} AND c.crm_status = ${status}`;
  //     }

  //     if (startDate && endDate) {
  //       whereClauses = sql`${whereClauses} AND c.created_at BETWEEN ${startDate} AND ${endDate}`;
  //     }

  //     const validSortFields = ["created_at", "updated_at", "name", "email"];
  //     const sortColumn = validSortFields.includes(sortBy)
  //       ? sortBy
  //       : "created_at";
  //     const order = sortOrder.toLowerCase() === "asc" ? sql`ASC` : sql`DESC`;

  //     console.log(
  //       `
  //                  SELECT COUNT(*) as total
  //                  FROM customers c
  //                  WHERE ${whereClauses}
  //                `,
  //       "select customers",
  //     );

  //     // Get total count with same filters
  //     const countResult = await sql`
  //       SELECT COUNT(*) as total
  //       FROM customers c
  //       WHERE ${whereClauses}
  //     `;
  //     const total = parseInt(countResult[0]?.total || "0");

  //     // Get paginated data
  //     const customerResults = await sql`
  //       SELECT *
  //       FROM customers c
  //       WHERE ${whereClauses}
  //       ORDER BY ${sql(sortColumn)} ${order}
  //       LIMIT ${limit} OFFSET ${offset}
  //     `;

  //     // Return paginated response
  //     return {
  //       data: customerResults,
  //       total: total,
  //       page: Math.floor(offset / limit) + 1,
  //       limit: limit,
  //       totalPages: Math.ceil(total / limit),
  //     };
  //   } catch (error: any) {
  //     console.error("❌ Error fetching customers:", error);
  //     throw error;
  //   }
  // }

  async getCustomersByTenant({
    tenantId,
    search = "",
    status = "",
    startDate = "",
    endDate = "",
    sortBy = "created_at",
    sortOrder = "desc",
    limit = 50,
    offset = 0,
  }: {
    tenantId: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      // Start with base WHERE clause
      const whereParts: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // tenant_id
      whereParts.push(`c.tenant_id = $${paramIndex++}`);
      params.push(tenantId);

      if (search && search.trim()) {
        const trimmedSearch = search.trim();
        const searchTerm = `%${trimmedSearch.toLowerCase()}%`;
        const phoneSearchTerm = `%${trimmedSearch}%`; // Phone numbers should not be lowercased

        whereParts.push(`
          (LOWER(c.name) LIKE $${paramIndex}
           OR LOWER(c.email) LIKE $${paramIndex}
           OR c.phone LIKE $${paramIndex + 1})
        `);
        params.push(searchTerm, phoneSearchTerm);
        paramIndex += 2; // Increment by 2 since we use 2 parameters (one for name/email, one for phone)
        console.log(`🔍 Search filter applied: "${trimmedSearch}" (searching name/email with: "${searchTerm}", phone with: "${phoneSearchTerm}")`);
      }

      if (status) {
        whereParts.push(`c.crm_status = $${paramIndex++}`);
        params.push(status);
      }

      if (startDate && endDate) {
        // Format dates to include full day range
        // startDate should be at 00:00:00, endDate should be at 23:59:59.999
        // Ensure dates are in YYYY-MM-DD format, then append time
        const startDateTime = `${startDate.trim()} 00:00:00`;
        const endDateTime = `${endDate.trim()} 23:59:59.999`;

        console.log(`🔍 Date filter applied: ${startDateTime} to ${endDateTime}`);

        whereParts.push(
          `c.created_at >= $${paramIndex++}::timestamp AND c.created_at <= $${paramIndex++}::timestamp`,
        );
        params.push(startDateTime, endDateTime);
      }

      const whereClause =
        whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

      // Validate sort column
      const validSortFields = ["created_at", "updated_at", "name", "email"];
      const sortColumn = validSortFields.includes(sortBy)
        ? sortBy
        : "created_at";
      const order = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

      // --- COUNT query
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM customers c
        ${whereClause};
      `;
      const countResult = await sql.unsafe(countQuery, params);
      const total = parseInt(countResult[0]?.total || "0");

      // --- DATA query
      const dataQuery = `
        SELECT *
        FROM customers c
        ${whereClause}
        ORDER BY ${sortColumn} ${order}
        LIMIT ${limit} OFFSET ${offset};
      `;
      const customerResults = await sql.unsafe(dataQuery, params);

      console.log(
        `✅ getCustomersByTenant → ${customerResults.length} results (total ${total})`,
      );

      // Transform results to ensure status fields are properly mapped
      const transformedResults = customerResults.map((customer: any) => ({
        ...customer,
        status: customer.crm_status || customer.status || "active",
        crmStatus: customer.crm_status || customer.crmStatus || "active",
        // Ensure firstName/lastName for compatibility
        firstName: customer.first_name || customer.firstName || customer.name?.split(" ")[0] || "",
        lastName: customer.last_name || customer.lastName || customer.name?.split(" ").slice(1).join(" ") || "",
        createdAt: customer.created_at || customer.createdAt,
        updatedAt: customer.updated_at || customer.updatedAt,
      }));

      return {
        data: transformedResults,
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      console.error("❌ Error fetching customers:", error);
      throw error;
    }
  }

  async getAllCustomersForGraph(
  tenantId: number,
  {
    search = "",
    status = "",
    dateFrom = "",
    dateTo = "",
  }: {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) {
  try {
    let where = sql`tenant_id = ${tenantId}`;


    if (search) {
      const term = `%${search.toLowerCase()}%`;
      where = sql`${where} AND (
        LOWER(name) LIKE ${term}
        OR LOWER(email) LIKE ${term}
        OR phone LIKE ${term}
      )`;
    }
    if (status) {
      where = sql`${where} AND crm_status = ${status}`;
    }
    if (dateFrom && dateTo) {
      where = sql`${where} AND created_at BETWEEN ${dateFrom} AND ${dateTo}`;
    }

    const rows = await sql`
      SELECT 
        id,
        tenant_id,
        name,
        email,
        phone,
        crm_status,
        created_at,
        updated_at
      FROM customers
      WHERE ${where}
      ORDER BY created_at DESC
    `;


    const customers = rows.map((customer: any) => ({
      ...customer,
      status: customer.crm_status || customer.status || "active",
      crmStatus: customer.crm_status || customer.crmStatus || "active",

      firstName:
        customer.first_name ||
        customer.firstName ||
        customer.name?.split(" ")[0] ||
        "",

      lastName:
        customer.last_name ||
        customer.lastName ||
        customer.name?.split(" ").slice(1).join(" ") ||
        "",

      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
    }));

    return customers;

  } catch (error) {
    console.error("❌ getAllCustomersForGraph error:", error);
    throw error;
  }
}

  async createCustomer(customerData: any) {
    try {
      console.log(
        "🔍 Backend - createCustomer called with data:",
        customerData,
      );

      // Handle both tenantId and tenant_id field naming
      const tenantId = customerData.tenantId || customerData.tenant_id;
      const {
        firstName,
        lastName,
        name,
        email,
        phone,
        address,
        country,
        state,
        city,
        pincode,
        status,
        crmStatus,
        preferences,
        notes,
      } = customerData;

      console.log("🔍 Backend - Extracted tenantId:", tenantId);
      console.log("🔍 Backend - Status from customerData:", { status, crmStatus });

      // Handle name field - use provided name or combine firstName/lastName
      const fullName = name || `${firstName || ""} ${lastName || ""}`.trim();

      // Use status or crmStatus from customerData, with fallback to "active"
      const customerStatus = crmStatus || status || "active";

      if (!tenantId) {
        throw new Error("tenant_id is required for customer creation");
      }

      const [customer] = await db
        .insert(customers)
        .values({
          tenantId,
          name: fullName,
          email,
          phone: phone || null,
          address: address || null,
          country: country || null,
          state: state || null,
          city: city || null,
          pincode: pincode || null,
          notes: notes || null,
          crmStatus: customerStatus, // Use the status from form data
          preferences: preferences || {},
          dynamicData: {},
          tags: [],
        })
        .returning();

      console.log("🔍 Backend - Customer created successfully:", customer);

      // Transform for frontend compatibility
      const transformedCustomer = {
        ...customer,
        firstName: customer.name?.split(" ")[0] || "",
        lastName: customer.name?.split(" ").slice(1).join(" ") || "",
        createdAt: customer.createdAt?.toISOString() || "",
      };

      // Create customer activity (fire and forget - don't block on error)
      this.createCustomerActivity({
        tenantId: tenantId,
        customerId: customer.id,
        userId: customerData.userId || null,
        activityType: 1,
        activityTitle: "Customer Created",
        activityDescription: `Customer Created: ${customer.name || 'Unknown'}${customerData.userId ? ` by user ${customerData.userId}` : ''} for tenant ${tenantId}`,
        activityStatus: 1,
        activityDate: new Date().toISOString(),
      }).catch((error) => {
        console.error("❌ Failed to create customer activity (non-blocking):", error);
      });

      return transformedCustomer;
    } catch (error: any) {
      console.error("🔍 Backend - createCustomer error:", error);
      throw error;
    }
  }

  async getCustomerByEmail(email: string, tenantId: number) {
    try {
      if (!email || email.trim() === "") {
        return null;
      }
      const [customer] = await sql`
        SELECT * FROM customers 
        WHERE tenant_id = ${tenantId} 
        AND email = ${email.trim().toLowerCase()}
        LIMIT 1
      `;
      return customer || null;
    } catch (error) {
      console.error("Error getting customer by email:", error);
      throw error;
    }
  }

  async getCustomerByPhone(phone: string, tenantId: number) {
    try {
      if (!phone || phone.trim() === "") {
        return null;
      }

      // Normalize phone number by removing spaces, dashes, parentheses, dots
      const normalizePhone = (phoneNum: string): string => {
        return phoneNum.replace(/[\s\-\(\)\.]/g, "").trim();
      };

      const normalizedPhone = normalizePhone(phone);

      // Use SQL to find customers with matching phone after normalization
      // This approach checks if any customer's phone (after normalization) matches
      const customers = await sql`
        SELECT * FROM customers 
        WHERE tenant_id = ${tenantId} 
        AND phone IS NOT NULL
        AND phone != ''
        AND LENGTH(phone) > 0
      `;

      // Check if any customer's phone matches after normalization
      // This handles cases like: "123-456-7890" vs "1234567890" vs "(123) 456-7890"
      for (const customer of customers) {
        if (customer.phone) {
          const customerPhoneNormalized = normalizePhone(customer.phone);
          if (customerPhoneNormalized === normalizedPhone) {
            return customer;
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting customer by phone:", error);
      throw error;
    }
  }

  async getCustomerById(customerId: number, tenantId: number) {
    try {
      console.log(
        "🔍 Backend - Fetching customer by ID:",
        customerId,
        "for tenant:",
        tenantId,
      );

      const [customer] = await sql`
        SELECT 
          id,
          tenant_id as "tenantId",
          name,
          email,
          phone,
          address,
          country,
          state,
          city,
          pincode,
          notes,
          crm_status as "crmStatus",
          last_activity as "lastActivity",
          total_value as "totalValue",
          tags,
          company,
          created_at as "createdAt"
        FROM customers 
        WHERE id = ${customerId} AND tenant_id = ${tenantId}
      `;

      if (!customer) {
        console.log("🔍 Backend - Customer not found");
        return null;
      }

      console.log("🔍 Backend - Found customer:", customer.id);

      // Add computed firstName/lastName fields for compatibility
      const transformedCustomer = {
        ...customer,
        firstName: customer.name?.split(" ")[0] || "",
        lastName: customer.name?.split(" ").slice(1).join(" ") || "",
      };

      return transformedCustomer;
    } catch (error: any) {
      console.error("🔍 Backend - Error fetching customer by ID:", error);
      throw error;
    }
  }

  async updateCustomer(
    customerId: number,
    tenantId: number,
    customerData: any,
  ) {
    try {
      console.log(
        "🔍 Backend - updateCustomer called with data:",
        customerData,
      );

      const {
        firstName,
        lastName,
        email,
        phone,
        address,
        country,
        state,
        city,
        pincode,
        preferences,
        status,
        notes,
        crmStatus,
        lastActivity,
        totalValue,
        tags,
        company,
      } = customerData;

      console.log("🔍 Backend - updateCustomer status from customerData:", { status, crmStatus });

      // Combine firstName and lastName for name field
      const fullName = `${firstName || ""} ${lastName || ""}`.trim();

      // Use status or crmStatus from customerData, keep existing if neither provided
      const customerStatus = crmStatus || status;

      const [customer] = await sql`
        UPDATE customers 
        SET name = ${fullName}, email = ${email}, 
            phone = ${phone || null}, address = ${address || null}, 
            country = ${country || null}, state = ${state || null}, city = ${city || null}, 
            pincode = ${pincode || null}, notes = ${notes || null},
            crm_status = ${customerStatus || null}, 
            last_activity = ${lastActivity || null},
            total_value = ${totalValue || null},
            tags = ${tags ? JSON.stringify(tags) : null},
            company = ${company || null}
        WHERE id = ${customerId}
        RETURNING 
          id,
          tenant_id as "tenantId",
          name,
          email,
          phone,
          address,
          country,
          state,
          city,
          pincode,
          notes,
          crm_status as "crmStatus",
          last_activity as "lastActivity",
          total_value as "totalValue",
          tags,
          company,
          created_at as "createdAt"
      `;

      console.log("🔍 Backend - Customer updated successfully:", customer);

      // Add computed firstName/lastName fields for compatibility
      const transformedCustomer = {
        ...customer,
        firstName: customer.name?.split(" ")[0] || "",
        lastName: customer.name?.split(" ").slice(1).join(" ") || "",
      };

      return transformedCustomer;
    } catch (error: any) {
      console.error("🔍 Backend - updateCustomer error:", error);
      throw error;
    }
  }

  // Customer columns management
  async getCustomerColumnsByTenant(tenantId: number) {
    const columns = await sql`
      SELECT 
        id,
        tenant_id as "tenantId",
        field_name as "fieldName",
        field_label as "fieldLabel",
        field_type as "fieldType",
        field_options as "fieldOptions",
        is_required as "isRequired",
        display_order as "displayOrder",
        is_active as "isActive",
        created_at as "createdAt"
      FROM customer_columns 
      WHERE tenant_id = ${tenantId} AND is_active = true
      ORDER BY display_order ASC, created_at ASC
    `;
    return columns;
  }

  async createCustomerColumn(columnData: any) {
    const {
      tenantId,
      fieldName,
      fieldLabel,
      fieldType,
      fieldOptions,
      isRequired,
      displayOrder,
      isActive,
    } = columnData;

    const [column] = await sql`
      INSERT INTO customer_columns (
        tenant_id, field_name, field_label, field_type, field_options,
        is_required, display_order, is_active
      )
      VALUES (
        ${tenantId}, ${fieldName}, ${fieldLabel}, ${fieldType}, 
        ${fieldOptions ? JSON.stringify(fieldOptions) : null},
        ${isRequired || false}, ${displayOrder || 0}, ${isActive !== false}
      )
      RETURNING 
        id,
        tenant_id as "tenantId",
        field_name as "fieldName",
        field_label as "fieldLabel",
        field_type as "fieldType",
        field_options as "fieldOptions",
        is_required as "isRequired",
        display_order as "displayOrder",
        is_active as "isActive",
        created_at as "createdAt"
    `;
    return column;
  }

  async updateCustomerColumn(columnId: number, columnData: any) {
    const {
      fieldName,
      fieldLabel,
      fieldType,
      fieldOptions,
      isRequired,
      displayOrder,
      isActive,
    } = columnData;

    const [column] = await sql`
      UPDATE customer_columns 
      SET field_name = ${fieldName}, field_label = ${fieldLabel}, 
          field_type = ${fieldType}, 
          field_options = ${fieldOptions ? JSON.stringify(fieldOptions) : null},
          is_required = ${isRequired}, display_order = ${displayOrder}, 
          is_active = ${isActive}
      WHERE id = ${columnId}
      RETURNING 
        id,
        tenant_id as "tenantId",
        field_name as "fieldName",
        field_label as "fieldLabel",
        field_type as "fieldType",
        field_options as "fieldOptions",
        is_required as "isRequired",
        display_order as "displayOrder",
        is_active as "isActive",
        created_at as "createdAt"
    `;
    return column;
  }

  async deleteCustomerColumn(columnId: number) {
    await sql`UPDATE customer_columns SET is_active = false WHERE id = ${columnId}`;
  }

  async deleteCustomer(customerId: number, tenantId: number): Promise<boolean> {
    try {
      console.log(`🔍 Deleting customer ${customerId} for tenant ${tenantId}`);

      // Delete customer, ensuring it belongs to the tenant
      const result = await sql`
        DELETE FROM customers 
        WHERE id = ${customerId} AND tenant_id = ${tenantId}
      `;

      // Check if any rows were deleted
      const deleted = result && result.count > 0;

      if (deleted) {
        console.log(`🔍 ✅ Customer ${customerId} deleted successfully`);
      } else {
        console.log(`🔍 ⚠️ No customer found with id ${customerId} for tenant ${tenantId}`);
      }

      return deleted;
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  }

  // User management methods
  async getUsersByTenant(tenantId: number) {
    try {
      const users = await sql`
        SELECT 
          u.id,
          u.email,
          u.role,
          u.tenant_id as "tenantId",
          u.role_id as "roleId",
          u.reporting_user_id as "reportingUserId",
          u.first_name as "firstName",
          u.last_name as "lastName",
          u.phone,
          u.is_active as "isActive",
          u.is_email_verified as "isEmailVerified",
          u.last_login_at as "lastLoginAt",
          u.password_reset_required as "passwordResetRequired",
          u.created_at as "createdAt",
          u.updated_at as "updatedAt",
          r.name as "roleName",
          r.hierarchy_level as "hierarchyLevel",
          reportingUser.first_name || ' ' || reportingUser.last_name as "reportingUserName"
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN users reportingUser ON u.reporting_user_id = reportingUser.id
        WHERE u.tenant_id = ${tenantId} AND u.is_active = true
        ORDER BY COALESCE(r.hierarchy_level, 999), u.first_name, u.last_name
      `;
      return users;
    } catch (error) {
      console.error("Error getting users by tenant:", error);
      throw error;
    }
  }

  // Get all direct subordinates of a user
  async getDirectSubordinates(userId: number, tenantId: number) {
    try {
      const subordinates = await sql`
        SELECT 
          u.id,
          u.email,
          u.role,
          u.tenant_id as "tenantId",
          u.role_id as "roleId",
          u.reporting_user_id as "reportingUserId",
          u.first_name as "firstName",
          u.last_name as "lastName",
          u.phone,
          u.is_active as "isActive",
          r.name as "roleName",
          r.hierarchy_level as "hierarchyLevel"
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.reporting_user_id = ${userId} 
          AND u.tenant_id = ${tenantId} 
          AND u.is_active = true
        ORDER BY COALESCE(r.hierarchy_level, 999), u.first_name, u.last_name
      `;
      return subordinates;
    } catch (error) {
      console.error("Error getting direct subordinates:", error);
      throw error;
    }
  }

  // Get all subordinates recursively (including subordinates of subordinates)
  async getAllSubordinates(userId: number, tenantId: number): Promise<number[]> {
    try {
      const allSubordinateIds: number[] = [];
      const processed = new Set<number>();

      const getSubordinatesRecursive = async (currentUserId: number) => {
        if (processed.has(currentUserId)) return;
        processed.add(currentUserId);

        const directSubs = await this.getDirectSubordinates(currentUserId, tenantId);
        for (const sub of directSubs) {
          if (!allSubordinateIds.includes(sub.id)) {
            allSubordinateIds.push(sub.id);
            await getSubordinatesRecursive(sub.id); // Recursively get their subordinates
          }
        }
      };

      await getSubordinatesRecursive(userId);
      return allSubordinateIds;
    } catch (error) {
      console.error("Error getting all subordinates:", error);
      throw error;
    }
  }

  // Get user's team IDs (user + all subordinates)
  async getUserTeamIds(userId: number, tenantId: number): Promise<number[]> {
    const subordinates = await this.getAllSubordinates(userId, tenantId);
    return [userId, ...subordinates];
  }

  // Check if user is owner/superadmin
  async isUserOwner(userId: number, tenantId: number): Promise<boolean> {
    try {
      const [user] = await sql`
        SELECT u.role_id, r.is_default, u.role
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = ${userId} AND u.tenant_id = ${tenantId}
      `;
      
      if (!user) return false;
      
      // Check if role is default (owner)
      if (user.is_default === true) return true;
      
      // Legacy check: tenant_admin role
      if (user.role === "tenant_admin") return true;
      
      return false;
    } catch (error) {
      console.error("Error checking if user is owner:", error);
      return false;
    }
  }

  async updateUser(userId: number, userData: any) {
    try {
      const [updatedUser] = await sql`
        UPDATE users 
        SET 
          first_name = COALESCE(${userData.firstName}, first_name),
          last_name = COALESCE(${userData.lastName}, last_name),
          email = COALESCE(${userData.email}, email),
          phone = COALESCE(${userData.phone}, phone),
          role_id = COALESCE(${userData.roleId}, role_id),
          reporting_user_id = COALESCE(${userData.reportingUserId}, reporting_user_id),
          is_active = COALESCE(${userData.isActive}, is_active),
          updated_at = NOW()
        WHERE id = ${userId}
        RETURNING *
      `;
      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  // Auto-assign lead based on role hierarchy and workload
  // Priority: 1. Configured priority role (from tenant settings), 2. Preferred role, 3. Lowest hierarchy level, 4. Least workload
  async autoAssignLead(tenantId: number, leadTypeId?: number, preferredRoleId?: number): Promise<number | null> {
    try {
      console.log(`🤖 Auto-assigning lead for tenant ${tenantId}, leadType: ${leadTypeId}, preferredRole: ${preferredRoleId}`);

      // Get tenant settings to check for configured priority role
      const [tenantSettings] = await sql`
        SELECT auto_assignment_priority_role_id 
        FROM tenant_settings 
        WHERE tenant_id = ${tenantId}
      `;
      
      const configuredPriorityRoleId = tenantSettings?.auto_assignment_priority_role_id || null;
      
      if (configuredPriorityRoleId) {
        console.log(`📋 Found configured priority role ID: ${configuredPriorityRoleId}`);
      }

      // Get all active users in tenant with their roles and workload
      const usersWithWorkload = await sql`
        SELECT 
          u.id,
          u.role_id,
          u.reporting_user_id,
          r.name as role_name,
          r.hierarchy_level,
          r.permissions,
          COUNT(l.id) as assigned_leads_count,
          COUNT(CASE WHEN l.status NOT IN ('closed_won', 'closed_lost') THEN 1 END) as active_leads_count
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN leads l ON l.assigned_user_id = u.id AND l.tenant_id = ${tenantId}
        WHERE u.tenant_id = ${tenantId} 
          AND u.is_active = true
          AND (r.permissions->>'leads' IS NOT NULL OR r.is_default = true)
        GROUP BY u.id, u.role_id, u.reporting_user_id, r.name, r.hierarchy_level, r.permissions
        HAVING (
          r.permissions->>'leads' LIKE '%"view"%' OR 
          r.permissions->>'leads' LIKE '%"create"%' OR
          r.is_default = true
        )
        ORDER BY 
          COALESCE(r.hierarchy_level, 999) ASC, -- Lower hierarchy level = higher priority
          active_leads_count ASC, -- Least active leads first
          assigned_leads_count ASC -- Least total leads first
      `;

      if (usersWithWorkload.length === 0) {
        console.log("⚠️ No eligible users found for auto-assignment");
        return null;
      }

      // STEP 1: Prioritize configured priority role users first (from tenant settings)
      if (configuredPriorityRoleId) {
        const priorityRoleUsers = usersWithWorkload.filter((u: any) => 
          u.role_id === configuredPriorityRoleId
        );

        if (priorityRoleUsers.length > 0) {
          console.log(`✅ Found ${priorityRoleUsers.length} users with configured priority role (ID: ${configuredPriorityRoleId}), prioritizing them`);
          // Select user with least active leads (round-robin style)
          const selectedUser = priorityRoleUsers.reduce((prev: any, curr: any) => {
            return (prev.active_leads_count ?? 0) <= (curr.active_leads_count ?? 0) ? prev : curr;
          });
          console.log(`✅ Auto-assigned to priority role user ${selectedUser.id} (${selectedUser.role_name}) with ${selectedUser.active_leads_count} active leads`);
          return selectedUser.id;
        } else {
          console.log(`ℹ️ Configured priority role (ID: ${configuredPriorityRoleId}) has no active users, falling back to other roles`);
        }
      }

      // STEP 2: Filter by preferred role if specified (include child roles in hierarchy)
      let eligibleUsers = usersWithWorkload;
      if (preferredRoleId) {
        // Get the preferred role and all its child roles (roles that have this as parent)
        const childRoleIds = await this.getRoleHierarchy(preferredRoleId, tenantId);
        const eligibleRoleIds = [preferredRoleId, ...childRoleIds];
        eligibleUsers = usersWithWorkload.filter((u: any) => 
          eligibleRoleIds.includes(u.role_id)
        );
        if (eligibleUsers.length === 0) {
          // Fallback to all users if preferred role has no users
          eligibleUsers = usersWithWorkload;
        }
      }

      // STEP 3: Find users at the lowest hierarchy level (sales reps, not managers)
      const minHierarchyLevel = Math.min(
        ...eligibleUsers.map((u: any) => u.hierarchy_level ?? 999)
      );

      // Filter to users at the sales rep level (highest hierarchy_level number)
      const salesReps = eligibleUsers.filter(
        (u: any) => (u.hierarchy_level ?? 999) === minHierarchyLevel
      );

      // If no sales reps found, use all eligible users
      const finalCandidates = salesReps.length > 0 ? salesReps : eligibleUsers;

      // STEP 4: Select user with least active leads
      const selectedUser = finalCandidates.reduce((prev: any, curr: any) => {
        return (prev.active_leads_count ?? 0) <= (curr.active_leads_count ?? 0) ? prev : curr;
      });

      console.log(`✅ Auto-assigned to user ${selectedUser.id} (${selectedUser.role_name}) with ${selectedUser.active_leads_count} active leads`);
      return selectedUser.id;
    } catch (error) {
      console.error("❌ Error in auto-assign lead:", error);
      return null;
    }
  }

  async deleteUser(userId: number) {
    try {
      await sql`UPDATE users SET is_active = false WHERE id = ${userId}`;
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  // Email configuration methods
  async getEmailConfiguration(tenantId: number) {
    try {
      const [config] = await sql`
        SELECT * FROM email_configurations 
        WHERE tenant_id = ${tenantId} AND is_active = true
        LIMIT 1
      `;
      return config;
    } catch (error) {
      console.error("Error getting email configuration:", error);
      return null;
    }
  }

  async upsertEmailConfiguration(configData: any) {
    try {
      console.log(
        "📧 Upserting email configuration for tenant:",
        configData.tenantId,
      );
      console.log(
        "📧 Config data received:",
        JSON.stringify(configData, null, 2),
      );

      // Check if email_configurations table exists and has correct structure
      const tableInfo = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'email_configurations' 
        ORDER BY ordinal_position
      `;
      console.log("📧 Table structure:", tableInfo);

      // Check if configuration exists
      const existing = await this.getEmailConfiguration(configData.tenantId);
      console.log(
        "📧 Existing configuration:",
        existing ? "found" : "not found",
      );

      if (existing) {
        // Update existing configuration
        console.log("📧 Updating existing configuration...");
        const [updated] = await sql`
          UPDATE email_configurations 
          SET 
            sender_name = ${configData.senderName || null},
            sender_email = ${configData.senderEmail || null},
            reply_to_email = ${configData.replyToEmail || null},
            smtp_host = ${configData.smtpHost || null},
            smtp_port = ${configData.smtpPort || 587},
            smtp_username = ${configData.smtpUsername || null},
            smtp_password = ${configData.smtpPassword || null},
            smtp_security = ${configData.smtpSecurity || "tls"},
            is_smtp_enabled = ${configData.isSmtpEnabled || false},
            daily_send_limit = ${configData.dailySendLimit || 1000},
            bounce_handling = ${configData.bounceHandling !== undefined ? configData.bounceHandling : true},
            track_opens = ${configData.trackOpens !== undefined ? configData.trackOpens : true},
            track_clicks = ${configData.trackClicks !== undefined ? configData.trackClicks : true},
            unsubscribe_footer = ${configData.unsubscribeFooter || null},
            email_signature = ${configData.emailSignature || null},
            is_active = ${configData.isActive !== undefined ? configData.isActive : true},
            updated_at = NOW()
          WHERE tenant_id = ${configData.tenantId}
          RETURNING *
        `;

        console.log("✅ Email configuration updated successfully");
        return updated;
      } else {
        // Create new configuration
        console.log("📧 Creating new configuration...");
        const [created] = await sql`
          INSERT INTO email_configurations (
            tenant_id, sender_name, sender_email, reply_to_email,
            smtp_host, smtp_port, smtp_username, smtp_password, smtp_security,
            is_smtp_enabled, daily_send_limit, bounce_handling, track_opens, track_clicks,
            unsubscribe_footer, email_signature, is_active, created_at, updated_at
          ) VALUES (
            ${configData.tenantId}, 
            ${configData.senderName || null}, 
            ${configData.senderEmail || null}, 
            ${configData.replyToEmail || null}, 
            ${configData.smtpHost || null}, 
            ${configData.smtpPort || 587},
            ${configData.smtpUsername || null}, 
            ${configData.smtpPassword || null}, 
            ${configData.smtpSecurity || "tls"},
            ${configData.isSmtpEnabled || false}, 
            ${configData.dailySendLimit || 1000}, 
            ${configData.bounceHandling !== undefined ? configData.bounceHandling : true},
            ${configData.trackOpens !== undefined ? configData.trackOpens : true}, 
            ${configData.trackClicks !== undefined ? configData.trackClicks : true}, 
            ${configData.unsubscribeFooter || null},
            ${configData.emailSignature || null}, 
            ${configData.isActive !== undefined ? configData.isActive : true}, 
            NOW(), 
            NOW()
          )
          RETURNING *
        `;

        console.log("✅ Email configuration created successfully");
        return created;
      }
    } catch (error) {
      console.error("❌ Error upserting email configuration:", error);
      console.error("❌ Stack trace:", error.stack);
      throw error;
    }
  }

  // Lead management methods using direct SQL (enhanced version)
  async getLeadsByTenant({
    tenantId,
    teamUserIds, // Optional: filter by team user IDs (for hierarchical access)
    limit = 50,
    offset = 0,
    search = "",
    status = "",
    priority = "",
    type = "",
    source = "",
    dateFrom = "",
    dateTo = "",
    sortBy = "created_at",
    sortOrder = "desc",
    typeSpecificFilters = "",
  }: {
    tenantId: number;
    teamUserIds?: number[]; // Filter leads by assigned_user_id if provided (for team/supervisor access)
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
    priority?: string;
    type?: string;
    source?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
    typeSpecificFilters?: string;
  }) {
    try {
      let whereClauses = sql`l.tenant_id = ${tenantId}`;

      // Filter by allowed user IDs if provided (role-based hierarchy filtering)
      // Show leads assigned to users in the role hierarchy
      if (teamUserIds && teamUserIds.length > 0) {
        // Ensure all IDs are integers
        const userIdsAsInts = teamUserIds.map(id => Number(id)).filter(id => !isNaN(id));
        if (userIdsAsInts.length > 0) {
          whereClauses = sql`${whereClauses} AND l.assigned_user_id = ANY(${sql.array(userIdsAsInts)}::int[])`;
        }
      }

      if (search) {
        whereClauses = sql`${whereClauses} AND (
          LOWER(l.first_name || ' ' || l.last_name) LIKE ${"%" + search.toLowerCase() + "%"}
          OR LOWER(l.email) LIKE ${"%" + search.toLowerCase() + "%"}
          OR l.phone LIKE ${"%" + search + "%"}
        )`;
      }

      if (status && status !== "all") {
        whereClauses = sql`${whereClauses} AND l.status = ${status}`;
      }

      if (priority) {
        whereClauses = sql`${whereClauses} AND l.priority = ${priority}`;
      }

      if (type) {
        const typeId = parseInt(String(type), 10);
        if (!isNaN(typeId)) {
          whereClauses = sql`${whereClauses} AND l.lead_type_id = ${typeId}`;
        }
      }

      if (source) {
        whereClauses = sql`${whereClauses} AND l.source = ${source}`;
      }

      if (dateFrom && dateTo) {
        whereClauses = sql`${whereClauses} AND l.created_at BETWEEN ${dateFrom} AND ${dateTo}`;
      }

      // Apply type-specific filters on JSON column
      if (typeSpecificFilters) {
        try {
          const filters = JSON.parse(typeSpecificFilters);
          console.log("🔍 Applying type-specific filters:", filters);

          Object.entries(filters).forEach(([fieldName, fieldValue]) => {
            if (
              fieldValue !== "" &&
              fieldValue !== null &&
              fieldValue !== undefined
            ) {
              // Use PostgreSQL JSON ->> operator to query JSON fields
              whereClauses = sql`${whereClauses} AND l.type_specific_data->>${fieldName} = ${String(fieldValue)}`;
              console.log(`🔍 Filter applied: ${fieldName} = ${fieldValue}`);
            }
          });
        } catch (error) {
          console.error("❌ Error parsing type-specific filters:", error);
        }
      }

      // Sort mapping
      const validSortFields = [
        "created_at",
        "updated_at",
        "first_name",
        "last_name",
      ];
      const sortColumn = validSortFields.includes(sortBy)
        ? sortBy
        : "created_at";
      const order = sortOrder.toLowerCase() === "asc" ? sql`ASC` : sql`DESC`;

      // Get total count for pagination
      const [countResult] = await sql`
        SELECT COUNT(*)::int as total
        FROM leads l
        LEFT JOIN lead_types lt ON l.lead_type_id = lt.id
        LEFT JOIN users assigned_user ON l.assigned_user_id = assigned_user.id
        WHERE ${whereClauses}
      `;
      const total = countResult?.total || 0;

      const leadResults = await sql`
        SELECT 
          l.*,
          l.type_specific_data as "typeSpecificData",
          l.assigned_user_id as "assignedUserId",
          lt.name AS lead_type_name,
          lt.icon AS lead_type_icon,
          lt.color AS lead_type_color,
          assigned_user.first_name as "assignedUserFirstName",
          assigned_user.last_name as "assignedUserLastName",
          assigned_user.email as "assignedUserEmail"
        FROM leads l
        LEFT JOIN lead_types lt ON l.lead_type_id = lt.id
        LEFT JOIN users assigned_user ON l.assigned_user_id = assigned_user.id
        WHERE ${whereClauses}
        ORDER BY ${sql(sortColumn)} ${order}
        LIMIT ${limit} OFFSET ${offset}
      `;

      // Transform leads with default fields
      const transformedLeads = leadResults.map((lead: any) => ({
        ...lead,
        name: lead.name || `${lead.first_name} ${lead.last_name}`.trim(),
        priority: lead.priority || "medium",
        score: lead.score || 50,
        emailOpens: 0,
        emailClicks: 0,
        websiteVisits: 0,
        budgetRange: lead.budget_range || "",
        country: lead.country || "",
        state: lead.state || "",
        city: lead.city || "",
        notes: lead.notes || "",
        leadTypeName: lead.lead_type_name || "General",
        leadTypeIcon: lead.lead_type_icon || "User",
        leadTypeColor: lead.lead_type_color || "#0BBCD6",
        assignedUserName: lead.assignedUserFirstName && lead.assignedUserLastName
          ? `${lead.assignedUserFirstName} ${lead.assignedUserLastName}`
          : null,
        assignedUserEmail: lead.assignedUserEmail || null,
        dynamicData: {},
      }));

      // Fetch dynamic data
      const leadsWithDynamicData = await Promise.all(
        transformedLeads.map(async (lead: any) => {
          try {
            const dynamicFieldValues = await sql`
              SELECT df.field_name, df.field_label, df.field_type, dfv.field_value
              FROM dynamic_field_values dfv
              JOIN dynamic_fields df
                ON dfv.field_id = df.id
               AND df.tenant_id = ${tenantId}
               AND df.show_in_leads = true
              WHERE dfv.lead_id = ${lead.id}
            `;
            const dynamicData: Record<string, any> = {};
            dynamicFieldValues.forEach(
              (f) => (dynamicData[f.field_name] = f.field_value),
            );
            return { ...lead, dynamicData };
          } catch {
            return { ...lead, dynamicData: {} };
          }
        }),
      );

      return {
        data: leadsWithDynamicData,
        total: total,
      };
    } catch (error) {
      console.error("❌ Error fetching leads:", error);
      throw error;
    }
  }


async getAllLeadsByTenant(
  tenantId: number,
  {
    limit = null,
    offset = null,
    search = "",
    status = "",
    priority = "",
    source = "",
    dateFrom = "",
    dateTo = "",
    sortBy = "created_at",
    sortOrder = "desc",
    teamUserIds, // Optional: filter by role hierarchy user IDs
  }
) {
  try {
    let dateFilter = sql`1=1`;

    if (dateFrom && dateTo) {
      dateFilter = sql`
        created_at >= ${dateFrom} AND created_at <= ${dateTo}
      `;
    }

    let whereClauses = sql`tenant_id = ${tenantId}`;

    // Filter by allowed user IDs if provided (role-based hierarchy filtering)
    if (teamUserIds && teamUserIds.length > 0) {
      whereClauses = sql`${whereClauses} AND (
        created_by = ANY(${sql.array(teamUserIds)}) 
        OR assigned_user_id = ANY(${sql.array(teamUserIds)})
      )`;
    }

    const leads = await sql`
      SELECT 
        id,
        first_name,
        last_name,
        name,
        email,
        source,
        status,
        priority,
        score,
        created_at,
        converted_to_customer_id
      FROM leads
      WHERE ${whereClauses}

        AND (
          ${search} = '' OR
          LOWER(first_name) LIKE ${"%" + search.toLowerCase() + "%"} OR
          LOWER(last_name) LIKE ${"%" + search.toLowerCase() + "%"} OR
          LOWER(email) LIKE ${"%" + search.toLowerCase() + "%"}
        )

        AND (${status} = '' OR status = ${status})
        AND (${priority} = '' OR priority = ${priority})
        AND (${source} = '' OR source = ${source})

        AND ${dateFilter}

      ORDER BY ${
        sortBy === "score"
          ? sql`score`
          : sortBy === "priority"
            ? sql`priority`
            : sql`created_at`
      } ${sortOrder === "asc" ? sql`ASC` : sql`DESC`}

      ${limit ? sql`LIMIT ${limit}` : sql``}
      ${offset ? sql`OFFSET ${offset}` : sql``}
    `;

    
    leads.forEach(l => {
      if (l.score === 0) {
        l.score = 50;
      }
    });

    return leads;

  } catch (error) {
    console.error("❌ getAllLeadsByTenant error:", error);
    throw error;
  }
}




  async getLeadsByAssignedUser(tenantId: number, userId: number) {
    try {
      console.log(
        "🔍 ⭐ SIMPLE-STORAGE: Fetching leads assigned to user:",
        userId,
        "in tenant:",
        tenantId,
      );

      // Use direct SQL query to filter leads by assigned_user_id
      const leadResults = await sql`
        SELECT 
          l.id,
          l.tenant_id as "tenantId",
          l.lead_type_id as "leadTypeId",
          l.first_name as "firstName",
          l.last_name as "lastName",
          l.name,
          l.email,
          l.phone,
          l.source,
          l.status,
          l.type_specific_data as "typeSpecificData",
          l.notes,
          l.budget_range as "budgetRange",
          l.priority,
          l.country,
          l.state,
          l.city,
          l.converted_to_customer_id as "convertedToCustomerId",
          l.assigned_user_id as "assignedUserId",
          l.score,
          l.last_contact_date as "lastContactDate",
          l.email_opens as "emailOpens",
          l.email_clicks as "emailClicks",
          l.website_visits as "websiteVisits",
          l.created_at as "createdAt",
          l.updated_at as "updatedAt",
          lt.name as "leadTypeName",
          lt.icon as "leadTypeIcon",
          lt.color as "leadTypeColor"
        FROM leads l
        LEFT JOIN lead_types lt ON l.lead_type_id = lt.id
        WHERE l.tenant_id = ${tenantId} AND l.assigned_user_id = ${userId}
        ORDER BY l.created_at DESC
      `;

      console.log("🔍 Found assigned leads:", leadResults.length);

      // Transform leads using the same logic as getLeadsByTenant
      const transformedLeads = leadResults.map((lead: any, index: number) => {
        try {
          const transformed = {
            ...lead,
            priority:
              lead.priority ||
              ((lead.score || 0) >= 80
                ? "high"
                : (lead.score || 0) >= 50
                  ? "medium"
                  : "low"),
            name:
              lead.name ||
              `${lead.firstName || ""} ${lead.lastName || ""}`.trim(),
            score: lead.score || 50,
            emailOpens: lead.emailOpens || 0,
            emailClicks: lead.emailClicks || 0,
            websiteVisits: lead.websiteVisits || 0,
            lastContactDate: lead.lastContactDate
              ? typeof lead.lastContactDate === "string"
                ? lead.lastContactDate
                : lead.lastContactDate.toISOString()
              : null,
            createdAt: lead.createdAt
              ? typeof lead.createdAt === "string"
                ? lead.createdAt
                : lead.createdAt.toISOString()
              : null,
            updatedAt: lead.updatedAt
              ? typeof lead.updatedAt === "string"
                ? lead.updatedAt
                : lead.updatedAt.toISOString()
              : null,
            budgetRange: lead.budgetRange || "",
            country: lead.country || "",
            state: lead.state || "",
            city: lead.city || "",
            notes: lead.notes || "",
          };

          return transformed;
        } catch (transformError: any) {
          console.error(
            `🔍 Error transforming assigned lead ${lead.id}:`,
            transformError,
          );
          throw new Error(
            `Failed to transform assigned lead ${lead.id}: ${transformError.message}`,
          );
        }
      });

      // Fetch dynamic field values for assigned leads
      const leadsWithDynamicData = await Promise.all(
        transformedLeads.map(async (lead: any) => {
          try {
            const dynamicFieldValues = await sql`
            SELECT 
              df.field_name,
              df.field_label,
              df.field_type,
              dfv.field_value
            FROM dynamic_field_values dfv
            JOIN dynamic_fields df ON dfv.field_id = df.id
            WHERE dfv.lead_id = ${lead.id} AND df.tenant_id = ${tenantId} AND df.show_in_leads = true
          `;

            const dynamicData: Record<string, any> = {};
            dynamicFieldValues.forEach((field: any) => {
              dynamicData[field.field_name] = field.field_value;
            });

            return {
              ...lead,
              dynamicData: dynamicData,
            };
          } catch (error) {
            console.error(
              `❌ Error fetching dynamic data for assigned lead ${lead.id}:`,
              error,
            );
            return {
              ...lead,
              dynamicData: {},
            };
          }
        }),
      );

      console.log(
        "🔍 Successfully processed assigned leads with dynamic data:",
        leadsWithDynamicData.length,
      );
      return leadsWithDynamicData;
    } catch (error: any) {
      console.error("🔍 Error fetching assigned leads:", error);
      console.error("🔍 Error details:", {
        message: error.message,
        code: error.code,
        severity: error.severity,
      });
      throw error;
    }
  }

  async saveLeadActivity(activityData: any) {
    try {
      console.log(
        "🔍🔍 SimpleStorage.saveLeadActivity - Raw input:",
        JSON.stringify(activityData, null, 2),
      );

      const {
        tenant_id,
        lead_id,
        user_id,
        activity_type,
        activity_title,
        activity_description,
        activity_status,
      } = activityData;

      if (!tenant_id) throw new Error("tenantId is required");

      const [leadActivity] = await sql`
        INSERT INTO lead_activities (
          tenant_id,
          lead_id,
          user_id,
          activity_type,
          activity_title,
          activity_description,
          activity_status,
          activity_date,
          created_at,
          updated_at
        )
        VALUES (
          ${tenant_id},
          ${lead_id},
          ${user_id},
          ${activity_type},
          ${activity_title},
          ${activity_description || null},
          ${activity_status},
          ${new Date().toISOString()},
          NOW(),
          NOW()
        )
        RETURNING *;
      `;

      console.log("✅ Lead Activity created successfully:", leadActivity.id);

      return {
        ...leadActivity,
      };
    } catch (error) {
      console.error("❌ Error in createActivity:", error);
      throw error;
    }
  }

  async createLead(leadData: any) {
    try {
      console.log(
        "🔍🔍 SimpleStorage.createLead - Raw input:",
        JSON.stringify(leadData, null, 2),
      );

      const {
        tenantId,
        leadTypeId,
        userId,
        firstName,
        lastName,
        email,
        phone,
        source,
        status,
        typeSpecificData,
        notes,
        budgetRange,
        priority,
        country,
        state,
        city,
      } = leadData;

      console.log(
        "🔍🔍 Extracted leadTypeId:",
        leadTypeId,
        "type:",
        typeof leadTypeId,
      );

      // Validate required fields
      if (!tenantId) throw new Error("tenantId is required");
      // Email is now optional - no validation needed

      // Ensure leadTypeId is valid - use fallback if needed
      const finalLeadTypeId = leadTypeId || 1;
      console.log(
        "🔍🔍🚀 FIXED VERSION LOADED - TIMESTAMP",
        new Date().toISOString(),
      );
      console.log("🔍🔍 Final leadTypeId to use:", finalLeadTypeId);

      // Handle case where firstName/lastName might be missing (use first/last OR derive from name)
      const finalFirstName =
        firstName || (leadData.name ? leadData.name.split(" ")[0] : "Unknown");
      const finalLastName =
        lastName ||
        (leadData.name ? leadData.name.split(" ").slice(1).join(" ") : "");
      const finalName =
        leadData.name || `${finalFirstName} ${finalLastName}`.trim();

      // Combine first name and last name for the name field if needed
      const fullName = `${firstName} ${lastName}`.trim();

      // Note: Database schema uses different column structure than expected
      // Available columns: id, email, tenant_id, first_name, last_name, phone, source, status, notes, etc.

      console.log("🔍🔍 About to insert lead with values:");
      console.log("  tenantId:", tenantId);
      console.log("  finalLeadTypeId:", finalLeadTypeId);
      console.log("  finalFirstName:", finalFirstName);
      console.log("  finalLastName:", finalLastName);
      console.log("  finalName:", finalName);
      console.log("  email:", email);

      // Auto-assign lead if userId not provided
      let finalUserId = userId;
      if (!finalUserId && tenantId) {
        // Get role ID from lead type if available (for role-based assignment)
        const [leadType] = leadData.leadTypeId 
          ? await sql`SELECT id, preferred_role_id FROM lead_types WHERE id = ${leadData.leadTypeId} AND tenant_id = ${tenantId}`
          : [null];
        
        const preferredRoleId = leadType?.preferred_role_id || null;
        finalUserId = await this.autoAssignLead(tenantId, finalLeadTypeId, preferredRoleId);
      }

      // Handle type_specific_data - ensure it's a JSON object, not a string
      // postgres.js automatically converts JavaScript objects to JSONB
      let typeSpecificDataJson: any = null;
      if (typeSpecificData) {
        if (typeof typeSpecificData === 'string') {
          // If it's already a string, try to parse it
          try {
            typeSpecificDataJson = JSON.parse(typeSpecificData);
          } catch (e) {
            // If parsing fails, use null
            console.warn("Failed to parse typeSpecificData string:", e);
            typeSpecificDataJson = null;
          }
        } else {
          // If it's already an object, use it directly
          typeSpecificDataJson = typeSpecificData;
        }
      }

      const [lead] = await sql`
        INSERT INTO leads (tenant_id, lead_type_id, first_name, last_name, name, email,phone,source,status,notes,budget_range,priority,country,state,city,type_specific_data,assigned_user_id,created_by)
        VALUES (${tenantId}, ${finalLeadTypeId}, ${finalFirstName}, ${finalLastName}, ${finalName}, ${email || ""}, ${phone || null}, ${source || null}, ${status || "new"}, ${notes || null}, ${budgetRange || null}, ${priority || "medium"}, ${country || null}, ${state || null},${city || null},${typeSpecificDataJson}, ${finalUserId || null}, ${userId || null})
        RETURNING 
          id,
          tenant_id as "tenantId",
          lead_type_id as "leadTypeId",
          first_name as "firstName",
          last_name as "lastName",
          name,
          email,
          phone,
          source,
          status,
          type_specific_data as "typeSpecificData",
          notes,
          budget_range as "budgetRange",
          priority,
          country,
          state,
          city,
          assigned_user_id as "assignedUserId",
          created_by as "createdBy",
          created_at as "createdAt"
      `;

      console.log("🔍 Lead created successfully:", lead.id);

      await this.saveLeadActivity({
        tenant_id: lead.tenantId,
        lead_id: lead.id,
        user_id: userId, // or the real user ID
        activity_type: 1, // assuming 'LEAD_CREATED' maps to 1
        activity_title: `Lead Created ${lead.firstName} ${lead.lastName}`,
        activity_description: `Summary : ${tenantId}, ${finalLeadTypeId}, ${finalFirstName}, ${finalLastName}, ${finalName}, ${email || ""}, ${phone || null}, ${source || null}, ${status || "new"}, ${notes || null}, ${budgetRange || null}, ${priority || "medium"}, ${country || null}, ${state || null}, ${city || null}`,
        activity_status: 1,
      });

      // Handle dynamic field data if provided
      if (
        leadData.dynamicData &&
        Object.keys(leadData.dynamicData).length > 0
      ) {
        console.log("🔍 Processing dynamic field data:", leadData.dynamicData);

        for (const [fieldName, fieldValue] of Object.entries(
          leadData.dynamicData,
        )) {
          if (
            fieldValue !== null &&
            fieldValue !== undefined &&
            fieldValue !== ""
          ) {
            try {
              // Find the dynamic field by name for this tenant
              const [dynamicField] = await sql`
                SELECT id FROM dynamic_fields 
                WHERE tenant_id = ${tenantId} AND field_name = ${fieldName} AND show_in_leads = true
              `;

              if (dynamicField) {
                await sql`
                  INSERT INTO dynamic_field_values (field_id, lead_id, field_value)
                  VALUES (${dynamicField.id}, ${lead.id}, ${String(fieldValue)})
                  ON CONFLICT (field_id, lead_id) 
                  DO UPDATE SET field_value = EXCLUDED.field_value, updated_at = NOW()
                `;
                console.log(
                  `🔍 Saved dynamic field value: ${fieldName} = ${fieldValue}`,
                );
              }
            } catch (error) {
              console.error(
                `❌ Error saving dynamic field ${fieldName}:`,
                error,
              );
            }
          }
        }
      }

      // Calculate lead score and priority using the scoring engine
      const score = LeadScoringEngine.calculateScore(lead);
      const calculatedPriority = LeadScoringEngine.calculatePriority(score);

      return {
        ...lead,
        score,
        priority: calculatedPriority,
        dynamicData: leadData.dynamicData || {},
      };
    } catch (error) {
      console.error("❌ Error in createLead:", error);
      throw error;
    }
  }

  async getLeadById(leadId: number, tenantId: number) {
    try {
      // Validate inputs
      const validLeadId = parseInt(String(leadId), 10);
      const validTenantId = parseInt(String(tenantId), 10);

      if (isNaN(validLeadId) || isNaN(validTenantId)) {
        console.error("🔍 Invalid leadId or tenantId:", { leadId, tenantId, validLeadId, validTenantId });
        return null;
      }

      console.log("🔍 SimpleStorage.getLeadById called with:", {
        leadId: validLeadId,
        tenantId: validTenantId,
      });

      const leadResults = await sql`
        SELECT 
          l.id,
          l.tenant_id as "tenantId",
          l.lead_type_id as "leadTypeId",
          l.first_name as "firstName",
          l.last_name as "lastName",
          l.name,
          l.email,
          l.phone,
          l.source,
          l.status,
          l.type_specific_data as "typeSpecificData",
          l.notes,
          l.budget_range as "budgetRange",
          l.priority,
          l.country,
          l.state,
          l.city,
          l.converted_to_customer_id as "convertedToCustomerId",
          l.score,
          l.last_contact_date as "lastContactDate",
          l.email_opens as "emailOpens",
          l.email_clicks as "emailClicks",
          l.website_visits as "websiteVisits",
          l.created_at as "createdAt",
          l.updated_at as "updatedAt",
          lt.name as "leadTypeName",
          lt.icon as "leadTypeIcon",
          lt.color as "leadTypeColor"
        FROM leads l
        LEFT JOIN lead_types lt ON l.lead_type_id = lt.id
        WHERE l.id = ${validLeadId} AND l.tenant_id = ${validTenantId}
      `;

      if (leadResults.length === 0) {
        return null;
      }

      const lead = leadResults[0];

      // Fetch dynamic field data
      const dynamicFieldValues = await sql`
        SELECT 
          df.field_name,
          dfv.field_value
        FROM dynamic_field_values dfv
        JOIN dynamic_fields df ON dfv.field_id = df.id
        WHERE dfv.lead_id = ${validLeadId} AND df.tenant_id = ${validTenantId} AND df.show_in_leads = true
      `;

      const dynamicData: Record<string, any> = {};
      dynamicFieldValues.forEach((field: any) => {
        dynamicData[field.field_name] = field.field_value;
      });

      return {
        ...lead,
        dynamicData: dynamicData,
      };
    } catch (error: any) {
      console.error("🔍 Error getting lead by ID:", error);
      throw error;
    }
  }

  async updateLead(leadId: number, tenantId: number, leadData: any) {
    console.log("🔍 SimpleStorage.updateLead called with:", {
      leadId,
      leadData,
    });

    // First get the existing lead data
    const [existingLead] = await sql`
      SELECT * FROM leads WHERE id = ${leadId}
    `;

    console.log(
      "🔍 Existing lead found:",
      existingLead ? `ID ${existingLead.id}` : "Not found",
    );

    if (!existingLead) {
      throw new Error("Lead not found");
    }

    // Merge existing data with updates, only updating provided fields
    const updates = {
      leadTypeId:
        leadData.leadTypeId !== undefined
          ? leadData.leadTypeId
          : existingLead.lead_type_id,
      firstName:
        leadData.firstName !== undefined
          ? leadData.firstName
          : existingLead.first_name,
      lastName:
        leadData.lastName !== undefined
          ? leadData.lastName
          : existingLead.last_name,
      email: leadData.email !== undefined ? leadData.email : existingLead.email,
      phone: leadData.phone !== undefined ? leadData.phone : existingLead.phone,
      source:
        leadData.source !== undefined ? leadData.source : existingLead.source,
      status:
        leadData.status !== undefined ? leadData.status : existingLead.status,
      typeSpecificData:
        leadData.typeSpecificData !== undefined
          ? leadData.typeSpecificData
          : existingLead.type_specific_data,
      notes: leadData.notes !== undefined ? leadData.notes : existingLead.notes,
      budgetRange:
        leadData.budgetRange !== undefined
          ? leadData.budgetRange
          : existingLead.budget_range,
      priority:
        leadData.priority !== undefined
          ? leadData.priority
          : existingLead.priority,
      country:
        leadData.country !== undefined
          ? leadData.country
          : existingLead.country,
      state: leadData.state !== undefined ? leadData.state : existingLead.state,
      city: leadData.city !== undefined ? leadData.city : existingLead.city,
    };

    console.log("🔍 About to UPDATE with values:", updates);

    const [lead] = await sql`
      UPDATE leads 
      SET lead_type_id = ${updates.leadTypeId}, first_name = ${updates.firstName}, 
          last_name = ${updates.lastName}, email = ${updates.email}, 
          phone = ${updates.phone || null}, source = ${updates.source || null}, 
          status = ${updates.status}, 
          type_specific_data = ${updates.typeSpecificData ? JSON.stringify(updates.typeSpecificData) : null},
          notes = ${updates.notes || null}, budget_range = ${updates.budgetRange || null},
          priority = ${updates.priority}, country = ${updates.country || null}, 
          state = ${updates.state || null}, city = ${updates.city || null},
          updated_by = ${userId || null},
          updated_at = NOW()
      WHERE id = ${leadId}
      RETURNING 
        id,
        tenant_id as "tenantId",
        lead_type_id as "leadTypeId",
        first_name as "firstName",
        last_name as "lastName",
        email,
        phone,
        source,
        status,
        type_specific_data as "typeSpecificData",
        notes,
        budget_range as "budgetRange",
        priority,
        country,
        state,
        city,
        created_by as "createdBy",
        updated_by as "updatedBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    console.log("🔍 UPDATE SQL executed, result:", lead);

    // 🎯 AUTOMATIC CUSTOMER CREATION: Check if lead status changed to "closed_won"
    if (
      updates.status === "closed_won" &&
      existingLead.status !== "closed_won" &&
      !existingLead.converted_to_customer_id
    ) {
      console.log(
        "🎯 Lead status changed to 'closed_won' - creating customer automatically",
      );

      try {
        // Create customer from lead data
        const customerData = {
          tenantId: existingLead.tenant_id,
          name: `${updates.firstName} ${updates.lastName}`.trim(),
          email: updates.email,
          phone: updates.phone,
          address: null,
          city: updates.city,
          country: updates.country,
          state: updates.state,
          customerType: "individual",
          notes: updates.notes,
          crmStatus: "closed-won",
          lastActivity: new Date().toISOString(),
          totalValue: 0,
          tags: [],
          company: null,
        };

        const newCustomer = await this.createCustomer(customerData);
        console.log("🎯 ✅ Customer created successfully:", newCustomer.id);

        // Update the lead with the customer reference
        await sql`
          UPDATE leads 
          SET converted_to_customer_id = ${newCustomer.id}
          WHERE id = ${leadId}
        `;
        console.log("🎯 ✅ Lead updated with customer reference");

        // Update the returned lead object to include the customer reference
        lead.convertedToCustomerId = newCustomer.id;
      } catch (error) {
        console.error("🎯 ❌ Error creating customer from lead:", error);
        // Don't throw error - lead update should still succeed even if customer creation fails
      }
    }

    // Handle dynamic field data if provided
    if (leadData.dynamicData && Object.keys(leadData.dynamicData).length > 0) {
      console.log(
        "🔍 Processing dynamic field data for update:",
        leadData.dynamicData,
      );

      for (const [fieldName, fieldValue] of Object.entries(
        leadData.dynamicData,
      )) {
        try {
          // Find the dynamic field by name for this tenant
          const [dynamicField] = await sql`
            SELECT id FROM dynamic_fields 
            WHERE tenant_id = ${existingLead.tenant_id} AND field_name = ${fieldName} AND show_in_leads = true
          `;

          if (dynamicField) {
            if (
              fieldValue !== null &&
              fieldValue !== undefined &&
              fieldValue !== ""
            ) {
              await sql`
                INSERT INTO dynamic_field_values (field_id, lead_id, field_value)
                VALUES (${dynamicField.id}, ${leadId}, ${String(fieldValue)})
                ON CONFLICT (field_id, lead_id) 
                DO UPDATE SET field_value = EXCLUDED.field_value, updated_at = NOW()
              `;
              console.log(
                `🔍 Updated dynamic field value: ${fieldName} = ${fieldValue}`,
              );
            } else {
              // Remove empty values
              await sql`
                DELETE FROM dynamic_field_values 
                WHERE field_id = ${dynamicField.id} AND lead_id = ${leadId}
              `;
              console.log(`🔍 Removed empty dynamic field value: ${fieldName}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error updating dynamic field ${fieldName}:`, error);
        }
      }
    }

    // Calculate lead score and priority using the scoring engine
    const score = LeadScoringEngine.calculateScore(lead);
    const calculatedPriority = LeadScoringEngine.calculatePriority(score);

    return {
      ...lead,
      score,
      priority: calculatedPriority,
      dynamicData: leadData.dynamicData || {},
    };
  }

  // Lead Types management
  // Role Management Methods
  async createRole(roleData: any) {
    try {
      // Calculate hierarchy level based on parent role
      let hierarchyLevel = roleData.hierarchyLevel;
      if (roleData.parentRoleId && hierarchyLevel === undefined) {
        const [parentRole] = await sql`
          SELECT hierarchy_level FROM roles 
          WHERE id = ${roleData.parentRoleId} AND tenant_id = ${roleData.tenantId}
        `;
        if (parentRole) {
          hierarchyLevel = (parentRole.hierarchy_level ?? 0) + 1;
        } else {
          hierarchyLevel = 0;
        }
      } else if (hierarchyLevel === undefined) {
        hierarchyLevel = 0;
      }

      const [role] = await sql`
        INSERT INTO roles (
          tenant_id, name, description, permissions, 
          parent_role_id, hierarchy_level, is_active, is_default, created_at, updated_at
        )
        VALUES (
          ${roleData.tenantId},
          ${roleData.name},
          ${roleData.description || null},
          ${JSON.stringify(roleData.permissions)},
          ${roleData.parentRoleId || null},
          ${hierarchyLevel},
          ${roleData.isActive !== false},
          ${roleData.isDefault || false},
          NOW(),
          NOW()
        )
        RETURNING *
      `;
      
      // Parse permissions if stored as string
      if (role && typeof role.permissions === 'string') {
        try {
          role.permissions = JSON.parse(role.permissions);
        } catch (e) {
          console.error(`Error parsing permissions for new role:`, e);
          role.permissions = {};
        }
      }
      
      return role;
    } catch (error) {
      console.error("Error creating role:", error);
      throw error;
    }
  }

  async getRolesByTenant(tenantId: number) {
    const roles = await sql`
      SELECT 
        r.id,
        r.tenant_id as "tenantId",
        r.name,
        r.description,
        r.permissions,
        r.is_active as "isActive",
        r.is_default as "isDefault",
        r.parent_role_id as "parentRoleId",
        r.hierarchy_level as "hierarchyLevel",
        r.created_at as "createdAt",
        r.updated_at as "updatedAt",
        parent.name as "parentRoleName"
      FROM roles r
      LEFT JOIN roles parent ON r.parent_role_id = parent.id
      WHERE r.tenant_id = ${tenantId} AND (r.is_active = true OR r.is_default = true)
      ORDER BY COALESCE(r.hierarchy_level, 999), r.name
    `;
    
    // Parse permissions if they're stored as JSON strings
    return roles.map((role: any) => {
      if (typeof role.permissions === 'string') {
        try {
          role.permissions = JSON.parse(role.permissions);
        } catch (e) {
          console.error(`Error parsing permissions for role ${role.id}:`, e);
          role.permissions = {};
        }
      }
      return role;
    });
  }

  // Get role hierarchy tree (role + all child roles recursively)
  async getRoleHierarchy(roleId: number, tenantId: number): Promise<number[]> {
    try {
      const allChildRoleIds: number[] = [];
      const processed = new Set<number>();

      const getChildRolesRecursive = async (currentRoleId: number) => {
        if (processed.has(currentRoleId)) return;
        processed.add(currentRoleId);

        const childRoles = await sql`
          SELECT id FROM roles 
          WHERE parent_role_id = ${currentRoleId} 
            AND tenant_id = ${tenantId} 
            AND is_active = true
        `;
        
        for (const child of childRoles) {
          const childId = Number(child.id);
          if (!isNaN(childId) && !allChildRoleIds.includes(childId)) {
            allChildRoleIds.push(childId);
            await getChildRolesRecursive(childId); // Recursively get their children
          }
        }
      };

      await getChildRolesRecursive(roleId);
      return allChildRoleIds;
    } catch (error) {
      console.error("Error getting role hierarchy:", error);
      throw error;
    }
  }

  // Get all user IDs by role hierarchy (users with current role + all child roles)
  async getUsersByRoleHierarchy(roleId: number, tenantId: number): Promise<number[]> {
    try {
      // Get current role + all child role IDs recursively
      const childRoleIds = await this.getRoleHierarchy(roleId, tenantId);
      const allRoleIds = [roleId, ...childRoleIds];

      console.log(`🔍 Getting users for role hierarchy: roleId=${roleId}, childRoles=${childRoleIds.length}, totalRoles=${allRoleIds.length}`);

      // Ensure all role IDs are integers
      const roleIdsAsInts = allRoleIds.map(id => Number(id)).filter(id => !isNaN(id));
      
      if (roleIdsAsInts.length === 0) {
        console.log("⚠️ No valid role IDs found");
        return [];
      }

      // Get all active users with these role IDs
      // PostgreSQL requires explicit integer array type casting
      // Construct array literal with explicit ::int[] cast
      const roleIdsString = roleIdsAsInts.join(', ');
      const users = await sql.unsafe(`
        SELECT id FROM users
        WHERE role_id = ANY(ARRAY[${roleIdsString}]::int[])
          AND tenant_id = ${tenantId}
          AND is_active = true
      `);

      const userIds = users.map((u: any) => u.id);
      console.log(`✅ Found ${userIds.length} users in role hierarchy`);
      
      return userIds;
    } catch (error) {
      console.error("Error getting users by role hierarchy:", error);
      throw error;
    }
  }

  // Get all roles that can be parent roles (roles higher in hierarchy)
  async getAvailableParentRoles(roleId: number | null, tenantId: number) {
    try {
      console.log(`🔍 getAvailableParentRoles called - roleId: ${roleId}, tenantId: ${tenantId}`);
      
      let query = sql`
        SELECT id, name, hierarchy_level, parent_role_id, is_default, is_active
        FROM roles 
        WHERE tenant_id = ${tenantId} 
          AND (is_active = true OR is_default = true)
      `;

      // If editing existing role, exclude itself and its descendants
      if (roleId) {
        const descendantRoleIds = await this.getRoleHierarchy(roleId, tenantId);
        const excludeIds = [roleId, ...descendantRoleIds];
        console.log(`🔍 Excluding role IDs:`, excludeIds);
        query = sql`
          SELECT id, name, hierarchy_level, parent_role_id, is_default, is_active
          FROM roles 
          WHERE tenant_id = ${tenantId} 
            AND (is_active = true OR is_default = true)
            AND id != ALL(${sql.array(excludeIds)})
        `;
      }

      const roles = await query;
      console.log(`🔍 Found ${roles.length} available parent roles:`, roles.map((r: any) => ({ id: r.id, name: r.name, is_default: r.is_default, is_active: r.is_active })));
      
      const sorted = roles.sort((a: any, b: any) => {
        // Sort by hierarchy level, but Owner role (is_default) should be first
        if (a.is_default) return -1;
        if (b.is_default) return 1;
        return (a.hierarchy_level ?? 999) - (b.hierarchy_level ?? 999);
      });
      
      console.log(`🔍 Sorted roles (Owner first):`, sorted.map((r: any) => r.name));
      return sorted;
    } catch (error) {
      console.error("Error getting available parent roles:", error);
      throw error;
    }
  }

  async getRoleById(roleId: number, tenantId: number) {
    const [role] = await sql`
      SELECT 
        r.*,
        r.parent_role_id as "parentRoleId",
        r.hierarchy_level as "hierarchyLevel",
        parent.name as "parentRoleName"
      FROM roles r
      LEFT JOIN roles parent ON r.parent_role_id = parent.id
      WHERE r.id = ${roleId} AND r.tenant_id = ${tenantId}
    `;
    return role;
  }

  async updateRole(roleId: number, roleData: any) {
    try {
      // Calculate hierarchy level if parent role changed
      let hierarchyLevel = roleData.hierarchyLevel;
      if (roleData.parentRoleId !== undefined && hierarchyLevel === undefined) {
        if (roleData.parentRoleId) {
          const [parentRole] = await sql`
            SELECT hierarchy_level FROM roles 
            WHERE id = ${roleData.parentRoleId}
          `;
          if (parentRole) {
            hierarchyLevel = (parentRole.hierarchy_level ?? 0) + 1;
          }
        } else {
          // No parent, set to 0 or keep existing
          const [currentRole] = await sql`
            SELECT hierarchy_level FROM roles WHERE id = ${roleId}
          `;
          hierarchyLevel = currentRole?.hierarchy_level ?? 0;
        }
      }

      const [role] = await sql`
        UPDATE roles 
        SET 
          name = COALESCE(${roleData.name}, name),
          description = ${roleData.description !== undefined ? (roleData.description || null) : sql`description`},
          permissions = ${roleData.permissions !== undefined ? JSON.stringify(roleData.permissions) : sql`permissions`},
          parent_role_id = ${roleData.parentRoleId !== undefined ? (roleData.parentRoleId || null) : sql`parent_role_id`},
          hierarchy_level = ${hierarchyLevel !== undefined ? hierarchyLevel : sql`hierarchy_level`},
          is_active = ${roleData.isActive !== undefined ? (roleData.isActive !== false) : sql`is_active`},
          updated_at = NOW()
        WHERE id = ${roleId}
        RETURNING *
      `;
      
      // Parse permissions if stored as string
      if (role && typeof role.permissions === 'string') {
        try {
          role.permissions = JSON.parse(role.permissions);
        } catch (e) {
          console.error(`Error parsing permissions for updated role ${roleId}:`, e);
          role.permissions = {};
        }
      }
      
      return role;
    } catch (error) {
      console.error("Error updating role:", error);
      throw error;
    }
  }

  async deleteRole(roleId: number) {
    await sql`UPDATE roles SET is_active = false WHERE id = ${roleId}`;
    // Also update users to remove this role
    await sql`UPDATE users SET role_id = NULL WHERE role_id = ${roleId}`;
  }

  // User Management Methods (Enhanced for tenant users)
  async createTenantUser(userData: any) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const [user] = await sql`
      INSERT INTO users (
        email, password, role, tenant_id, role_id, reporting_user_id, first_name, last_name, 
        phone, is_active, is_email_verified, password_reset_required
      )
      VALUES (
        ${userData.email}, ${hashedPassword}, 'tenant_user', ${userData.tenantId}, 
        ${userData.roleId}, ${userData.reportingUserId || null}, ${userData.firstName}, ${userData.lastName}, 
        ${userData.phone || null}, ${userData.isActive !== false}, false, true
      )
      RETURNING id, email, role, tenant_id as "tenantId", role_id as "roleId", 
               reporting_user_id as "reportingUserId",
               first_name as "firstName", last_name as "lastName", phone, 
               is_active as "isActive", is_email_verified as "isEmailVerified",
               password_reset_required as "passwordResetRequired", 
               created_at as "createdAt"
    `;
    return user;
  }

  async getTenantUsers(tenantId: number) {
    const users = await sql`
      SELECT 
        u.id, u.email, u.role, u.tenant_id as "tenantId", u.role_id as "roleId",
        u.reporting_user_id as "reportingUserId",
        u.first_name as "firstName", u.last_name as "lastName", u.phone,
        u.is_active as "isActive", u.is_email_verified as "isEmailVerified",
        u.last_login_at as "lastLoginAt", u.created_at as "createdAt",
        r.name as "roleName",
        reportingUser.first_name || ' ' || reportingUser.last_name as "reportingUserName"
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN users reportingUser ON u.reporting_user_id = reportingUser.id
      WHERE u.tenant_id = ${tenantId} AND u.is_active = true
      ORDER BY u.created_at DESC
    `;
    return users;
  }

  async updateTenantUser(userId: number, userData: any) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (userData.firstName !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(userData.firstName);
    }
    if (userData.lastName !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(userData.lastName);
    }
    if (userData.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(userData.email);
    }
    if (userData.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(userData.phone);
    }
    if (userData.roleId !== undefined) {
      updates.push(`role_id = $${paramIndex++}`);
      values.push(userData.roleId);
    }
    if (userData.reportingUserId !== undefined) {
      updates.push(`reporting_user_id = $${paramIndex++}`);
      values.push(userData.reportingUserId);
    }
    if (userData.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(userData.isActive);
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, email, role, tenant_id as "tenantId", role_id as "roleId",
               reporting_user_id as "reportingUserId",
               first_name as "firstName", last_name as "lastName", phone,
               is_active as "isActive", is_email_verified as "isEmailVerified",
               updated_at as "updatedAt"
    `;

    const [user] = await sql.unsafe(query, values);
    return user;
  }

  async getUserWithRole(userId: number) {
    const [user] = await sql`
      SELECT 
        u.*, r.name as "roleName", r.permissions as "rolePermissions"
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${userId}
    `;
    return user;
  }

  async checkUserPermission(
    userId: number,
    page: string,
    action: string,
  ): Promise<boolean> {
    const user = await this.getUserWithRole(userId);

    if (!user) return false;

    // Tenant admins have all permissions
    if (user.role === "tenant_admin") return true;

    // Check role-based permissions
    if (user.rolePermissions && user.rolePermissions[page]) {
      return user.rolePermissions[page].includes(action);
    }

    return false;
  }

  // Generate random password for new users
  generateRandomPassword(length: number = 12): string {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  async getLeadTypesByTenant(tenantId: number) {
    try {
      console.log(
        "🔍 SimpleStorage - getLeadTypesByTenant called with tenantId:",
        tenantId,
      );
      const leadTypes = await sql`
        SELECT 
          id,
          tenant_id as "tenantId",
          name,
          description,
          icon,
          color,
          is_active as "isActive",
          lead_type_category,
          display_order as "displayOrder",
          created_at as "createdAt"
        FROM lead_types 
        WHERE tenant_id = ${tenantId} AND is_active = true
        ORDER BY display_order ASC, created_at ASC
      `;
      console.log(
        "🔍 SimpleStorage - Lead types query successful. Found:",
        leadTypes.length,
      );
      return leadTypes;
    } catch (error) {
      console.error("🔍 SimpleStorage - Error in getLeadTypesByTenant:", error);
      throw error;
    }
  }

  async createLeadType(leadTypeData: any) {
    try {
      console.log(
        "🔍 SimpleStorage - createLeadType called with data:",
        leadTypeData,
      );
      const {
        tenantId,
        name,
        description,
        icon,
        color,
        isActive,
        displayOrder,
        lead_type_category,
      } = leadTypeData;

      const [leadType] = await sql`
        INSERT INTO lead_types (
          tenant_id, name, description, icon, color, is_active, display_order , lead_type_category
        )
        VALUES (
          ${tenantId}, ${name}, ${description || null}, ${icon || null}, 
          ${color || "#3B82F6"}, ${isActive !== false}, ${displayOrder || 0} , ${lead_type_category || 0}
        )
        RETURNING 
          id,
          tenant_id as "tenantId",
          name,
          description,
          lead_type_category,
          icon,
          color,
          is_active as "isActive",
          display_order as "displayOrder",
          created_at as "createdAt"
      `;
      console.log(
        "🔍 SimpleStorage - Lead type created successfully:",
        leadType,
      );
      return leadType;
    } catch (error) {
      console.error("🔍 SimpleStorage - Error in createLeadType:", error);
      throw error;
    }
  }

  async updateLeadType(leadTypeId: number, leadTypeData: any) {
    try {
      console.log(
        "🔍 SimpleStorage - updateLeadType called with ID:",
        leadTypeId,
        "and data:",
        leadTypeData,
      );
      const {
        name,
        description,
        icon,
        color,
        isActive,
        displayOrder,
        lead_type_category,
      } = leadTypeData;

      const [leadType] = await sql`
        UPDATE lead_types 
        SET name = ${name}, description = ${description}, icon = ${icon}, 
            color = ${color}, is_active = ${isActive}, display_order = ${displayOrder},  lead_type_category=${lead_type_category}   
        WHERE id = ${leadTypeId}
        RETURNING 
          id,
          tenant_id as "tenantId",
          name,
          description,
          icon,
          color,
          lead_type_category,
          is_active as "isActive",
          display_order as "displayOrder",
          created_at as "createdAt"
      `;
      console.log(
        "🔍 SimpleStorage - Lead type updated successfully:",
        leadType,
      );
      return leadType;
    } catch (error) {
      console.error("🔍 SimpleStorage - Error in updateLeadType:", error);
      throw error;
    }
  }
  async deleteLeadType(leadTypeId: number) {
    try {
      console.log(
        "🔍 SimpleStorage - deleteLeadType called with ID:",
        leadTypeId,
      );
      await sql`UPDATE lead_types SET is_active = false WHERE id = ${leadTypeId}`;
      console.log("🔍 SimpleStorage - Lead type deleted successfully");
    } catch (error) {
      console.error("🔍 SimpleStorage - Error in deleteLeadType:", error);
      throw error;
    }
  }

  // Lead Type Fields management
  async getLeadTypeFieldsByLeadType(leadTypeId: number) {
    // const fields = await sql`
    //   SELECT
    //     id,
    //     lead_type_id as "leadTypeId",
    //     field_name as "fieldName",
    //     field_label as "fieldLabel",
    //     field_type as "fieldType",
    //     field_options as "fieldOptions",
    //     is_required as "isRequired",
    //     display_order as "displayOrder",
    //     validation_rules as "validationRules",
    //     placeholder,
    //     help_text as "helpText",
    //     is_active as "isActive",
    //     created_at as "createdAt"
    //   FROM lead_type_fields
    //   WHERE lead_type_id = ${leadTypeId} AND is_active = true
    //   ORDER BY display_order ASC, created_at ASC
    // `;
    // return fields;
    // Step 1: Get lead_type_category from lead_types table
    const [leadType] = await sql`
      SELECT lead_type_category
      FROM lead_types
      WHERE id = ${leadTypeId}
      LIMIT 1
    `;

    if (!leadType) {
      throw new Error("Invalid leadTypeId — no matching lead type found");
    }

    const leadTypeCategory = leadType.lead_type_category;

    // Step 2: If category = 1, return static predefined fields (e.g. Flight/Travel)
    if (leadTypeCategory === 1) {
      return [
        {
          id: 1,
          leadTypeId,
          fieldName: "sourceCity",
          fieldLabel: "From City",
          fieldType: "text",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 1,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 2,
          leadTypeId,
          fieldName: "destinationCity",
          fieldLabel: "To City",
          fieldType: "text",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 2,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 3,
          leadTypeId,
          fieldName: "departureDate",
          fieldLabel: "Departure Date",
          fieldType: "date",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 3,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 4,
          leadTypeId,
          fieldName: "returnDate",
          fieldLabel: "Return Date",
          fieldType: "date",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 4,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 5,
          leadTypeId,
          fieldName: "flightClass",
          fieldLabel: "Class",
          fieldType: "select",
          fieldOptions: [
            "Economy",
            "Premium Economy",
            "Business",
            "First Class",
          ],
          isRequired: false,
          displayOrder: 5,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 6,
          leadTypeId,
          fieldName: "flightType",
          fieldLabel: "Flight Type",
          fieldType: "select",
          fieldOptions: ["One Way", "Round Trip", "Multi-City"],
          isRequired: false,
          displayOrder: 6,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 7,
          leadTypeId,
          fieldName: "passengers",
          fieldLabel: "Number of Passengers",
          fieldType: "number",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 7,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: new Date(),
        },
      ];
    } else if (leadTypeCategory === 2) {
      return [
        {
          id: 8,
          leadTypeId,
          fieldName: "destination",
          fieldLabel: "City",
          fieldType: "text",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 1,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:48.483707",
        },
        {
          id: 9,
          leadTypeId,
          fieldName: "checkInDate",
          fieldLabel: "Check-in Date",
          fieldType: "date",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 2,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:48.483707",
        },
        {
          id: 10,
          leadTypeId,
          fieldName: "checkOutDate",
          fieldLabel: "Check-out Date",
          fieldType: "date",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 3,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:48.483707",
        },
        {
          id: 11,
          leadTypeId,
          fieldName: "roomType",
          fieldLabel: "Room Type",
          fieldType: "select",
          fieldOptions: ["Standard", "Deluxe", "Suite", "Presidential Suite"],
          isRequired: false,
          displayOrder: 4,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:48.483707",
        },
        {
          id: 12,
          leadTypeId,
          fieldName: "preferredHotel",
          fieldLabel: "Preffered Hotels",
          fieldType: "number",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 5,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:48.483707",
        },
        // {
        //   id: 12,
        //   leadTypeId,
        //   fieldName: "guests",
        //   fieldLabel: "Number of Guests",
        //   fieldType: "number",
        //   fieldOptions: null,
        //   isRequired: false,
        //   displayOrder: 5,
        //   validationRules: null,
        //   placeholder: null,
        //   helpText: null,
        //   isActive: true,
        //   createdAt: "2025-11-05 13:34:48.483707",
        // },
        {
          id: 12,
          leadTypeId,
          fieldName: "adults",
          fieldLabel: "Number of Adults",
          fieldType: "number",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 5,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:48.483707",
        },
        {
          id: 14,
          leadTypeId,
          fieldName: "children",
          fieldLabel: "Number of Childrens",
          fieldType: "number",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 5,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:48.483707",
        },
        {
          id: 13,
          leadTypeId,
          fieldName: "rooms",
          fieldLabel: "Number of Rooms",
          fieldType: "number",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 6,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:48.483707",
        },
      ];
    } else if (leadTypeCategory === 3) {
      return [
        {
          id: 14,
          leadTypeId,
          fieldName: "destination",
          fieldLabel: "Destination",
          fieldType: "text",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 1,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:53.158235",
        },
        {
          id: 15,
          leadTypeId,
          fieldName: "travelDate",
          fieldLabel: "Travel Date",
          fieldType: "date",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 2,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:53.158235",
        },
        {
          id: 16,
          leadTypeId,
          fieldName: "duration",
          fieldLabel: "Duration (Days)",
          fieldType: "number",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 3,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:53.158235",
        },
        // {
        //   id: 17,
        //   leadTypeId,
        //   fieldName: "package_type",
        //   fieldLabel: "Package Type",
        //   fieldType: "select",
        //   fieldOptions: ["Budget", "Standard", "Luxury", "Premium"],
        //   isRequired: false,
        //   displayOrder: 4,
        //   validationRules: null,
        //   placeholder: null,
        //   helpText: null,
        //   isActive: true,
        //   createdAt: "2025-11-05 13:34:53.158235",
        // },
        {
          id: 17,
          leadTypeId,
          fieldName: "packageType",
          fieldLabel: "Packages",
          fieldType: "select",
          fieldOptions: ["Budget", "Standard", "Luxury", "Premium"],
          isRequired: false,
          displayOrder: 4,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:53.158235",
        },
        {
          id: 18,
          leadTypeId,
          fieldName: "travelers",
          fieldLabel: "Number of Travelers",
          fieldType: "number",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 5,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:53.158235",
        },
      ];
    } else if (leadTypeCategory === 4) {
      return [
        {
          id: 19,
          leadTypeId,
          fieldName: "pickup_city",
          fieldLabel: "Pickup City",
          fieldType: "text",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 1,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:56.99652",
        },
        {
          id: 20,
          leadTypeId,
          fieldName: "dropoff_city",
          fieldLabel: "Drop-off City",
          fieldType: "text",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 2,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:56.99652",
        },
        {
          id: 21,
          leadTypeId: 88,
          fieldName: "pickup_date",
          fieldLabel: "Pickup Date",
          fieldType: "date",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 3,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:56.99652",
        },
        {
          id: 22,
          leadTypeId: 88,
          fieldName: "dropoff_date",
          fieldLabel: "Drop-off Date",
          fieldType: "date",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 4,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:56.99652",
        },
        {
          id: 23,
          leadTypeId: 88,
          fieldName: "car_type",
          fieldLabel: "Car Type",
          fieldType: "select",
          fieldOptions: ["Economy", "Compact", "Mid-Size", "SUV", "Luxury"],
          isRequired: false,
          displayOrder: 5,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:56.99652",
        },
      ];
    } else if (leadTypeCategory === 5) {
      return [
        {
          id: 19,
          leadTypeId: 88,
          fieldName: "pickup_city",
          fieldLabel: "Pickup City",
          fieldType: "text",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 1,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:56.99652",
        },
        {
          id: 20,
          leadTypeId: 88,
          fieldName: "dropoff_city",
          fieldLabel: "Drop-off City",
          fieldType: "text",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 2,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:56.99652",
        },
        {
          id: 21,
          leadTypeId: 88,
          fieldName: "pickup_date",
          fieldLabel: "Pickup Date",
          fieldType: "date",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 3,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:56.99652",
        },
        {
          id: 22,
          leadTypeId: 88,
          fieldName: "dropoff_date",
          fieldLabel: "Drop-off Date",
          fieldType: "date",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 4,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:56.99652",
        },
        {
          id: 23,
          leadTypeId: 88,
          fieldName: "car_type",
          fieldLabel: "Car Type",
          fieldType: "select",
          fieldOptions: ["Economy", "Compact", "Mid-Size", "SUV", "Luxury"],
          isRequired: false,
          displayOrder: 5,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:56.99652",
        },
      ];
    } else if (leadTypeCategory === 6) {
      return [
        {
          id: 24,
          leadTypeId: 89,
          fieldName: "attraction_city",
          fieldLabel: "City",
          fieldType: "text",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 1,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:59.018415",
        },
        {
          id: 25,
          leadTypeId: 89,
          fieldName: "visit_date",
          fieldLabel: "Visit Date",
          fieldType: "date",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 2,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:59.018415",
        },
        {
          id: 26,
          leadTypeId: 89,
          fieldName: "ticket_type",
          fieldLabel: "Ticket Type",
          fieldType: "select",
          fieldOptions: ["Adult", "Child", "Senior", "Family Pass"],
          isRequired: false,
          displayOrder: 3,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:59.018415",
        },
        {
          id: 27,
          leadTypeId: 89,
          fieldName: "tickets",
          fieldLabel: "Number of Tickets",
          fieldType: "number",
          fieldOptions: null,
          isRequired: false,
          displayOrder: 4,
          validationRules: null,
          placeholder: null,
          helpText: null,
          isActive: true,
          createdAt: "2025-11-05 13:34:59.018415",
        },
      ];
    } else {
      return [];
    }
  }

  async createLeadTypeField(fieldData: any) {
    const {
      leadTypeId,
      fieldName,
      fieldLabel,
      fieldType,
      fieldOptions,
      isRequired,
      displayOrder,
      validationRules,
      placeholder,
      helpText,
      isActive,
    } = fieldData;

    const [field] = await sql`
      INSERT INTO lead_type_fields (
        lead_type_id, field_name, field_label, field_type, field_options,
        is_required, display_order, validation_rules, placeholder, help_text, is_active
      )
      VALUES (
        ${leadTypeId}, ${fieldName}, ${fieldLabel}, ${fieldType}, 
        ${fieldOptions ? JSON.stringify(fieldOptions) : null},
        ${isRequired || false}, ${displayOrder || 0}, 
        ${validationRules ? JSON.stringify(validationRules) : null},
        ${placeholder || null}, ${helpText || null}, ${isActive !== false}
      )
      RETURNING 
        id,
        lead_type_id as "leadTypeId",
        field_name as "fieldName",
        field_label as "fieldLabel",
        field_type as "fieldType",
        field_options as "fieldOptions",
        is_required as "isRequired",
        display_order as "displayOrder",
        validation_rules as "validationRules",
        placeholder,
        help_text as "helpText",
        is_active as "isActive",
        created_at as "createdAt"
    `;
    return field;
  }

  async updateLeadTypeField(fieldId: number, fieldData: any) {
    const {
      fieldName,
      fieldLabel,
      fieldType,
      fieldOptions,
      isRequired,
      displayOrder,
      validationRules,
      placeholder,
      helpText,
      isActive,
    } = fieldData;

    const [field] = await sql`
      UPDATE lead_type_fields 
      SET field_name = ${fieldName}, field_label = ${fieldLabel}, 
          field_type = ${fieldType}, 
          field_options = ${fieldOptions ? JSON.stringify(fieldOptions) : null},
          is_required = ${isRequired}, display_order = ${displayOrder}, 
          validation_rules = ${validationRules ? JSON.stringify(validationRules) : null},
          placeholder = ${placeholder}, help_text = ${helpText}, is_active = ${isActive}
      WHERE id = ${fieldId}
      RETURNING 
        id,
        lead_type_id as "leadTypeId",
        field_name as "fieldName",
        field_label as "fieldLabel",
        field_type as "fieldType",
        field_options as "fieldOptions",
        is_required as "isRequired",
        display_order as "displayOrder",
        validation_rules as "validationRules",
        placeholder,
        help_text as "helpText",
        is_active as "isActive",
        created_at as "createdAt"
    `;
    return field;
  }

  async deleteLeadTypeField(fieldId: number) {
    await sql`UPDATE lead_type_fields SET is_active = false WHERE id = ${fieldId}`;
  }

  async deleteLead(leadId: number) {
    await sql`DELETE FROM leads WHERE id = ${leadId}`;
  }

  // Booking management methods
  async createBooking(bookingData: any) {
    try {
      console.log(
        "🔍 SimpleStorage.createBooking - Raw input:",
        JSON.stringify(bookingData, null, 2),
      );

      // Extract and validate required fields using actual database schema
      const tenantId = parseInt(
        bookingData.tenantId || bookingData.tenant_id || 0,
      );
      const customerId = parseInt(
        bookingData.customerId || bookingData.customer_id || 0,
      );
      const leadTypeId = parseInt(
        bookingData.leadTypeId || bookingData.lead_type_id || 0,
      );

      if (!tenantId) throw new Error("tenantId is required");
      if (!customerId) throw new Error("customerId is required");
      if (!leadTypeId) throw new Error("leadTypeId is required");

      console.log(
        "🔍 Processing booking creation for tenant:",
        tenantId,
        "customer:",
        customerId,
        "leadType:",
        leadTypeId,
      );

      // Prepare all fields with safe defaults using correct database column names
      const packageId = bookingData.packageId
        ? parseInt(bookingData.packageId)
        : null;
      const bookingNumber = bookingData.bookingNumber || `BK-${Date.now()}`;
      const travelDate = bookingData.travelDate || null;
      const travelers = parseInt(
        bookingData.travelers || bookingData.numberOfTravelers || 1,
      );
      const totalAmount = parseFloat(bookingData.totalAmount || 0);
      const amountPaid = parseFloat(
        bookingData.amountPaid || bookingData.paidAmount || 0,
      );
      const status = bookingData.status || "pending";
      const paymentStatus = bookingData.paymentStatus || "pending";
      const specialRequests = bookingData.specialRequests || null;
      const vendorId = bookingData.vendorId
        ? parseInt(bookingData.vendorId)
        : null;

      console.log("🔍 Inserting booking with safe values:", {
        tenantId,
        customerId,
        leadTypeId,
        travelers,
        totalAmount,
        amountPaid,
        status,
      });

      const [booking] = await sql`
        INSERT INTO bookings (
          tenant_id, customer_id, lead_type_id, package_id, vendor_id, booking_number, 
          travelers, travel_date, total_amount, amount_paid, status, payment_status, 
          special_requests, created_at, updated_at
        )
        VALUES (
          ${tenantId}, ${customerId}, ${leadTypeId}, ${packageId}, ${vendorId}, ${bookingNumber},
          ${travelers}, ${travelDate}, ${totalAmount}, ${amountPaid}, ${status}, ${paymentStatus},
          ${specialRequests}, NOW(), NOW()
        )
        RETURNING *
      `;

      console.log("🔍 Booking created successfully with ID:", booking.id);

      // Log customer activity for booking creation
      if (bookingData.userId) {
        try {
          await this.createCustomerActivity({
            tenantId,
            customerId,
            userId: bookingData.userId,
            activityType: 11, // Booking Created
            activityTitle: `Booking Created: ${bookingNumber}`,
            activityDescription: `New booking created for ${travelers} traveler(s). Total amount: ${totalAmount}, Amount paid: ${amountPaid}. Status: ${status}`,
            activityStatus: 1,
          });
          console.log(`✅ Customer activity logged for booking ${booking.id}`);
        } catch (activityError) {
          console.error("⚠️ Failed to log booking activity:", activityError);
        }
      }

      // Return booking with camelCase mapping for frontend
      return {
        id: booking.id,
        tenantId: booking.tenant_id,
        customerId: booking.customer_id,
        leadTypeId: booking.lead_type_id,
        packageId: booking.package_id,
        vendorId: booking.vendor_id,
        bookingNumber: booking.booking_number,
        travelers: booking.travelers,
        travelDate: booking.travel_date,
        totalAmount: booking.total_amount,
        amountPaid: booking.amount_paid,
        status: booking.status,
        paymentStatus: booking.payment_status,
        specialRequests: booking.special_requests,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
      };
    } catch (error: any) {
      console.error("🔍 Error creating booking:", error);
      throw error;
    }
  }

  async updateBooking(bookingId: number, bookingData: any) {
    try {
      console.log(
        "🔍 SimpleStorage.updateBooking - Updating booking:",
        bookingId,
      );
      console.log("🔍 Update data:", JSON.stringify(bookingData, null, 2));

      const {
        travelDate,
        travelers,
        numberOfTravelers,
        totalAmount,
        amountPaid,
        paidAmount,
        paymentType,
        status,
        bookingStatus,
        paymentStatus,
        specialRequests,
      } = bookingData;

      // Handle various field name formats
      const finalNumberOfTravelers = numberOfTravelers || travelers;
      const finalAmountPaid = amountPaid || paidAmount;
      const finalBookingStatus = bookingStatus || status;

      const [booking] = await sql`
        UPDATE bookings 
        SET 
          travel_date = COALESCE(${travelDate}, travel_date),
          number_of_travelers = COALESCE(${finalNumberOfTravelers}, number_of_travelers),
          total_amount = COALESCE(${totalAmount}, total_amount),
          amount_paid = COALESCE(${finalAmountPaid}, amount_paid),
          payment_type = COALESCE(${paymentType}, payment_type),
          booking_status = COALESCE(${finalBookingStatus}, booking_status),
          payment_status = COALESCE(${paymentStatus}, payment_status),
          special_requests = COALESCE(${specialRequests}, special_requests),
          updated_at = NOW()
        WHERE id = ${bookingId}
        RETURNING 
          id,
          tenant_id as "tenantId",
          customer_id as "customerId",
          package_id as "packageId",
          booking_number as "bookingNumber",
          travel_date as "travelDate",
          number_of_travelers as "numberOfTravelers",
          total_amount as "totalAmount",
          amount_paid as "amountPaid",
          payment_type as "paymentType",
          booking_status as "bookingStatus",
          payment_status as "paymentStatus",
          special_requests as "specialRequests",
          updated_at as "updatedAt"
      `;

      console.log("🔍 Booking updated successfully:", booking.id);
      return booking;
    } catch (error: any) {
      console.error("🔍 Error updating booking:", error);
      throw error;
    }
  }

  async deleteBooking(bookingId: number) {
    try {
      console.log(
        "🗑️ SimpleStorage.deleteBooking - Deleting booking:",
        bookingId,
      );
      await sql`DELETE FROM bookings WHERE id = ${bookingId}`;
      console.log("✅ Booking deleted successfully:", bookingId);
    } catch (error: any) {
      console.error("❌ Error deleting booking:", error);
      throw error;
    }
  }

  // Convert lead to customer
  async convertLeadToCustomer(leadId: number) {
    try {
      console.log("🔄 Converting lead to customer, leadId:", leadId);

      // Get the lead data
      const leads = await sql`
        SELECT * FROM leads WHERE id = ${leadId}
      `;

      if (leads.length === 0) {
        throw new Error("Lead not found");
      }

      const lead = leads[0] as any;
      console.log("🔍 Lead data:", { name: lead.name, email: lead.email });

      // Check if lead is already converted
      if (lead.converted_to_customer_id) {
        throw new Error("Lead has already been converted to a customer");
      }

      // Create customer from lead data with proper JSON structure
      const preferences = {
        source: lead.source,
        interestedPackages: lead.interested_packages,
        budgetRange: lead.budget_range,
        travelTimeframe: lead.travel_timeframe,
        groupSize: lead.group_size,
        preferredDestinations: lead.preferred_destinations,
      };

      console.log("🔄 About to create customer with data:", {
        tenant_id: lead.tenant_id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        notes: lead.notes,
      });

      const customers = await sql`
        INSERT INTO customers (
          tenant_id,
          name,
          email,
          phone,
          preferences,
          notes,
          crm_status
        ) VALUES (
          ${lead.tenant_id},
          ${lead.name},
          ${lead.email},
          ${lead.phone},
          ${JSON.stringify(preferences)},
          ${lead.notes},
          'new'
        )
        RETURNING *
      `;

      const customer = customers[0];

      // Update lead status and link to customer
      await sql`
        UPDATE leads 
        SET status = 'converted', converted_to_customer_id = ${customer.id}
        WHERE id = ${leadId}
      `;

      return {
        customer: {
          id: customer.id,
          tenantId: customer.tenant_id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          preferences: customer.preferences,
          notes: customer.notes,
          crmStatus: customer.crm_status,
          createdAt: customer.created_at,
        },
        leadId,
        convertedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error converting lead to customer:", error);
      throw error;
    }
  }

  // Travel package management methods
  async getPackagesByTenant(tenantId: number) {
    const packages = await sql`
      SELECT 
        id,
        tenant_id as "tenantId",
        package_type_id as "packageTypeId",
        name,
        description,
        destination,
        duration,
        duration_type as "durationType",
        region,
        country,
        city,
        price,
        max_capacity as "maxCapacity",
        package_staying_image as "packageStayingImage",
        alt_name as "altName",
        vendor_name as "vendorName",
        rating,
        status,
        inclusions,
        exclusions,
        itinerary_images as "itineraryImages",
        itinerary_description as "itineraryDescription",
        cancellation_policy as "cancellationPolicy",
        cancellation_benefit as "cancellationBenefit",
        day_wise_itinerary as "dayWiseItinerary",
        itinerary,
        image,
        is_active as "isActive",
        created_at as "createdAt"
      FROM travel_packages 
      WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC
    `;
    return packages;
  }

  async getPackage(packageId: number) {
    const [package_] = await sql`
      SELECT 
        id,
        tenant_id as "tenantId",
        package_type_id as "packageTypeId",
        name,
        description,
        destination,
        duration,
        duration_type as "durationType",
        region,
        country,
        city,
        price,
        max_capacity as "maxCapacity",
        package_staying_image as "packageStayingImage",
        alt_name as "altName",
        vendor_name as "vendorName",
        rating,
        status,
        inclusions,
        exclusions,
        itinerary_images as "itineraryImages",
        itinerary_description as "itineraryDescription",
        cancellation_policy as "cancellationPolicy",
        cancellation_benefit as "cancellationBenefit",
        day_wise_itinerary as "dayWiseItinerary",
        itinerary,
        image,
        is_active as "isActive",
        created_at as "createdAt"
      FROM travel_packages 
      WHERE id = ${packageId}
    `;
    return package_;
  }

  async createPackage(packageData: any) {
    const {
      tenantId,
      packageTypeId,
      name,
      description,
      destination,
      duration,
      price,
      maxCapacity,
      inclusions,
      exclusions,
      isActive,
      durationType,
      region,
      country,
      city,
      packageStayingImage,
      altName,
      vendorName,
      rating,
      status,
      itineraryImages,
      itineraryDescription,
      cancellationPolicy,
      cancellationBenefit,
      dayWiseItinerary,
      itinerary,
      image,
    } = packageData;

    // Handle itineraryImages - check if column is JSON or TEXT
    // If it's a string (comma-separated), convert to array for JSON column
    // If it's already an array, use it directly
    let itineraryImagesParam = null;
    if (itineraryImages) {
      if (typeof itineraryImages === 'string') {
        // If comma-separated string, split and store as JSON array
        const imageArray = itineraryImages.split(',').map(img => img.trim()).filter(img => img);
        itineraryImagesParam = imageArray.length > 0 ? JSON.stringify(imageArray) : null;
      } else if (Array.isArray(itineraryImages)) {
        // If already an array, stringify it
        itineraryImagesParam = JSON.stringify(itineraryImages);
      }
    }

    // Sanitize JSON fields to prevent invalid JSON errors (for dayWiseItinerary)
    const sanitizeJsonArray = (arr) => {
      if (!arr || !Array.isArray(arr)) return null;
      // Filter out empty objects and invalid entries
      const cleaned = arr.filter(
        (item) =>
          item && typeof item === "object" && Object.keys(item).length > 0,
      );
      return cleaned.length > 0 ? cleaned : null;
    };

    const cleanDayWiseItinerary = sanitizeJsonArray(dayWiseItinerary);

    // Create properly serialized JSON parameters for dayWiseItinerary
    const dayWiseItineraryParam = cleanDayWiseItinerary
      ? JSON.stringify(cleanDayWiseItinerary)
      : null;

    // Handle inclusions and exclusions - they can be strings or arrays
    // Always JSON.stringify to ensure valid JSON format for PostgreSQL JSON columns
    let inclusionsParam = null;
    if (inclusions) {
      if (typeof inclusions === 'string') {
        // If it's a string, wrap it in an array to make it valid JSON
        // This ensures the database receives valid JSON format
        inclusionsParam = JSON.stringify([inclusions]);
      } else if (Array.isArray(inclusions)) {
        inclusionsParam = JSON.stringify(inclusions);
      } else {
        inclusionsParam = JSON.stringify(inclusions);
      }
    }

    let exclusionsParam = null;
    if (exclusions !== undefined && exclusions !== null) {
      if (typeof exclusions === 'string') {
        // If it's an empty string, store as empty array
        if (exclusions.trim() === '') {
          exclusionsParam = JSON.stringify([]);
        } else {
          // If it's a string, wrap it in an array to make it valid JSON
          exclusionsParam = JSON.stringify([exclusions]);
        }
      } else if (Array.isArray(exclusions)) {
        exclusionsParam = JSON.stringify(exclusions);
      } else {
        exclusionsParam = JSON.stringify(exclusions);
      }
    }

    console.log("🔍 Creating package with data:", packageData);
    console.log("🔍 Sanitized itineraryImages:", itineraryImagesParam);
    console.log("🔍 Sanitized dayWiseItinerary:", dayWiseItineraryParam);
    console.log("🔍 Inclusions:", inclusionsParam);
    console.log("🔍 Exclusions:", exclusionsParam);

    const [travelPackage] = await sql`
      INSERT INTO travel_packages (
        tenant_id, package_type_id, name, description, destination, duration, price, max_capacity, 
        inclusions, exclusions, is_active, duration_type, region, country, city, 
        package_staying_image, alt_name, vendor_name, rating, status, itinerary_images, 
        itinerary_description, cancellation_policy, cancellation_benefit, day_wise_itinerary, 
        itinerary, image
      )
      VALUES (
        ${tenantId},
        ${packageTypeId || 1},
        ${name},
        ${description || null},
        ${destination},
        ${duration},
        ${price},
        ${maxCapacity},
        ${inclusionsParam || null},
        ${exclusionsParam || null},
        ${isActive !== false},
        ${durationType || null},
        ${region || null},
        ${country || null},
        ${city || null},
        ${packageStayingImage || null},
        ${altName || null},
        ${vendorName || null},
        ${rating || null},
        ${status || "draft"},
        ${itineraryImagesParam || null},
        ${itineraryDescription || null},
        ${cancellationPolicy || null},
        ${cancellationBenefit || null},
        ${dayWiseItineraryParam || null},
        ${itinerary || null},
        ${image || null}
      )
      RETURNING id, tenant_id as "tenantId", package_type_id as "packageTypeId", name, description, destination, duration, price, max_capacity as "maxCapacity", inclusions, exclusions, is_active as "isActive", duration_type as "durationType", region, country, city, package_staying_image as "packageStayingImage", alt_name as "altName", vendor_name as "vendorName", rating, status, itinerary_images as "itineraryImages", itinerary_description as "itineraryDescription", cancellation_policy as "cancellationPolicy", cancellation_benefit as "cancellationBenefit", day_wise_itinerary as "dayWiseItinerary", 
        itinerary, image;
    `;

    return travelPackage;
  }

  async updatePackage(packageId: number, packageData: any) {
    // First, fetch the existing package to preserve required fields
    const existingPackage = await this.getPackage(packageId);
    if (!existingPackage) {
      throw new Error(`Package with id ${packageId} not found`);
    }

    const {
      name,
      description,
      destination,
      duration,
      price,
      maxCapacity,
      inclusions,
      exclusions,
      isActive,
      durationType,
      region,
      country,
      city,
      packageStayingImage,
      altName,
      vendorName,
      rating,
      status,
      itineraryImages,
      itineraryDescription,
      cancellationPolicy,
      cancellationBenefit,
      dayWiseItinerary,
      itinerary,
      image,
    } = packageData;

    // Handle itineraryImages - check if column is JSON or TEXT
    let itineraryImagesParam = null;
    if (itineraryImages !== undefined && itineraryImages !== null) {
      if (typeof itineraryImages === 'string') {
        const imageArray = itineraryImages.split(',').map(img => img.trim()).filter(img => img);
        itineraryImagesParam = imageArray.length > 0 ? JSON.stringify(imageArray) : null;
      } else if (Array.isArray(itineraryImages)) {
        itineraryImagesParam = JSON.stringify(itineraryImages);
      }
    } else {
      // Preserve existing itineraryImages if not provided
      itineraryImagesParam = existingPackage.itineraryImages ? JSON.stringify(existingPackage.itineraryImages) : null;
    }

    // Sanitize JSON fields to prevent invalid JSON errors (for dayWiseItinerary)
    const sanitizeJsonArray = (arr) => {
      if (!arr || !Array.isArray(arr)) return null;
      const cleaned = arr.filter(
        (item) =>
          item && typeof item === "object" && Object.keys(item).length > 0,
      );
      return cleaned.length > 0 ? cleaned : null;
    };

    let dayWiseItineraryParam = null;
    if (dayWiseItinerary !== undefined && dayWiseItinerary !== null) {
      const cleanDayWiseItinerary = sanitizeJsonArray(dayWiseItinerary);
      dayWiseItineraryParam = cleanDayWiseItinerary
        ? JSON.stringify(cleanDayWiseItinerary)
        : null;
    } else {
      // Preserve existing dayWiseItinerary if not provided
      dayWiseItineraryParam = existingPackage.dayWiseItinerary ? JSON.stringify(existingPackage.dayWiseItinerary) : null;
    }

    // Handle inclusions and exclusions - they can be strings or arrays
    // Always JSON.stringify to ensure valid JSON format for PostgreSQL JSON columns
    let inclusionsParam = null;
    if (inclusions !== undefined && inclusions !== null) {
      if (typeof inclusions === 'string') {
        // If it's a string, wrap it in an array to make it valid JSON
        inclusionsParam = JSON.stringify([inclusions]);
      } else if (Array.isArray(inclusions)) {
        inclusionsParam = JSON.stringify(inclusions);
      } else {
        inclusionsParam = JSON.stringify(inclusions);
      }
    } else {
      // Preserve existing inclusions if not provided
      inclusionsParam = existingPackage.inclusions ? JSON.stringify(existingPackage.inclusions) : null;
    }

    let exclusionsParam = null;
    if (exclusions !== undefined && exclusions !== null) {
      if (typeof exclusions === 'string') {
        // If it's an empty string, store as empty array
        if (exclusions.trim() === '') {
          exclusionsParam = JSON.stringify([]);
        } else {
          // If it's a string, wrap it in an array to make it valid JSON
          exclusionsParam = JSON.stringify([exclusions]);
        }
      } else if (Array.isArray(exclusions)) {
        exclusionsParam = JSON.stringify(exclusions);
      } else {
        exclusionsParam = JSON.stringify(exclusions);
      }
    } else {
      // Preserve existing exclusions if not provided
      exclusionsParam = existingPackage.exclusions ? JSON.stringify(existingPackage.exclusions) : null;
    }

    // For required NOT NULL fields, use existing value if new value is missing
    // For optional fields, use new value if provided, otherwise keep existing
    const nameParam = name !== undefined && name !== null ? name : existingPackage.name;
    const descriptionParam = description !== undefined ? description : existingPackage.description;
    const destinationParam = destination !== undefined && destination !== null ? destination : existingPackage.destination;
    const durationParam = duration !== undefined && duration !== null ? Number(duration) : Number(existingPackage.duration);
    const priceParam = price !== undefined && price !== null && !isNaN(Number(price)) ? Number(price) : Number(existingPackage.price);
    const maxCapacityParam = maxCapacity !== undefined && maxCapacity !== null ? Number(maxCapacity) : Number(existingPackage.maxCapacity);
    const isActiveParam = isActive !== undefined ? (isActive !== false) : existingPackage.isActive;
    const durationTypeParam = durationType !== undefined ? durationType : existingPackage.durationType;
    const regionParam = region !== undefined ? region : existingPackage.region;
    const countryParam = country !== undefined ? country : existingPackage.country;
    const cityParam = city !== undefined ? city : existingPackage.city;
    const packageStayingImageParam = packageStayingImage !== undefined ? packageStayingImage : existingPackage.packageStayingImage;
    // For text fields, preserve empty strings (don't convert to null)
    const altNameParam = altName !== undefined ? altName : existingPackage.altName;
    const vendorNameParam = vendorName !== undefined ? vendorName : existingPackage.vendorName;
    const ratingParam = rating !== undefined ? rating : existingPackage.rating;
    const statusParam = status !== undefined ? status : existingPackage.status;
    const itineraryDescriptionParam = itineraryDescription !== undefined ? itineraryDescription : existingPackage.itineraryDescription;
    const cancellationPolicyParam = cancellationPolicy !== undefined ? cancellationPolicy : existingPackage.cancellationPolicy;
    // For text fields, preserve empty strings (don't convert to null)
    const cancellationBenefitParam = cancellationBenefit !== undefined ? cancellationBenefit : existingPackage.cancellationBenefit;
    const itineraryParam = itinerary !== undefined ? itinerary : existingPackage.itinerary;
    const imageParam = image !== undefined ? image : existingPackage.image;

    const [travelPackage] = await sql`
      UPDATE travel_packages 
      SET name = ${nameParam}, 
          description = ${descriptionParam}, 
          destination = ${destinationParam}, 
          duration = ${durationParam}, 
          price = ${priceParam}, 
          max_capacity = ${maxCapacityParam},
          inclusions = ${inclusionsParam}, 
          exclusions = ${exclusionsParam}, 
          is_active = ${isActiveParam},
          duration_type = ${durationTypeParam},
          region = ${regionParam},
          country = ${countryParam},
          city = ${cityParam},
          package_staying_image = ${packageStayingImageParam},
          alt_name = ${altNameParam},
          vendor_name = ${vendorNameParam},
          rating = ${ratingParam},
          status = ${statusParam},
          itinerary_images = ${itineraryImagesParam},
          itinerary_description = ${itineraryDescriptionParam},
          cancellation_policy = ${cancellationPolicyParam},
          cancellation_benefit = ${cancellationBenefitParam},
          day_wise_itinerary = ${dayWiseItineraryParam},
          itinerary = ${itineraryParam},
          image = ${imageParam}
      WHERE id = ${packageId}
      RETURNING 
        id,
        tenant_id as "tenantId",
        package_type_id as "packageTypeId",
        name,
        description,
        destination,
        duration,
        duration_type as "durationType",
        region,
        country,
        city,
        price,
        max_capacity as "maxCapacity",
        package_staying_image as "packageStayingImage",
        alt_name as "altName",
        vendor_name as "vendorName",
        rating,
        status,
        inclusions,
        exclusions,
        itinerary_images as "itineraryImages",
        itinerary_description as "itineraryDescription",
        cancellation_policy as "cancellationPolicy",
        cancellation_benefit as "cancellationBenefit",
        day_wise_itinerary as "dayWiseItinerary",
        itinerary,
        image,
        is_active as "isActive",
        created_at as "createdAt"
    `;
    return travelPackage;
  }

  async deletePackage(packageId: number) {
    await sql`DELETE FROM travel_packages WHERE id = ${packageId}`;
  }

  // Booking management methods - simplified for dashboard
  async getBookingsByTenant(tenantId: number) {
    try {
      console.log("Storage: Fetching bookings for tenant:", tenantId);

      // Use direct SQL with correct column names (customers has 'name', not first_name/last_name)
      const bookings = await sql`
        SELECT b.*, c.name as customer_name, c.email as customer_email,
               p.name as package_name, p.destination as package_destination
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.id AND c.tenant_id = ${tenantId}
        LEFT JOIN travel_packages p ON b.package_id = p.id AND p.tenant_id = ${tenantId}
        WHERE b.tenant_id = ${tenantId}
        ORDER BY b.created_at DESC
      `;
      console.log("Storage: Found bookings:", bookings.length);

      return bookings;
    } catch (error) {
      console.error("Storage: Error fetching bookings:", error);
      throw error;
    }
  }

  // Payment History Functions
  async createPaymentHistoryEntry(paymentData: any) {
    try {
      const {
        bookingId,
        tenantId,
        paymentAmount,
        paymentType,
        paymentMethod,
        transactionReference,
        notes,
      } = paymentData;

      const [payment] = await sql`
        INSERT INTO payment_history (booking_id, tenant_id, payment_amount, payment_type, payment_method, transaction_reference, notes)
        VALUES (${bookingId}, ${tenantId}, ${paymentAmount}, ${paymentType || "partial"}, ${paymentMethod || "cash"}, ${transactionReference || null}, ${notes || null})
        RETURNING *
      `;

      // Map database fields to camelCase for frontend compatibility
      return {
        id: payment.id,
        bookingId: payment.booking_id,
        tenantId: payment.tenant_id,
        paymentAmount: payment.payment_amount,
        paymentType: payment.payment_type,
        paymentMethod: payment.payment_method,
        transactionReference: payment.transaction_reference,
        notes: payment.notes,
        paymentDate: payment.payment_date,
        createdAt: payment.created_at,
      };
    } catch (error) {
      console.error("Storage: Error creating payment history:", error);
      throw error;
    }
  }

  async getBookingPaymentHistory(bookingId: number) {
    try {
      const payments = await sql`
        SELECT * FROM payment_history 
        WHERE booking_id = ${bookingId}
        ORDER BY payment_date DESC
      `;

      return payments.map((payment) => ({
        id: payment.id,
        bookingId: payment.booking_id,
        tenantId: payment.tenant_id,
        paymentAmount: payment.payment_amount,
        paymentType: payment.payment_type,
        paymentDate: payment.payment_date,
        paymentMethod: payment.payment_method,
        transactionReference: payment.transaction_reference,
        notes: payment.notes,
        createdAt: payment.created_at,
      }));
    } catch (error) {
      console.error("Storage: Error fetching booking payment history:", error);
      throw error;
    }
  }

  // Email campaign management methods
  async getEmailCampaignsByTenant(tenantId: number) {
    console.log(`Querying campaigns for tenant ${tenantId}`);
    const campaigns = await sql`
      SELECT * FROM email_campaigns 
      WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC
    `;
    console.log(
      `Found ${campaigns.length} campaigns in database:`,
      campaigns.map((c) => ({ id: c.id, name: c.name })),
    );
    return campaigns.map((campaign) => ({
      id: campaign.id,
      tenantId: campaign.tenant_id,
      name: campaign.name,
      subject: campaign.subject,
      content: campaign.content,
      type: campaign.type,
      status: campaign.status,
      targetAudience: campaign.target_audience,
      scheduledAt: campaign.scheduled_at,
      sentAt: campaign.sent_at,
      recipientCount: campaign.recipient_count,
      openRate: campaign.open_rate,
      clickRate: campaign.click_rate,
      createdAt: campaign.created_at,
    }));
  }

  async createEmailCampaign(campaignData: any) {
    try {
      const campaign = await sql`
        INSERT INTO email_campaigns (
          tenant_id,
          name,
          subject,
          content,
          type,
          status,
          target_audience,
          recipient_count
        ) VALUES (
          ${campaignData.tenantId || 1},
          ${campaignData.name || "Untitled Campaign"},
          ${campaignData.subject || "No Subject"},
          ${campaignData.content || "No Content"},
          ${campaignData.type || "newsletter"},
          ${campaignData.status || "draft"},
          ${campaignData.targetAudience || "all_customers"},
          ${campaignData.recipientCount || 0}
        )
        RETURNING *
      `;

      const newCampaign = campaign[0];
      return {
        id: newCampaign.id,
        tenantId: newCampaign.tenant_id,
        name: newCampaign.name,
        subject: newCampaign.subject,
        content: newCampaign.content,
        type: newCampaign.type,
        status: newCampaign.status,
        targetAudience: newCampaign.target_audience,
        scheduledAt: newCampaign.scheduled_at,
        sentAt: newCampaign.sent_at,
        recipientCount: newCampaign.recipient_count,
        openRate: newCampaign.open_rate,
        clickRate: newCampaign.click_rate,
        createdAt: newCampaign.created_at,
      };
    } catch (error) {
      console.error("Email campaign creation error:", error);
      throw error;
    }
  }

  async updateEmailCampaign(campaignId: number, campaignData: any) {
    const campaign = await sql`
      UPDATE email_campaigns 
      SET 
        name = COALESCE(${campaignData.name}, name),
        subject = COALESCE(${campaignData.subject}, subject),
        content = COALESCE(${campaignData.content}, content),
        type = COALESCE(${campaignData.type}, type),
        status = COALESCE(${campaignData.status}, status),
        target_audience = COALESCE(${campaignData.targetAudience}, target_audience),
        scheduled_at = COALESCE(${campaignData.scheduledAt}, scheduled_at),
        sent_at = COALESCE(${campaignData.sentAt}, sent_at),
        recipient_count = COALESCE(${campaignData.recipientCount}, recipient_count),
        open_rate = COALESCE(${campaignData.openRate}, open_rate),
        click_rate = COALESCE(${campaignData.clickRate}, click_rate)
      WHERE id = ${campaignId}
      RETURNING *
    `;

    if (campaign.length === 0) {
      throw new Error("Campaign not found");
    }

    const updatedCampaign = campaign[0];
    return {
      id: updatedCampaign.id,
      tenantId: updatedCampaign.tenant_id,
      name: updatedCampaign.name,
      subject: updatedCampaign.subject,
      content: updatedCampaign.content,
      type: updatedCampaign.type,
      status: updatedCampaign.status,
      targetAudience: updatedCampaign.target_audience,
      scheduledAt: updatedCampaign.scheduled_at,
      sentAt: updatedCampaign.sent_at,
      recipientCount: updatedCampaign.recipient_count,
      openRate: updatedCampaign.open_rate,
      clickRate: updatedCampaign.click_rate,
      createdAt: updatedCampaign.created_at,
    };
  }

  async deleteEmailCampaign(campaignId: number) {
    await sql`DELETE FROM email_campaigns WHERE id = ${campaignId}`;
  }

  // Settings management methods
  async updateTenant(tenantId: number, tenantData: any) {
    try {
      // Build update query dynamically, only including defined fields (not undefined)
      // Note: null values are allowed, but undefined values are not
      const updateParts: any[] = [];
      
      if (tenantData.company_name !== undefined) {
        updateParts.push(sql`company_name = ${tenantData.company_name ?? null}`);
      }
      if (tenantData.contact_email !== undefined) {
        updateParts.push(sql`contact_email = ${tenantData.contact_email ?? null}`);
      }
      if (tenantData.contact_phone !== undefined) {
        updateParts.push(sql`contact_phone = ${tenantData.contact_phone ?? null}`);
      }
      if (tenantData.address !== undefined) {
        updateParts.push(sql`address = ${tenantData.address ?? null}`);
      }
      if (tenantData.subdomain !== undefined) {
        updateParts.push(sql`subdomain = ${tenantData.subdomain ?? null}`);
      }
      if (tenantData.logo !== undefined) {
        updateParts.push(sql`logo = ${tenantData.logo ?? null}`);
      }
      if (tenantData.timezone !== undefined) {
        updateParts.push(sql`timezone = ${tenantData.timezone ?? null}`);
      }
      if (tenantData.currency !== undefined) {
        updateParts.push(sql`currency = ${tenantData.currency ?? null}`);
      }
      if (tenantData.date_format !== undefined) {
        updateParts.push(sql`date_format = ${tenantData.date_format ?? null}`);
      }
      if (tenantData.zoom_account_id !== undefined) {
        updateParts.push(sql`zoom_account_id = ${tenantData.zoom_account_id ?? null}`);
      }
      if (tenantData.zoom_client_id !== undefined) {
        updateParts.push(sql`zoom_client_id = ${tenantData.zoom_client_id ?? null}`);
      }
      if (tenantData.zoom_client_secret !== undefined) {
        updateParts.push(sql`zoom_client_secret = ${tenantData.zoom_client_secret ?? null}`);
      }

      if (updateParts.length === 0) {
        // No updates to make, return current tenant
        const [tenant] = await sql`SELECT * FROM tenants WHERE id = ${tenantId}`;
        return tenant;
      }

      // Build the query using sql template tag
      const updateClause = sql.join(updateParts, sql`, `);
      const [updatedTenant] = await sql`
        UPDATE tenants 
        SET ${updateClause}
        WHERE id = ${tenantId}
        RETURNING *
      `;
      return updatedTenant;
    } catch (error) {
      console.error("Error updating tenant:", error);
      throw error;
    }
  }

  // Invoice management methods
  async getInvoiceById(tenantId: number, invoiceId: number) {
    try {
      // Fetch invoice by ID and tenant ID
      const invoices = await sql`
        SELECT * FROM invoices 
        WHERE id = ${invoiceId} AND tenant_id = ${tenantId}
        LIMIT 1
      `;

      if (invoices.length === 0) {
        throw new Error("Invoice not found");
      }

      const invoice = invoices[0];

      // Combine prefix and number for backward compatibility (without dash: INV001)
      const invoicePrefix = invoice.invoice_prefix || "INV";
      const invoiceNumberOnly = invoice.invoice_number || "";
      invoice.invoice_number = invoicePrefix && invoiceNumberOnly 
        ? `${invoicePrefix}${invoiceNumberOnly}` 
        : invoiceNumberOnly || invoice.invoice_number;

      // Fetch customer details
      let customerName = null;
      let customerEmail = null;
      let customerPhone = null;
      let customerAddress = null;

      try {
        if (invoice.customer_id) {
          const customers = await sql`
            SELECT name, email, phone, address 
            FROM customers 
            WHERE id = ${invoice.customer_id}
          `;
          if (customers.length > 0) {
            const customer = customers[0];
            customerName = customer.name || null;
            customerEmail = customer.email || null;
            customerPhone = customer.phone || null;
            customerAddress = customer.address || null;
          }
        }
      } catch (joinError) {
        console.warn("Error fetching customer details:", joinError);
      }

      // Fetch booking details
      let bookingNumber = null;
      try {
        if (invoice.booking_id) {
          const bookings = await sql`
            SELECT booking_number 
            FROM bookings 
            WHERE id = ${invoice.booking_id}
          `;
          if (bookings.length > 0) {
            bookingNumber = bookings[0].booking_number;
          }
        }
      } catch (joinError) {
        console.warn("Error fetching booking details:", joinError);
      }

      // Fetch line items from invoice_items table
      let lineItems = [];
      try {
        const items = await sql`
          SELECT * FROM invoice_items 
          WHERE invoice_id = ${invoice.id}
          ORDER BY id
        `;
        lineItems = items.map((item: any) => ({
          id: item.id,
          description: item.description,
          itemTitle: item.description,
          quantity: item.quantity || 1,
          unitPrice: parseFloat(item.unit_price || 0),
          sellingPrice: parseFloat(item.unit_price || 0),
          tax: 0,
          totalAmount: parseFloat(item.total_price || 0),
        }));
      } catch (itemsError) {
        console.warn("Error fetching invoice items:", itemsError);
      }

      // Also check if line items are stored as JSON in the invoice record
      let jsonLineItems = [];
      if (invoice.line_items) {
        try {
          if (typeof invoice.line_items === 'string') {
            jsonLineItems = JSON.parse(invoice.line_items);
          } else if (Array.isArray(invoice.line_items)) {
            jsonLineItems = invoice.line_items;
          }
        } catch (e) {
          console.warn("Failed to parse line_items JSON:", e);
        }
      }

      // Use JSON line items if available, otherwise use invoice_items table
      const finalLineItems = jsonLineItems.length > 0 ? jsonLineItems : lineItems;

      // Fetch payment installments if they exist
      let installments = [];
      try {
        const installmentData = await sql`
          SELECT * FROM payment_installments 
          WHERE invoice_id = ${invoice.id} AND tenant_id = ${tenantId}
          ORDER BY installment_number ASC
        `;
        installments = installmentData.map((inst: any) => ({
          installmentNumber: inst.installment_number,
          dueDate: inst.due_date ? new Date(inst.due_date).toISOString().split("T")[0] : null,
          amount: inst.amount?.toString() || "0",
          status: inst.status,
          paidAmount: parseFloat(inst.paid_amount || "0"),
        }));
      } catch (installmentError) {
        console.warn("Error fetching installments:", installmentError);
      }

      return {
        id: invoice.id,
        tenantId: invoice.tenant_id,
        customerId: invoice.customer_id,
        bookingId: invoice.booking_id,
        invoiceNumber: invoice.invoice_number,
        status: invoice.status,
        issueDate: invoice.issue_date || invoice.invoice_date,
        dueDate: invoice.due_date,
        subtotal: parseFloat(invoice.subtotal || "0"),
        taxAmount: parseFloat(invoice.tax_amount || "0"),
        totalAmount: parseFloat(invoice.total_amount || "0"),
        paidAmount: parseFloat(invoice.paid_amount || invoice.amount_paid || "0"),
        discountAmount: parseFloat(invoice.discount_amount || "0"),
        currency: invoice.currency || "USD",
        paymentMethod: invoice.payment_method ? (() => {
          try {
            const parsed = JSON.parse(invoice.payment_method);
            return Array.isArray(parsed) ? parsed : [invoice.payment_method];
          } catch {
            return [invoice.payment_method];
          }
        })() : null,
        paymentTerms: invoice.payment_terms || null,
        isTaxInclusive: invoice.is_tax_inclusive || false,
        notes: invoice.notes || null,
        additionalNotes: invoice.additional_notes || null,
        enableReminder: invoice.enable_reminder || false,
        reminderFrequency: invoice.reminder_frequency || null,
        reminderSpecificDate: invoice.reminder_specific_date || null,
        lineItems: finalLineItems,
        installments: installments.length > 0 ? installments : undefined,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        customerAddress: customerAddress,
        bookingNumber: bookingNumber,
      };
    } catch (error) {
      console.error("getInvoiceById error:", error);
      throw error;
    }
  }

  async getInvoicesByTenant(
    tenantId: number,
    filters?: {
      customerId?: number;
      vendorId?: number;
      providerId?: number;
      leadTypeId?: number;
      status?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      pageSize?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    try {
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 10;
      const offset = (page - 1) * pageSize;
      console.log("🔍 getInvoicesByTenant - filters:", filters);
      // Initialize filters object if not provided
      const filterParams = filters || {};

      console.log("🔍 getInvoicesByTenant - Filters received:", JSON.stringify(filterParams, null, 2));
      console.log("🔍 getInvoicesByTenant - Tenant ID:", tenantId);
      console.log("🔍 getInvoicesByTenant - Page:", page, "PageSize:", pageSize, "Offset:", offset);

      // Build WHERE clause dynamically - always use table prefix to avoid ambiguity
      let whereClause = sql`invoices.tenant_id = ${tenantId}`;
      let needsJoin = false;

      console.log("🔍 Initial WHERE clause: invoices.tenant_id =", tenantId);

      // Handle customer filter - can be single ID or array of IDs
      if (filterParams?.customerId) {
        if (Array.isArray(filterParams.customerId)) {
          if (filterParams.customerId.length > 0) {
            console.log("🔍 Applying customer filter (array):", filterParams.customerId);
            whereClause = sql`${whereClause} AND invoices.customer_id = ANY(${sql.array(filterParams.customerId)})`;
            console.log("🔍 WHERE clause after customer filter (array)");
          }
        } else {
          console.log("🔍 Applying customer filter (single):", filterParams.customerId);
          whereClause = sql`${whereClause} AND invoices.customer_id = ${filterParams.customerId}`;
          console.log("🔍 WHERE clause after customer filter (single)");
        }
      } else {
        console.log("🔍 No customer filter applied");
      }

      if (filterParams?.status && filterParams.status !== "all") {
        console.log("🔍 Applying status filter:", filterParams.status);
        whereClause = sql`${whereClause} AND invoices.status = ${filterParams.status}`;
        console.log("🔍 WHERE clause after status filter");
      } else {
        // When status is "all" or not specified, exclude void invoices
        console.log("🔍 No status filter applied - excluding void invoices");
        whereClause = sql`${whereClause} AND LOWER(invoices.status) != 'void'`;
        console.log("🔍 WHERE clause after excluding void invoices");
      }

      // Build JOIN clause for search if needed
      let joinClause = sql``;
      const hasSearch = filterParams?.search && filterParams.search.trim() !== "";
      const shouldFilterAfterFetch = filterParams?.vendorId || filterParams?.providerId || filterParams?.leadTypeId || hasSearch;

      // Handle date filters
      if (filterParams?.startDate) {
        console.log("🔍 Applying start date filter:", filterParams.startDate);
        whereClause = sql`${whereClause} AND invoices.issue_date >= ${filterParams.startDate}::date`;
      }
      if (filterParams?.endDate) {
        console.log("🔍 Applying end date filter:", filterParams.endDate);
        whereClause = sql`${whereClause} AND invoices.issue_date <= ${filterParams.endDate}::date`;
      }

      // Only apply search in SQL WHERE clause if we're NOT filtering after fetch
      // (i.e., when we don't need to check line items)
      // If we need to check line items, we'll filter in JavaScript after fetching
      if (hasSearch && !shouldFilterAfterFetch) {
        const searchTerm = filterParams.search!.trim();
        const searchPattern = `%${searchTerm}%`;
        const searchPatternNoDash = `%${searchTerm.replace(/-/g, '')}%`;
        console.log("🔍 Applying search filter in SQL:", searchTerm);
        needsJoin = true;
        joinClause = sql`LEFT JOIN customers c ON invoices.customer_id = c.id`;
        
        // Handle invoice number search - check both formats (INV-117 and INV117)
        // Also check the combined format (invoice_prefix + invoice_number)
        whereClause = sql`${whereClause} AND (
          invoices.invoice_number ILIKE ${searchPattern} 
          OR CONCAT(invoices.invoice_prefix, COALESCE(invoices.invoice_number, '')) ILIKE ${searchPattern}
          OR CONCAT(invoices.invoice_prefix, '-', COALESCE(invoices.invoice_number, '')) ILIKE ${searchPattern}
          OR CONCAT(invoices.invoice_prefix, COALESCE(invoices.invoice_number, '')) ILIKE ${searchPatternNoDash}
          OR invoices.invoice_number ILIKE ${searchPatternNoDash}
          OR c.name ILIKE ${searchPattern}
        )`;
      } else if (hasSearch) {
        // When filtering after fetch, we still need the JOIN for customer name search
        console.log("🔍 Search will be applied after fetch (to check line items):", filterParams.search);
        needsJoin = true;
        joinClause = sql`LEFT JOIN customers c ON invoices.customer_id = c.id`;
      }

      console.log("🔍 shouldFilterAfterFetch:", shouldFilterAfterFetch);
      console.log("🔍 Filter breakdown:");
      console.log("🔍   - vendorId:", filterParams?.vendorId, "(type:", typeof filterParams?.vendorId, ")");
      console.log("🔍   - providerId:", filterParams?.providerId, "(type:", typeof filterParams?.providerId, ")");
      console.log("🔍   - leadTypeId:", filterParams?.leadTypeId, "(type:", typeof filterParams?.leadTypeId, ")");
      console.log("🔍   - search:", filterParams?.search, "(type:", typeof filterParams?.search, ")");
      console.log("🔍   - customerId:", filterParams?.customerId, "(type:", Array.isArray(filterParams?.customerId) ? "array" : typeof filterParams?.customerId, ")");
      console.log("🔍   - status:", filterParams?.status, "(type:", typeof filterParams?.status, ")");
      console.log("🔍   - sortBy:", filterParams?.sortBy, "sortOrder:", filterParams?.sortOrder);
      console.log("🔍 ========================================");

      // Determine sort column and order
      const sortBy = filterParams?.sortBy || 'created_at';
      const sortOrder = filterParams?.sortOrder || 'desc';

      // Whitelist of valid sort columns for security
      const validSortColumns = [
        'invoice_number', 'customer_id', 'issue_date', 'due_date',
        'total_amount', 'paid_amount', 'status', 'created_at'
      ];

      // Validate and map sort column
      const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
      const orderDirection = sortOrder.toUpperCase() === 'ASC' ? sql`ASC` : sql`DESC`;

      // Build ORDER BY based on whether we need join prefix
      let orderByColumn;
      if (needsJoin) {
        switch (safeSortBy) {
          case 'invoice_number':
            orderByColumn = sql`invoices.invoice_number`;
            break;
          case 'customer_id':
            orderByColumn = sql`invoices.customer_id`;
            break;
          case 'issue_date':
            orderByColumn = sql`invoices.issue_date`;
            break;
          case 'due_date':
            orderByColumn = sql`invoices.due_date`;
            break;
          case 'total_amount':
            orderByColumn = sql`invoices.total_amount`;
            break;
          case 'paid_amount':
            orderByColumn = sql`invoices.paid_amount`;
            break;
          case 'status':
            orderByColumn = sql`invoices.status`;
            break;
          case 'created_at':
          default:
            orderByColumn = sql`invoices.created_at`;
            break;
        }
      } else {
        switch (safeSortBy) {
          case 'invoice_number':
            orderByColumn = sql`invoice_number`;
            break;
          case 'customer_id':
            orderByColumn = sql`customer_id`;
            break;
          case 'issue_date':
            orderByColumn = sql`issue_date`;
            break;
          case 'due_date':
            orderByColumn = sql`due_date`;
            break;
          case 'total_amount':
            orderByColumn = sql`total_amount`;
            break;
          case 'paid_amount':
            orderByColumn = sql`paid_amount`;
            break;
          case 'status':
            orderByColumn = sql`status`;
            break;
          case 'created_at':
          default:
            orderByColumn = sql`created_at`;
            break;
        }
      }

      let invoices;
      if (shouldFilterAfterFetch) {
        // Fetch all matching invoices (without pagination limit) to filter by line items
        // Then apply pagination after filtering
        if (needsJoin) {
          invoices = await sql`
            SELECT invoices.* FROM invoices
            ${joinClause}
            WHERE ${whereClause}
            ORDER BY ${orderByColumn} ${orderDirection}
          `;
        } else {
          invoices = await sql`
            SELECT * FROM invoices 
            WHERE ${whereClause}
            ORDER BY ${orderByColumn} ${orderDirection}
          `;
        }
      } else {
        // Apply pagination in SQL for better performance when no line item filters
        if (needsJoin) {
          invoices = await sql`
            SELECT invoices.* FROM invoices
            ${joinClause}
            WHERE ${whereClause}
            ORDER BY ${orderByColumn} ${orderDirection}
            LIMIT ${pageSize} OFFSET ${offset}
          `;
        } else {
          invoices = await sql`
            SELECT * FROM invoices 
            WHERE ${whereClause}
            ORDER BY ${orderByColumn} ${orderDirection}
            LIMIT ${pageSize} OFFSET ${offset}
          `;
        }
      }

      // Get total count - will be recalculated after filtering if needed
      let totalCount = 0;
      if (!shouldFilterAfterFetch) {
        // For simple filters, count directly from SQL
        if (needsJoin) {
          const countResult = await sql`
            SELECT COUNT(*) as total FROM invoices
            ${joinClause}
            WHERE ${whereClause}
          `;
          totalCount = parseInt(countResult[0]?.total || "0");
        } else {
          const countResult = await sql`
            SELECT COUNT(*) as total FROM invoices 
            WHERE ${whereClause}
          `;
          totalCount = parseInt(countResult[0]?.total || "0");
        }
      }

      // Fetch customer and booking details separately for each invoice
      const invoicesWithDetails = await Promise.all(
        invoices.map(async (invoice) => {
          let customerName = null;
          let customerEmail = null;
          let bookingNumber = null;

          try {
            if (invoice.customer_id) {
              const customers = await sql`
              SELECT name, email 
              FROM customers 
              WHERE id = ${invoice.customer_id}
            `;
              if (customers.length > 0) {
                const customer = customers[0];
                customerName = customer.name || null;
                customerEmail = customer.email;
              }
            }

            if (invoice.booking_id) {
              const bookings = await sql`
              SELECT booking_number 
              FROM bookings 
              WHERE id = ${invoice.booking_id}
            `;
              if (bookings.length > 0) {
                bookingNumber = bookings[0].booking_number;
              }
            }
          } catch (joinError) {
            console.warn("Error fetching invoice details:", joinError);
          }

          // Parse line items from JSON string if present
          let lineItems = [];
          if (invoice.line_items) {
            try {
              if (typeof invoice.line_items === 'string') {
                lineItems = JSON.parse(invoice.line_items);
              } else if (Array.isArray(invoice.line_items)) {
                lineItems = invoice.line_items;
              }
            } catch (parseError) {
              console.warn("Error parsing line_items JSON:", parseError);
            }
          }

          // Filter by search term - check main invoice number, customer name, and line items
          // When shouldFilterAfterFetch is true, we fetch all invoices and filter here
          // to allow searching in line items' invoice/voucher numbers
          if (filterParams?.search && filterParams.search.trim() !== "") {
            const searchTerm = filterParams.search.trim().toLowerCase();
            const searchTermNoDash = searchTerm.replace(/-/g, '');
            console.log("🔍 Checking search for invoice ID:", invoice.id, "Search term:", searchTerm);

            // Check main invoice number (just the number part)
            const invoiceNumberMatch = invoice.invoice_number?.toLowerCase().includes(searchTerm) || 
                                      invoice.invoice_number?.toLowerCase().includes(searchTermNoDash);

            // Check combined invoice number (prefix + number) - handle both with and without dash
            const invPrefix = (invoice.invoice_prefix || "INV").toLowerCase();
            const invNumber = (invoice.invoice_number || "").toLowerCase();
            const combinedWithDash = `${invPrefix}-${invNumber}`;
            const combinedWithoutDash = `${invPrefix}${invNumber}`;
            const combinedMatch = combinedWithDash.includes(searchTerm) || 
                                 combinedWithoutDash.includes(searchTerm) ||
                                 combinedWithDash.includes(searchTermNoDash) ||
                                 combinedWithoutDash.includes(searchTermNoDash);

            // Check customer name
            const customerNameMatch = customerName?.toLowerCase().includes(searchTerm);

            // Check if search matches any line item's invoice/voucher number
            const lineItemMatch = lineItems.some((item: any) => {
              const itemInvoiceNumber = (item.invoiceNumber?.toString() || "").toLowerCase();
              const itemVoucherNumber = (item.voucherNumber?.toString() || "").toLowerCase();
              const matches = itemInvoiceNumber.includes(searchTerm) || 
                            itemInvoiceNumber.includes(searchTermNoDash) ||
                            itemVoucherNumber.includes(searchTerm) || 
                            itemVoucherNumber.includes(searchTermNoDash);
              if (matches) {
                console.log("🔍 Line item match found - invoiceNumber:", itemInvoiceNumber, "voucherNumber:", itemVoucherNumber);
              }
              return matches;
            });

            // Include invoice if it matches in invoice number, customer name, or line items
            const hasMatch = invoiceNumberMatch || combinedMatch || customerNameMatch || lineItemMatch;
            console.log("🔍 Invoice ID:", invoice.id, "invoiceNumberMatch:", invoiceNumberMatch, "combinedMatch:", combinedMatch, "customerNameMatch:", customerNameMatch, "lineItemMatch:", lineItemMatch);
            if (!hasMatch) {
              console.log("🔍 Excluding invoice ID:", invoice.id, "- no match found");
              return null;
            }
            console.log("🔍 Including invoice ID:", invoice.id, "- match found");
          }

          // Filter by vendor if specified (check line items)
          if (filterParams?.vendorId) {
            const hasMatchingVendor = lineItems.some((item: any) => {
              const itemVendor = item.vendor?.toString() || item.vendorId?.toString();
              const filterVendor = filterParams.vendorId.toString();
              return itemVendor === filterVendor;
            });

            console.log("🔍 Invoice ID:", invoice.id, "hasMatchingVendor:", hasMatchingVendor, "lineItems count:", lineItems.length);
            if (!hasMatchingVendor) {
              console.log("🔍 Excluding invoice ID:", invoice.id, "- no matching vendor in line items");
              return null; // Skip this invoice if no line item matches the vendor filter
            }
            console.log("🔍 Including invoice ID:", invoice.id, "- vendor match found");
          }

          // Filter by provider if specified (check line items)
          if (filterParams?.providerId) {
            const hasMatchingProvider = lineItems.some((item: any) => {
              const itemProvider = item.serviceProviderId?.toString() || item.providerId?.toString();
              const filterProvider = filterParams.providerId.toString();
              return itemProvider === filterProvider;
            });

            console.log("🔍 Invoice ID:", invoice.id, "hasMatchingProvider:", hasMatchingProvider, "lineItems count:", lineItems.length);
            if (!hasMatchingProvider) {
              console.log("🔍 Excluding invoice ID:", invoice.id, "- no matching provider in line items");
              return null; // Skip this invoice if no line item matches the provider filter
            }
            console.log("🔍 Including invoice ID:", invoice.id, "- provider match found");
          }

          // Combine prefix and number for backward compatibility (without dash: INV001)
          const invPrefix = invoice.invoice_prefix || "INV";
          const invNumber = invoice.invoice_number || "";
          const fullInvoiceNumber = invPrefix && invNumber 
            ? `${invPrefix}${invNumber}` 
            : invNumber || invoice.invoice_number;

          return {
            id: invoice.id,
            tenantId: invoice.tenant_id,
            customerId: invoice.customer_id,
            bookingId: invoice.booking_id,
            invoiceNumber: fullInvoiceNumber,
            invoicePrefix: invPrefix,
            status: invoice.status,
            issueDate: invoice.issue_date,
            dueDate: invoice.due_date,
            subtotal: parseFloat(invoice.subtotal || "0"),
            taxAmount: parseFloat(invoice.tax_amount || "0"),
            discountAmount: parseFloat(invoice.discount_amount || "0"),
            totalAmount: parseFloat(invoice.total_amount || "0"),
            paidAmount: parseFloat(invoice.paid_amount || invoice.amount_paid || "0"),
            currency: invoice.currency || "USD",
            paymentTerms: invoice.payment_terms || null,
            notes: invoice.notes,
            lineItems: lineItems,
            createdAt: invoice.created_at,
            customerName: customerName,
            customerEmail: customerEmail,
            bookingNumber: bookingNumber,
          };
        }),
      );

      // Filter out null values
      let filteredInvoices = invoicesWithDetails.filter((inv) => inv !== null);

      // Apply lead type filter (requires checking service providers)
      if (filterParams?.leadTypeId) {
        const filtered = await Promise.all(
          filteredInvoices.map(async (invoice) => {
            if (!invoice.lineItems || invoice.lineItems.length === 0) {
              return null;
            }

            // Check if any line item has a provider with the specified lead type
            for (const item of invoice.lineItems) {
              const providerId = item.serviceProviderId || item.providerId;
              if (providerId) {
                try {
                  const providers = await sql`
                    SELECT lead_type_id FROM service_providers 
                    WHERE id = ${parseInt(providerId.toString())} AND tenant_id = ${tenantId}
                  `;
                  if (providers.length > 0 && providers[0].lead_type_id === filterParams.leadTypeId) {
                    return invoice;
                  }
                } catch (error) {
                  console.warn(`Error checking provider ${providerId} for lead type:`, error);
                }
              }
            }
            return null;
          })
        );
        filteredInvoices = filtered.filter((inv) => inv !== null);
        console.log("🔍 Invoices after leadTypeId filter:", filteredInvoices.length);
      }

      // Recalculate total count after all filtering if we filtered after fetch
      if (shouldFilterAfterFetch) {
        console.log("🔍 Recalculating total count after filtering. Current filtered count:", filteredInvoices.length);
        totalCount = filteredInvoices.length;
        // Apply pagination to filtered results
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        console.log("🔍 Applying pagination - startIndex:", startIndex, "endIndex:", endIndex);
        filteredInvoices = filteredInvoices.slice(startIndex, endIndex);
        console.log("🔍 Final invoices count after pagination:", filteredInvoices.length);
      } else {
        console.log("🔍 Total count from SQL:", totalCount);
      }

      // Always return new format with pagination for consistency
      const result = {
        data: filteredInvoices,
        pagination: {
          page,
          pageSize,
          total: totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      };

      console.log("🔍 Final result - Data count:", result.data.length, "Total:", result.pagination.total, "TotalPages:", result.pagination.totalPages);
      console.log("🔍 ========================================");

      return result;
    } catch (error) {
      console.error("getInvoicesByTenant error:", error);
      throw error;
    }
  }

 async getAllInvoicesByTenant(tenantId: number, startDate?: string, endDate?: string) {
  try {
    const parseJsonSafe = (value: any) => {
      if (!value) return [];
      if (typeof value === "object") return value;
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    };

    let dateFilter = sql`1=1`;

    if (startDate && endDate) {
      dateFilter = sql`issue_date >= ${startDate} AND issue_date <= ${endDate}`;
    }

   
    const invoices = await sql`
      SELECT * FROM invoices
      WHERE tenant_id = ${tenantId}
        AND status NOT IN ('void', 'cancelled')
        AND ${dateFilter}
      ORDER BY issue_date DESC
    `;

    if (invoices.length === 0) return [];

    const invoiceIds = invoices.map(i => i.id);

    // Fetch invoice_items 
    const invoiceItems = await sql`
      SELECT * FROM invoice_items
      WHERE invoice_id = ANY(${invoiceIds})
    `;

    const itemMap: any = {};
    invoiceItems.forEach(item => {
      if (!itemMap[item.invoice_id]) itemMap[item.invoice_id] = [];
      itemMap[item.invoice_id].push(item);
    });

    const allJsonLineItems = invoices.flatMap(inv => parseJsonSafe(inv.line_items));

    const providerIds = [
      ...new Set(
        allJsonLineItems
          .map(li => Number(li.serviceProviderId))
          .filter(id => !isNaN(id))
      ),
    ];

    const vendorIds = [
      ...new Set(
        allJsonLineItems
          .map(li => Number(li.vendor))
          .filter(id => !isNaN(id))
      ),
    ];

    const providers = providerIds.length
      ? await sql`
          SELECT id, name
          FROM service_providers
          WHERE id = ANY(${providerIds})
        `
      : [];

    const providerMap = Object.fromEntries(
      providers.map(p => [p.id, p])
    );

    const vendors = vendorIds.length
      ? await sql`
          SELECT id, name
          FROM vendors
          WHERE id = ANY(${vendorIds})
        `
      : [];

    const vendorMap = Object.fromEntries(
      vendors.map(v => [v.id, v])
    );

    // Final response
    return invoices.map(inv => {
      const rawLineItems = parseJsonSafe(inv.line_items);

      const lineItems = rawLineItems.map(li => ({
        ...li,
        serviceProviderName: providerMap[Number(li.serviceProviderId)]?.name || null,
        vendorName: vendorMap[Number(li.vendor)]?.name || null,
      }));

      // Combine prefix and number for backward compatibility (without dash: INV001)
      const invPrefix = inv.invoice_prefix || "INV";
      const invNumber = inv.invoice_number || "";
      const fullInvoiceNumber = invPrefix && invNumber 
        ? `${invPrefix}${invNumber}` 
        : invNumber || inv.invoice_number;

      return {
        id: inv.id,
        tenantId: inv.tenant_id,
        customerId: inv.customer_id,
        bookingId: inv.booking_id,
        invoiceNumber: fullInvoiceNumber,
        invoicePrefix: invPrefix,

        status: inv.status,
        issueDate: inv.issue_date,
        dueDate: inv.due_date,

        subtotal: parseFloat(inv.subtotal),
        taxAmount: parseFloat(inv.tax_amount || "0"),
        discountAmount: parseFloat(inv.discount_amount || "0"),
        totalAmount: parseFloat(inv.total_amount),

        notes: inv.notes,
        additionalNotes: inv.additional_notes,
        createdAt: inv.created_at,

        lineItems,
        items: itemMap[inv.id] || []
      };
    });

  } catch (error) {
    console.error("❌ getAllInvoicesByTenant error:", error);
    throw error;
  }
}




  async createInvoice(invoiceData: any) {
    try {
      console.log(
        "🔍 CREATEINVOICE DEBUG: Creating invoice with data:",
        JSON.stringify(invoiceData, null, 2),
      );

      // Validate required fields
      if (!invoiceData.tenantId) {
        throw new Error("tenantId is required");
      }
      if (!invoiceData.customerId) {
        throw new Error("customerId is required");
      }
      // Ensure we have either subtotal or totalAmount for calculation
      if (
        (invoiceData.subtotal === undefined || invoiceData.subtotal === null) &&
        (invoiceData.totalAmount === undefined ||
          invoiceData.totalAmount === null)
      ) {
        throw new Error("Either subtotal or totalAmount is required");
      }
      if (
        invoiceData.totalAmount === undefined ||
        invoiceData.totalAmount === null
      ) {
        throw new Error("totalAmount is required");
      }

      // Helper function to split invoice number into prefix and number
      const splitInvoiceNumber = (fullNumber: string, defaultPrefix: string = "INV"): { prefix: string; number: string } => {
        if (!fullNumber) {
          return { prefix: defaultPrefix, number: "" };
        }
        // Try to extract prefix and number (format: PREFIX-NUMBER, PREFIXNUMBER, or PREFIX NUMBER)
        // First try with separator (dash or space)
        const matchWithSeparator = fullNumber.match(/^([A-Za-z0-9]+)[\s-]+(.+)$/);
        if (matchWithSeparator) {
          return { prefix: matchWithSeparator[1].toUpperCase(), number: matchWithSeparator[2] };
        }
        // If no separator, try to find where numbers start (format: PREFIXNUMBER like INV001)
        const numberMatch = fullNumber.match(/^([A-Za-z]+)(\d+.*)$/);
        if (numberMatch) {
          return { prefix: numberMatch[1].toUpperCase(), number: numberMatch[2] };
        }
        // If it's all numbers, use default prefix
        if (/^\d+/.test(fullNumber)) {
          return { prefix: defaultPrefix, number: fullNumber };
        }
        // Default: use as number with default prefix
        return { prefix: defaultPrefix, number: fullNumber };
      };

      // Get default prefix from tenant settings or use "INV"
      const tenantSettings = await this.getInvoiceSettings(invoiceData.tenantId);
      const defaultPrefix = tenantSettings?.invoiceNumberPrefix || "INV";
      const startNumber = tenantSettings?.invoiceNumberStart || 1;

      // Generate invoice number if not provided
      let fullInvoiceNumber = invoiceData.invoiceNumber;
      
      if (!fullInvoiceNumber) {
        // Get existing invoices for this tenant to find the highest number
        const existingInvoices = await sql`
          SELECT invoice_prefix, invoice_number 
          FROM invoices 
          WHERE tenant_id = ${invoiceData.tenantId}
          ORDER BY created_at DESC
        `;

        let nextNumber = startNumber;

        if (existingInvoices.length > 0) {
          // Extract numbers from existing invoices
          const invoiceNumbers = existingInvoices
            .map((inv: any) => {
              const invPrefix = inv.invoice_prefix || defaultPrefix;
              const invNum = inv.invoice_number || "";
              
              if (!invNum) return 0;
              
              // Try to extract number - handle multiple formats
              // Pattern 1: PREFIX-NUMBER (e.g., INV-001)
              const matchWithDash = invNum.match(/^(\d+)$/);
              if (matchWithDash) {
                return parseInt(matchWithDash[1], 10);
              }
              
              // Pattern 2: Just numbers
              const matchNumbers = invNum.match(/(\d+)/);
              if (matchNumbers) {
                return parseInt(matchNumbers[1], 10);
              }
              
              return 0;
            })
            .filter((num: number) => num > 0);

          if (invoiceNumbers.length > 0) {
            const maxNumber = Math.max(...invoiceNumbers);
            nextNumber = Math.max(maxNumber + 1, startNumber);
            console.log(`🔢 Server: Found ${invoiceNumbers.length} existing invoices, max number: ${maxNumber}, next: ${nextNumber}`);
          } else {
            console.log(`🔢 Server: No valid invoice numbers found, using start number: ${startNumber}`);
          }
        } else {
          console.log(`🔢 Server: No existing invoices, using start number: ${startNumber}`);
        }

        // Generate invoice number without dash: INV001
        fullInvoiceNumber = `${defaultPrefix}${String(nextNumber).padStart(3, '0')}`;
        console.log(`🔢 Server: Generated invoice number: ${fullInvoiceNumber}`);
      }

      // Split invoice number into prefix and number
      const { prefix, number } = splitInvoiceNumber(fullInvoiceNumber, defaultPrefix);
      const invoiceNumber = number; // Store only the number part
      const invoicePrefix = prefix; // Store prefix separately

      // First, fix the sequence to ensure it's correct
      await sql`SELECT setval('invoices_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM invoices), false)`;

      // Sanitize numeric fields to ensure they're not undefined
      const subtotal = parseFloat(
        invoiceData.subtotal?.toString() ||
        invoiceData.totalAmount?.toString() ||
        "0",
      );
      const taxAmount = parseFloat(invoiceData.taxAmount?.toString() || "0");
      const totalAmount = parseFloat(
        invoiceData.totalAmount?.toString() || "0",
      );
      const discountAmount = parseFloat(invoiceData.discountAmount?.toString() || "0");
      const paidAmount = parseFloat(invoiceData.paidAmount?.toString() || "0");

      // Prepare issue date - use issueDate if provided, otherwise invoiceDate, otherwise today
      const issueDate = invoiceData.issueDate || invoiceData.invoiceDate || new Date().toISOString().split("T")[0];
      const dueDate = invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Store full line items as JSON for complete data preservation
      const lineItemsJson = JSON.stringify(invoiceData.lineItems || invoiceData.items || []);

      // Build the INSERT query with all available fields
      // Note: Some columns may not exist in the database yet - they should be added via migration
      const invoice = await sql`
        INSERT INTO invoices (
          tenant_id, customer_id, booking_id, invoice_prefix, invoice_number, status,
          invoice_date, issue_date, due_date, subtotal, tax_amount, discount_amount, total_amount, 
          paid_amount, currency, payment_method, payment_terms, is_tax_inclusive,
          notes, additional_notes, enable_reminder, reminder_frequency, reminder_specific_date, line_items
        ) VALUES (
          ${invoiceData.tenantId},
          ${invoiceData.customerId},
          ${invoiceData.bookingId || null},
          ${invoicePrefix},
          ${invoiceNumber},
          ${invoiceData.status || "draft"},
          ${issueDate},
          ${issueDate},
          ${invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]},
          ${subtotal},
          ${taxAmount},
          ${discountAmount},
          ${totalAmount},
          ${paidAmount},
          ${invoiceData.currency || "USD"},
          ${invoiceData.paymentMethod ? (Array.isArray(invoiceData.paymentMethod) ? JSON.stringify(invoiceData.paymentMethod) : invoiceData.paymentMethod) : null},
          ${invoiceData.paymentTerms || null},
          ${invoiceData.isTaxInclusive !== undefined ? invoiceData.isTaxInclusive : false},
          ${invoiceData.notes || invoiceData.description || null},
          ${invoiceData.additionalNotes || null},
          ${invoiceData.enableReminder || false},
          ${invoiceData.reminderFrequency || null},
          ${invoiceData.reminderSpecificDate || null},
          ${lineItemsJson}
        )
        RETURNING *
      `;

      const newInvoice = invoice[0];

      // Handle line items - check both lineItems and items for compatibility
      const lineItems = invoiceData.lineItems || invoiceData.items || [];

      if (lineItems.length > 0) {
        for (const item of lineItems) {
          // Build description from available fields
          const description = item.itemTitle || item.description || item.travelCategory || "Item";

          // Calculate unit price and total price
          const unitPrice = parseFloat(item.sellingPrice?.toString() || item.unitPrice?.toString() || "0");
          const quantity = parseInt(item.quantity?.toString() || "1");
          const tax = parseFloat(item.tax?.toString() || "0");
          const totalPrice = parseFloat(item.totalAmount?.toString() || item.totalPrice?.toString() || (unitPrice * quantity + tax).toString());

          // Store line item with basic fields
          // Additional fields (travelCategory, vendor, serviceProviderId, purchasePrice, taxRateId, etc.) 
          // can be stored in a JSON column if needed, or in a separate table
          await sql`
            INSERT INTO invoice_items (
              invoice_id, description, quantity, unit_price, total_price, package_id
            ) VALUES (
              ${newInvoice.id},
              ${description},
              ${quantity},
              ${unitPrice},
              ${totalPrice},
              ${item.packageId || null}
            )
          `;
        }
      }

      // Create expenses if provided (using new line items structure)
      if (invoiceData.expenses && Array.isArray(invoiceData.expenses) && invoiceData.expenses.length > 0) {
        for (const expense of invoiceData.expenses) {
          try {
            const expenseAmount = parseFloat(expense.amount?.toString() || "0");
            const expenseTaxAmount = parseFloat(expense.taxAmount?.toString() || "0");
            const expenseTaxRate = parseFloat(expense.taxRate?.toString() || "0");
            const expenseQuantity = parseFloat(expense.quantity?.toString() || "1");
            const expenseAmountPaid = parseFloat(expense.amountPaid?.toString() || "0");
            const expenseAmountDue = parseFloat(expense.amountDue?.toString() || expenseAmount.toString() || "0");
            const totalAmount = expenseAmount + expenseTaxAmount;

            // Get expense settings for default prefix
            const expenseSettings = await this.getExpenseSettings(invoiceData.tenantId);
            const defaultPrefix = expenseSettings?.expenseNumberPrefix || "EXP";

            // Split expense number into prefix and number
            const splitExpenseNumber = (fullNumber: string, defaultPrefix: string = "EXP"): { prefix: string; number: string } => {
              if (!fullNumber) {
                return { prefix: defaultPrefix, number: "" };
              }
              const matchWithSeparator = fullNumber.match(/^([A-Za-z0-9]+)[\s-]+(.+)$/);
              if (matchWithSeparator) {
                return { prefix: matchWithSeparator[1].toUpperCase(), number: matchWithSeparator[2] };
              }
              const numberMatch = fullNumber.match(/^([A-Za-z]+)(\d+.*)$/);
              if (numberMatch) {
                return { prefix: numberMatch[1].toUpperCase(), number: numberMatch[2] };
              }
              if (/^\d+/.test(fullNumber)) {
                return { prefix: defaultPrefix, number: fullNumber };
              }
              return { prefix: defaultPrefix, number: fullNumber };
            };

            const fullExpenseNumber = expense.expenseNumber || "";
            const { prefix: expensePrefix, number: expenseNumber } = splitExpenseNumber(fullExpenseNumber, defaultPrefix);

            // Create expense header
            const [createdExpense] = await sql`
              INSERT INTO expenses (
                tenant_id, expense_prefix, expense_number, title, description, quantity, amount, currency, category, subcategory,
                expense_date, payment_method, payment_reference, vendor_id, lead_type_id, expense_type,
                receipt_url, tax_amount, tax_rate, is_reimbursable, is_recurring, recurring_frequency,
                status, amount_paid, amount_due, tags, notes, created_by
              ) VALUES (
                ${invoiceData.tenantId},
                ${expensePrefix},
                ${expenseNumber || null},
                ${expense.title || "Expense"},
                ${expense.notes || expense.description || null},
                1,
                ${totalAmount},
                ${expense.currency || invoiceData.currency || "USD"},
                ${expense.category || "General"},
                ${expense.subcategory || expense.category || "General"},
                ${expense.expenseDate || issueDate},
                ${expense.paymentMethod || "bank_transfer"},
                ${expense.paymentReference || null},
                ${expense.vendorId || null},
                ${expense.leadTypeId || null},
                ${expense.expenseType || "purchase"},
                null,
                ${expenseTaxAmount},
                ${expenseTaxRate},
                ${expense.isReimbursable || false},
                ${expense.isRecurring || false},
                ${expense.recurringFrequency || null},
                ${expense.status || "pending"},
                ${expenseAmountPaid},
                ${expenseAmountDue},
                ${JSON.stringify(expense.tags || [])},
                ${expense.notes || null},
                ${invoiceData.userId || null}
              )
              RETURNING id
            `;

            // Create line item for this expense
            const paymentStatus = expense.status === "paid" ? "paid" : (expense.status === "due" ? "due" : "credit");
            await sql`
              INSERT INTO expense_line_items (
                expense_id, category, title, description, quantity, amount, tax_rate_id, tax_amount, tax_rate,
                total_amount, vendor_id, lead_type_id, payment_method, payment_status, amount_paid, amount_due,
                receipt_url, notes, display_order
              ) VALUES (
                ${createdExpense.id},
                ${expense.category || "General"},
                ${expense.title || "Expense"},
                ${expense.description || expense.notes || null},
                ${expenseQuantity},
                ${expenseAmount},
                ${expense.taxRateId || null},
                ${expenseTaxAmount},
                ${expenseTaxRate},
                ${totalAmount},
                ${expense.vendorId || null},
                ${expense.leadTypeId || null},
                ${expense.paymentMethod || "bank_transfer"},
                ${paymentStatus},
                ${expenseAmountPaid},
                ${expenseAmountDue},
                ${expense.receiptUrl || null},
                ${expense.notes || null},
                0
              )
            `;

            console.log(`✅ Created expense with line item: ${expense.title || "Expense"}`);
          } catch (expenseError) {
            console.error("⚠️ Failed to create expense:", expenseError);
            // Continue with other expenses even if one fails
          }
        }
      }

      // Create payment installments if provided
      if (invoiceData.installments && Array.isArray(invoiceData.installments) && invoiceData.installments.length > 0) {
        try {
          for (const installment of invoiceData.installments) {
            await sql`
              INSERT INTO payment_installments (
                invoice_id, tenant_id, installment_number, amount, due_date, 
                status, paid_amount, payment_method, notes, created_at, updated_at
              ) VALUES (
                ${newInvoice.id},
                ${invoiceData.tenantId},
                ${installment.installmentNumber || 1},
                ${parseFloat(installment.amount?.toString() || "0")},
                ${installment.dueDate || invoiceData.dueDate || dueDate},
                ${installment.status || "pending"},
                ${parseFloat(installment.paidAmount?.toString() || "0")},
                ${installment.paymentMethod || null},
                ${installment.notes || null},
                NOW(),
                NOW()
              )
            `;
          }
          console.log(`✅ Created ${invoiceData.installments.length} payment installments for invoice ${newInvoice.id}`);
        } catch (installmentError) {
          console.error("⚠️ Failed to create payment installments:", installmentError);
          // Continue even if installments fail
        }
      }

      // Log customer activity for invoice creation
      if (invoiceData.userId) {
        try {
          await this.createCustomerActivity({
            tenantId: invoiceData.tenantId,
            customerId: invoiceData.customerId,
            userId: invoiceData.userId,
            activityType: 12, // Invoice Created
            activityTitle: `Invoice Created: ${invoiceNumber}`,
            activityDescription: `New invoice created. Total amount: ${totalAmount}. Status: ${invoiceData.status || "draft"}`,
            activityStatus: 1,
          });
          console.log(
            `✅ Customer activity logged for invoice ${newInvoice.id}`,
          );
        } catch (activityError) {
          console.error("⚠️ Failed to log invoice activity:", activityError);
        }
      }

      // Combine prefix and number for backward compatibility (without dash: INV001)
      const newInvPrefix = newInvoice.invoice_prefix || "INV";
      const newInvNumber = newInvoice.invoice_number || "";

      // Update invoice settings starting number to the next number
      try {
        // Extract the numeric part from the invoice number
        const invoiceNumberValue = parseInt(newInvNumber, 10);
        if (!isNaN(invoiceNumberValue)) {
          // Increment the starting number to be one more than the current invoice number
          const nextStartNumber = invoiceNumberValue + 1;
          
          // Get current settings to preserve other values
          const currentSettings = await this.getInvoiceSettings(invoiceData.tenantId);
          
          // Update only the invoiceNumberStart
          await this.upsertInvoiceSettings(invoiceData.tenantId, {
            ...currentSettings,
            invoiceNumberStart: nextStartNumber,
          });
          
          console.log(`✅ Updated invoice settings: invoiceNumberStart set to ${nextStartNumber} (was ${currentSettings.invoiceNumberStart || startNumber})`);
        }
      } catch (settingsError) {
        console.error("⚠️ Failed to update invoice settings starting number:", settingsError);
        // Don't fail the invoice creation if settings update fails
      }
      const fullNewInvoiceNumber = newInvPrefix && newInvNumber 
        ? `${newInvPrefix}${newInvNumber}` 
        : newInvNumber || newInvoice.invoice_number;

      return {
        id: newInvoice.id,
        tenantId: newInvoice.tenant_id,
        customerId: newInvoice.customer_id,
        bookingId: newInvoice.booking_id,
        invoiceNumber: fullNewInvoiceNumber,
        invoicePrefix: newInvPrefix,
        status: newInvoice.status,
        issueDate: newInvoice.issue_date || newInvoice.invoice_date,
        dueDate: newInvoice.due_date,
        subtotal: parseFloat(newInvoice.subtotal),
        taxAmount: parseFloat(newInvoice.tax_amount || "0"),
        discountAmount: parseFloat(newInvoice.discount_amount || "0"),
        totalAmount: parseFloat(newInvoice.total_amount),
        paidAmount: parseFloat(newInvoice.paid_amount || "0"),
        currency: newInvoice.currency || "USD",
        paymentMethod: newInvoice.payment_method ? (() => {
          try {
            const parsed = JSON.parse(newInvoice.payment_method);
            return Array.isArray(parsed) ? parsed : [newInvoice.payment_method];
          } catch {
            return [newInvoice.payment_method];
          }
        })() : null,
        paymentTerms: newInvoice.payment_terms || null,
        isTaxInclusive: newInvoice.is_tax_inclusive || false,
        notes: newInvoice.notes,
        additionalNotes: newInvoice.additional_notes || null,
        enableReminder: newInvoice.enable_reminder || false,
        reminderFrequency: newInvoice.reminder_frequency || null,
        reminderSpecificDate: newInvoice.reminder_specific_date || null,
        createdAt: newInvoice.created_at,
      };
    } catch (error) {
      console.error("Invoice creation error:", error);
      throw error;
    }
  }

  async updateInvoice(invoiceId: number, invoiceData: any) {
    try {
      console.log("Updating invoice with data:", invoiceData);

      // Store full line items as JSON for complete data preservation
      const lineItemsJson = invoiceData.lineItems || invoiceData.items ? JSON.stringify(invoiceData.lineItems || invoiceData.items || []) : null;

      // Handle invoice number update - split prefix and number if provided
      let invoicePrefixUpdate = null;
      let invoiceNumberUpdate = null;
      if (invoiceData.invoiceNumber !== undefined) {
        const tenantSettings = await this.getInvoiceSettings(invoiceData.tenantId || (await sql`SELECT tenant_id FROM invoices WHERE id = ${invoiceId}`)[0]?.tenant_id);
        const defaultPrefix = tenantSettings?.invoiceNumberPrefix || "INV";
        const splitResult = (() => {
          const fullNumber = invoiceData.invoiceNumber || "";
          if (!fullNumber) {
            return { prefix: defaultPrefix, number: "" };
          }
          const match = fullNumber.match(/^([A-Za-z0-9]+)[\s-]+(.+)$/);
          if (match) {
            return { prefix: match[1].toUpperCase(), number: match[2] };
          }
          const numberMatch = fullNumber.match(/^([A-Za-z]+)(\d+.*)$/);
          if (numberMatch) {
            return { prefix: numberMatch[1].toUpperCase(), number: numberMatch[2] };
          }
          if (/^\d+/.test(fullNumber)) {
            return { prefix: defaultPrefix, number: fullNumber };
          }
          return { prefix: defaultPrefix, number: fullNumber };
        })();
        invoicePrefixUpdate = splitResult.prefix;
        invoiceNumberUpdate = splitResult.number;
      }

      // Sanitize and validate data before update
      const cleanData = {
        customerId: invoiceData.customerId !== undefined ? invoiceData.customerId : null,
        bookingId: invoiceData.bookingId !== undefined ? invoiceData.bookingId : null,
        invoicePrefix: invoicePrefixUpdate,
        invoiceNumber: invoiceNumberUpdate,
        status: invoiceData.status || null,
        issueDate: invoiceData.issueDate || invoiceData.invoiceDate || null,
        dueDate: invoiceData.dueDate || null,
        subtotal: invoiceData.subtotal !== undefined ? parseFloat(invoiceData.subtotal?.toString() || "0") : null,
        taxAmount: invoiceData.taxAmount !== undefined ? parseFloat(invoiceData.taxAmount?.toString() || "0") : null,
        discountAmount: invoiceData.discountAmount !== undefined ? parseFloat(invoiceData.discountAmount?.toString() || "0") : null,
        totalAmount: invoiceData.totalAmount !== undefined ? parseFloat(invoiceData.totalAmount?.toString() || "0") : null,
        paidAmount: invoiceData.paidAmount !== undefined ? parseFloat(invoiceData.paidAmount?.toString() || "0") : null,
        currency: invoiceData.currency || null,
        paymentMethod: invoiceData.paymentMethod ? (Array.isArray(invoiceData.paymentMethod) ? JSON.stringify(invoiceData.paymentMethod) : invoiceData.paymentMethod) : null,
        paymentTerms: invoiceData.paymentTerms || null,
        isTaxInclusive: invoiceData.isTaxInclusive !== undefined ? invoiceData.isTaxInclusive : null,
        notes: invoiceData.notes !== undefined ? invoiceData.notes : null,
        additionalNotes: invoiceData.additionalNotes !== undefined ? invoiceData.additionalNotes : null,
        enableReminder: invoiceData.enableReminder !== undefined ? invoiceData.enableReminder : null,
        reminderFrequency: invoiceData.reminderFrequency || null,
        reminderSpecificDate: invoiceData.reminderSpecificDate || null,
        lineItems: lineItemsJson,
      };

      console.log("Clean update data:", cleanData);

      const invoice = await sql`
        UPDATE invoices 
        SET 
          customer_id = COALESCE(${cleanData.customerId}, customer_id),
          booking_id = COALESCE(${cleanData.bookingId}, booking_id),
          invoice_prefix = COALESCE(${cleanData.invoicePrefix}, invoice_prefix),
          invoice_number = COALESCE(${cleanData.invoiceNumber}, invoice_number),
          status = COALESCE(${cleanData.status}, status),
          issue_date = COALESCE(${cleanData.issueDate}, issue_date),
          invoice_date = COALESCE(${cleanData.issueDate}, invoice_date),
          due_date = COALESCE(${cleanData.dueDate}, due_date),
          subtotal = COALESCE(${cleanData.subtotal}, subtotal),
          tax_amount = COALESCE(${cleanData.taxAmount}, tax_amount),
          discount_amount = COALESCE(${cleanData.discountAmount}, discount_amount),
          total_amount = COALESCE(${cleanData.totalAmount}, total_amount),
          paid_amount = COALESCE(${cleanData.paidAmount}, paid_amount),
          currency = COALESCE(${cleanData.currency}, currency),
          payment_method = COALESCE(${cleanData.paymentMethod}, payment_method),
          payment_terms = COALESCE(${cleanData.paymentTerms}, payment_terms),
          is_tax_inclusive = COALESCE(${cleanData.isTaxInclusive}, is_tax_inclusive),
          notes = COALESCE(${cleanData.notes}, notes),
          additional_notes = COALESCE(${cleanData.additionalNotes}, additional_notes),
          enable_reminder = COALESCE(${cleanData.enableReminder}, enable_reminder),
          reminder_frequency = COALESCE(${cleanData.reminderFrequency}, reminder_frequency),
          reminder_specific_date = COALESCE(${cleanData.reminderSpecificDate}, reminder_specific_date),
          line_items = COALESCE(${cleanData.lineItems}, line_items),
          updated_at = NOW()
        WHERE id = ${invoiceId}
        RETURNING *
      `;

      if (invoice.length === 0) {
        throw new Error("Invoice not found");
      }

      const updatedInvoice = invoice[0];

      // Combine prefix and number for backward compatibility (without dash: INV001)
      const updatedInvPrefix = updatedInvoice.invoice_prefix || "INV";
      const updatedInvNumber = updatedInvoice.invoice_number || "";
      const fullUpdatedInvoiceNumber = updatedInvPrefix && updatedInvNumber 
        ? `${updatedInvPrefix}${updatedInvNumber}` 
        : updatedInvNumber || updatedInvoice.invoice_number;

      // Also update invoice_items table if line items are provided
      if (invoiceData.lineItems && Array.isArray(invoiceData.lineItems)) {
        // Delete existing items
        await sql`DELETE FROM invoice_items WHERE invoice_id = ${invoiceId}`;

        // Insert new items
        for (const item of invoiceData.lineItems) {
          const description = item.itemTitle || item.description || item.travelCategory || "Item";
          const unitPrice = parseFloat(item.sellingPrice?.toString() || item.unitPrice?.toString() || "0");
          const quantity = parseInt(item.quantity?.toString() || "1");
          const tax = parseFloat(item.tax?.toString() || "0");
          const totalPrice = parseFloat(item.totalAmount?.toString() || item.totalPrice?.toString() || (unitPrice * quantity + tax).toString());

          await sql`
            INSERT INTO invoice_items (
              invoice_id, description, quantity, unit_price, total_price, package_id
            ) VALUES (
              ${invoiceId},
              ${description},
              ${quantity},
              ${unitPrice},
              ${totalPrice},
              ${item.packageId || null}
            )
          `;
        }
      }

      // Update payment installments if provided
      if (invoiceData.installments !== undefined) {
        // Get tenantId from invoiceData or updatedInvoice
        const tenantId = invoiceData.tenantId || updatedInvoice.tenant_id;

        // Delete existing installments
        await sql`DELETE FROM payment_installments WHERE invoice_id = ${invoiceId} AND tenant_id = ${tenantId}`;

        // Create new installments if provided
        if (Array.isArray(invoiceData.installments) && invoiceData.installments.length > 0) {
          try {
            for (const installment of invoiceData.installments) {
              await sql`
                INSERT INTO payment_installments (
                  invoice_id, tenant_id, installment_number, amount, due_date, 
                  status, paid_amount, payment_method, notes, created_at, updated_at
                ) VALUES (
                  ${invoiceId},
                  ${tenantId},
                  ${installment.installmentNumber || 1},
                  ${parseFloat(installment.amount?.toString() || "0")},
                  ${installment.dueDate || updatedInvoice.due_date},
                  ${installment.status || "pending"},
                  ${parseFloat(installment.paidAmount?.toString() || "0")},
                  ${installment.paymentMethod || null},
                  ${installment.notes || null},
                  NOW(),
                  NOW()
                )
              `;
            }
            console.log(`✅ Updated payment installments for invoice ${invoiceId}`);
          } catch (installmentError) {
            console.error("⚠️ Failed to update payment installments:", installmentError);
            // Continue even if installments fail
          }
        }
      }

      return {
        id: updatedInvoice.id,
        tenantId: updatedInvoice.tenant_id,
        customerId: updatedInvoice.customer_id,
        bookingId: updatedInvoice.booking_id,
        invoiceNumber: fullUpdatedInvoiceNumber,
        invoicePrefix: updatedInvPrefix,
        status: updatedInvoice.status,
        issueDate: updatedInvoice.issue_date || updatedInvoice.invoice_date,
        dueDate: updatedInvoice.due_date,
        subtotal: parseFloat(updatedInvoice.subtotal || "0"),
        taxAmount: parseFloat(updatedInvoice.tax_amount || "0"),
        discountAmount: parseFloat(updatedInvoice.discount_amount || "0"),
        totalAmount: parseFloat(updatedInvoice.total_amount || "0"),
        paidAmount: parseFloat(updatedInvoice.paid_amount || "0"),
        currency: updatedInvoice.currency || "USD",
        paymentMethod: updatedInvoice.payment_method ? (() => {
          try {
            const parsed = JSON.parse(updatedInvoice.payment_method);
            return Array.isArray(parsed) ? parsed : [updatedInvoice.payment_method];
          } catch {
            return [updatedInvoice.payment_method];
          }
        })() : null,
        paymentTerms: updatedInvoice.payment_terms || null,
        isTaxInclusive: updatedInvoice.is_tax_inclusive || false,
        notes: updatedInvoice.notes,
        additionalNotes: updatedInvoice.additional_notes || null,
        enableReminder: updatedInvoice.enable_reminder || false,
        reminderFrequency: updatedInvoice.reminder_frequency || null,
        reminderSpecificDate: updatedInvoice.reminder_specific_date || null,
        createdAt: updatedInvoice.created_at,
        updatedAt: updatedInvoice.updated_at,
      };
    } catch (error) {
      console.error("Invoice update error:", error);
      throw error;
    }
  }

  async getInvoiceItems(invoiceId: number) {
    const items = await sql`
      SELECT 
        ii.*,
        tp.name as package_name
      FROM invoice_items ii
      LEFT JOIN travel_packages tp ON ii.package_id = tp.id
      WHERE ii.invoice_id = ${invoiceId}
      ORDER BY ii.id
    `;

    return items.map((item) => ({
      id: item.id,
      invoiceId: item.invoice_id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price),
      totalPrice: parseFloat(item.total_price),
      packageId: item.package_id,
      packageName: item.package_name,
    }));
  }

  async getInvoiceStats(tenantId: number) {
    const stats = await sql`
      SELECT 
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pending' OR status = 'overdue' THEN total_amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN status = 'overdue' THEN total_amount ELSE 0 END) as total_overdue,
        SUM(CASE WHEN status = 'draft' THEN total_amount ELSE 0 END) as total_draft,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count
      FROM invoices 
      WHERE tenant_id = ${tenantId}
    `;

    const result = stats[0];
    return {
      totalInvoices: parseInt(result.total_invoices),
      totalPaid: parseFloat(result.total_paid || 0),
      totalPending: parseFloat(result.total_pending || 0),
      totalOverdue: parseFloat(result.total_overdue || 0),
      totalDraft: parseFloat(result.total_draft || 0),
      overdueCount: parseInt(result.overdue_count || 0),
      draftCount: parseInt(result.draft_count || 0),
    };
  }

  // Subscription management methods
  async getTenantSubscription(tenantId: number) {
    try {
      const [subscription] = await sql`
        SELECT * FROM tenant_subscriptions 
        WHERE tenant_id = ${tenantId} 
        AND status != 'cancelled'
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (!subscription) return null;

      return {
        id: subscription.id,
        tenantId: subscription.tenant_id,
        planId: subscription.plan_id,
        status: subscription.status,
        billingCycle: subscription.billing_cycle,
        paymentGateway: subscription.payment_gateway,
        gatewaySubscriptionId: subscription.gateway_subscription_id,
        gatewayCustomerId: subscription.gateway_customer_id,
        trialEndsAt: subscription.trial_ends_at,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        nextBillingDate: subscription.next_billing_date,
        lastPaymentDate: subscription.last_payment_date,
        failedPaymentAttempts: subscription.failed_payment_attempts,
        cancelledAt: subscription.cancelled_at,
        createdAt: subscription.created_at,
        updatedAt: subscription.updated_at,
      };
    } catch (error) {
      console.error("Error getting tenant subscription:", error);
      return null;
    }
  }

  async createTenantSubscription(subscriptionData: any) {
    try {
      const [newSubscription] = await sql`
        INSERT INTO tenant_subscriptions (
          tenant_id,
          plan_id,
          status,
          billing_cycle,
          payment_gateway,
          gateway_subscription_id,
          gateway_customer_id,
          trial_ends_at,
          current_period_start,
          current_period_end,
          next_billing_date,
          failed_payment_attempts
        ) VALUES (
          ${subscriptionData.tenantId},
          ${subscriptionData.planId},
          ${subscriptionData.status},
          ${subscriptionData.billingCycle},
          ${subscriptionData.paymentGateway},
          ${subscriptionData.gatewaySubscriptionId},
          ${subscriptionData.gatewayCustomerId},
          ${subscriptionData.trialEndsAt},
          ${subscriptionData.currentPeriodStart},
          ${subscriptionData.currentPeriodEnd},
          ${subscriptionData.nextBillingDate},
          ${subscriptionData.failedPaymentAttempts}
        )
        RETURNING *
      `;

      return {
        id: newSubscription.id,
        tenantId: newSubscription.tenant_id,
        planId: newSubscription.plan_id,
        status: newSubscription.status,
        billingCycle: newSubscription.billing_cycle,
        paymentGateway: newSubscription.payment_gateway,
        gatewaySubscriptionId: newSubscription.gateway_subscription_id,
        gatewayCustomerId: newSubscription.gateway_customer_id,
        trialEndsAt: newSubscription.trial_ends_at,
        currentPeriodStart: newSubscription.current_period_start,
        currentPeriodEnd: newSubscription.current_period_end,
        nextBillingDate: newSubscription.next_billing_date,
        failedPaymentAttempts: newSubscription.failed_payment_attempts,
        createdAt: newSubscription.created_at,
        updatedAt: newSubscription.updated_at,
      };
    } catch (error) {
      console.error("Error creating tenant subscription:", error);
      throw error;
    }
  }

  async updateTenantSubscription(subscriptionId: number, updateData: any) {
    try {
      const [updatedSubscription] = await sql`
        UPDATE tenant_subscriptions 
        SET 
          status = COALESCE(${updateData.status}, status),
          current_period_start = COALESCE(${updateData.currentPeriodStart}, current_period_start),
          current_period_end = COALESCE(${updateData.currentPeriodEnd}, current_period_end),
          next_billing_date = COALESCE(${updateData.nextBillingDate}, next_billing_date),
          last_payment_date = COALESCE(${updateData.lastPaymentDate}, last_payment_date),
          failed_payment_attempts = COALESCE(${updateData.failedPaymentAttempts}, failed_payment_attempts),
          cancelled_at = COALESCE(${updateData.cancelledAt}, cancelled_at),
          updated_at = NOW()
        WHERE id = ${subscriptionId}
        RETURNING *
      `;

      return updatedSubscription;
    } catch (error) {
      console.error("Error updating tenant subscription:", error);
      throw error;
    }
  }

  async createPaymentHistory(paymentData: any) {
    try {
      const [payment] = await sql`
        INSERT INTO payment_history (
          tenant_id,
          subscription_id,
          payment_gateway,
          gateway_payment_id,
          amount,
          currency,
          status,
          payment_method,
          failure_reason,
          receipt_url
        ) VALUES (
          ${paymentData.tenantId},
          ${paymentData.subscriptionId},
          ${paymentData.paymentGateway},
          ${paymentData.gatewayPaymentId},
          ${paymentData.amount},
          ${paymentData.currency},
          ${paymentData.status},
          ${paymentData.paymentMethod},
          ${paymentData.failureReason || null},
          ${paymentData.receiptUrl || null}
        )
        RETURNING *
      `;

      return payment;
    } catch (error) {
      console.error("Error creating payment history:", error);
      throw error;
    }
  }

  async getPaymentHistory(tenantId: number) {
    try {
      const payments = await sql`
        SELECT * FROM payment_history 
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC
        LIMIT 50
      `;

      return payments.map((payment) => ({
        id: payment.id,
        tenantId: payment.tenant_id,
        subscriptionId: payment.subscription_id,
        paymentGateway: payment.payment_gateway,
        gatewayPaymentId: payment.gateway_payment_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.payment_method,
        failureReason: payment.failure_reason,
        receiptUrl: payment.receipt_url,
        createdAt: payment.created_at,
      }));
    } catch (error) {
      console.error("Error getting payment history:", error);
      return [];
    }
  }

  async createPaymentMethod(methodData: any) {
    try {
      const [method] = await sql`
        INSERT INTO payment_methods (
          tenant_id,
          payment_gateway,
          gateway_method_id,
          type,
          last4,
          brand,
          expiry_month,
          expiry_year,
          is_default,
          is_active
        ) VALUES (
          ${methodData.tenantId},
          ${methodData.paymentGateway},
          ${methodData.gatewayMethodId},
          ${methodData.type},
          ${methodData.last4 || null},
          ${methodData.brand || null},
          ${methodData.expiryMonth || null},
          ${methodData.expiryYear || null},
          ${methodData.isDefault || false},
          ${methodData.isActive || true}
        )
        RETURNING *
      `;

      return method;
    } catch (error) {
      console.error("Error creating payment method:", error);
      throw error;
    }
  }

  async getPaymentMethods(tenantId: number) {
    try {
      const methods = await sql`
        SELECT * FROM payment_methods 
        WHERE tenant_id = ${tenantId} AND is_active = true
        ORDER BY is_default DESC, created_at DESC
      `;

      return methods.map((method) => ({
        id: method.id,
        tenantId: method.tenant_id,
        paymentGateway: method.payment_gateway,
        gatewayMethodId: method.gateway_method_id,
        type: method.type,
        last4: method.last4,
        brand: method.brand,
        expiryMonth: method.expiry_month,
        expiryYear: method.expiry_year,
        isDefault: method.is_default,
        isActive: method.is_active,
        createdAt: method.created_at,
      }));
    } catch (error) {
      console.error("Error getting payment methods:", error);
      return [];
    }
  }

  async updatePaymentMethod(methodId: number, updateData: any) {
    try {
      const [updatedMethod] = await sql`
        UPDATE payment_methods 
        SET 
          is_default = COALESCE(${updateData.isDefault}, is_default),
          is_active = COALESCE(${updateData.isActive}, is_active)
        WHERE id = ${methodId}
        RETURNING *
      `;

      return updatedMethod;
    } catch (error) {
      console.error("Error updating payment method:", error);
      throw error;
    }
  }

  async deletePaymentMethod(methodId: number) {
    try {
      await sql`
        UPDATE payment_methods 
        SET is_active = false
        WHERE id = ${methodId}
      `;
      return { success: true };
    } catch (error) {
      console.error("Error deleting payment method:", error);
      throw error;
    }
  }
  // Communications management methods
  async getCommunicationsByTenant(tenantId: number) {
    try {
      const communications = await sql`
        SELECT 
          c.*,
          cust.name as customer_name,
          l.name as lead_name
        FROM communications c
        LEFT JOIN customers cust ON c.customer_id = cust.id
        LEFT JOIN leads l ON c.lead_id = l.id
        WHERE c.tenant_id = ${tenantId}
        ORDER BY c.created_at DESC
      `;

      return communications.map((comm) => ({
        id: comm.id,
        type: comm.type,
        subject: comm.subject,
        content: comm.content,
        direction: comm.direction,
        status: comm.status,
        priority: comm.priority,
        customerId: comm.customer_id,
        customerName: comm.customer_name,
        leadId: comm.lead_id,
        leadName: comm.lead_name,
        createdAt: comm.created_at,
        updatedAt: comm.updated_at,
        createdBy: comm.created_by,
        tags: comm.tags ? JSON.parse(comm.tags) : [],
        attachments: comm.attachments ? JSON.parse(comm.attachments) : [],
      }));
    } catch (error) {
      console.error("Error fetching communications:", error);
      throw error;
    }
  }

  async createCommunication(communicationData: any) {
    try {
      const [newCommunication] = await sql`
        INSERT INTO communications (
          tenant_id,
          type,
          subject,
          content,
          direction,
          status,
          priority,
          customer_id,
          lead_id,
          created_by,
          created_by_user_id,
          tags,
          attachments,
          created_at,
          updated_at
        ) VALUES (
          ${communicationData.tenantId},
          ${communicationData.type},
          ${communicationData.subject || ""},
          ${communicationData.content || ""},
          ${communicationData.direction || "outbound"},
          ${communicationData.status || "sent"},
          ${communicationData.priority || "medium"},
          ${communicationData.customerId || null},
          ${communicationData.leadId || null},
          ${communicationData.createdBy || "System"},
          ${communicationData.createdByUserId || null},
          ${communicationData.tags ? JSON.stringify(communicationData.tags) : null},
          ${communicationData.attachments ? JSON.stringify(communicationData.attachments) : null},
          NOW(),
          NOW()
        )
        RETURNING *
      `;

      return {
        id: newCommunication.id,
        type: newCommunication.type,
        subject: newCommunication.subject,
        content: newCommunication.content,
        direction: newCommunication.direction,
        status: newCommunication.status,
        priority: newCommunication.priority,
        customerId: newCommunication.customer_id,
        leadId: newCommunication.lead_id,
        createdAt: newCommunication.created_at,
        updatedAt: newCommunication.updated_at,
        createdBy: newCommunication.created_by,
        tags: newCommunication.tags ? JSON.parse(newCommunication.tags) : [],
        attachments: newCommunication.attachments
          ? JSON.parse(newCommunication.attachments)
          : [],
      };
    } catch (error) {
      console.error("Error creating communication:", error);
      throw error;
    }
  }

  async updateCommunication(communicationId: number, updateData: any) {
    try {
      const [updatedCommunication] = await sql`
        UPDATE communications 
        SET 
          subject = COALESCE(${updateData.subject}, subject),
          content = COALESCE(${updateData.content}, content),
          status = COALESCE(${updateData.status}, status),
          priority = COALESCE(${updateData.priority}, priority),
          tags = COALESCE(${updateData.tags ? JSON.stringify(updateData.tags) : null}, tags),
          updated_at = NOW()
        WHERE id = ${communicationId}
        RETURNING *
      `;

      return updatedCommunication;
    } catch (error) {
      console.error("Error updating communication:", error);
      throw error;
    }
  }

  async deleteCommunication(communicationId: number) {
    try {
      await sql`DELETE FROM communications WHERE id = ${communicationId}`;
    } catch (error) {
      console.error("Error deleting communication:", error);
      throw error;
    }
  }

  // Tasks management methods
  async getTasksByTenant(tenantId: number) {
    try {
      // Check if tasks table exists
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'tasks'
        )
      `;
      
      if (!tableExists[0]?.exists) {
        console.warn("tasks table does not exist. Returning empty array.");
        return [];
      }

      const tasks = await sql`
        SELECT 
          t.*,
          cust.name as customer_name,
          l.name as lead_name
        FROM tasks t
        LEFT JOIN customers cust ON t.customer_id = cust.id
        LEFT JOIN leads l ON t.lead_id = l.id
        WHERE t.tenant_id = ${tenantId}
        ORDER BY 
          CASE 
            WHEN t.status = 'overdue' THEN 1
            WHEN t.status = 'pending' THEN 2
            WHEN t.status = 'in_progress' THEN 3
            ELSE 4
          END,
          t.due_date ASC
      `;

      return tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        type: task.type,
        dueDate: task.due_date,
        completedAt: task.completed_at,
        assignedTo: task.assigned_to,
        assignedToId: task.assigned_to_id,
        customerId: task.customer_id,
        customerName: task.customer_name,
        leadId: task.lead_id,
        leadName: task.lead_name,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        tags: task.tags ? JSON.parse(task.tags) : [],
        notes: task.notes,
        estimatedDuration: task.estimated_duration,
        actualDuration: task.actual_duration,
      }));
    } catch (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }
  }

  async createTask(taskData: any) {
    try {
      const [newTask] = await sql`
        INSERT INTO tasks (
          tenant_id,
          title,
          description,
          status,
          priority,
          type,
          due_date,
          assigned_to,
          assigned_to_id,
          customer_id,
          lead_id,
          tags,
          notes,
          estimated_duration,
          created_at,
          updated_at
        ) VALUES (
          ${taskData.tenantId},
          ${taskData.title},
          ${taskData.description},
          ${taskData.status || "pending"},
          ${taskData.priority || "medium"},
          ${taskData.type || "general"},
          ${taskData.dueDate},
          ${taskData.assignedTo},
          ${taskData.assignedToId},
          ${taskData.customerId || null},
          ${taskData.leadId || null},
          ${taskData.tags ? JSON.stringify(taskData.tags) : null},
          ${taskData.notes || null},
          ${taskData.estimatedDuration || null},
          NOW(),
          NOW()
        )
        RETURNING *
      `;

      return {
        id: newTask.id,
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        type: newTask.type,
        dueDate: newTask.due_date,
        assignedTo: newTask.assigned_to,
        assignedToId: newTask.assigned_to_id,
        customerId: newTask.customer_id,
        leadId: newTask.lead_id,
        createdAt: newTask.created_at,
        updatedAt: newTask.updated_at,
        tags: newTask.tags ? JSON.parse(newTask.tags) : [],
        notes: newTask.notes,
        estimatedDuration: newTask.estimated_duration,
      };
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  }

  async updateTask(taskId: number, updateData: any) {
    try {
      const updateFields: any = {
        updated_at: "NOW()",
      };

      if (updateData.title) updateFields.title = updateData.title;
      if (updateData.description)
        updateFields.description = updateData.description;
      if (updateData.status) {
        updateFields.status = updateData.status;
        if (updateData.status === "completed") {
          updateFields.completed_at = "NOW()";
        }
      }
      if (updateData.priority) updateFields.priority = updateData.priority;
      if (updateData.dueDate) updateFields.due_date = updateData.dueDate;
      if (updateData.notes) updateFields.notes = updateData.notes;
      if (updateData.actualDuration)
        updateFields.actual_duration = updateData.actualDuration;
      if (updateData.tags) updateFields.tags = JSON.stringify(updateData.tags);

      const [updatedTask] = await sql`
        UPDATE tasks 
        SET 
          title = COALESCE(${updateData.title}, title),
          description = COALESCE(${updateData.description}, description),
          status = COALESCE(${updateData.status}, status),
          priority = COALESCE(${updateData.priority}, priority),
          due_date = COALESCE(${updateData.dueDate}, due_date),
          notes = COALESCE(${updateData.notes}, notes),
          actual_duration = COALESCE(${updateData.actualDuration}, actual_duration),
          tags = COALESCE(${updateData.tags ? JSON.stringify(updateData.tags) : null}, tags),
          completed_at = CASE WHEN ${updateData.status} = 'completed' THEN NOW() ELSE completed_at END,
          updated_at = NOW()
        WHERE id = ${taskId}
        RETURNING *
      `;

      return updatedTask;
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  }

  async deleteTask(taskId: number) {
    try {
      await sql`DELETE FROM tasks WHERE id = ${taskId}`;
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  }

  // ========================================
  // USER MANAGEMENT SYSTEM METHODS
  // ========================================

  // Assignment Management Methods
  async assignEntityToUser(
    entityType: string,
    entityId: number,
    userId: number | null,
    assignedBy: number,
    reason: string = "manual_assignment",
  ) {
    try {
      // Get user details for assignment (if userId is provided)
      let fullName = "Unassigned";
      if (userId) {
        const [user] =
          await sql`SELECT first_name, last_name FROM users WHERE id = ${userId}`;
        if (user) {
          fullName = `${user.first_name} ${user.last_name}`;
        }
      }

      // Get current assignment for history tracking
      let previousUserId = null;
      if (entityType === "lead") {
        const [currentLead] =
          await sql`SELECT assigned_user_id FROM leads WHERE id = ${entityId}`;
        previousUserId = currentLead?.assigned_user_id;

        // Update lead assignment (allow null to unassign)
        await sql`
          UPDATE leads 
          SET assigned_user_id = ${userId}, 
              assigned_at = ${userId ? sql`NOW()` : sql`NULL`}, 
              assigned_by = ${assignedBy}, 
              last_activity_user_id = ${userId || assignedBy}
          WHERE id = ${entityId}
        `;
      } else if (entityType === "customer") {
        const [currentCustomer] =
          await sql`SELECT assigned_user_id FROM customers WHERE id = ${entityId}`;
        previousUserId = currentCustomer?.assigned_user_id;

        // Update customer assignment (allow null to unassign)
        await sql`
          UPDATE customers 
          SET assigned_user_id = ${userId}, 
              assigned_at = ${userId ? sql`NOW()` : sql`NULL`}, 
              assigned_by = ${assignedBy}, 
              last_activity_user_id = ${userId || assignedBy}
          WHERE id = ${entityId}
        `;
      }

      const tenantId = await this.getTenantIdFromEntity(entityType, entityId);

      // Log assignment history (only if userId is provided)
      if (userId) {
        await this.logAssignmentHistory({
          tenantId,
          entityType,
          entityId,
          previousUserId,
          newUserId: userId,
          assignedBy,
          reason,
        });
      }

      // For leads, also log to lead activities
      if (entityType === "lead" && userId) {
        try {
          const [lead] = await sql`SELECT first_name, last_name, name FROM leads WHERE id = ${entityId}`;
          const leadName = lead?.name || `${lead?.first_name || ''} ${lead?.last_name || ''}`.trim() || `Lead #${entityId}`;
          const [previousUser] = previousUserId 
            ? await sql`SELECT first_name, last_name FROM users WHERE id = ${previousUserId}`
            : [null];
          const previousUserName = previousUser ? `${previousUser.first_name} ${previousUser.last_name}` : "Unassigned";
          
          await this.saveLeadActivity({
            tenant_id: tenantId,
            lead_id: entityId,
            user_id: assignedBy,
            activity_type: 2, // ASSIGNMENT activity type
            activity_title: userId ? `Lead Assigned to ${fullName}` : "Lead Unassigned",
            activity_description: userId 
              ? `Lead "${leadName}" was assigned from ${previousUserName} to ${fullName}`
              : `Lead "${leadName}" was unassigned from ${previousUserName}`,
            activity_status: 1,
          });
        } catch (error) {
          console.error("Error logging lead activity for assignment:", error);
          // Don't throw - allow assignment to continue
        }
      }

      // Create notification and send email only if userId is provided
      if (userId) {
        // Create notification for assigned user
        await this.createNotification({
          tenantId,
          userId,
          title: `New ${entityType} Assigned`,
          message: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} has been assigned to you`,
          type: "assignment",
          entityType,
          entityId,
          priority: "medium",
        });

        // Send email notification for lead assignments
        if (entityType === "lead") {
          try {
            const [assignedUser] = await sql`SELECT email, first_name, last_name FROM users WHERE id = ${userId}`;
            const [lead] = await sql`
              SELECT 
                l.id,
                l.first_name,
                l.last_name,
                l.name,
                l.email,
                l.phone,
                l.source,
                l.status,
                l.priority,
                l.budget_range,
                l.country,
                l.state,
                l.city,
                l.notes,
                l.created_at,
                l.score,
                lt.name as lead_type_name
              FROM leads l
              LEFT JOIN lead_types lt ON l.lead_type_id = lt.id
              WHERE l.id = ${entityId}
            `;
            
            if (assignedUser?.email && lead) {
              const leadName = lead?.name || `${lead?.first_name || ''} ${lead?.last_name || ''}`.trim() || `Lead #${entityId}`;
              const emailService = (await import("./email-service")).emailService;
              
              // Format created date
              const createdDate = lead.created_at 
                ? new Date(lead.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'N/A';
              
              // Build details HTML
              const detailsHtml = `
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Lead ID:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">#${lead.id}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Name:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${leadName}</td>
                  </tr>
                  ${lead.email ? `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Email:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><a href="mailto:${lead.email}">${lead.email}</a></td>
                  </tr>
                  ` : ''}
                  ${lead.phone ? `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Phone:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><a href="tel:${lead.phone}">${lead.phone}</a></td>
                  </tr>
                  ` : ''}
                  ${lead.source ? `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Source:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${lead.source}</td>
                  </tr>
                  ` : ''}
                  ${lead.lead_type_name ? `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Lead Type:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${lead.lead_type_name}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Status:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">
                      <span style="background-color: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: capitalize;">
                        ${lead.status || 'New'}
                      </span>
                    </td>
                  </tr>
                  ${lead.priority ? `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Priority:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">
                      <span style="background-color: #fff3e0; color: #f57c00; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: capitalize;">
                        ${lead.priority}
                      </span>
                    </td>
                  </tr>
                  ` : ''}
                  ${lead.score ? `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Score:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${lead.score}</td>
                  </tr>
                  ` : ''}
                  ${lead.budget_range ? `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Budget Range:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${lead.budget_range}</td>
                  </tr>
                  ` : ''}
                  ${lead.country || lead.state || lead.city ? `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Location:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">
                      ${[lead.city, lead.state, lead.country].filter(Boolean).join(', ') || 'N/A'}
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Created:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${createdDate}</td>
                  </tr>
                  ${lead.notes ? `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; vertical-align: top;"><strong>Notes:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${lead.notes}</td>
                  </tr>
                  ` : ''}
                </table>
              `;
              
              // Build text version
              const textDetails = `
Lead ID: #${lead.id}
Name: ${leadName}
${lead.email ? `Email: ${lead.email}` : ''}
${lead.phone ? `Phone: ${lead.phone}` : ''}
${lead.source ? `Source: ${lead.source}` : ''}
${lead.lead_type_name ? `Lead Type: ${lead.lead_type_name}` : ''}
Status: ${lead.status || 'New'}
${lead.priority ? `Priority: ${lead.priority}` : ''}
${lead.score ? `Score: ${lead.score}` : ''}
${lead.budget_range ? `Budget Range: ${lead.budget_range}` : ''}
${lead.country || lead.state || lead.city ? `Location: ${[lead.city, lead.state, lead.country].filter(Boolean).join(', ')}` : ''}
Created: ${createdDate}
${lead.notes ? `Notes: ${lead.notes}` : ''}
              `.trim();
              
              await emailService.sendEmail({
                to: assignedUser.email,
                subject: `New Lead Assigned: ${leadName}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white;">
                      <h2 style="margin: 0; color: white;">New Lead Assignment</h2>
                    </div>
                    <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
                      <p style="color: #333; font-size: 16px;">Hello <strong>${assignedUser.first_name} ${assignedUser.last_name}</strong>,</p>
                      <p style="color: #666;">A new lead has been assigned to you. Please review the details below and follow up as soon as possible.</p>
                      
                      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
                        ${detailsHtml}
                      </div>
                      
                      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                        <p style="color: #666; font-size: 14px; margin: 0;">
                          <strong>Next Steps:</strong><br>
                          • Review the lead details above<br>
                          • Contact the lead at your earliest convenience<br>
                          • Update the lead status in CRM after initial contact
                        </p>
                      </div>
                      
                      <div style="margin-top: 30px; text-align: center;">
                        <a href="${process.env.APP_URL || 'http://localhost:5000'}/leads/${lead.id}" 
                           style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                          View Lead in CRM
                        </a>
                      </div>
                    </div>
                    <div style="margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
                      <p>This is an automated notification from RateHonk CRM</p>
                      <p>Best regards,<br><strong>RateHonk CRM Team</strong></p>
                    </div>
                  </div>
                `,
                text: `New Lead Assignment

Hello ${assignedUser.first_name} ${assignedUser.last_name},

A new lead has been assigned to you. Please review the details below and follow up as soon as possible.

${textDetails}

Next Steps:
• Review the lead details above
• Contact the lead at your earliest convenience
• Update the lead status in CRM after initial contact

View Lead: ${process.env.APP_URL || 'http://localhost:5000'}/leads/${lead.id}

This is an automated notification from RateHonk CRM

Best regards,
RateHonk CRM Team`,
              });
              console.log(`✅ Assignment email sent to ${assignedUser.email} with full lead details`);
            }
          } catch (error) {
            console.error("Error sending assignment email:", error);
            // Don't throw - allow assignment to continue even if email fails
          }
        }
      }

      return { success: true, assignedUser: fullName };
    } catch (error) {
      console.error("Error assigning entity to user:", error);
      throw error;
    }
  }

  async getTenantIdFromEntity(
    entityType: string,
    entityId: number,
  ): Promise<number> {
    let result;
    if (entityType === "lead") {
      result = await sql`SELECT tenant_id FROM leads WHERE id = ${entityId}`;
    } else if (entityType === "customer") {
      result =
        await sql`SELECT tenant_id FROM customers WHERE id = ${entityId}`;
    } else if (entityType === "task") {
      // Check if tasks table exists before querying
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'tasks'
        )
      `;
      if (tableExists[0]?.exists) {
        result = await sql`SELECT tenant_id FROM tasks WHERE id = ${entityId}`;
      }
    }
    return result[0]?.tenant_id;
  }

  async getAssignableUsers(tenantId: number, entityType: string = "leads") {
    try {
      const users = await sql`
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.role,
          r.name as role_name,
          r.permissions,
          COUNT(CASE WHEN l.assigned_user_id = u.id THEN 1 END) as lead_count,
          COUNT(CASE WHEN c.assigned_user_id = u.id THEN 1 END) as customer_count,
          COUNT(CASE WHEN t.assigned_to_id = u.id AND t.status != 'completed' THEN 1 END) as active_task_count
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN leads l ON l.assigned_user_id = u.id AND l.tenant_id = ${tenantId}
        LEFT JOIN customers c ON c.assigned_user_id = u.id AND c.tenant_id = ${tenantId}
        LEFT JOIN tasks t ON t.assigned_to_id = u.id AND t.tenant_id = ${tenantId}
        WHERE u.tenant_id = ${tenantId} AND u.is_active = true
        GROUP BY u.id, u.first_name, u.last_name, u.email, u.role, r.name, r.id
        ORDER BY u.first_name, u.last_name
      `;

      return users.map((user) => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        roleName: user.role_name,
        permissions: user.permissions ? JSON.parse(user.permissions) : {},
        workload: {
          leads: user.lead_count || 0,
          customers: user.customer_count || 0,
          activeTasks: user.active_task_count || 0,
          total:
            (user.lead_count || 0) +
            (user.customer_count || 0) +
            (user.active_task_count || 0),
        },
      }));
    } catch (error) {
      console.error("Error getting assignable users:", error);
      throw error;
    }
  }

  async getUserAssignments(userId: number, tenantId: number) {
    try {
      // Check if tasks table exists
      const tasksTableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'tasks'
        )
      `;
      
      const hasTasksTable = tasksTableExists[0]?.exists || false;

      let assignments;
      if (hasTasksTable) {
        [assignments] = await sql`
          SELECT 
            (SELECT COUNT(*) FROM leads WHERE assigned_user_id = ${userId} AND tenant_id = ${tenantId}) as assigned_leads,
            (SELECT COUNT(*) FROM customers WHERE assigned_user_id = ${userId} AND tenant_id = ${tenantId}) as assigned_customers,
            (SELECT COUNT(*) FROM tasks WHERE assigned_to_id = ${userId} AND tenant_id = ${tenantId} AND status != 'completed') as active_tasks,
            (SELECT COUNT(*) FROM tasks WHERE assigned_to_id = ${userId} AND tenant_id = ${tenantId} AND status = 'completed') as completed_tasks
        `;
      } else {
        // If tasks table doesn't exist, return counts without tasks
        [assignments] = await sql`
          SELECT 
            (SELECT COUNT(*) FROM leads WHERE assigned_user_id = ${userId} AND tenant_id = ${tenantId}) as assigned_leads,
            (SELECT COUNT(*) FROM customers WHERE assigned_user_id = ${userId} AND tenant_id = ${tenantId}) as assigned_customers,
            0 as active_tasks,
            0 as completed_tasks
        `;
      }

      const recentLeads = await sql`
        SELECT id, name, status, created_at, priority 
        FROM leads 
        WHERE assigned_user_id = ${userId} AND tenant_id = ${tenantId}
        ORDER BY created_at DESC 
        LIMIT 5
      `;

      const recentCustomers = await sql`
        SELECT id, name, crm_status, last_activity, total_value 
        FROM customers 
        WHERE assigned_user_id = ${userId} AND tenant_id = ${tenantId}
        ORDER BY last_activity DESC 
        LIMIT 5
      `;

      let upcomingTasks = [];
      if (hasTasksTable) {
        upcomingTasks = await sql`
          SELECT id, title, due_date, priority, status, type 
          FROM tasks 
          WHERE assigned_to_id = ${userId} AND tenant_id = ${tenantId} AND status != 'completed'
          ORDER BY due_date ASC 
          LIMIT 10
        `;
      }

      return {
        summary: {
          assignedLeads: assignments.assigned_leads || 0,
          assignedCustomers: assignments.assigned_customers || 0,
          activeTasks: assignments.active_tasks || 0,
          completedTasks: assignments.completed_tasks || 0,
        },
        recentLeads: recentLeads.map((lead) => ({
          id: lead.id,
          name: lead.name,
          status: lead.status,
          createdAt: lead.created_at,
          priority: lead.priority,
        })),
        recentCustomers: recentCustomers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          crmStatus: customer.crm_status,
          lastActivity: customer.last_activity,
          totalValue: customer.total_value,
        })),
        upcomingTasks: upcomingTasks.map((task) => ({
          id: task.id,
          title: task.title,
          dueDate: task.due_date,
          priority: task.priority,
          status: task.status,
          type: task.type,
        })),
      };
    } catch (error) {
      console.error("Error getting user assignments:", error);
      throw error;
    }
  }

  // Assignment History Methods
  async logAssignmentHistory(historyData: any) {
    try {
      // Check if table exists first
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'assignment_history'
        )
      `;
      
      if (!tableExists[0]?.exists) {
        console.warn("assignment_history table does not exist. Skipping history logging.");
        return;
      }

      await sql`
        INSERT INTO assignment_history (
          tenant_id, entity_type, entity_id, previous_user_id, 
          new_user_id, assigned_by, reason, notes, created_at
        ) VALUES (
          ${historyData.tenantId}, ${historyData.entityType}, ${historyData.entityId},
          ${historyData.previousUserId}, ${historyData.newUserId}, ${historyData.assignedBy},
          ${historyData.reason}, ${historyData.notes || null}, NOW()
        )
      `;
    } catch (error) {
      console.error("Error logging assignment history:", error);
      // Don't throw - allow the operation to continue even if history logging fails
    }
  }

  async getAssignmentHistory(
    tenantId: number,
    entityType?: string,
    entityId?: number,
  ) {
    try {
      // Check if table exists first
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'assignment_history'
        )
      `;
      
      if (!tableExists[0]?.exists) {
        console.warn("assignment_history table does not exist. Returning empty array.");
        return [];
      }

      let history;
      
      if (entityType && entityId) {
        history = await sql`
          SELECT 
            ah.*,
            prev_user.first_name as previous_user_first_name,
            prev_user.last_name as previous_user_last_name,
            new_user.first_name as new_user_first_name,
            new_user.last_name as new_user_last_name,
            assigned_user.first_name as assigned_by_first_name,
            assigned_user.last_name as assigned_by_last_name
          FROM assignment_history ah
          LEFT JOIN users prev_user ON ah.previous_user_id = prev_user.id
          LEFT JOIN users new_user ON ah.new_user_id = new_user.id
          LEFT JOIN users assigned_user ON ah.assigned_by = assigned_user.id
          WHERE ah.tenant_id = ${tenantId}
            AND ah.entity_type = ${entityType}
            AND ah.entity_id = ${entityId}
          ORDER BY ah.created_at DESC
          LIMIT 50
        `;
      } else {
        history = await sql`
          SELECT 
            ah.*,
            prev_user.first_name as previous_user_first_name,
            prev_user.last_name as previous_user_last_name,
            new_user.first_name as new_user_first_name,
            new_user.last_name as new_user_last_name,
            assigned_user.first_name as assigned_by_first_name,
            assigned_user.last_name as assigned_by_last_name
          FROM assignment_history ah
          LEFT JOIN users prev_user ON ah.previous_user_id = prev_user.id
          LEFT JOIN users new_user ON ah.new_user_id = new_user.id
          LEFT JOIN users assigned_user ON ah.assigned_by = assigned_user.id
          WHERE ah.tenant_id = ${tenantId}
          ORDER BY ah.created_at DESC
          LIMIT 50
        `;
      }

      return history.map((record) => ({
        id: record.id,
        entityType: record.entity_type,
        entityId: record.entity_id,
        previousUser: record.previous_user_id
          ? {
            id: record.previous_user_id,
            name: `${record.previous_user_first_name} ${record.previous_user_last_name}`,
          }
          : null,
        newUser: {
          id: record.new_user_id,
          name: `${record.new_user_first_name} ${record.new_user_last_name}`,
        },
        assignedBy: {
          id: record.assigned_by,
          name: `${record.assigned_by_first_name} ${record.assigned_by_last_name}`,
        },
        reason: record.reason,
        notes: record.notes,
        createdAt: record.created_at,
      }));
    } catch (error) {
      console.error("Error getting assignment history:", error);
      throw error;
    }
  }

  // User Metrics Methods
  async recordUserMetric(metricData: any) {
    try {
      // Check if table exists first
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'user_metrics'
        )
      `;
      
      if (!tableExists[0]?.exists) {
        console.warn("user_metrics table does not exist. Skipping metric recording.");
        return;
      }

      await sql`
        INSERT INTO user_metrics (
          tenant_id, user_id, metric_type, metric_value, 
          metric_date, additional_data, created_at
        ) VALUES (
          ${metricData.tenantId}, ${metricData.userId}, ${metricData.metricType},
          ${metricData.metricValue}, ${metricData.metricDate || new Date()},
          ${metricData.additionalData ? JSON.stringify(metricData.additionalData) : null}, NOW()
        )
      `;
    } catch (error) {
      console.error("Error recording user metric:", error);
      // Don't throw - allow the operation to continue even if metric recording fails
    }
  }

  async getUserMetrics(
    userId: number,
    tenantId: number,
    startDate?: Date,
    endDate?: Date,
  ) {
    try {
      // Check if table exists first
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'user_metrics'
        )
      `;
      
      if (!tableExists[0]?.exists) {
        console.warn("user_metrics table does not exist. Returning empty array.");
        return [];
      }

      let metrics;
      
      if (startDate && endDate) {
        metrics = await sql`
          SELECT 
            metric_type,
            SUM(metric_value) as total_value,
            AVG(metric_value) as average_value,
            COUNT(*) as record_count,
            MAX(metric_date) as last_recorded
          FROM user_metrics
          WHERE user_id = ${userId} AND tenant_id = ${tenantId}
            AND metric_date BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
          GROUP BY metric_type
          ORDER BY metric_type
        `;
      } else {
        metrics = await sql`
          SELECT 
            metric_type,
            SUM(metric_value) as total_value,
            AVG(metric_value) as average_value,
            COUNT(*) as record_count,
            MAX(metric_date) as last_recorded
          FROM user_metrics
          WHERE user_id = ${userId} AND tenant_id = ${tenantId}
          GROUP BY metric_type
          ORDER BY metric_type
        `;
      }

      return metrics.map((metric) => ({
        type: metric.metric_type,
        totalValue: parseFloat(metric.total_value) || 0,
        averageValue: parseFloat(metric.average_value) || 0,
        recordCount: metric.record_count || 0,
        lastRecorded: metric.last_recorded,
      }));
    } catch (error) {
      console.error("Error getting user metrics:", error);
      throw error;
    }
  }

  // User Notifications Methods
  async createNotification(notificationData: any) {
    try {
      // Check if table exists first
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'user_notifications'
        )
      `;
      
      if (!tableExists[0]?.exists) {
        console.warn("user_notifications table does not exist. Skipping notification creation.");
        return {
          id: 0,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          priority: notificationData.priority || "medium",
          isRead: notificationData.isRead || false,
          createdAt: new Date(),
        };
      }

      const [notification] = await sql`
        INSERT INTO user_notifications (
          tenant_id, user_id, title, message, type, entity_type,
          entity_id, is_read, priority, action_url, metadata, expires_at, created_at
        ) VALUES (
          ${notificationData.tenantId}, ${notificationData.userId}, ${notificationData.title},
          ${notificationData.message}, ${notificationData.type}, ${notificationData.entityType || null},
          ${notificationData.entityId || null}, ${notificationData.isRead || false},
          ${notificationData.priority || "medium"}, ${notificationData.actionUrl || null},
          ${notificationData.metadata ? JSON.stringify(notificationData.metadata) : null},
          ${notificationData.expiresAt || null}, NOW()
        )
        RETURNING *
      `;

      return {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        isRead: notification.is_read,
        createdAt: notification.created_at,
      };
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  async getUserNotifications(
    userId: number,
    tenantId: number,
    includeRead: boolean = false,
  ) {
    try {
      // Check if table exists first
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'user_notifications'
        )
      `;
      
      if (!tableExists[0]?.exists) {
        console.warn("user_notifications table does not exist. Returning empty array.");
        return [];
      }

      let notifications;
      
      if (includeRead) {
        notifications = await sql`
          SELECT * FROM user_notifications
          WHERE user_id = ${userId} AND tenant_id = ${tenantId}
            AND (expires_at IS NULL OR expires_at > NOW())
          ORDER BY 
            CASE priority
              WHEN 'urgent' THEN 1
              WHEN 'high' THEN 2
              WHEN 'medium' THEN 3
              ELSE 4
            END,
            created_at DESC
          LIMIT 50
        `;
      } else {
        notifications = await sql`
          SELECT * FROM user_notifications
          WHERE user_id = ${userId} AND tenant_id = ${tenantId}
            AND is_read = false
            AND (expires_at IS NULL OR expires_at > NOW())
          ORDER BY 
            CASE priority
              WHEN 'urgent' THEN 1
              WHEN 'high' THEN 2
              WHEN 'medium' THEN 3
              ELSE 4
            END,
            created_at DESC
          LIMIT 50
        `;
      }

      return notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        entityType: notification.entity_type,
        entityId: notification.entity_id,
        isRead: notification.is_read,
        priority: notification.priority,
        actionUrl: notification.action_url,
        metadata: notification.metadata
          ? JSON.parse(notification.metadata)
          : null,
        createdAt: notification.created_at,
        expiresAt: notification.expires_at,
      }));
    } catch (error) {
      console.error("Error getting user notifications:", error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: number, userId: number) {
    try {
      await sql`
        UPDATE user_notifications 
        SET is_read = true 
        WHERE id = ${notificationId} AND user_id = ${userId}
      `;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(userId: number, tenantId: number) {
    try {
      await sql`
        UPDATE user_notifications 
        SET is_read = true 
        WHERE user_id = ${userId} AND tenant_id = ${tenantId} AND is_read = false
      `;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  // Follow-ups management methods
  async getFollowUpsByTenant(tenantId: number) {
    try {
      const followUps = await sql`
        SELECT 
          f.*,
          t.title as task_title
        FROM follow_ups f
        LEFT JOIN tasks t ON f.task_id = t.id
        WHERE f.tenant_id = ${tenantId}
        ORDER BY f.scheduled_date ASC
      `;

      return followUps.map((followUp) => ({
        id: followUp.id,
        taskId: followUp.task_id,
        taskTitle: followUp.task_title,
        scheduledDate: followUp.scheduled_date,
        type: followUp.type,
        message: followUp.message,
        isCompleted: followUp.is_completed,
        completedAt: followUp.completed_at,
        createdAt: followUp.created_at,
      }));
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
      throw error;
    }
  }

  async createFollowUp(followUpData: any) {
    try {
      const [newFollowUp] = await sql`
        INSERT INTO follow_ups (
          tenant_id,
          task_id,
          scheduled_date,
          type,
          message,
          is_completed,
          created_at
        ) VALUES (
          ${followUpData.tenantId},
          ${followUpData.taskId},
          ${followUpData.scheduledDate},
          ${followUpData.type || "reminder"},
          ${followUpData.message},
          ${followUpData.isCompleted || false},
          NOW()
        )
        RETURNING *
      `;

      return {
        id: newFollowUp.id,
        taskId: newFollowUp.task_id,
        scheduledDate: newFollowUp.scheduled_date,
        type: newFollowUp.type,
        message: newFollowUp.message,
        isCompleted: newFollowUp.is_completed,
        createdAt: newFollowUp.created_at,
      };
    } catch (error) {
      console.error("Error creating follow-up:", error);
      throw error;
    }
  }

  async updateFollowUp(followUpId: number, updateData: any) {
    try {
      const [updatedFollowUp] = await sql`
        UPDATE follow_ups 
        SET 
          message = COALESCE(${updateData.message}, message),
          scheduled_date = COALESCE(${updateData.scheduledDate}, scheduled_date),
          is_completed = COALESCE(${updateData.isCompleted}, is_completed),
          completed_at = CASE WHEN ${updateData.isCompleted} = true THEN NOW() ELSE completed_at END
        WHERE id = ${followUpId}
        RETURNING *
      `;

      return updatedFollowUp;
    } catch (error) {
      console.error("Error updating follow-up:", error);
      throw error;
    }
  }

  // ==================== General Follow-Ups Methods ====================

  // Get assignable users for follow-up (parent + child users based on role hierarchy)
  async getAssignableUsersForFollowUp(userId: number, tenantId: number) {
    try {
      // Get current user's role
      const [user] = await sql`
        SELECT id, role_id, reporting_user_id
        FROM users
        WHERE id = ${userId} AND tenant_id = ${tenantId} AND is_active = true
      `;

      if (!user || !user.role_id) {
        return [];
      }

      const assignableUsers: any[] = [];
      
      // Add self
      const [selfUser] = await sql`
        SELECT u.id, u.email, u.first_name, u.last_name, r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = ${userId} AND u.tenant_id = ${tenantId} AND u.is_active = true
      `;
      if (selfUser) {
        assignableUsers.push({
          id: selfUser.id,
          name: `${selfUser.first_name || ''} ${selfUser.last_name || ''}`.trim() || selfUser.email,
          email: selfUser.email,
          role: selfUser.role_name,
          relationship: 'self'
        });
      }

      // Get parent user (reporting user)
      if (user.reporting_user_id) {
        const [parentUser] = await sql`
          SELECT u.id, u.email, u.first_name, u.last_name, r.name as role_name
          FROM users u
          LEFT JOIN roles r ON u.role_id = r.id
          WHERE u.id = ${user.reporting_user_id} AND u.tenant_id = ${tenantId} AND u.is_active = true
        `;
        if (parentUser) {
          assignableUsers.push({
            id: parentUser.id,
            name: `${parentUser.first_name || ''} ${parentUser.last_name || ''}`.trim() || parentUser.email,
            email: parentUser.email,
            role: parentUser.role_name,
            relationship: 'parent'
          });
        }
      }

      // Get child users (users who report to current user)
      const childUsers = await sql`
        SELECT u.id, u.email, u.first_name, u.last_name, r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.reporting_user_id = ${userId} AND u.tenant_id = ${tenantId} AND u.is_active = true
      `;
      
      for (const child of childUsers) {
        assignableUsers.push({
          id: child.id,
          name: `${child.first_name || ''} ${child.last_name || ''}`.trim() || child.email,
          email: child.email,
          role: child.role_name,
          relationship: 'child'
        });
      }

      return assignableUsers;
    } catch (error) {
      console.error("Error getting assignable users for follow-up:", error);
      throw error;
    }
  }

  // Get general follow-ups by tenant with filters
  async getGeneralFollowUpsByTenant(tenantId: number, filters?: {
    assignedUserId?: number;
    createdByUserId?: number;
    userId?: number; // For non-owners: show follow-ups assigned to OR created by this user
    status?: string;
    excludeStatus?: string; // Exclude follow-ups with this status
    priority?: string;
    relatedTableName?: string;
    relatedTableId?: number;
    limit?: number;
    offset?: number;
    sort?: string;
  }) {
    try {
      let whereClauses = sql`f.tenant_id = ${tenantId}`;
      
      // If userId is provided, show follow-ups assigned to OR created by this user
      if (filters?.userId) {
        whereClauses = sql`${whereClauses} AND (f.assigned_user_id = ${filters.userId} OR f.created_by_user_id = ${filters.userId})`;
      } else {
        // Otherwise use specific filters
        if (filters?.assignedUserId) {
          whereClauses = sql`${whereClauses} AND f.assigned_user_id = ${filters.assignedUserId}`;
        }
        
        if (filters?.createdByUserId) {
          whereClauses = sql`${whereClauses} AND f.created_by_user_id = ${filters.createdByUserId}`;
        }
      }
      
      if (filters?.status) {
        whereClauses = sql`${whereClauses} AND f.status = ${filters.status}`;
      }
      
      if (filters?.excludeStatus) {
        whereClauses = sql`${whereClauses} AND f.status != ${filters.excludeStatus}`;
      }
      
      if (filters?.priority) {
        whereClauses = sql`${whereClauses} AND f.priority = ${filters.priority}`;
      }
      
      if (filters?.relatedTableName) {
        whereClauses = sql`${whereClauses} AND f.related_table_name = ${filters.relatedTableName}`;
      }
      
      if (filters?.relatedTableId) {
        whereClauses = sql`${whereClauses} AND f.related_table_id = ${filters.relatedTableId}`;
      }

      const sortOrder = filters?.sort === 'asc' ? sql`ASC` : sql`DESC`;
      const limitNum = filters?.limit || 50;
      const offsetNum = filters?.offset || 0;

      const followUps = await sql`
        SELECT 
          f.*,
          assigned_user.email as assigned_user_email,
          assigned_user.first_name as assigned_user_first_name,
          assigned_user.last_name as assigned_user_last_name,
          created_by.email as created_by_email,
          created_by.first_name as created_by_first_name,
          created_by.last_name as created_by_last_name,
          previous_user.email as previous_user_email,
          previous_user.first_name as previous_user_first_name,
          previous_user.last_name as previous_user_last_name
        FROM general_follow_ups f
        LEFT JOIN users assigned_user ON f.assigned_user_id = assigned_user.id
        LEFT JOIN users created_by ON f.created_by_user_id = created_by.id
        LEFT JOIN users previous_user ON f.previous_assigned_user_id = previous_user.id
        WHERE ${whereClauses}
        ORDER BY f.due_date ${sortOrder}
        LIMIT ${limitNum}
        OFFSET ${offsetNum}
      `;

      const totalResult = await sql`
        SELECT COUNT(*) as total
        FROM general_follow_ups f
        WHERE ${whereClauses}
      `;
      const total = Number(totalResult[0]?.total || 0);

      return {
        data: followUps.map((f: any) => ({
          id: f.id,
          tenantId: f.tenant_id,
          title: f.title,
          description: f.description,
          assignedUserId: f.assigned_user_id,
          assignedUserName: f.assigned_user_first_name && f.assigned_user_last_name
            ? `${f.assigned_user_first_name} ${f.assigned_user_last_name}`
            : f.assigned_user_email,
          assignedUserEmail: f.assigned_user_email,
          createdByUserId: f.created_by_user_id,
          createdByName: f.created_by_first_name && f.created_by_last_name
            ? `${f.created_by_first_name} ${f.created_by_last_name}`
            : f.created_by_email,
          createdByEmail: f.created_by_email,
          previousAssignedUserId: f.previous_assigned_user_id,
          previousAssignedUserName: f.previous_user_first_name && f.previous_user_last_name
            ? `${f.previous_user_first_name} ${f.previous_user_last_name}`
            : f.previous_user_email,
          previousAssignedUserEmail: f.previous_user_email,
          priority: f.priority,
          status: f.status,
          dueDate: f.due_date,
          relatedTableName: f.related_table_name,
          relatedTableId: f.related_table_id,
          tags: f.tags || [],
          reminderDate: f.reminder_date,
          completedAt: f.completed_at,
          completionNotes: f.completion_notes,
          emailSent: f.email_sent,
          emailSentAt: f.email_sent_at,
          createdAt: f.created_at,
          updatedAt: f.updated_at,
        })),
        total,
      };
    } catch (error) {
      console.error("Error fetching general follow-ups:", error);
      throw error;
    }
  }

  // Check if follow-up already exists for an entity (excluding completed/cancelled)
  async checkFollowUpExists(
    tenantId: number,
    relatedTableName: string,
    relatedTableId: number
  ): Promise<boolean> {
    try {
      const [existing] = await sql`
        SELECT id FROM general_follow_ups
        WHERE tenant_id = ${tenantId}
          AND related_table_name = ${relatedTableName}
          AND related_table_id = ${relatedTableId}
          AND status NOT IN ('completed', 'cancelled')
        LIMIT 1
      `;
      return !!existing;
    } catch (error) {
      console.error("Error checking follow-up existence:", error);
      throw error;
    }
  }

  // Create general follow-up
  async createGeneralFollowUp(followUpData: {
    tenantId: number;
    title: string;
    description?: string;
    assignedUserId?: number;
    createdByUserId: number;
    priority?: string;
    status?: string;
    dueDate: string;
    relatedTableName?: string;
    relatedTableId?: number;
    tags?: string[];
    reminderDate?: string;
  }) {
    try {
      const [newFollowUp] = await sql`
        INSERT INTO general_follow_ups (
          tenant_id,
          title,
          description,
          assigned_user_id,
          created_by_user_id,
          priority,
          status,
          due_date,
          related_table_name,
          related_table_id,
          tags,
          reminder_date
        ) VALUES (
          ${followUpData.tenantId},
          ${followUpData.title},
          ${followUpData.description || null},
          ${followUpData.assignedUserId || null},
          ${followUpData.createdByUserId},
          ${followUpData.priority || 'medium'},
          ${followUpData.status || 'pending'},
          ${followUpData.dueDate},
          ${followUpData.relatedTableName || null},
          ${followUpData.relatedTableId || null},
          ${sql.array(followUpData.tags || [])},
          ${followUpData.reminderDate || null}
        )
        RETURNING *
      `;

      // Get assigned user and created by user details
      const [assignedUser] = followUpData.assignedUserId ? await sql`
        SELECT email, first_name, last_name FROM users WHERE id = ${followUpData.assignedUserId}
      ` : [null];

      const [createdBy] = await sql`
        SELECT email, first_name, last_name FROM users WHERE id = ${followUpData.createdByUserId}
      `;

      return {
        id: newFollowUp.id,
        tenantId: newFollowUp.tenant_id,
        title: newFollowUp.title,
        description: newFollowUp.description,
        assignedUserId: newFollowUp.assigned_user_id,
        assignedUserName: assignedUser ? `${assignedUser.first_name || ''} ${assignedUser.last_name || ''}`.trim() : null,
        assignedUserEmail: assignedUser?.email || null,
        createdByUserId: newFollowUp.created_by_user_id,
        createdByName: `${createdBy.first_name || ''} ${createdBy.last_name || ''}`.trim(),
        createdByEmail: createdBy.email,
        priority: newFollowUp.priority,
        status: newFollowUp.status,
        dueDate: newFollowUp.due_date,
        relatedTableName: newFollowUp.related_table_name,
        relatedTableId: newFollowUp.related_table_id,
        tags: newFollowUp.tags || [],
        reminderDate: newFollowUp.reminder_date,
        emailSent: newFollowUp.email_sent,
        emailSentAt: newFollowUp.email_sent_at,
        createdAt: newFollowUp.created_at,
        updatedAt: newFollowUp.updated_at,
      };
    } catch (error) {
      console.error("Error creating general follow-up:", error);
      throw error;
    }
  }

  // Update general follow-up
  async updateGeneralFollowUp(followUpId: number, updateData: {
    title?: string;
    description?: string;
    assignedUserId?: number;
    priority?: string;
    status?: string;
    dueDate?: string;
    relatedTableName?: string;
    relatedTableId?: number;
    tags?: string[];
    reminderDate?: string;
    completionNotes?: string;
  }) {
    try {
      // Get current follow-up first
      const [current] = await sql`
        SELECT * FROM general_follow_ups WHERE id = ${followUpId}
      `;

      if (!current) {
        return null;
      }

      // Helper function to convert date to ISO string
      const toISOString = (date: any): string | null => {
        if (!date) return null;
        if (date instanceof Date) return date.toISOString();
        if (typeof date === 'string') return date;
        return new Date(date).toISOString();
      };

      // Prepare update values
      const title = updateData.title !== undefined ? updateData.title : current.title;
      const description = updateData.description !== undefined ? updateData.description : current.description;
      const assignedUserId = updateData.assignedUserId !== undefined ? updateData.assignedUserId : current.assigned_user_id;
      const priority = updateData.priority !== undefined ? updateData.priority : current.priority;
      const status = updateData.status !== undefined ? updateData.status : current.status;
      const dueDate = updateData.dueDate !== undefined ? updateData.dueDate : toISOString(current.due_date);
      const relatedTableName = updateData.relatedTableName !== undefined ? updateData.relatedTableName : current.related_table_name;
      const relatedTableId = updateData.relatedTableId !== undefined ? updateData.relatedTableId : current.related_table_id;
      const tags = updateData.tags !== undefined ? updateData.tags : current.tags;
      const reminderDate = updateData.reminderDate !== undefined ? updateData.reminderDate : toISOString(current.reminder_date);
      const completionNotes = updateData.completionNotes !== undefined ? updateData.completionNotes : current.completion_notes;

      // Handle completed_at based on status
      let completedAt: string | null = null;
      if (updateData.status !== undefined) {
        if (updateData.status === 'completed' && !current.completed_at) {
          completedAt = new Date().toISOString();
        } else if (updateData.status !== 'completed') {
          completedAt = null;
        } else {
          // Keep existing completed_at if status is still completed
          completedAt = toISOString(current.completed_at);
        }
      } else {
        // If status is not being updated, keep existing completed_at
        completedAt = toISOString(current.completed_at);
      }

      const [updatedFollowUp] = await sql`
        UPDATE general_follow_ups 
        SET 
          title = ${title},
          description = ${description},
          assigned_user_id = ${assignedUserId},
          priority = ${priority},
          status = ${status},
          due_date = ${dueDate}::timestamp,
          related_table_name = ${relatedTableName},
          related_table_id = ${relatedTableId},
          tags = ${sql.array(tags || [])},
          reminder_date = ${reminderDate ? sql`${reminderDate}::timestamp` : sql`NULL`},
          completed_at = ${completedAt ? sql`${completedAt}::timestamp` : sql`NULL`},
          completion_notes = ${completionNotes},
          updated_at = NOW()
        WHERE id = ${followUpId}
        RETURNING *
      `;

      return updatedFollowUp || null;
    } catch (error) {
      console.error("Error updating general follow-up:", error);
      throw error;
    }
  }

  // Delete general follow-up
  async deleteGeneralFollowUp(followUpId: number) {
    try {
      await sql`
        DELETE FROM general_follow_ups
        WHERE id = ${followUpId}
      `;
      return true;
    } catch (error) {
      console.error("Error deleting general follow-up:", error);
      throw error;
    }
  }

  // Mark follow-up as complete
  async markFollowUpComplete(followUpId: number, completionNotes?: string) {
    try {
      const [updatedFollowUp] = await sql`
        UPDATE general_follow_ups 
        SET 
          status = 'completed',
          completed_at = NOW(),
          completion_notes = COALESCE(${completionNotes}, completion_notes)
        WHERE id = ${followUpId}
        RETURNING *
      `;

      return updatedFollowUp;
    } catch (error) {
      console.error("Error marking follow-up as complete:", error);
      throw error;
    }
  }

  // Reassign follow-up
  async reassignFollowUp(followUpId: number, newUserId: number) {
    try {
      // First get the current assigned_user_id before updating
      const [currentFollowUp] = await sql`
        SELECT assigned_user_id FROM general_follow_ups WHERE id = ${followUpId}
      `;
      
      const previousUserId = currentFollowUp?.assigned_user_id || null;
      
      const [updatedFollowUp] = await sql`
        UPDATE general_follow_ups 
        SET 
          previous_assigned_user_id = ${previousUserId},
          assigned_user_id = ${newUserId},
          email_sent = false,
          email_sent_at = NULL
        WHERE id = ${followUpId}
        RETURNING *
      `;

      return updatedFollowUp;
    } catch (error) {
      console.error("Error reassigning follow-up:", error);
      throw error;
    }
  }

  // Get related entity details
  async getRelatedEntityDetails(tableName: string, tableId: number) {
    try {
      switch (tableName) {
        case 'leads':
          const [lead] = await sql`
            SELECT id, first_name, last_name, email, name
            FROM leads
            WHERE id = ${tableId}
          `;
          return lead ? {
            id: lead.id,
            name: lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.email,
            email: lead.email,
            type: 'lead'
          } : null;

        case 'customers':
          const [customer] = await sql`
            SELECT id, first_name, last_name, email, name
            FROM customers
            WHERE id = ${tableId}
          `;
          return customer ? {
            id: customer.id,
            name: customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email,
            email: customer.email,
            type: 'customer'
          } : null;

        case 'invoices':
          const [invoice] = await sql`
            SELECT id, invoice_number, customer_id
            FROM invoices
            WHERE id = ${tableId}
          `;
          return invoice ? {
            id: invoice.id,
            name: `Invoice #${invoice.invoice_number}`,
            type: 'invoice'
          } : null;

        case 'bookings':
          const [booking] = await sql`
            SELECT id, booking_number, customer_id
            FROM bookings
            WHERE id = ${tableId}
          `;
          return booking ? {
            id: booking.id,
            name: `Booking #${booking.booking_number}`,
            type: 'booking'
          } : null;

        default:
          return null;
      }
    } catch (error) {
      console.error("Error getting related entity details:", error);
      return null;
    }
  }

  // Update email sent status
  async updateFollowUpEmailSent(followUpId: number) {
    try {
      await sql`
        UPDATE general_follow_ups 
        SET 
          email_sent = true,
          email_sent_at = NOW()
        WHERE id = ${followUpId}
      `;
      return true;
    } catch (error) {
      console.error("Error updating follow-up email sent status:", error);
      throw error;
    }
  }

  // Email A/B Testing methods
  async createABTest(testData: any) {
    try {
      const [newTest] = await sql`
        INSERT INTO email_ab_tests (
          tenant_id,
          name,
          test_type,
          variant_a,
          variant_b,
          description,
          status,
          test_duration,
          sample_size,
          created_at
        ) VALUES (
          ${testData.tenantId},
          ${testData.name},
          ${testData.testType},
          ${JSON.stringify(testData.variantA)},
          ${JSON.stringify(testData.variantB)},
          ${testData.description || null},
          ${testData.status || "draft"},
          ${testData.testDuration || 7},
          ${testData.sampleSize || 1000},
          NOW()
        )
        RETURNING *
      `;

      return {
        id: newTest.id,
        name: newTest.name,
        testType: newTest.test_type,
        variantA: JSON.parse(newTest.variant_a),
        variantB: JSON.parse(newTest.variant_b),
        description: newTest.description,
        status: newTest.status,
        testDuration: newTest.test_duration,
        sampleSize: newTest.sample_size,
        createdAt: newTest.created_at,
      };
    } catch (error) {
      console.error("Error creating A/B test:", error);
      throw error;
    }
  }

  async getABTestsByTenant(tenantId: number) {
    try {
      const tests = await sql`
        SELECT * FROM email_ab_tests 
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC
      `;

      return tests.map((test) => ({
        id: test.id,
        name: test.name,
        testType: test.test_type,
        variantA: JSON.parse(test.variant_a),
        variantB: JSON.parse(test.variant_b),
        description: test.description,
        status: test.status,
        testDuration: test.test_duration,
        sampleSize: test.sample_size,
        winningVariant: test.winning_variant,
        createdAt: test.created_at,
        completedAt: test.completed_at,
      }));
    } catch (error) {
      console.error("Error fetching A/B tests:", error);
      throw error;
    }
  }

  // Email Segmentation methods
  async createEmailSegment(segmentData: any) {
    try {
      const [newSegment] = await sql`
        INSERT INTO email_segments (
          tenant_id,
          name,
          filter_conditions,
          description,
          is_active,
          subscriber_count,
          created_at
        ) VALUES (
          ${segmentData.tenantId},
          ${segmentData.name},
          ${JSON.stringify(segmentData.filterConditions)},
          ${segmentData.description || null},
          ${segmentData.isActive !== false},
          ${segmentData.subscriberCount || 0},
          NOW()
        )
        RETURNING *
      `;

      return {
        id: newSegment.id,
        name: newSegment.name,
        filterConditions: JSON.parse(newSegment.filter_conditions),
        description: newSegment.description,
        isActive: newSegment.is_active,
        subscriberCount: newSegment.subscriber_count,
        createdAt: newSegment.created_at,
      };
    } catch (error) {
      console.error("Error creating email segment:", error);
      throw error;
    }
  }

  async getEmailSegmentsByTenant(tenantId: number) {
    try {
      const segments = await sql`
        SELECT * FROM email_segments 
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC
      `;

      return segments.map((segment) => ({
        id: segment.id,
        name: segment.name,
        filterConditions: JSON.parse(segment.filter_conditions),
        description: segment.description,
        isActive: segment.is_active,
        subscriberCount: segment.subscriber_count,
        createdAt: segment.created_at,
        updatedAt: segment.updated_at,
      }));
    } catch (error) {
      console.error("Error fetching email segments:", error);
      throw error;
    }
  }

  // Menu preferences management
  async getTenantMenuPreferences(tenantId: number) {
    try {
      const preferences = await sql`
        SELECT * FROM tenant_menu_preferences 
        WHERE tenant_id = ${tenantId} 
        ORDER BY custom_order ASC, menu_item_id ASC
      `;

      return preferences.map((pref) => ({
        id: pref.id,
        tenantId: pref.tenant_id,
        menuItemId: pref.menu_item_id,
        isVisible: pref.is_visible,
        customOrder: pref.custom_order,
        customName: pref.custom_name,
        customIcon: pref.custom_icon,
        createdAt: pref.created_at,
        updatedAt: pref.updated_at,
      }));
    } catch (error) {
      console.error("Get tenant menu preferences error:", error);
      return [];
    }
  }

  async updateMenuPreference(
    tenantId: number,
    menuItemId: string,
    preferenceData: any,
  ) {
    try {
      const [updated] = await sql`
        INSERT INTO tenant_menu_preferences (
          tenant_id, menu_item_id, is_visible, custom_order, custom_name, custom_icon, updated_at
        ) VALUES (
          ${tenantId}, ${menuItemId}, ${preferenceData.isVisible}, 
          ${preferenceData.customOrder || 0}, ${preferenceData.customName}, 
          ${preferenceData.customIcon}, NOW()
        )
        ON CONFLICT (tenant_id, menu_item_id) 
        DO UPDATE SET 
          is_visible = EXCLUDED.is_visible,
          custom_order = EXCLUDED.custom_order,
          custom_name = EXCLUDED.custom_name,
          custom_icon = EXCLUDED.custom_icon,
          updated_at = NOW()
        RETURNING *
      `;

      return {
        id: updated.id,
        tenantId: updated.tenant_id,
        menuItemId: updated.menu_item_id,
        isVisible: updated.is_visible,
        customOrder: updated.custom_order,
        customName: updated.custom_name,
        customIcon: updated.custom_icon,
        updatedAt: updated.updated_at,
      };
    } catch (error) {
      console.error("Update menu preference error:", error);
      throw error;
    }
  }

  async createDefaultMenuPreferences(tenantId: number) {
    try {
      const defaultMenuItems = [
        { menuItemId: "dashboard", isVisible: true, customOrder: 1 },
        { menuItemId: "customers", isVisible: true, customOrder: 2 },
        { menuItemId: "communications", isVisible: true, customOrder: 3 },
        { menuItemId: "tasks", isVisible: true, customOrder: 4 },
        { menuItemId: "leads", isVisible: true, customOrder: 5 },
        { menuItemId: "lead-sync", isVisible: true, customOrder: 6 },
        { menuItemId: "social-integrations", isVisible: true, customOrder: 7 },
        { menuItemId: "bookings", isVisible: true, customOrder: 8 },
        { menuItemId: "packages", isVisible: true, customOrder: 9 },
        { menuItemId: "invoices", isVisible: true, customOrder: 10 },
        { menuItemId: "vendors", isVisible: true, customOrder: 11 },
        { menuItemId: "expenses", isVisible: true, customOrder: 12 },
        { menuItemId: "email-campaigns", isVisible: true, customOrder: 13 },
        { menuItemId: "email-automations", isVisible: true, customOrder: 14 },
        { menuItemId: "email-ab-tests", isVisible: true, customOrder: 15 },
        { menuItemId: "email-segments", isVisible: true, customOrder: 16 },
        { menuItemId: "email-settings", isVisible: true, customOrder: 17 },
        { menuItemId: "reports", isVisible: true, customOrder: 18 },
        { menuItemId: "settings", isVisible: true, customOrder: 19 },
        { menuItemId: "support", isVisible: true, customOrder: 20 },
      ];

      for (const item of defaultMenuItems) {
        await sql`
          INSERT INTO tenant_menu_preferences (
            tenant_id, menu_item_id, is_visible, custom_order
          ) VALUES (
            ${tenantId}, ${item.menuItemId}, ${item.isVisible}, ${item.customOrder}
          )
          ON CONFLICT (tenant_id, menu_item_id) DO NOTHING
        `;
      }

      return true;
    } catch (error) {
      console.error("Create default menu preferences error:", error);
      return false;
    }
  }

  // Group preferences management
  async getTenantGroupPreferences(tenantId: number) {
    try {
      const preferences = await sql`
        SELECT * FROM tenant_group_preferences 
        WHERE tenant_id = ${tenantId} 
        ORDER BY custom_order ASC, group_key ASC
      `;

      return preferences.map((pref) => ({
        id: pref.id,
        tenantId: pref.tenant_id,
        groupKey: pref.group_key,
        customOrder: pref.custom_order,
        isVisible: pref.is_visible,
        customName: pref.custom_name,
        createdAt: pref.created_at,
        updatedAt: pref.updated_at,
      }));
    } catch (error) {
      console.error("Get tenant group preferences error:", error);
      return [];
    }
  }

  async updateGroupPreference(
    tenantId: number,
    groupKey: string,
    preferenceData: any,
  ) {
    try {
      console.log("🔧 updateGroupPreference called with:", {
        tenantId,
        groupKey,
        preferenceData,
      });

      // Use UPSERT with proper error handling
      const result = await sql`
        INSERT INTO tenant_group_preferences (
          tenant_id, group_key, custom_order, is_visible, custom_name, created_at, updated_at
        ) VALUES (
          ${tenantId}, ${groupKey}, ${preferenceData.customOrder || 0}, 
          ${preferenceData.isVisible !== false}, ${preferenceData.customName || null}, NOW(), NOW()
        )
        ON CONFLICT (tenant_id, group_key) 
        DO UPDATE SET 
          custom_order = EXCLUDED.custom_order,
          is_visible = EXCLUDED.is_visible,
          custom_name = EXCLUDED.custom_name,
          updated_at = NOW()
        RETURNING *
      `;

      console.log("🔧 UPSERT result:", result);

      if (!result || result.length === 0) {
        throw new Error("No record returned from upsert operation");
      }

      const record = result[0];
      return {
        id: record.id,
        tenantId: record.tenant_id,
        groupKey: record.group_key,
        customOrder: record.custom_order,
        isVisible: record.is_visible,
        customName: record.custom_name,
        updatedAt: record.updated_at,
      };
    } catch (error) {
      console.error("🚨 Update group preference error:", error);
      console.error("🚨 Error details:", {
        message: error.message,
        code: error.code,
        detail: error.detail,
        tenantId,
        groupKey,
        preferenceData,
      });
      throw error;
    }
  }

  async createDefaultGroupPreferences(tenantId: number) {
    try {
      const defaultGroups = [
        { groupKey: "main", customOrder: 1 },
        { groupKey: "Customer Management", customOrder: 2 },
        { groupKey: "Lead Management", customOrder: 3 },
        { groupKey: "Booking Management", customOrder: 4 },
        { groupKey: "Email Marketing", customOrder: 5 },
        { groupKey: "Automation", customOrder: 6 },
        { groupKey: "Reports", customOrder: 7 },
        { groupKey: "Settings", customOrder: 8 },
        { groupKey: "Help & Support", customOrder: 9 },
      ];

      for (const group of defaultGroups) {
        await sql`
          INSERT INTO tenant_group_preferences (
            tenant_id, group_key, custom_order, is_visible
          ) VALUES (
            ${tenantId}, ${group.groupKey}, ${group.customOrder}, true
          )
          ON CONFLICT (tenant_id, group_key) DO NOTHING
        `;
      }

      return true;
    } catch (error) {
      console.error("Create default group preferences error:", error);
      return false;
    }
  }

  // Email Configuration methods

  async createOrUpdateEmailConfiguration(configData: any) {
    try {
      console.log(
        "📧 Storage: Creating/updating email configuration for tenant:",
        configData.tenantId,
      );
      console.log(
        "📧 Storage: Config data:",
        JSON.stringify(configData, null, 2),
      );

      // Convert empty strings to null
      const cleanData = {
        tenantId: configData.tenantId,
        senderName: configData.senderName || "Default Sender",
        senderEmail: configData.senderEmail || "noreply@example.com",
        replyToEmail:
          configData.replyToEmail && configData.replyToEmail.trim()
            ? configData.replyToEmail
            : null,
        smtpHost:
          configData.smtpHost && configData.smtpHost.trim()
            ? configData.smtpHost
            : null,
        smtpPort: configData.smtpPort || 587,
        smtpUsername:
          configData.smtpUsername && configData.smtpUsername.trim()
            ? configData.smtpUsername
            : null,
        smtpPassword:
          configData.smtpPassword && configData.smtpPassword.trim()
            ? configData.smtpPassword
            : null,
        smtpSecurity: configData.smtpSecurity || "tls",
        isSmtpEnabled: configData.isSmtpEnabled || false,
        dailySendLimit: configData.dailySendLimit || 1000,
        bounceHandling: configData.bounceHandling !== false,
        trackOpens: configData.trackOpens !== false,
        trackClicks: configData.trackClicks !== false,
        unsubscribeFooter:
          configData.unsubscribeFooter && configData.unsubscribeFooter.trim()
            ? configData.unsubscribeFooter
            : null,
        emailSignature:
          configData.emailSignature && configData.emailSignature.trim()
            ? configData.emailSignature
            : null,
        isActive: configData.isActive !== false,
      };

      console.log(
        "📧 Storage: Cleaned data:",
        JSON.stringify(cleanData, null, 2),
      );

      const [config] = await sql`
        INSERT INTO email_configurations (
          tenant_id, sender_name, sender_email, reply_to_email,
          smtp_host, smtp_port, smtp_username, smtp_password,
          smtp_security, is_smtp_enabled, daily_send_limit,
          bounce_handling, track_opens, track_clicks,
          unsubscribe_footer, email_signature, is_active,
          created_at, updated_at
        ) VALUES (
          ${cleanData.tenantId}, ${cleanData.senderName}, ${cleanData.senderEmail},
          ${cleanData.replyToEmail}, ${cleanData.smtpHost},
          ${cleanData.smtpPort}, ${cleanData.smtpUsername},
          ${cleanData.smtpPassword}, ${cleanData.smtpSecurity},
          ${cleanData.isSmtpEnabled}, ${cleanData.dailySendLimit},
          ${cleanData.bounceHandling}, ${cleanData.trackOpens},
          ${cleanData.trackClicks}, ${cleanData.unsubscribeFooter},
          ${cleanData.emailSignature}, ${cleanData.isActive},
          NOW(), NOW()
        )
        ON CONFLICT (tenant_id) 
        DO UPDATE SET
          sender_name = EXCLUDED.sender_name,
          sender_email = EXCLUDED.sender_email,
          reply_to_email = EXCLUDED.reply_to_email,
          smtp_host = EXCLUDED.smtp_host,
          smtp_port = EXCLUDED.smtp_port,
          smtp_username = EXCLUDED.smtp_username,
          smtp_password = EXCLUDED.smtp_password,
          smtp_security = EXCLUDED.smtp_security,
          is_smtp_enabled = EXCLUDED.is_smtp_enabled,
          daily_send_limit = EXCLUDED.daily_send_limit,
          bounce_handling = EXCLUDED.bounce_handling,
          track_opens = EXCLUDED.track_opens,
          track_clicks = EXCLUDED.track_clicks,
          unsubscribe_footer = EXCLUDED.unsubscribe_footer,
          email_signature = EXCLUDED.email_signature,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
        RETURNING *
      `;

      console.log(
        "📧 Storage: Email configuration saved successfully:",
        config ? "SUCCESS" : "NO_RESULT",
      );
      return config;
    } catch (error) {
      console.error(
        "❌ Storage: Error creating/updating email configuration:",
        error,
      );
      console.error("❌ Storage: Error details:", {
        message: error.message,
        code: error.code,
        detail: error.detail,
      });
      throw error;
    }
  }

  // Gmail integration methods
  async createOrUpdateGmailIntegration(integrationData: any) {
    try {
      const [integration] = await sql`
        INSERT INTO gmail_integrations (
          tenant_id, gmail_address, access_token, refresh_token,
          token_expiry_date, is_connected, sync_enabled
        ) VALUES (
          ${integrationData.tenantId}, ${integrationData.gmailAddress},
          ${integrationData.accessToken || null}, ${integrationData.refreshToken || null},
          ${integrationData.tokenExpiryDate || null}, ${integrationData.isConnected},
          ${integrationData.syncEnabled}
        )
        ON CONFLICT (tenant_id) 
        DO UPDATE SET
          gmail_address = EXCLUDED.gmail_address,
          access_token = EXCLUDED.access_token,
          refresh_token = EXCLUDED.refresh_token,
          token_expiry_date = EXCLUDED.token_expiry_date,
          is_connected = EXCLUDED.is_connected,
          sync_enabled = EXCLUDED.sync_enabled,
          updated_at = NOW()
        RETURNING *
      `;
      return this.formatGmailIntegration(integration);
    } catch (error) {
      console.error("Error creating/updating Gmail integration:", error);
      throw error;
    }
  }

  async getGmailIntegration(tenantId: number) {
    try {
      const [integration] = await sql`
        SELECT * FROM gmail_integrations 
        WHERE tenant_id = ${tenantId}
      `;

      return integration ? this.formatGmailIntegration(integration) : null;
    } catch (error) {
      console.error("Error getting Gmail integration:", error);
      return null;
    }
  }

  async updateGmailIntegration(integrationId: number, updateData: any) {
    try {
      const [updated] = await sql`
        UPDATE gmail_integrations 
        SET 
          access_token = COALESCE(${updateData.accessToken}, access_token),
          refresh_token = COALESCE(${updateData.refreshToken}, refresh_token),
          token_expiry_date = COALESCE(${updateData.tokenExpiryDate}, token_expiry_date),
          is_connected = COALESCE(${updateData.isConnected}, is_connected),
          sync_enabled = COALESCE(${updateData.syncEnabled}, sync_enabled),
          last_sync_at = COALESCE(${updateData.lastSyncAt}, last_sync_at),
          updated_at = NOW()
        WHERE id = ${integrationId}
        RETURNING *
      `;

      return updated ? this.formatGmailIntegration(updated) : null;
    } catch (error) {
      console.error("Error updating Gmail integration:", error);
      throw error;
    }
  }

  async createGmailEmail(emailData: any) {
    try {
      const [created] = await sql`
        INSERT INTO gmail_emails (
          tenant_id, gmail_message_id, thread_id, from_email, from_name,
          to_email, to_name, subject, body_text, body_html, is_read,
          is_important, has_attachments, labels, received_at
        ) VALUES (
          ${emailData.tenantId}, ${emailData.gmailMessageId}, ${emailData.threadId},
          ${emailData.fromEmail}, ${emailData.fromName || null}, ${emailData.toEmail},
          ${emailData.toName || null}, ${emailData.subject || null}, ${emailData.bodyText || null},
          ${emailData.bodyHtml || null}, ${emailData.isRead}, ${emailData.isImportant},
          ${emailData.hasAttachments}, ${JSON.stringify(emailData.labels || [])},
          ${emailData.receivedAt}
        )
        RETURNING *
      `;

      return this.formatGmailEmail(created);
    } catch (error) {
      console.error("Error creating Gmail email:", error);
      throw error;
    }
  }

  async getGmailEmailsByTenant(
    tenantId: number,
    limit: number = 50,
    offset: number = 0,
  ) {
    try {
      const emails = await sql`
        SELECT * FROM gmail_emails 
        WHERE tenant_id = ${tenantId}
        ORDER BY received_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      return emails.map((email) => this.formatGmailEmail(email));
    } catch (error) {
      console.error("Error getting Gmail emails:", error);
      return [];
    }
  }

  async getGmailEmailByMessageId(tenantId: number, messageId: string) {
    try {
      const [email] = await sql`
        SELECT * FROM gmail_emails 
        WHERE tenant_id = ${tenantId} AND gmail_message_id = ${messageId}
      `;

      return email ? this.formatGmailEmail(email) : null;
    } catch (error) {
      console.error("Error getting Gmail email by message ID:", error);
      return null;
    }
  }

  async deleteGmailEmailsByTenant(tenantId: number) {
    try {
      await sql`DELETE FROM gmail_emails WHERE tenant_id = ${tenantId}`;
    } catch (error) {
      console.error("Error deleting Gmail emails:", error);
      throw error;
    }
  }

  async getGmailEmailsCount(tenantId: number): Promise<number> {
    try {
      const [result] = await sql`
        SELECT COUNT(*) as count FROM gmail_emails WHERE tenant_id = ${tenantId}
      `;
      return parseInt(result.count);
    } catch (error) {
      console.error("Error getting Gmail emails count:", error);
      return 0;
    }
  }

  private formatGmailIntegration(integration: any) {
    return {
      id: integration.id,
      tenantId: integration.tenant_id,
      gmailAddress: integration.gmail_address,
      accessToken: integration.access_token,
      refreshToken: integration.refresh_token,
      tokenExpiryDate: integration.token_expiry_date,
      isConnected: integration.is_connected,
      lastSyncAt: integration.last_sync_at,
      syncEnabled: integration.sync_enabled,
      createdAt: integration.created_at,
      updatedAt: integration.updated_at,
    };
  }

  private formatGmailEmail(email: any) {
    return {
      id: email.id,
      tenantId: email.tenant_id,
      gmailMessageId: email.gmail_message_id,
      threadId: email.thread_id,
      fromEmail: email.from_email,
      fromName: email.from_name,
      toEmail: email.to_email,
      toName: email.to_name,
      subject: email.subject,
      bodyText: email.body_text,
      bodyHtml: email.body_html,
      isRead: email.is_read,
      isImportant: email.is_important,
      hasAttachments: email.has_attachments,
      labels: email.labels ? JSON.parse(email.labels) : [],
      receivedAt: email.received_at,
      createdAt: email.created_at,
    };
  }

  // Social Integration Methods (supports Facebook, Instagram, LinkedIn)
  async createSocialIntegration(integrationData: any) {
    try {
      const { tenantId, platform, appId, appSecret } = integrationData;

      const [integration] = await sql`
        INSERT INTO social_integrations (
          tenant_id, platform, app_id, app_secret, is_active, created_at, updated_at
        ) VALUES (
          ${tenantId}, ${platform}, ${appId}, ${appSecret}, true, NOW(), NOW()
        ) RETURNING *
      `;

      return {
        id: integration.id,
        tenantId: integration.tenant_id,
        platform: integration.platform,
        appId: integration.app_id,
        appSecret: integration.app_secret,
        isActive: integration.is_active,
        createdAt: integration.created_at,
        updatedAt: integration.updated_at,
      };
    } catch (error) {
      console.error("Error creating social integration:", error);
      throw error;
    }
  }

  async getSocialIntegration(tenantId: number, platform: string) {
    try {
      const [integration] = await sql`
        SELECT * FROM social_integrations 
        WHERE tenant_id = ${tenantId} AND platform = ${platform} AND is_active = true
      `;

      if (!integration) return null;

      return {
        id: integration.id,
        tenantId: integration.tenant_id,
        platform: integration.platform,
        appId: integration.app_id,
        appSecret: integration.app_secret,
        accessToken: integration.access_token,
        refreshToken: integration.refresh_token,
        tokenExpiresAt: integration.token_expires_at,
        isActive: integration.is_active,
        lastSync: integration.last_sync,
        totalLeadsImported: integration.total_leads_imported,
        permissions: integration.permissions,
        settings: integration.settings,
        createdAt: integration.created_at,
        updatedAt: integration.updated_at,
      };
    } catch (error) {
      console.error("Error getting social integration:", error);
      throw error;
    }
  }

  async updateSocialIntegration(integrationId: number, updateData: any) {
    try {
      const {
        accessToken,
        refreshToken,
        tokenExpiresAt,
        lastSync,
        permissions,
        settings,
      } = updateData;

      const [integration] = await sql`
        UPDATE social_integrations 
        SET 
          access_token = COALESCE(${accessToken}, access_token),
          refresh_token = COALESCE(${refreshToken}, refresh_token), 
          token_expires_at = COALESCE(${tokenExpiresAt}, token_expires_at),
          last_sync = COALESCE(${lastSync || null}, last_sync),
          permissions = COALESCE(${permissions ? JSON.stringify(permissions) : null}, permissions),
          settings = COALESCE(${settings ? JSON.stringify(settings) : null}, settings),
          updated_at = NOW()
        WHERE id = ${integrationId}
        RETURNING *
      `;

      if (!integration) return null;

      return {
        id: integration.id,
        tenantId: integration.tenant_id,
        platform: integration.platform,
        accessToken: integration.access_token,
        refreshToken: integration.refresh_token,
        tokenExpiresAt: integration.token_expires_at,
        isActive: integration.is_active,
        lastSync: integration.last_sync,
        permissions: integration.permissions,
        settings: integration.settings,
        updatedAt: integration.updated_at,
      };
    } catch (error) {
      console.error("Error updating social integration:", error);
      throw error;
    }
  }

  // Facebook Business Suite integration methods
  async createFacebookIntegration(integrationData: any) {
    const integration = {
      id: Date.now(),
      ...integrationData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("Creating Facebook integration:", integration);
    return integration;
  }

  async getFacebookIntegration(tenantId: number) {
    // Return mock data for now
    return {
      id: 1,
      tenantId,
      facebookUserId: "123456789",
      userAccessToken: "mock_token",
      isActive: true,
      lastSync: new Date().toISOString(),
    };
  }

  async updateFacebookIntegration(integrationId: number, updateData: any) {
    console.log(`Updating Facebook integration ${integrationId}:`, updateData);
    return { id: integrationId, ...updateData };
  }

  async createFacebookPage(pageData: any) {
    const page = {
      id: Date.now(),
      ...pageData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("Creating Facebook page:", page);
    return page;
  }

  async getFacebookPages(tenantId: number) {
    // Return mock data for now
    return [
      {
        id: 1,
        tenantId,
        pageId: "page123",
        pageName: "Sample Travel Agency",
        pageAccessToken: "mock_page_token",
        followersCount: 1250,
        isInstagramConnected: true,
        isActive: true,
      },
    ];
  }

  async getFacebookPageByPageId(tenantId: number, pageId: string) {
    const pages = await this.getFacebookPages(tenantId);
    return pages.find((page) => page.pageId === pageId);
  }

  async createFacebookLeadForm(formData: any) {
    const form = {
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("Creating Facebook lead form:", form);
    return form;
  }

  async getFacebookLeadForms(tenantId: number) {
    return [
      {
        id: 1,
        tenantId,
        formId: "form123",
        formName: "Travel Inquiry Form",
        status: "active",
        totalLeads: 45,
        isActive: true,
      },
    ];
  }

  async createFacebookPost(postData: any) {
    const post = {
      id: Date.now(),
      ...postData,
      createdAt: new Date().toISOString(),
    };

    console.log("Creating Facebook post:", post);
    return post;
  }

  async getFacebookPosts(tenantId: number, limit: number = 25) {
    return [
      {
        id: 1,
        tenantId,
        postId: "post123",
        message: "Check out our amazing travel deals!",
        postType: "photo",
        likes: 45,
        comments: 12,
        shares: 8,
        reach: 1250,
        publishedAt: new Date().toISOString(),
      },
    ];
  }

  async getFacebookInsights(tenantId: number, pageId?: string) {
    return {
      totalReach: 15420,
      totalEngagement: 2340,
      newFollowers: 156,
      postImpressions: 8750,
      pageViews: 540,
      totalLeads: 78,
    };
  }

  // Calendar Events Management
  async getCalendarEventsByTenant(tenantId: number) {
    try {
      console.log(
        `📅 Getting real-time calendar events for tenant ${tenantId}`,
      );

      let calendarEvents = [];
      let bookings = [];
      let leads = [];

      // Get calendar_events from database (if table exists)
      try {
        const result = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'calendar_events'
          )
        `;

        if (result[0].exists) {
          calendarEvents = await sql`
            SELECT 
              id, tenant_id, title, description, start_time, end_time, 
              location, attendees, color, is_recurring, status, visibility, created_at
            FROM calendar_events 
            WHERE tenant_id = ${tenantId}
            ORDER BY start_time ASC
          `;
          console.log(`📅 Found ${calendarEvents.length} calendar events`);
        } else {
          console.log("📅 Calendar events table does not exist, skipping");
          calendarEvents = [];
        }
      } catch (err) {
        console.log("📅 Calendar events table check failed, skipping");
        calendarEvents = [];
      }

      // Get real bookings data
      try {
        bookings = await sql`
          SELECT 
            b.id, b.travel_date, b.total_amount, b.status, b.booking_number, b.number_of_travelers,
            c.name as customer_name, c.email as customer_email, c.phone as customer_phone
          FROM bookings b
          LEFT JOIN customers c ON b.customer_id = c.id
          WHERE b.tenant_id = ${tenantId} AND b.travel_date IS NOT NULL
          ORDER BY b.travel_date ASC
        `;
        console.log(
          `📅 Found ${bookings.length} bookings with travel dates for tenant ${tenantId}`,
        );
        console.log(
          `📅 Bookings details:`,
          bookings.map((b) => ({
            id: b.id,
            travel_date: b.travel_date,
            customer_name: b.customer_name,
          })),
        );
      } catch (err) {
        console.log("📅 Error fetching bookings:", err.message);
        console.log("📅 Full booking error:", err);
        bookings = [];
      }

      // Get real leads data
      try {
        leads = await sql`
          SELECT 
            l.id, 
            COALESCE(l.name, CONCAT(l.first_name, ' ', l.last_name)) as name,
            l.email, l.phone, l.status, l.budget_range, 
            l.created_at, l.notes, l.source
          FROM leads l
          WHERE l.tenant_id = ${tenantId}
          ORDER BY l.created_at DESC
        `;
        console.log(`📅 Found ${leads.length} leads for tenant ${tenantId}`);
        console.log(
          `📅 Leads details:`,
          leads.map((l) => ({ id: l.id, name: l.name, email: l.email })),
        );
      } catch (err) {
        console.log("📅 Error fetching leads:", err.message);
        console.log("📅 Full leads error:", err);
        leads = [];
      }

      const allEvents = [];

      // Add calendar_events from database
      calendarEvents.forEach((event) => {
        allEvents.push({
          id: event.id.toString(),
          tenantId: event.tenant_id,
          title: event.title,
          description: event.description,
          startTime: event.start_time,
          endTime: event.end_time,
          location: event.location,
          attendees: Array.isArray(event.attendees)
            ? event.attendees
            : event.attendees
              ? [event.attendees]
              : [],
          status: event.status || "confirmed",
          color: event.color || "#3B82F6",
          isRecurring: event.is_recurring || false,
          type: "event",
          visibility: event.visibility || "public",
          createdAt: event.created_at,
        });
      });

      // Transform bookings to calendar events with real data
      bookings.forEach((booking) => {
        if (booking.travel_date) {
          const travelDate = new Date(booking.travel_date);
          allEvents.push({
            id: `booking-${booking.id}`,
            tenantId: tenantId,
            title: `✈️ ${booking.customer_name || "Travel Booking"} (${booking.booking_number || booking.id})`,
            description: `Amount: $${booking.total_amount} | Travelers: ${booking.number_of_travelers || 1} | Status: ${booking.status} | Customer: ${booking.customer_name} | Email: ${booking.customer_email} | Phone: ${booking.customer_phone}`,
            startTime: travelDate.toISOString(),
            endTime: new Date(
              travelDate.getTime() + 24 * 60 * 60 * 1000,
            ).toISOString(),
            location: null,
            attendees: booking.customer_email ? [booking.customer_email] : [],
            status: "confirmed",
            color: "#10b981",
            isRecurring: false,
            type: "booking",
            amount: parseFloat(booking.total_amount || "0"),
            customerName: booking.customer_name,
            customerEmail: booking.customer_email,
            customerPhone: booking.customer_phone,
            bookingStatus: booking.status,
            bookingNumber: booking.booking_number,
          });
        }
      });

      // Transform leads to follow-up calendar events with real data
      leads.forEach((lead) => {
        const followUpDate = new Date(lead.created_at);
        followUpDate.setDate(followUpDate.getDate() + 1);
        followUpDate.setHours(10, 0, 0, 0);

        allEvents.push({
          id: `lead-${lead.id}`,
          tenantId: tenantId,
          title: `🎯 Follow up: ${lead.name}`,
          description: `Lead: ${lead.name} | Budget: ${lead.budget_range || "TBD"} | Status: ${lead.status} | Source: ${lead.source || "Unknown"} | Email: ${lead.email} | Phone: ${lead.phone} | Notes: ${lead.notes || "No notes"}`,
          startTime: followUpDate.toISOString(),
          endTime: new Date(
            followUpDate.getTime() + 60 * 60 * 1000,
          ).toISOString(),
          location: null,
          attendees: lead.email ? [lead.email] : [],
          status: "tentative",
          color: "#8b5cf6",
          isRecurring: false,
          type: "lead",
          leadName: lead.name,
          leadEmail: lead.email,
          leadPhone: lead.phone,
          budgetRange: lead.budget_range,
          leadStatus: lead.status,
          notes: lead.notes,
          source: lead.source,
        });
      });

      console.log(
        `✅ Real-time data: ${calendarEvents.length} calendar events, ${bookings.length} bookings, ${leads.length} leads`,
      );
      console.log(
        `✅ Total events returned: ${allEvents.length} with authentic business data`,
      );
      return allEvents;
    } catch (error) {
      console.error("❌ Error getting calendar events:", error);
      console.error("❌ Error details:", error.message);
      return []; // Return empty array instead of throwing to prevent frontend crashes
    }
  }

  async createCalendarEvent(eventData: any) {
    try {
      console.log("📅 Creating calendar event with data:", eventData);

      const [newEvent] = await sql`
        INSERT INTO calendar_events (
          tenant_id,
          title,
          description,
          start_time,
          end_time,
          location,
          attendees,
          color,
          is_recurring,
          recurrence_pattern,
          reminders,
          created_by,
          timezone,
          status,
          visibility
        ) VALUES (
          ${eventData.tenantId},
          ${eventData.title},
          ${eventData.description || ""},
          ${eventData.startTime},
          ${eventData.endTime},
          ${eventData.location || ""},
          ${eventData.attendees ? JSON.stringify(eventData.attendees) : ""},
          ${eventData.color || "#3B82F6"},
          ${eventData.isRecurring || false},
          ${eventData.recurrencePattern || ""},
          ${eventData.reminders ? JSON.stringify(eventData.reminders) : ""},
          ${eventData.createdBy || 1},
          ${eventData.timezone || "UTC"},
          ${eventData.status || "confirmed"},
          ${eventData.visibility || "public"}
        )
        RETURNING *
      `;

      return {
        id: newEvent.id,
        tenantId: newEvent.tenant_id,
        title: newEvent.title,
        description: newEvent.description,
        startTime: newEvent.start_time,
        endTime: newEvent.end_time,
        location: newEvent.location,
        attendees: newEvent.attendees || [],
        color: newEvent.color,
        isRecurring: newEvent.is_recurring,
        recurrencePattern: newEvent.recurrence_pattern,
        reminders: newEvent.reminders || [],
        createdBy: newEvent.created_by,
        timezone: newEvent.timezone,
        status: newEvent.status,
        visibility: newEvent.visibility,
        createdAt: newEvent.created_at,
        updatedAt: newEvent.updated_at,
      };
    } catch (error) {
      console.error("Error creating calendar event:", error);
      throw error;
    }
  }

  async updateCalendarEvent(eventId: number, updateData: any) {
    try {
      const [updatedEvent] = await sql`
        UPDATE calendar_events 
        SET 
          title = COALESCE(${updateData.title}, title),
          description = COALESCE(${updateData.description}, description),
          start_time = COALESCE(${updateData.startTime}, start_time),
          end_time = COALESCE(${updateData.endTime}, end_time),
          location = COALESCE(${updateData.location}, location),
          attendees = COALESCE(${updateData.attendees ? JSON.stringify(updateData.attendees) : null}, attendees),
          color = COALESCE(${updateData.color}, color),
          is_recurring = COALESCE(${updateData.isRecurring}, is_recurring),
          recurrence_pattern = COALESCE(${updateData.recurrencePattern}, recurrence_pattern),
          reminders = COALESCE(${updateData.reminders ? JSON.stringify(updateData.reminders) : null}, reminders),
          timezone = COALESCE(${updateData.timezone}, timezone),
          status = COALESCE(${updateData.status}, status),
          visibility = COALESCE(${updateData.visibility}, visibility),
          updated_at = NOW()
        WHERE id = ${eventId}
        RETURNING *
      `;

      return updatedEvent;
    } catch (error) {
      console.error("Error updating calendar event:", error);
      throw error;
    }
  }

  async deleteCalendarEvent(eventId: number) {
    try {
      await sql`DELETE FROM calendar_events WHERE id = ${eventId}`;
      return { success: true };
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      throw error;
    }
  }

  async getCalendarEventsForDashboard(tenantId: number) {
    try {
      // Get all events for dashboard display (past and future)
      const events = await sql`
        SELECT 
          ce.*,
          u.first_name || ' ' || u.last_name as created_by_name,
          b.customer_name,
          b.destination,
          b.total_price,
          c.first_name || ' ' || c.last_name as customer_name_alt,
          l.name as lead_name,
          l.destination as lead_destination
        FROM calendar_events ce
        LEFT JOIN users u ON ce.created_by = u.id
        LEFT JOIN bookings b ON ce.title ILIKE '%' || b.booking_number || '%'
        LEFT JOIN customers c ON b.customer_id = c.id
        LEFT JOIN leads l ON ce.title ILIKE '%lead%' AND l.tenant_id = ce.tenant_id
        WHERE ce.tenant_id = ${tenantId}
        ORDER BY ce.start_time DESC
        LIMIT 50
      `;

      return events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startTime: event.start_time,
        endTime: event.end_time,
        location: event.location,
        color: event.color,
        status: event.status,
        customerName: event.customer_name || event.customer_name_alt,
        destination: event.destination || event.lead_destination,
        totalPrice: event.total_price,
      }));
    } catch (error) {
      console.error("Error getting calendar events for dashboard:", error);
      return [];
    }
  }

  // Invoice V2 CRUD operations

  async deleteInvoice(invoiceId: number, tenantId: number) {
    try {
      console.log(
        "🗑️ DELETEINVOICE: Deleting invoice",
        invoiceId,
        "for tenant",
        tenantId,
      );

      const [deletedInvoice] = await sql`
        DELETE FROM invoices 
        WHERE id = ${invoiceId} AND tenant_id = ${tenantId}
        RETURNING id
      `;

      if (!deletedInvoice) {
        throw new Error("Invoice not found or unauthorized");
      }

      console.log("✅ DELETEINVOICE: Invoice deleted successfully");
      return { success: true };
    } catch (error) {
      console.error("deleteInvoice error:", error);
      throw error;
    }
  }

  // Payment Installments Management
  async createPaymentInstallments(installments: any[]) {
    try {
      console.log("💳 Creating payment installments:", installments);

      const createdInstallments = [];
      for (const installment of installments) {
        const [created] = await sql`
          INSERT INTO payment_installments (
            invoice_id, tenant_id, installment_number, amount, due_date, 
            status, paid_amount, payment_method, notes, created_at, updated_at
          ) VALUES (
            ${installment.invoiceId}, ${installment.tenantId}, ${installment.installmentNumber},
            ${installment.amount}, ${installment.dueDate}, ${installment.status || "pending"},
            ${installment.paidAmount || 0}, ${installment.paymentMethod || null}, 
            ${installment.notes || null}, NOW(), NOW()
          ) RETURNING *
        `;
        createdInstallments.push(created);
      }

      console.log("✅ Payment installments created successfully");
      return createdInstallments;
    } catch (error) {
      console.error("createPaymentInstallments error:", error);
      throw error;
    }
  }

  async getPaymentInstallmentsByInvoice(invoiceId: number, tenantId: number) {
    try {
      const installments = await sql`
        SELECT * FROM payment_installments 
        WHERE invoice_id = ${invoiceId} AND tenant_id = ${tenantId}
        ORDER BY installment_number ASC
      `;
      return installments;
    } catch (error) {
      console.error("getPaymentInstallmentsByInvoice error:", error);
      throw error;
    }
  }

  async updatePaymentInstallment(installmentId: number, updates: any) {
    try {
      const [updated] = await sql`
        UPDATE payment_installments SET
          status = ${updates.status || "pending"},
          paid_amount = ${updates.paidAmount || 0},
          paid_date = ${updates.paidDate || null},
          payment_method = ${updates.paymentMethod || null},
          notes = ${updates.notes || null},
          updated_at = NOW()
        WHERE id = ${installmentId} AND tenant_id = ${updates.tenantId}
        RETURNING *
      `;

      if (!updated) {
        throw new Error("Installment not found or unauthorized");
      }

      return updated;
    } catch (error) {
      console.error("updatePaymentInstallment error:", error);
      throw error;
    }
  }

  async deletePaymentInstallmentsByInvoice(
    invoiceId: number,
    tenantId: number,
  ) {
    try {
      await sql`
        DELETE FROM payment_installments 
        WHERE invoice_id = ${invoiceId} AND tenant_id = ${tenantId}
      `;
      return { success: true };
    } catch (error) {
      console.error("deletePaymentInstallmentsByInvoice error:", error);
      throw error;
    }
  }

  // Dynamic Fields Management
  async getDynamicFieldsByTenant(tenantId: number) {
    try {
      console.log("🔍 Fetching dynamic fields for tenant:", tenantId);
      const fields = await sql`
        SELECT * FROM dynamic_fields 
        WHERE tenant_id = ${tenantId} 
        ORDER BY display_order ASC, created_at ASC
      `;
      console.log("🔍 ✅ Dynamic fields fetched, count:", fields.length);
      return fields;
    } catch (error: any) {
      console.error("🔍 ❌ Error fetching dynamic fields:", error);
      throw error;
    }
  }

  async createDynamicField(field: any) {
    try {
      console.log("🔍 Creating dynamic field:", field);

      const [newField] = await sql`
        INSERT INTO dynamic_fields (
          tenant_id, field_name, field_label, field_type, field_options,
          is_required, is_enabled, display_order, 
          show_in_leads, show_in_customers, show_in_invoices, show_in_bookings, show_in_packages,
          created_at, updated_at
        ) VALUES (
          ${field.tenantId}, ${field.fieldName}, ${field.fieldLabel}, 
          ${field.fieldType}, ${field.fieldOptions || null}, 
          ${field.isRequired || false}, ${field.isEnabled || true}, 
          ${field.displayOrder || 0},
          ${field.showInLeads !== undefined ? field.showInLeads : true},
          ${field.showInCustomers !== undefined ? field.showInCustomers : false},
          ${field.showInInvoices !== undefined ? field.showInInvoices : false},
          ${field.showInBookings !== undefined ? field.showInBookings : false},
          ${field.showInPackages !== undefined ? field.showInPackages : false},
          NOW(), NOW()
        ) RETURNING *
      `;

      console.log("🔍 ✅ Dynamic field created:", newField);
      return newField;
    } catch (error: any) {
      console.error("🔍 ❌ Error creating dynamic field:", error);
      throw error;
    }
  }

  async updateDynamicField(fieldId: number, field: any) {
    try {
      console.log("🔍 Updating dynamic field:", fieldId, field);

      const [updatedField] = await sql`
        UPDATE dynamic_fields SET
          field_label = ${field.fieldLabel},
          field_type = ${field.fieldType},
          field_options = ${field.fieldOptions || null},
          is_required = ${field.isRequired || false},
          is_enabled = ${field.isEnabled || true},
          display_order = ${field.displayOrder || 0},
          show_in_leads = ${field.showInLeads !== undefined ? field.showInLeads : true},
          show_in_customers = ${field.showInCustomers !== undefined ? field.showInCustomers : false},
          show_in_invoices = ${field.showInInvoices !== undefined ? field.showInInvoices : false},
          show_in_bookings = ${field.showInBookings !== undefined ? field.showInBookings : false},
          show_in_packages = ${field.showInPackages !== undefined ? field.showInPackages : false},
          updated_at = NOW()
        WHERE id = ${fieldId}
        RETURNING *
      `;

      console.log("🔍 ✅ Dynamic field updated:", updatedField);
      return updatedField;
    } catch (error: any) {
      console.error("🔍 ❌ Error updating dynamic field:", error);
      throw error;
    }
  }

  async deleteDynamicField(fieldId: number) {
    try {
      console.log("🔍 Deleting dynamic field:", fieldId);

      // First delete associated field values
      await sql`DELETE FROM dynamic_field_values WHERE field_id = ${fieldId}`;

      // Then delete the field itself
      const [deletedField] = await sql`
        DELETE FROM dynamic_fields WHERE id = ${fieldId} RETURNING *
      `;

      console.log("🔍 ✅ Dynamic field deleted:", deletedField);
      return deletedField;
    } catch (error: any) {
      console.error("🔍 ❌ Error deleting dynamic field:", error);
      throw error;
    }
  }

  async getDynamicFieldValues(leadId: number) {
    try {
      console.log("🔍 Fetching dynamic field values for lead:", leadId);
      const values = await sql`
        SELECT dfv.*, df.field_name, df.field_label, df.field_type 
        FROM dynamic_field_values dfv
        JOIN dynamic_fields df ON dfv.field_id = df.id
        WHERE dfv.lead_id = ${leadId}
      `;
      console.log("🔍 ✅ Dynamic field values fetched, count:", values.length);
      return values;
    } catch (error: any) {
      console.error("🔍 ❌ Error fetching dynamic field values:", error);
      throw error;
    }
  }

  async saveDynamicFieldValues(
    leadId: number,
    fieldValues: Array<{ fieldId: number; fieldValue: string }>,
  ) {
    try {
      console.log(
        "🔍 Saving dynamic field values for lead:",
        leadId,
        fieldValues,
      );

      // Delete existing values for this lead
      await sql`DELETE FROM dynamic_field_values WHERE lead_id = ${leadId}`;

      // Insert new values
      if (fieldValues.length > 0) {
        const insertPromises = fieldValues.map(
          (fv) =>
            sql`
            INSERT INTO dynamic_field_values (lead_id, field_id, field_value, created_at, updated_at)
            VALUES (${leadId}, ${fv.fieldId}, ${fv.fieldValue}, NOW(), NOW())
            RETURNING *
          `,
        );

        const results = await Promise.all(insertPromises);
        console.log("🔍 ✅ Dynamic field values saved, count:", results.length);
        return results.map((r) => r[0]);
      }

      return [];
    } catch (error: any) {
      console.error("🔍 ❌ Error saving dynamic field values:", error);
      throw error;
    }
  }

  // SOCIAL MEDIA INTEGRATION METHODS

  async getSocialCredentials(platform: string) {
    try {
      const [credentials] = await sql`
        SELECT app_id as "appId", app_secret as "appSecret", 
               client_id as "clientId", client_secret as "clientSecret",
               client_key as "clientKey"
        FROM social_credentials 
        WHERE platform = ${platform}
      `;
      return credentials;
    } catch (error) {
      console.error("Error getting social credentials:", error);
      return null;
    }
  }

  async getSocialIntegration(tenantId: number, platform: string) {
    try {
      const [integration] = await sql`
        SELECT * FROM social_integrations 
        WHERE tenant_id = ${tenantId} AND platform = ${platform}
      `;
      return integration;
    } catch (error) {
      console.error("Error getting social integration:", error);
      return null;
    }
  }

  async updateSocialIntegration(tenantId: number, platform: string, data: any) {
    try {
      const [updated] = await sql`
        UPDATE social_integrations 
        SET access_token = ${data.accessToken || null},
            refresh_token = ${data.refreshToken || null},
            token_expires_at = ${data.tokenExpiresAt || null},
            last_sync = ${data.lastSync || null},
            updated_at = NOW()
        WHERE tenant_id = ${tenantId} AND platform = ${platform}
        RETURNING *
      `;
      return updated;
    } catch (error) {
      console.error("Error updating social integration:", error);
      throw error;
    }
  }

  async createSocialPost(postData: any) {
    try {
      const [post] = await sql`
        INSERT INTO social_posts 
        (tenant_id, platform, external_id, content, media_urls, media_type, 
         scheduled_at, published_at, status, likes, comments, shares, views, analytics)
        VALUES (${postData.tenantId}, ${postData.platform}, ${postData.externalId},
                ${postData.content}, ${postData.mediaUrls}, ${postData.mediaType},
                ${postData.scheduledAt}, ${postData.publishedAt}, ${postData.status},
                ${postData.likes || 0}, ${postData.comments || 0}, ${postData.shares || 0},
                ${postData.views || 0}, ${postData.analytics})
        RETURNING *
      `;
      return post;
    } catch (error) {
      console.error("Error creating social post:", error);
      throw error;
    }
  }

  async upsertSocialPost(postData: any) {
    try {
      const [post] = await sql`
        INSERT INTO social_posts 
        (tenant_id, platform, external_id, content, media_urls, media_type, 
         scheduled_at, published_at, status, likes, comments, shares, views, analytics)
        VALUES (${postData.tenantId}, ${postData.platform}, ${postData.externalId},
                ${postData.content}, ${postData.mediaUrls}, ${postData.mediaType},
                ${postData.scheduledAt}, ${postData.publishedAt}, ${postData.status},
                ${postData.likes || 0}, ${postData.comments || 0}, ${postData.shares || 0},
                ${postData.views || 0}, ${postData.analytics})
        ON CONFLICT (tenant_id, platform, external_id) 
        DO UPDATE SET
          content = EXCLUDED.content,
          media_urls = EXCLUDED.media_urls,
          likes = EXCLUDED.likes,
          comments = EXCLUDED.comments,
          shares = EXCLUDED.shares,
          views = EXCLUDED.views,
          analytics = EXCLUDED.analytics,
          updated_at = NOW()
        RETURNING *
      `;
      return post;
    } catch (error) {
      console.error("Error upserting social post:", error);
      throw error;
    }
  }

  async getSocialPosts(tenantId: number, filter: string = "all") {
    try {
      let posts;
      if (filter === "all") {
        posts = await sql`
          SELECT * FROM social_posts 
          WHERE tenant_id = ${tenantId}
          ORDER BY created_at DESC
        `;
      } else {
        posts = await sql`
          SELECT * FROM social_posts 
          WHERE tenant_id = ${tenantId} AND status = ${filter}
          ORDER BY created_at DESC
        `;
      }
      return posts;
    } catch (error) {
      console.error("Error getting social posts:", error);
      return [];
    }
  }

  async getSocialMessages(tenantId: number, filter: string = "all") {
    try {
      let messages;
      if (filter === "all") {
        messages = await sql`
          SELECT * FROM social_messages 
          WHERE tenant_id = ${tenantId}
          ORDER BY created_at DESC
        `;
      } else if (filter === "unread") {
        messages = await sql`
          SELECT * FROM social_messages 
          WHERE tenant_id = ${tenantId} AND is_read = false
          ORDER BY created_at DESC
        `;
      } else {
        messages = await sql`
          SELECT * FROM social_messages 
          WHERE tenant_id = ${tenantId} AND is_read = true
          ORDER BY created_at DESC
        `;
      }
      return messages;
    } catch (error) {
      console.error("Error getting social messages:", error);
      return [];
    }
  }

  async getSocialMessage(tenantId: number, messageId: string) {
    try {
      const [message] = await sql`
        SELECT * FROM social_messages 
        WHERE tenant_id = ${tenantId} AND id = ${parseInt(messageId)}
      `;
      return message;
    } catch (error) {
      console.error("Error getting social message:", error);
      return null;
    }
  }

  async updateSocialMessage(tenantId: number, messageId: string, data: any) {
    try {
      const [updated] = await sql`
        UPDATE social_messages 
        SET is_read = ${data.isRead || false},
            updated_at = NOW()
        WHERE tenant_id = ${tenantId} AND id = ${parseInt(messageId)}
        RETURNING *
      `;
      return updated;
    } catch (error) {
      console.error("Error updating social message:", error);
      throw error;
    }
  }

  async upsertSocialMessage(messageData: any) {
    try {
      const [message] = await sql`
        INSERT INTO social_messages 
        (tenant_id, platform, external_id, from_user, to_user, content, 
         conversation_id, is_read, attachments, created_at)
        VALUES (${messageData.tenantId}, ${messageData.platform}, ${messageData.externalId},
                ${messageData.fromUser}, ${messageData.toUser}, ${messageData.content},
                ${messageData.conversationId}, ${messageData.isRead || false}, 
                ${messageData.attachments}, ${messageData.createdAt || "NOW()"})
        ON CONFLICT (tenant_id, platform, external_id) 
        DO UPDATE SET
          content = EXCLUDED.content,
          is_read = EXCLUDED.is_read,
          updated_at = NOW()
        RETURNING *
      `;
      return message;
    } catch (error) {
      console.error("Error upserting social message:", error);
      throw error;
    }
  }

  async createSocialMessage(messageData: any) {
    try {
      const [message] = await sql`
        INSERT INTO social_messages 
        (tenant_id, platform, external_id, from_user, to_user, content, 
         conversation_id, is_read, attachments, created_at)
        VALUES (${messageData.tenantId}, ${messageData.platform}, ${messageData.externalId},
                ${messageData.fromUser}, ${messageData.toUser}, ${messageData.content},
                ${messageData.conversationId}, ${messageData.isRead || false}, 
                ${messageData.attachments}, ${messageData.createdAt || "NOW()"})
        RETURNING *
      `;
      return message;
    } catch (error) {
      console.error("Error creating social message:", error);
      throw error;
    }
  }

  async getSocialLeads(tenantId: number) {
    try {
      const leads = await sql`
        SELECT * FROM social_leads 
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC
      `;
      return leads;
    } catch (error) {
      console.error("Error getting social leads:", error);
      return [];
    }
  }

  async upsertSocialLead(leadData: any) {
    try {
      const [lead] = await sql`
        INSERT INTO social_leads 
        (tenant_id, platform, external_id, name, email, phone, source, 
         form_name, fields, created_at)
        VALUES (${leadData.tenantId}, ${leadData.platform}, ${leadData.externalId},
                ${leadData.name}, ${leadData.email}, ${leadData.phone}, ${leadData.source},
                ${leadData.formName}, ${leadData.fields}, ${leadData.createdAt || "NOW()"})
        ON CONFLICT (tenant_id, platform, external_id) 
        DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          fields = EXCLUDED.fields,
          updated_at = NOW()
        RETURNING *
      `;
      return lead;
    } catch (error) {
      console.error("Error upserting social lead:", error);
      throw error;
    }
  }

  async createSocialLead(leadData: any) {
    try {
      const [lead] = await sql`
        INSERT INTO social_leads 
        (tenant_id, platform, external_id, name, email, phone, source, 
         form_name, fields, created_at)
        VALUES (${leadData.tenantId}, ${leadData.platform}, ${leadData.externalId},
                ${leadData.name}, ${leadData.email}, ${leadData.phone}, ${leadData.source},
                ${leadData.formName}, ${leadData.fields}, ${leadData.createdAt || "NOW()"})
        RETURNING *
      `;
      return lead;
    } catch (error) {
      console.error("Error creating social lead:", error);
      throw error;
    }
  }

  // Tenant Settings Methods
  async getTenantSettings(tenantId: number) {
    try {
      console.log(`🔧 Getting tenant settings for tenant ${tenantId}`);
      const [settings] = await sql`
        SELECT 
          enable_lead_welcome_message,
          lead_welcome_message,
          enable_customer_welcome_message,
          customer_welcome_message,
          auto_assignment_priority_role_id,
          lead_scoring_enabled,
          auto_lead_assignment,
          duplicate_detection,
          data_retention_days,
          audit_logging,
          session_timeout
        FROM tenant_settings 
        WHERE tenant_id = ${tenantId}
      `;

      if (!settings) {
        // Return schema defaults if no settings found (matches default values in schema)
        console.log(
          `🔧 No settings found for tenant ${tenantId}, returning schema defaults`,
        );
        return {
          enableLeadWelcomeMessage: true,
          leadWelcomeMessage:
            "Hello! Thank you for your interest. Our team will get in touch with you shortly.",
          enableCustomerWelcomeMessage: true,
          customerWelcomeMessage:
            "Welcome! Thank you for choosing us. We're excited to serve you!",
        };
      }

      console.log(`🔧 Found settings for tenant ${tenantId}`);
      // Return in camelCase format (use schema defaults as fallback)
      return {
        enableLeadWelcomeMessage: settings.enable_lead_welcome_message ?? true,
        leadWelcomeMessage:
          settings.lead_welcome_message ??
          "Hello! Thank you for your interest. Our team will get in touch with you shortly.",
        enableCustomerWelcomeMessage:
          settings.enable_customer_welcome_message ?? true,
        customerWelcomeMessage:
          settings.customer_welcome_message ??
          "Welcome! Thank you for choosing us. We're excited to serve you!",
        autoAssignmentPriorityRoleId: settings.auto_assignment_priority_role_id || null,
        leadScoringEnabled: settings.lead_scoring_enabled ?? true,
        autoLeadAssignment: settings.auto_lead_assignment ?? false,
        duplicateDetection: settings.duplicate_detection ?? true,
        dataRetentionDays: settings.data_retention_days ?? 365,
        auditLogging: settings.audit_logging ?? true,
        sessionTimeout: settings.session_timeout ?? 120,
      };
    } catch (error) {
      console.error("Error getting tenant settings:", error);
      // Return schema defaults on error
      return {
        enableLeadWelcomeMessage: true,
        leadWelcomeMessage:
          "Hello! Thank you for your interest. Our team will get in touch with you shortly.",
        enableCustomerWelcomeMessage: true,
        customerWelcomeMessage:
          "Welcome! Thank you for choosing us. We're excited to serve you!",
      };
    }
  }

  async updateTenantSettings(tenantId: number, settingsData: any) {
    try {
      console.log(
        `🔧 Updating tenant settings for tenant ${tenantId}:`,
        settingsData,
      );

      // Insert or update settings using COALESCE to preserve existing values
      const [updatedSettings] = await sql`
        INSERT INTO tenant_settings (
          tenant_id, 
          enable_lead_welcome_message, 
          lead_welcome_message,
          enable_customer_welcome_message, 
          customer_welcome_message,
          auto_assignment_priority_role_id,
          lead_scoring_enabled,
          auto_lead_assignment,
          duplicate_detection,
          data_retention_days,
          audit_logging,
          session_timeout,
          updated_at
        )
        VALUES (
          ${tenantId}, 
          ${settingsData.enableLeadWelcomeMessage ?? false}, 
          ${settingsData.leadWelcomeMessage ?? ""},
          ${settingsData.enableCustomerWelcomeMessage ?? false}, 
          ${settingsData.customerWelcomeMessage ?? ""},
          ${settingsData.autoAssignmentPriorityRoleId || null},
          ${settingsData.leadScoringEnabled ?? true},
          ${settingsData.autoLeadAssignment ?? false},
          ${settingsData.duplicateDetection ?? true},
          ${settingsData.dataRetentionDays ?? 365},
          ${settingsData.auditLogging ?? true},
          ${settingsData.sessionTimeout ?? 120},
          NOW()
        )
        ON CONFLICT (tenant_id)
        DO UPDATE SET 
          enable_lead_welcome_message = COALESCE(${settingsData.enableLeadWelcomeMessage}, tenant_settings.enable_lead_welcome_message),
          lead_welcome_message = COALESCE(${settingsData.leadWelcomeMessage}, tenant_settings.lead_welcome_message),
          enable_customer_welcome_message = COALESCE(${settingsData.enableCustomerWelcomeMessage}, tenant_settings.enable_customer_welcome_message),
          customer_welcome_message = COALESCE(${settingsData.customerWelcomeMessage}, tenant_settings.customer_welcome_message),
          auto_assignment_priority_role_id = COALESCE(${settingsData.autoAssignmentPriorityRoleId}, tenant_settings.auto_assignment_priority_role_id),
          lead_scoring_enabled = COALESCE(${settingsData.leadScoringEnabled}, tenant_settings.lead_scoring_enabled),
          auto_lead_assignment = COALESCE(${settingsData.autoLeadAssignment}, tenant_settings.auto_lead_assignment),
          duplicate_detection = COALESCE(${settingsData.duplicateDetection}, tenant_settings.duplicate_detection),
          data_retention_days = COALESCE(${settingsData.dataRetentionDays}, tenant_settings.data_retention_days),
          audit_logging = COALESCE(${settingsData.auditLogging}, tenant_settings.audit_logging),
          session_timeout = COALESCE(${settingsData.sessionTimeout}, tenant_settings.session_timeout),
          updated_at = NOW()
        RETURNING 
          enable_lead_welcome_message,
          lead_welcome_message,
          enable_customer_welcome_message,
          customer_welcome_message,
          auto_assignment_priority_role_id,
          lead_scoring_enabled,
          auto_lead_assignment,
          duplicate_detection,
          data_retention_days,
          audit_logging,
          session_timeout
      `;

      console.log(
        `🔧 Successfully updated tenant settings for tenant ${tenantId}`,
      );

      // Return in camelCase format
      return {
        enableLeadWelcomeMessage:
          updatedSettings.enable_lead_welcome_message ?? false,
        leadWelcomeMessage: updatedSettings.lead_welcome_message ?? "",
        enableCustomerWelcomeMessage:
          updatedSettings.enable_customer_welcome_message ?? false,
        customerWelcomeMessage: updatedSettings.customer_welcome_message ?? "",
        autoAssignmentPriorityRoleId: updatedSettings.auto_assignment_priority_role_id || null,
        leadScoringEnabled: updatedSettings.lead_scoring_enabled ?? true,
        autoLeadAssignment: updatedSettings.auto_lead_assignment ?? false,
        duplicateDetection: updatedSettings.duplicate_detection ?? true,
        dataRetentionDays: updatedSettings.data_retention_days ?? 365,
        auditLogging: updatedSettings.audit_logging ?? true,
        sessionTimeout: updatedSettings.session_timeout ?? 120,
      };
    } catch (error) {
      console.error("Error updating tenant settings:", error);
      throw error;
    }
  }

  // Estimates Methods
  async getEstimatesByTenant({
    tenantId,
    search = "",
    status = "",
    startDate = "",
    endDate = "",
    sortBy = "created_at",
    sortOrder = "desc",
    limit = 50,
    offset = 0,
    page = 1,
    pageSize = 10,
  }: {
    tenantId: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }) {
    console.log("Fetching estimates for tenantId:", tenantId);

    let whereClauses = sql`e.tenant_id = ${tenantId}`;

    if (search) {
      whereClauses = sql`${whereClauses} AND (
        LOWER(e.estimate_number::text) LIKE ${"%" + search.toLowerCase() + "%"}
        OR LOWER(e.customer_name) LIKE ${"%" + search.toLowerCase() + "%"}
      )`;
    }

    if (status && status !== "all") {
      whereClauses = sql`${whereClauses} AND e.status = ${status}`;
    }

    if (startDate && endDate) {
      whereClauses = sql`${whereClauses} AND e.created_at BETWEEN ${startDate} AND ${endDate}`;
    }

    // Get total count for pagination
    const [totalCountResult] = await sql`SELECT COUNT(*) as count FROM estimates e WHERE ${whereClauses}`;
    const totalCount = Number(totalCountResult?.count || 0);

    const validSortFields = [
      "created_at",
      "updated_at",
      "estimate_number",
      "status",
    ];
    const sortColumn = validSortFields.includes(sortBy) ? sortBy : "created_at";
    const orderDirection = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

    // Use page/pageSize if provided, otherwise use limit/offset
    const finalLimit = pageSize || limit;
    const finalOffset = page ? (page - 1) * finalLimit : offset;

    // Build query with validated column name (safe because column is whitelisted)
    // We need to use different queries for each sort column since sql doesn't support identifiers
    let estimates;

    if (sortColumn === "created_at") {
      estimates =
        orderDirection === "ASC"
          ? await sql`SELECT * FROM estimates e WHERE ${whereClauses} ORDER BY e.created_at ASC LIMIT ${finalLimit} OFFSET ${finalOffset}`
          : await sql`SELECT * FROM estimates e WHERE ${whereClauses} ORDER BY e.created_at DESC LIMIT ${finalLimit} OFFSET ${finalOffset}`;
    } else if (sortColumn === "updated_at") {
      estimates =
        orderDirection === "ASC"
          ? await sql`SELECT * FROM estimates e WHERE ${whereClauses} ORDER BY e.updated_at ASC LIMIT ${finalLimit} OFFSET ${finalOffset}`
          : await sql`SELECT * FROM estimates e WHERE ${whereClauses} ORDER BY e.updated_at DESC LIMIT ${finalLimit} OFFSET ${finalOffset}`;
    } else if (sortColumn === "estimate_number") {
      estimates =
        orderDirection === "ASC"
          ? await sql`SELECT * FROM estimates e WHERE ${whereClauses} ORDER BY e.estimate_number ASC LIMIT ${finalLimit} OFFSET ${finalOffset}`
          : await sql`SELECT * FROM estimates e WHERE ${whereClauses} ORDER BY e.estimate_number DESC LIMIT ${finalLimit} OFFSET ${finalOffset}`;
    } else if (sortColumn === "status") {
      estimates =
        orderDirection === "ASC"
          ? await sql`SELECT * FROM estimates e WHERE ${whereClauses} ORDER BY e.status ASC LIMIT ${finalLimit} OFFSET ${finalOffset}`
          : await sql`SELECT * FROM estimates e WHERE ${whereClauses} ORDER BY e.status DESC LIMIT ${finalLimit} OFFSET ${finalOffset}`;
    } else {
      estimates =
        await sql`SELECT * FROM estimates e WHERE ${whereClauses} ORDER BY e.created_at DESC LIMIT ${finalLimit} OFFSET ${finalOffset}`;
    }

    console.log("Fetched records:", estimates.length, "Total count:", totalCount);

    // Combine prefix and number for backward compatibility (without dash: EST001)
    const estimatesWithCombinedNumber = estimates.map((estimate: any) => {
      const estPrefix = estimate.estimate_prefix || "EST";
      const estNumber = estimate.estimate_number || "";
      const fullEstimateNumber = estPrefix && estNumber 
        ? `${estPrefix}${estNumber}` 
        : estNumber || estimate.estimate_number;
      return {
        ...estimate,
        estimateNumber: fullEstimateNumber,
        estimatePrefix: estPrefix,
      };
    });

    // Return pagination format similar to invoices
    return {
      data: estimatesWithCombinedNumber,
      pagination: {
        page: page || Math.floor(offset / finalLimit) + 1,
        pageSize: finalLimit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / finalLimit),
      },
    };
  }

  // get All-Estimates 

  async getAllEstimatesByTenant({
  tenantId,
  search = "",
  status = "",
  startDate = "",
  endDate = "",
}: {
  tenantId: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  console.log("Fetching ALL estimates (no pagination) for tenantId:", tenantId);

  
  let whereClauses = sql`e.tenant_id = ${tenantId}`;

  // Search filter
  if (search) {
    whereClauses = sql`${whereClauses} AND (
      LOWER(e.estimate_number::text) LIKE ${"%" + search.toLowerCase() + "%"}
      OR LOWER(e.customer_name) LIKE ${"%" + search.toLowerCase() + "%"}
    )`;
  }

  // Status filter
  if (status && status !== "all") {
    whereClauses = sql`${whereClauses} AND e.status = ${status}`;
  }

  // Date filter
  if (startDate && endDate) {
    whereClauses = sql`${whereClauses} AND e.created_at BETWEEN ${startDate} AND ${endDate}`;
  }

  
  const estimates = await sql`
    SELECT * 
    FROM estimates e 
    WHERE ${whereClauses}
    ORDER BY e.created_at DESC
  `;

  console.log("Fetched (no pagination):", estimates.length);

  const estimatesWithCombinedNumber = estimates.map((estimate: any) => {
    const estPrefix = estimate.estimate_prefix || "EST";
    const estNumber = estimate.estimate_number || "";

    const fullEstimateNumber =
      estPrefix && estNumber ? `${estPrefix}${estNumber}` : estNumber;

    return {
      ...estimate,
      estimateNumber: fullEstimateNumber,
      estimatePrefix: estPrefix,
    };
  });

  return {
    data: estimatesWithCombinedNumber,
  };
}




  async getEstimate(estimateId: number, tenantId: number) {
    try {
      console.log(`Getting estimate ${estimateId} for tenant ${tenantId}`);
      const [estimate] = await sql`
        SELECT * FROM estimates 
        WHERE id = ${estimateId} AND tenant_id = ${tenantId}
      `;
      console.log("Retrieved estimate:", estimate);
      
      if (!estimate) {
        return undefined;
      }

      // Combine prefix and number for backward compatibility (without dash: EST001)
      const estPrefix = estimate.estimate_prefix || "EST";
      const estNumber = estimate.estimate_number || "";
      const fullEstimateNumber = estPrefix && estNumber 
        ? `${estPrefix}${estNumber}` 
        : estNumber || estimate.estimate_number;

      return {
        ...estimate,
        estimateNumber: fullEstimateNumber,
        estimatePrefix: estPrefix,
      };
    } catch (error) {
      console.error("Error getting estimate:", error);
      throw error;
    }
  }

  async createEstimate(estimateData: any) {
    try {
      console.log(
        "🔧 DEBUG: Creating estimate with data:",
        JSON.stringify(estimateData, null, 2),
      );

      // Handle date conversion properly - pass as string and let SQL handle it
      const validUntilValue = estimateData.validUntil || null;
      console.log("🔧 DEBUG: validUntil value:", validUntilValue);

      // Get estimate settings to get default prefix
      const estimateSettings = await this.getEstimateSettings(estimateData.tenantId);
      const defaultPrefix = estimateSettings?.estimateNumberPrefix || "EST";

      // Helper function to split estimate number into prefix and number
      const splitEstimateNumber = (fullNumber: string, defaultPrefix: string = "EST"): { prefix: string; number: string } => {
        if (!fullNumber) {
          return { prefix: defaultPrefix, number: "" };
        }
        // Try to extract prefix and number (format: PREFIX-NUMBER, PREFIXNUMBER, or PREFIX NUMBER)
        // First try with separator (dash or space)
        const matchWithSeparator = fullNumber.match(/^([A-Za-z0-9]+)[\s-]+(.+)$/);
        if (matchWithSeparator) {
          return { prefix: matchWithSeparator[1].toUpperCase(), number: matchWithSeparator[2] };
        }
        // If no separator, try to find where numbers start (format: PREFIXNUMBER like EST001)
        const numberMatch = fullNumber.match(/^([A-Za-z]+)(\d+.*)$/);
        if (numberMatch) {
          return { prefix: numberMatch[1].toUpperCase(), number: numberMatch[2] };
        }
        // If it's all numbers, use default prefix
        if (/^\d+/.test(fullNumber)) {
          return { prefix: defaultPrefix, number: fullNumber };
        }
        // Default: use default prefix and the whole string as number
        return { prefix: defaultPrefix, number: fullNumber };
      };

      // Split estimate number into prefix and number
      const fullEstimateNumber = estimateData.estimateNumber || "";
      const { prefix, number } = splitEstimateNumber(fullEstimateNumber, defaultPrefix);
      const estimateNumber = number; // Store only the number part
      const estimatePrefix = prefix; // Store prefix separately

      const [estimate] = await sql`
        INSERT INTO estimates (
          tenant_id, customer_id, lead_id, estimate_number, estimate_prefix, invoice_number, title, description, 
          currency, customer_name, customer_email, customer_phone, customer_address,
          subtotal, discount_type, discount_value, discount_amount, tax_rate, tax_amount,
          total_amount, deposit_required, deposit_amount, deposit_percentage,
          payment_terms, logo_url, brand_color, notes, status, valid_until, attachments
        ) VALUES (
          ${estimateData.tenantId}, ${estimateData.customerId}, ${estimateData.leadId || null}, ${estimateNumber},
          ${estimatePrefix}, ${estimateData.invoiceNumber}, ${estimateData.title}, ${estimateData.description},
          ${estimateData.currency || "USD"}, ${estimateData.customerName}, 
          ${estimateData.customerEmail}, ${estimateData.customerPhone}, 
          ${estimateData.customerAddress}, ${estimateData.subtotal}, 
          ${estimateData.discountType || "none"}, ${estimateData.discountValue || 0},
          ${estimateData.discountAmount || 0}, ${estimateData.taxRate || 0}, 
          ${estimateData.taxAmount || 0}, ${estimateData.totalAmount},
          ${estimateData.depositRequired || false}, ${estimateData.depositAmount || 0},
          ${estimateData.depositPercentage || 0}, ${estimateData.paymentTerms},
          ${estimateData.logoUrl}, ${estimateData.brandColor || "#0BBCD6"},
          ${estimateData.notes}, ${estimateData.status || "draft"}, ${estimateData.validUntil || null},
          ${estimateData.attachments || JSON.stringify([])}
        ) RETURNING *
      `;

      // Update estimate settings starting number to the next number
      try {
        // Extract the numeric part from the estimate number
        const estimateNumberValue = parseInt(estimateNumber, 10);
        if (!isNaN(estimateNumberValue)) {
          // Increment the starting number to be one more than the current estimate number
          const nextStartNumber = estimateNumberValue + 1;
          
          // Get current settings to preserve other values
          const currentSettings = await this.getEstimateSettings(estimateData.tenantId);
          
          // Update only the estimateNumberStart
          await this.upsertEstimateSettings(estimateData.tenantId, {
            ...currentSettings,
            estimateNumberStart: nextStartNumber,
          });
          
          console.log(`✅ Updated estimate settings: estimateNumberStart set to ${nextStartNumber} (was ${currentSettings.estimateNumberStart || estimateSettings.estimateNumberStart || 1})`);
        }
      } catch (settingsError) {
        console.error("⚠️ Failed to update estimate settings starting number:", settingsError);
        // Don't fail the estimate creation if settings update fails
      }

      // Combine prefix and number for backward compatibility (without dash: EST001)
      const newEstPrefix = estimate.estimate_prefix || "EST";
      const newEstNumber = estimate.estimate_number || "";
      const fullNewEstimateNumber = newEstPrefix && newEstNumber 
        ? `${newEstPrefix}${newEstNumber}` 
        : newEstNumber || estimate.estimate_number;

      return {
        ...estimate,
        estimateNumber: fullNewEstimateNumber,
        estimatePrefix: newEstPrefix,
      };
    } catch (error) {
      console.error("Error creating estimate:", error);
      throw error;
    }
  }

  async getEstimateLineItems(estimateId: number) {
    try {
      const lineItems = await sql`
        SELECT * FROM estimate_line_items 
        WHERE estimate_id = ${estimateId}
        ORDER BY display_order ASC, id ASC
      `;
      return lineItems;
    } catch (error) {
      console.error("Error getting estimate line items:", error);
      return [];
    }
  }

  async createEstimateLineItem(lineItemData: any) {
    try {
      // Try to insert with all optional fields first
      try {
        const [lineItem] = await sql`
          INSERT INTO estimate_line_items (
            estimate_id, item_name, description, quantity, unit_price, total_price, display_order, 
            category, tax_rate_id, tax, discount
          ) VALUES (
            ${lineItemData.estimateId}, ${lineItemData.itemName}, ${lineItemData.description || null},
            ${lineItemData.quantity}, ${lineItemData.unitPrice}, ${lineItemData.totalPrice},
            ${lineItemData.displayOrder || 0},
            ${lineItemData.category || null},
            ${lineItemData.taxRateId || null},
            ${lineItemData.tax || null},
            ${lineItemData.discount || null}
          ) RETURNING *
        `;
        return lineItem;
      } catch (error: any) {
        // If columns don't exist, try with category and tax_rate_id only
        if (error && error.message && (
          error.message.includes('column "tax"') ||
          error.message.includes('column "discount"') ||
          error.message.includes('column tax') ||
          error.message.includes('column discount')
        )) {
          console.log("⚠️ Tax/discount columns not found, trying without them");
          try {
            const [lineItem] = await sql`
              INSERT INTO estimate_line_items (
                estimate_id, item_name, description, quantity, unit_price, total_price, display_order, 
                category, tax_rate_id
              ) VALUES (
                ${lineItemData.estimateId}, ${lineItemData.itemName}, ${lineItemData.description || null},
                ${lineItemData.quantity}, ${lineItemData.unitPrice}, ${lineItemData.totalPrice},
                ${lineItemData.displayOrder || 0},
                ${lineItemData.category || null},
                ${lineItemData.taxRateId || null}
              ) RETURNING *
            `;
            return lineItem;
          } catch (error2: any) {
            // If category or tax_rate_id don't exist either, try basic fields
            if (error2 && error2.message && (
              error2.message.includes('column "category"') ||
              error2.message.includes('column "tax_rate_id"')
            )) {
              console.log("⚠️ Category/tax_rate_id columns not found, using basic fields only");
              const [lineItem] = await sql`
                INSERT INTO estimate_line_items (
                  estimate_id, item_name, description, quantity, unit_price, total_price, display_order
                ) VALUES (
                  ${lineItemData.estimateId}, ${lineItemData.itemName}, ${lineItemData.description || null},
                  ${lineItemData.quantity}, ${lineItemData.unitPrice}, ${lineItemData.totalPrice},
                  ${lineItemData.displayOrder || 0}
                ) RETURNING *
              `;
              return lineItem;
            }
            throw error2;
          }
        }
        throw error;
      }
    } catch (error) {
      console.error("Error creating estimate line item:", error);
      throw error;
    }
  }

  async createEstimateEmailLog(emailLogData: any) {
    try {
      const [emailLog] = await sql`
        INSERT INTO estimate_email_logs (
          estimate_id, tenant_id, recipient_email, subject, status, error_message, sent_at
        ) VALUES (
          ${emailLogData.estimateId}, ${emailLogData.tenantId}, ${emailLogData.recipientEmail},
          ${emailLogData.subject}, ${emailLogData.status}, ${emailLogData.errorMessage},
          ${emailLogData.sentAt}
        ) RETURNING *
      `;
      return emailLog;
    } catch (error) {
      console.error("Error creating estimate email log:", error);
      throw error;
    }
  }

  // ✅ Get all call logs for a tenant (optionally by customer or user)
  async getCallLogs(tenantId: number, customerId?: number, userId?: number) {
    try {
      console.log("🔍 Backend - getCallLogs called with tenantId:", tenantId);

      let query = `
        SELECT * FROM call_logs
        WHERE tenant_id = ${tenantId}
      `;

      if (customerId) {
        query += ` AND customer_id = ${customerId}`;
      }

      if (userId) {
        query += ` AND user_id = ${userId}`;
      }

      query += ` ORDER BY started_at DESC`;

      const logs = await sql.unsafe(query);
      console.log("🔍 Backend - Found call logs:", logs.length);

      return logs;
    } catch (error: any) {
      console.error("🔍 Backend - getCallLogs error:", error);
      throw error;
    }
  }

  // ✅ Create a new call log
  async createCallLog(
    tenantId: number,
    customerId: number,
    userId: number,
    callType: string,
    status?: string,
    duration?: number,
    notes?: string,
    startedAt?: Date | string,
    endedAt?: Date | string,
  ) {
    try {
      // Normalize to Date objects if strings are passed
      const startedAtDate = startedAt ? new Date(startedAt) : null;
      const endedAtDate = endedAt ? new Date(endedAt) : null;

      const [newLog] = await sql.unsafe(`
        INSERT INTO call_logs 
          (tenant_id, customer_id, user_id, call_type, status, duration, notes, started_at, ended_at) 
        VALUES (
          ${tenantId}, 
          ${customerId}, 
          ${userId}, 
          '${callType}', 
          '${status || "completed"}', 
          ${duration || null}, 
          ${notes ? `'${notes}'` : null}, 
          ${startedAtDate ? `'${startedAtDate.toISOString()}'` : "NOW()"}, 
          ${endedAtDate ? `'${endedAtDate.toISOString()}'` : null}
        )
        RETURNING *
      `);

      console.log("🔍 Backend - Call log created:", newLog.id);
      return newLog;
    } catch (error: any) {
      console.error("🔍 Backend - createCallLog error:", error);
      throw error;
    }
  }

  // ✅ Update an existing call log
  async updateCallLog(
    id: number,
    status?: string,
    duration?: number,
    notes?: string,
    endedAt?: Date,
  ) {
    try {
      console.log("🔍 Backend - updateCallLog called for ID:", id);

      const [updatedLog] = await sql.unsafe(`
        UPDATE call_logs
        SET 
          status = COALESCE('${status || null}', status),
          duration = COALESCE(${duration || null}, duration),
          notes = COALESCE(${notes ? `'${notes}'` : null}, notes),
          ended_at = COALESCE(${endedAt ? `'${endedAt.toISOString()}'` : null}, ended_at),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `);

      if (!updatedLog) {
        throw new Error("Call log not found");
      }

      console.log("🔍 Backend - Call log updated:", updatedLog.id);
      return updatedLog;
    } catch (error: any) {
      console.error("🔍 Backend - updateCallLog error:", error);
      throw error;
    }
  }

  // ✅ Delete a call log
  async deleteCallLog(id: number) {
    try {
      console.log("🔍 Backend - deleteCallLog called for ID:", id);

      await sql.unsafe(`DELETE FROM call_logs WHERE id = ${id}`);
      console.log("🔍 Backend - Call log deleted:", id);

      return { message: "Call log deleted" };
    } catch (error: any) {
      console.error("🔍 Backend - deleteCallLog error:", error);
      throw error;
    }
  }

  // Lead Activities Methods
  async getLeadActivities(leadId: number) {
    try {
      console.log("🔍 SimpleStorage.getLeadActivities - leadId:", leadId);

      const leadActivities = await sql`
        SELECT 
          la.id,
          la.tenant_id as "tenantId",
          la.lead_id as "leadId", 
          la.user_id as "userId",
          la.activity_type as "activityType",
          la.activity_title as "activityTitle",
          la.activity_description as "activityDescription",
          la.activity_status as "activityStatus",
          la.activity_date as "activityDate",
          la.created_at as "createdAt",
          la.updated_at as "updatedAt",
          u.email as "userEmail",
          CONCAT(u.first_name, ' ', u.last_name) as "userName"
        FROM lead_activities la
        LEFT JOIN users u ON la.user_id = u.id  
        WHERE la.lead_id = ${leadId}
        ORDER BY la.activity_date DESC, la.created_at DESC
      `;

      console.log(
        "✅ Lead activities fetched successfully:",
        leadActivities.length,
      );
      return leadActivities;
    } catch (error) {
      console.error("❌ Error in getLeadActivities:", error);
      throw error;
    }
  }

  async createLeadActivity(activityData: any) {
    try {
      console.log(
        "🔍 SimpleStorage.createLeadActivity - activityData:",
        activityData,
      );

      const [activity] = await sql`
        INSERT INTO lead_activities (
          tenant_id, lead_id, user_id, activity_type, 
          activity_title, activity_description, activity_status, activity_date
        ) VALUES (
          ${activityData.tenantId}, ${activityData.leadId}, ${activityData.userId}, 
          ${activityData.activityType || 1}, ${activityData.activityTitle}, 
          ${activityData.activityDescription}, ${activityData.activityStatus || 1}, 
          ${activityData.activityDate || new Date().toISOString()}
        )
        RETURNING 
          id,
          tenant_id as "tenantId",
          lead_id as "leadId",
          user_id as "userId", 
          activity_type as "activityType",
          activity_title as "activityTitle",
          activity_description as "activityDescription",
          activity_status as "activityStatus",
          activity_date as "activityDate",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      console.log("✅ Lead activity created successfully:", activity.id);
      return activity;
    } catch (error) {
      console.error("❌ Error in createLeadActivity:", error);
      throw error;
    }
  }

  // Lead Notes Methods
  async getLeadNotes(leadId: number) {
    try {
      console.log("🔍 SimpleStorage.getLeadNotes - leadId:", leadId);

      const leadNotesResult = await sql`
        SELECT 
          ln.id,
          ln.tenant_id as "tenantId",
          ln.lead_id as "leadId", 
          ln.user_id as "userId",
          ln.title as "noteTitle",
          ln.details as "noteContent",
          ln.note_type as "noteType",
          ln.note_date as "noteDate",
          ln.attachment,
          ln.reminder,
          ln.reminder_auto as "reminderAuto",
          ln.reminder_email as "reminderEmail",
          ln.reminder_date as "reminderDate",
          ln.created_at as "createdAt",
          ln.updated_at as "updatedAt",
          u.email as "userEmail",
          CONCAT(u.first_name, ' ', u.last_name) as "userName"
        FROM lead_notes ln
        LEFT JOIN users u ON ln.user_id = u.id  
        WHERE ln.lead_id = ${leadId}
        ORDER BY ln.created_at DESC
      `;

      console.log(
        "✅ Lead notes fetched successfully:",
        leadNotesResult.length,
      );
      return leadNotesResult;
    } catch (error) {
      console.error("❌ Error in getLeadNotes:", error);
      throw error;
    }
  }

  async createLeadNote(noteData: any) {
    try {
      console.log("🔍 SimpleStorage.createLeadNote - noteData:", noteData);

      const [note] = await sql`
        INSERT INTO lead_notes (
          tenant_id, lead_id, user_id, title, 
          details, note_type, attachment, 
          reminder, reminder_auto, reminder_email, reminder_date, note_date
        ) VALUES (
          ${noteData.tenantId}, ${noteData.leadId}, ${noteData.userId}, 
          ${noteData.noteTitle}, ${noteData.noteContent}, 
          ${noteData.noteType || "general"}, ${noteData.attachment || null}, 
          ${noteData.reminder || false}, ${noteData.reminderAuto || true}, 
          ${noteData.reminderEmail || null}, ${noteData.reminderDate || null}, NOW()
        )
        RETURNING 
          id,
          tenant_id as "tenantId",
          lead_id as "leadId",
          user_id as "userId", 
          title as "noteTitle",
          details as "noteContent",
          note_type as "noteType",
          note_date as "noteDate",
          attachment,
          reminder,
          reminder_auto as "reminderAuto",
          reminder_email as "reminderEmail",
          reminder_date as "reminderDate",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      console.log("✅ Lead note created successfully:", note.id);
      return note;
    } catch (error) {
      console.error("❌ Error in createLeadNote:", error);
      throw error;
    }
  }

  // Package Types methods - implementing IStorage interface
  async getPackageTypesByTenant(tenantId: number) {
    try {
      const packageTypes = await sql`
        SELECT 
          id,
          name,
          description,
          icon,
          color,
          package_category as "packageCategory",
          display_order as "displayOrder",
          is_active as "isActive",
          tenant_id as "tenantId",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM package_types 
        WHERE tenant_id = ${tenantId} AND is_deleted = false
        ORDER BY display_order ASC, name ASC
      `;
      return packageTypes;
    } catch (error) {
      console.error("❌ Error getting package types by tenant:", error);
      throw error;
    }
  }

  async getPackageType(id: number, tenantId: number) {
    try {
      const [packageType] = await sql`
        SELECT 
          id,
          name,
          description,
          icon,
          color,
          package_category as "packageCategory",
          display_order as "displayOrder",
          is_active as "isActive",
          tenant_id as "tenantId",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM package_types 
        WHERE id = ${id} AND tenant_id = ${tenantId} AND is_deleted = false
      `;
      return packageType;
    } catch (error) {
      console.error("❌ Error getting package type:", error);
      throw error;
    }
  }

  async createPackageType(packageType: any) {
    try {
      const [newPackageType] = await sql`
        INSERT INTO package_types (
          tenant_id, name, description, icon, color, 
          package_category, display_order, is_active
        ) VALUES (
          ${packageType.tenantId}, ${packageType.name}, ${packageType.description || null},
          ${packageType.icon || null}, ${packageType.color || null},
          ${packageType.packageCategory || null}, ${packageType.displayOrder || 0},
          ${packageType.isActive !== false}
        )
        RETURNING 
          id,
          name,
          description,
          icon,
          color,
          package_category as "packageCategory",
          display_order as "displayOrder",
          is_active as "isActive",
          tenant_id as "tenantId",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;
      return newPackageType;
    } catch (error) {
      console.error("❌ Error creating package type:", error);
      throw error;
    }
  }

  async updatePackageType(id: number, tenantId: number, updates: any) {
    try {
      // Sanitize undefined values to null for PostgreSQL
      const sanitizedUpdates = {
        name: updates.name ?? null,
        description: updates.description ?? null,
        icon: updates.icon ?? null,
        color: updates.color ?? null,
        packageCategory: updates.packageCategory ?? null,
        displayOrder: updates.displayOrder ?? null,
        isActive: updates.isActive ?? null,
      };

      console.log("🔍 Sanitized updates:", sanitizedUpdates);

      const [packageType] = await sql`
        UPDATE package_types 
        SET 
          name = COALESCE(${sanitizedUpdates.name}, name),
          description = COALESCE(${sanitizedUpdates.description}, description),
          icon = COALESCE(${sanitizedUpdates.icon}, icon),
          color = COALESCE(${sanitizedUpdates.color}, color),
          package_category = COALESCE(${sanitizedUpdates.packageCategory}, package_category),
          display_order = COALESCE(${sanitizedUpdates.displayOrder}, display_order),
          is_active = COALESCE(${sanitizedUpdates.isActive}, is_active),
          updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${tenantId} AND is_deleted = false
        RETURNING 
          id,
          name,
          description,
          icon,
          color,
          package_category as "packageCategory",
          display_order as "displayOrder",
          is_active as "isActive",
          tenant_id as "tenantId",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;
      return packageType;
    } catch (error) {
      console.error("❌ Error updating package type:", error);
      throw error;
    }
  }

  async deletePackageType(id: number, tenantId: number) {
    try {
      const result = await sql`
        UPDATE package_types 
        SET is_deleted = true, updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${tenantId} AND is_deleted = false
      `;
      return result.rowCount > 0;
    } catch (error) {
      console.error("❌ Error deleting package type:", error);
      throw error;
    }
  }

  // ======================
  // CUSTOMER-SPECIFIC METHODS
  // ======================

  // Customer Notes Methods
  async getCustomerNotes(tenantId: number, customerId: number) {
    try {
      const notes = await sql`
        SELECT 
          id,
          tenant_id as "tenantId",
          customer_id as "customerId",
          user_id as "userId",
          title as "noteTitle",
          details as "noteContent",
          note_type as "noteType",
          attachment,
          reminder,
          reminder_auto as "reminderAuto",
          reminder_email as "reminderEmail",
          reminder_date as "reminderDate",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM customer_notes 
        WHERE tenant_id = ${tenantId} AND customer_id = ${customerId}
        ORDER BY created_at DESC
      `;
      return notes;
    } catch (error) {
      console.error("❌ Error getting customer notes:", error);
      throw error;
    }
  }

  async createCustomerNote(data: any) {
    try {
      const [note] = await sql`
        INSERT INTO customer_notes (
          tenant_id, customer_id, user_id, title, details, note_type,
          attachment, reminder, reminder_auto, reminder_email, reminder_date
        ) VALUES (
          ${data.tenantId}, ${data.customerId}, ${data.userId}, 
          ${data.noteTitle}, ${data.noteContent || null}, ${data.noteType || "general"},
          ${data.attachment || null}, ${data.reminder || false}, 
          ${data.reminderAuto !== false}, ${data.reminderEmail || null},
          ${data.reminderDate || null}
        )
        RETURNING 
          id,
          tenant_id as "tenantId",
          customer_id as "customerId",
          user_id as "userId",
          title as "noteTitle",
          details as "noteContent",
          note_type as "noteType",
          attachment,
          reminder,
          reminder_auto as "reminderAuto",
          reminder_email as "reminderEmail",
          reminder_date as "reminderDate",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;
      return note;
    } catch (error) {
      console.error("❌ Error creating customer note:", error);
      throw error;
    }
  }

  async updateCustomerNote(
    id: number,
    tenantId: number,
    customerId: number,
    data: any,
  ) {
    try {
      const [note] = await sql`
        UPDATE customer_notes 
        SET 
          title = ${data.noteTitle},
          details = ${data.noteContent || null},
          note_type = ${data.noteType || "general"},
          attachment = ${data.attachment || null},
          reminder = ${data.reminder || false},
          reminder_auto = ${data.reminderAuto !== false},
          reminder_email = ${data.reminderEmail || null},
          reminder_date = ${data.reminderDate || null},
          updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${tenantId} AND customer_id = ${customerId}
        RETURNING 
          id,
          tenant_id as "tenantId",
          customer_id as "customerId",
          user_id as "userId",
          title as "noteTitle",
          details as "noteContent",
          note_type as "noteType",
          attachment,
          reminder,
          reminder_auto as "reminderAuto",
          reminder_email as "reminderEmail",
          reminder_date as "reminderDate",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;
      return note;
    } catch (error) {
      console.error("❌ Error updating customer note:", error);
      throw error;
    }
  }

  async deleteCustomerNote(id: number, tenantId: number, customerId: number) {
    try {
      const result = await sql`
        DELETE FROM customer_notes 
        WHERE id = ${id} AND tenant_id = ${tenantId} AND customer_id = ${customerId}
      `;
      return result.rowCount > 0;
    } catch (error) {
      console.error("❌ Error deleting customer note:", error);
      throw error;
    }
  }

  // Customer Activities Methods
  async getCustomerActivities(tenantId: number, customerId: number) {
    try {
      const activities = await sql`
        SELECT 
          id,
          tenant_id as "tenantId",
          customer_id as "customerId",
          user_id as "userId",
          activity_type as "activityType",
          activity_title as "activityTitle",
          activity_description as "activityDescription",
          activity_status as "activityStatus",
          activity_date as "activityDate",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM customer_activities 
        WHERE tenant_id = ${tenantId} AND customer_id = ${customerId}
        ORDER BY activity_date DESC, created_at DESC
      `;
      return activities;
    } catch (error) {
      console.error("❌ Error getting customer activities:", error);
      throw error;
    }
  }

  async createCustomerActivity(data: any) {
    try {
      // Ensure all required fields are not undefined (convert to null if undefined)
      const tenantId = data.tenantId ?? null;
      const customerId = data.customerId ?? null;
      const userId = data.userId ?? null;
      const activityType = data.activityType ?? null;
      const activityTitle = data.activityTitle ?? null;
      const activityDescription = data.activityDescription ?? null;
      const activityStatus = data.activityStatus ?? 1;
      const activityDate = data.activityDate ?? sql`NOW()`;

      const [activity] = await sql`
        INSERT INTO customer_activities (
          tenant_id, customer_id, user_id, activity_type, 
          activity_title, activity_description, activity_status, activity_date
        ) VALUES (
          ${tenantId}, ${customerId}, ${userId}, 
          ${activityType}, ${activityTitle}, ${activityDescription},
          ${activityStatus}, ${activityDate}
        )
        RETURNING 
          id,
          tenant_id as "tenantId",
          customer_id as "customerId",
          user_id as "userId",
          activity_type as "activityType",
          activity_title as "activityTitle",
          activity_description as "activityDescription",
          activity_status as "activityStatus",
          activity_date as "activityDate",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;
      return activity;
    } catch (error) {
      console.error("❌ Error creating customer activity:", error);
      throw error;
    }
  }

  async updateCustomerActivity(
    id: number,
    tenantId: number,
    customerId: number,
    data: any,
  ) {
    try {
      const [activity] = await sql`
        UPDATE customer_activities 
        SET 
          activity_type = ${data.activityType},
          activity_title = ${data.activityTitle},
          activity_description = ${data.activityDescription || null},
          activity_status = ${data.activityStatus || 1},
          activity_date = ${data.activityDate || sql`NOW()`},
          updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${tenantId} AND customer_id = ${customerId}
        RETURNING 
          id,
          tenant_id as "tenantId",
          customer_id as "customerId",
          user_id as "userId",
          activity_type as "activityType",
          activity_title as "activityTitle",
          activity_description as "activityDescription",
          activity_status as "activityStatus",
          activity_date as "activityDate",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;
      return activity;
    } catch (error) {
      console.error("❌ Error updating customer activity:", error);
      throw error;
    }
  }

  async deleteCustomerActivity(
    id: number,
    tenantId: number,
    customerId: number,
  ) {
    try {
      const result = await sql`
        DELETE FROM customer_activities 
        WHERE id = ${id} AND tenant_id = ${tenantId} AND customer_id = ${customerId}
      `;
      return result.rowCount > 0;
    } catch (error) {
      console.error("❌ Error deleting customer activity:", error);
      throw error;
    }
  }

  // Customer Emails Methods
  async getCustomerEmails(tenantId: number, customerId: number) {
    try {
      const emails = await sql`
        SELECT 
          id,
          tenant_id as "tenantId",
          customer_id as "customerId",
          campaign_id as "campaignId",
          subscriber_id as "subscriberId",
          email,
          subject,
          body,
          status,
          sent_at as "sentAt",
          delivered_at as "deliveredAt",
          opened_at as "openedAt",
          clicked_at as "clickedAt",
          error_message as "errorMessage",
          lead_id as "leadId",
          from_email as "fromEmail"
        FROM email_logs 
        WHERE tenant_id = ${tenantId} AND customer_id = ${customerId}
        ORDER BY sent_at DESC
      `;
      return emails;
    } catch (error) {
      console.error("❌ Error getting customer emails:", error);
      throw error;
    }
  }

  async createCustomerEmail(data: any) {
    try {
      const [email] = await sql`
        INSERT INTO email_logs (
          tenant_id, customer_id, campaign_id, subscriber_id, email, subject, body, 
          status, sent_at, from_email
        ) VALUES (
          ${data.tenantId}, ${data.customerId}, ${data.campaignId || null}, ${data.subscriberId || null}, 
          ${data.email}, ${data.subject}, ${data.body},
          ${data.status || "sent"}, ${data.sentAt || sql`NOW()`}, ${data.fromEmail || null}
        )
        RETURNING 
          id,
          tenant_id as "tenantId",
          customer_id as "customerId",
          campaign_id as "campaignId",
          subscriber_id as "subscriberId",
          email,
          subject,
          body,
          status,
          sent_at as "sentAt",
          delivered_at as "deliveredAt",
          opened_at as "openedAt",
          clicked_at as "clickedAt",
          error_message as "errorMessage",
          lead_id as "leadId",
          from_email as "fromEmail"
      `;
      this.createCustomerActivity({
        tenantId: data.tenantId,
        customerId: data.customerId,
        userId: data.userId,
        activityType: 2,
        activityTitle: data.subject,
        activityDescription: data.body,
        activityStatus: 1,
      });
    } catch (error) {
      console.error("❌ Error creating customer email:", error);
      throw error;
    }
  }

  async updateCustomerEmail(
    id: number,
    tenantId: number,
    customerId: number,
    data: any,
  ) {
    try {
      const [email] = await sql`
        UPDATE email_logs 
        SET 
          subject = ${data.subject},
          body = ${data.body},
          status = ${data.status || "sent"},
          delivered_at = ${data.deliveredAt || null},
          opened_at = ${data.openedAt || null},
          clicked_at = ${data.clickedAt || null},
          error_message = ${data.errorMessage || null}
        WHERE id = ${id} AND tenant_id = ${tenantId} AND customer_id = ${customerId}
        RETURNING 
          id,
          tenant_id as "tenantId",
          customer_id as "customerId",
          campaign_id as "campaignId",
          subscriber_id as "subscriberId",
          email,
          subject,
          body,
          status,
          sent_at as "sentAt",
          delivered_at as "deliveredAt",
          opened_at as "openedAt",
          clicked_at as "clickedAt",
          error_message as "errorMessage",
          lead_id as "leadId",
          from_email as "fromEmail"
      `;
      return email;
    } catch (error) {
      console.error("❌ Error updating customer email:", error);
      throw error;
    }
  }

  async deleteCustomerEmail(id: number, tenantId: number, customerId: number) {
    try {
      const result = await sql`
        DELETE FROM email_logs 
        WHERE id = ${id} AND tenant_id = ${tenantId} AND customer_id = ${customerId}
      `;
      return result.rowCount > 0;
    } catch (error) {
      console.error("❌ Error deleting customer email:", error);
      throw error;
    }
  }

  // Customer Calls Methods (using call_logs table with customer filtering)
  async getCustomerCalls(tenantId: number, customerId: number) {
    try {
      const calls = await sql`
        SELECT 
          id,
          tenant_id as "tenantId",
          customer_id as "customerId",
          user_id as "userId",
          call_type as "callType",
          status,
          duration,
          notes,
          started_at as "startedAt",
          ended_at as "endedAt",
          caller_number,
          "followUpDateTime",
          "followUpRequired"
        FROM call_logs 
        WHERE tenant_id = ${tenantId} AND customer_id = ${customerId}
        ORDER BY started_at DESC
      `;
      return calls;
    } catch (error) {
      console.error("❌ Error getting customer calls:", error);
      throw error;
    }
  }

  async createCustomerCall(data: any) {
    try {
      const [call] = await sql`
        INSERT INTO call_logs (
          tenant_id, customer_id, user_id, call_type, status, duration, notes, started_at,caller_number,"followUpDateTime","followUpRequired"
        ) VALUES (
          ${data.tenantId}, ${data.customerId}, ${data.userId}, 
          ${data.callType || "outgoing"}, ${data.status || "completed"},
          ${data.duration || 0}, ${data.notes || null}, 
          ${data.startedAt || sql`NOW()`},${data.phoneNumber},${data.followUpDateTime},${data.followUpRequired}
        )
        RETURNING 
          id,
          tenant_id as "tenantId",
          customer_id as "customerId",
          user_id as "userId",
          call_type as "callType",
          status,
          duration,
          notes,
          started_at as "startedAt",
          ended_at as "endedAt",
          caller_number,
          "followUpDateTime",
          "followUpRequired"
      `;
      this.createCustomerActivity({
        tenantId: data.tenantId,
        customerId: data.customerId,
        userId: data.userId,
        activityType: 3,
        activityTitle: data.callType,
        activityDescription:
          "Mobile Number " +
          data.phoneNumber +
          " Status " +
          data.status +
          " Minutes " +
          data.duration +
          " Notes " +
          data.notes +
          " Date " +
          data.startedAt +
          " Mobile Number " +
          data.phoneNumber +
          "Follow Up " +
          data.followUpDateTime +
          " Follow Up Status " +
          data.followUpRequired,
        activityStatus: 1,
      });
      return call;
    } catch (error) {
      console.error("❌ Error creating customer call:", error);
      throw error;
    }
  }

  async updateCustomerCall(
    id: number,
    tenantId: number,
    customerId: number,
    data: any,
  ) {
    try {
      const [call] = await sql`
        UPDATE call_logs 
        SET 
          phone_number = ${data.phoneNumber},
          call_type = ${data.callType || "outbound"},
          call_status = ${data.callStatus || "completed"},
          call_duration = ${data.callDuration || 0},
          call_outcome = ${data.callOutcome || null},
          notes = ${data.notes || null},
          follow_up_date = ${data.followUpDate || null},
          updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${tenantId} AND customer_id = ${customerId}
        RETURNING 
          id,
          tenant_id as "tenantId",
          customer_id as "customerId",
          lead_id as "leadId",
          user_id as "userId",
          phone_number as "phoneNumber",
          call_type as "callType",
          call_status as "callStatus",
          call_duration as "callDuration",
          call_outcome as "callOutcome",
          notes,
          follow_up_date as "followUpDate",
          recording_url as "recordingUrl",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;
      return call;
    } catch (error) {
      console.error("❌ Error updating customer call:", error);
      throw error;
    }
  }

  async deleteCustomerCall(id: number, tenantId: number, customerId: number) {
    try {
      const result = await sql`
        DELETE FROM call_logs 
        WHERE id = ${id} AND tenant_id = ${tenantId} AND customer_id = ${customerId}
      `;
      return result.rowCount > 0;
    } catch (error) {
      console.error("❌ Error deleting customer call:", error);
      throw error;
    }
  }

  // Customer Files Methods
  async getCustomerFiles(
    tenantId: number,
    customerId: number,
  ): Promise<CustomerFile[]> {
    const result = await db
      .select()
      .from(customerFiles)
      .where(
        and(
          eq(customerFiles.tenantId, tenantId),
          eq(customerFiles.customerId, customerId),
        ),
      )
      .orderBy(desc(customerFiles.createdAt));

    console.log(
      `📁 STORAGE: Retrieved ${result.length} files for customer ${customerId} in tenant ${tenantId}`,
    );
    return result;
  }

  async createCustomerFile(
    fileData: InsertCustomerFile,
  ): Promise<CustomerFile> {
    console.log(`📁 STORAGE: Creating customer file:`, fileData.fileName);

    const result = await db.insert(customerFiles).values(fileData).returning();

    console.log(`📁 STORAGE: Created customer file with ID ${result[0].id}`);
    return result[0];
  }

  async deleteCustomerFile(tenantId: number, fileId: number): Promise<void> {
    console.log(
      `📁 STORAGE: Deleting customer file ${fileId} in tenant ${tenantId}`,
    );

    await db
      .delete(customerFiles)
      .where(
        and(eq(customerFiles.id, fileId), eq(customerFiles.tenantId, tenantId)),
      );

    console.log(`📁 STORAGE: Deleted customer file ${fileId}`);
  }

  async getCustomerFileById(
    tenantId: number,
    fileId: number,
  ): Promise<CustomerFile | undefined> {
    const result = await db
      .select()
      .from(customerFiles)
      .where(
        and(eq(customerFiles.id, fileId), eq(customerFiles.tenantId, tenantId)),
      )
      .limit(1);

    return result[0];
  }

  async updateCustomerFile(
    tenantId: number,
    fileId: number,
    updates: Partial<InsertCustomerFile>,
  ): Promise<CustomerFile> {
    console.log(
      `📁 STORAGE: Updating customer file ${fileId} in tenant ${tenantId}`,
    );

    const result = await db
      .update(customerFiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(
        and(eq(customerFiles.id, fileId), eq(customerFiles.tenantId, tenantId)),
      )
      .returning();

    console.log(`📁 STORAGE: Updated customer file ${fileId}`);
    return result[0];
  }


  // DASHBOARD & REPORTS METHODS


async getDashboardMetrics(
  tenantId: number,
  teamUserIds?: number[], // Optional: filter by team user IDs (for hierarchical access)
  startDate?: string,
  endDate?: string,
  period?: string,
) {
  console.log(
    `📊 STORAGE: Getting dashboard metrics for tenant ${tenantId}`,
    teamUserIds ? `(filtered for team: ${teamUserIds.join(', ')})` : "(all data)",
    { startDate, endDate, period },
  );

  try {
  
    // DATE FILTER LOGIC
  
    let dateFilter = sql`1=1`;
    if (startDate && endDate) {
      dateFilter = sql`i.issue_date BETWEEN ${startDate} AND ${endDate}`;
    } else if (period) {
      const now = new Date();
      let filterDate = new Date();

      switch (period) {
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          filterDate.setMonth(now.getMonth() - 1);
      }

      dateFilter = sql`i.issue_date >= ${filterDate.toISOString()}`;
    }

    // REVENUE (SUM OF INVOICE.total_amount)

    const [revenueResult] = await sql`
      SELECT COALESCE(SUM(i.total_amount), 0) AS revenue
      FROM invoices i
      WHERE 
        i.tenant_id = ${tenantId}
        AND i.status NOT IN ('void', 'cancelled')
        AND ${dateFilter}
    `;

    // OTHER METRICS
   
    // Invoices - filter by team if provided (replacing bookings count with invoices)
    let invoicesFilter = sql`tenant_id = ${tenantId}`;
    if (teamUserIds && teamUserIds.length > 0) {
      // Ensure all IDs are integers
      const userIdsAsInts = teamUserIds.map(id => Number(id)).filter(id => !isNaN(id));
      if (userIdsAsInts.length > 0) {
        // Invoices don't have assigned_user_id, so we'll filter by customer's assigned user if needed
        // For now, just filter by tenant_id
        invoicesFilter = sql`tenant_id = ${tenantId}`;
      }
    }
    const [invoicesResult] = await sql`
      SELECT COUNT(*) as total_invoices
      FROM invoices 
      WHERE ${invoicesFilter} AND ${dateFilter} AND status NOT IN ('void', 'cancelled')
    `;

    // Customers - filter by team if provided
    let customersFilter = sql`tenant_id = ${tenantId}`;
    if (teamUserIds && teamUserIds.length > 0) {
      // Ensure all IDs are integers
      const userIdsAsInts = teamUserIds.map(id => Number(id)).filter(id => !isNaN(id));
      if (userIdsAsInts.length > 0) {
        customersFilter = sql`${customersFilter} AND assigned_user_id = ANY(${sql.array(userIdsAsInts)}::int[])`;
      }
    }
    const [customersResult] = await sql`
      SELECT COUNT(*) as customers
      FROM customers 
      WHERE ${customersFilter} AND ${dateFilter}
    `;

    // Leads - filter by team if provided (role-based hierarchy filtering)
    let leadsFilter = sql`tenant_id = ${tenantId}`;
    if (teamUserIds && teamUserIds.length > 0) {
      // Ensure all IDs are integers
      const userIdsAsInts = teamUserIds.map(id => Number(id)).filter(id => !isNaN(id));
      if (userIdsAsInts.length > 0) {
        leadsFilter = sql`${leadsFilter} AND assigned_user_id = ANY(${sql.array(userIdsAsInts)}::int[])`;
      }
    }
    const [leadsResult] = await sql`
      SELECT COUNT(*) as leads
      FROM leads 
      WHERE ${leadsFilter} AND ${dateFilter}
    `;

   
    // MONTHLY REVENUE 
    
    const monthlyRevenue = await sql`
      SELECT 
        TO_CHAR(i.issue_date, 'Mon') AS month,
        COUNT(i.id) AS bookings,
        COALESCE(SUM(i.total_amount), 0) AS revenue
      FROM invoices i
      WHERE 
        i.tenant_id = ${tenantId}
        AND i.status NOT IN ('void', 'cancelled')
        AND i.issue_date >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(i.issue_date, 'Mon'), DATE_TRUNC('month', i.issue_date)
      ORDER BY DATE_TRUNC('month', i.issue_date)
      LIMIT 6
    `;

    // Leads chart data - filter by team if provided (role-based hierarchy filtering)
    let leadsChartFilter = sql`tenant_id = ${tenantId} AND created_at >= NOW() - INTERVAL '6 months'`;
    if (teamUserIds && teamUserIds.length > 0) {
      // Ensure all IDs are integers
      const userIdsAsInts = teamUserIds.map(id => Number(id)).filter(id => !isNaN(id));
      if (userIdsAsInts.length > 0) {
        leadsChartFilter = sql`${leadsChartFilter} AND assigned_user_id = ANY(${sql.array(userIdsAsInts)}::int[])`;
      }
    }
    const leadsData = await sql`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        COUNT(*) as leads
      FROM leads 
      WHERE ${leadsChartFilter}
      GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
      LIMIT 6
    `;

    const chartData = monthlyRevenue.map((revenueRow) => {
      const leadsRow = leadsData.find(
        (l) => l.month === revenueRow.month,
      ) || { leads: 0 };

      return {
        month: revenueRow.month,
        bookings: parseInt(revenueRow.bookings),
        leads: parseInt(leadsRow.leads),
        revenue: parseFloat(revenueRow.revenue),
      };
    });

    const metrics = {
      revenue: parseFloat(revenueResult.revenue) || 0,
      activeBookings: parseInt(invoicesResult.total_invoices) || 0, // Changed to invoice count
      customers: parseInt(customersResult.customers) || 0,
      leads: parseInt(leadsResult.leads) || 0,
    };

    console.log(`📊 STORAGE: Dashboard metrics calculated:`, metrics);

    return {
      metrics,
      monthlyRevenue: chartData,
      stats: {
        conversionRate:
          metrics.leads > 0
            ? ((metrics.customers / metrics.leads) * 100).toFixed(1)
            : 0,
        avgBookingValue:
          metrics.activeBookings > 0
            ? (metrics.revenue / metrics.activeBookings).toFixed(2)
            : 0,
        customerSatisfaction: 85,
        avgResponseTime: 2.5,
      },
    };
  } catch (error) {
    console.error("❌ STORAGE: Error getting dashboard metrics:", error);
    throw error;
  }
}




  async getChartData(
    tenantId: number,
    filters: { period?: string; startDate?: string; endDate?: string },
  ) {
    console.log(
      `📊 STORAGE: Getting chart data for tenant ${tenantId}`,
      filters,
    );

    try {
      // Map frontend period values to backend period values
      let period = filters.period || "this_month";

      // Normalize period - frontend sends "this_week", "this_month", "this_year"
      if (period === "this_week" || period === "today") {
        period = "week";
      } else if (period === "this_year") {
        period = "year";
      } else {
        period = "month"; // this_month or default
      }

      // Calculate date range
      let startDate: string = "";
      let endDate: string = new Date().toISOString();

      if (filters.startDate && filters.endDate) {
        startDate = filters.startDate;
        endDate = filters.endDate;
      } else {
        const now = new Date();
        let filterDate = new Date();

        switch (period) {
          case "week":
            filterDate.setDate(now.getDate() - 7);
            break;
          case "month":
            filterDate.setMonth(now.getMonth() - 6);
            break;
          case "year":
            filterDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            filterDate.setMonth(now.getMonth() - 6);
        }

        startDate = filterDate.toISOString();
      }

      console.log(`📊 STORAGE: Using period="${period}" for chart grouping`);
      console.log(
        `📊 STORAGE: tenantId=${tenantId}, startDate=${startDate}, endDate=${endDate}`,
      );

      if (period === "week") {
        // Daily data for week view - return YYYY-MM-DD as unique key
        const [bookingsData, revenueData, leadsData, expensesData] =
          await Promise.all([
            sql`
            SELECT 
              TO_CHAR(DATE_TRUNC('day', bookings.created_at), 'YYYY-MM-DD') as month,
              COUNT(*) as bookings
            FROM bookings 
            WHERE bookings.tenant_id = ${tenantId} 
              AND bookings.created_at >= ${startDate}
              AND bookings.created_at <= ${endDate}
            GROUP BY DATE_TRUNC('day', bookings.created_at)
            ORDER BY DATE_TRUNC('day', bookings.created_at)
          `,
            sql`
            SELECT 
              TO_CHAR(DATE_TRUNC('day', invoices.created_at), 'YYYY-MM-DD') as month,
              COALESCE(SUM(invoices.total_amount::numeric), 0) as revenue
            FROM invoices 
            WHERE invoices.tenant_id = ${tenantId} 
              AND invoices.created_at >= ${startDate}
              AND invoices.created_at <= ${endDate}
            GROUP BY DATE_TRUNC('day', invoices.created_at)
            ORDER BY DATE_TRUNC('day', invoices.created_at)
          `,
            sql`
            SELECT 
              TO_CHAR(DATE_TRUNC('day', leads.created_at), 'YYYY-MM-DD') as month,
              COUNT(*) as leads
            FROM leads 
            WHERE leads.tenant_id = ${tenantId}
              AND leads.created_at >= ${startDate}
              AND leads.created_at <= ${endDate}
            GROUP BY DATE_TRUNC('day', leads.created_at)
            ORDER BY DATE_TRUNC('day', leads.created_at)
          `,
            sql`
            SELECT 
              TO_CHAR(DATE_TRUNC('day', expenses.created_at), 'YYYY-MM-DD') as month,
              COALESCE(SUM(expenses.amount::numeric), 0) as expense
            FROM expenses 
            WHERE expenses.tenant_id = ${tenantId}
              AND expenses.created_at >= ${startDate}
              AND expenses.created_at <= ${endDate}
            GROUP BY DATE_TRUNC('day', expenses.created_at)
            ORDER BY DATE_TRUNC('day', expenses.created_at)
          `,
          ]);

        // Create canonical time scaffold based on actual date range with unique keys
        const periodScaffold: Array<{ key: string; label: string }> = [];
        const rangeStart = new Date(startDate);
        const rangeEnd = new Date(endDate);

        // Generate days within the date range - use ISO date as key
        const currentDate = new Date(rangeStart);
        while (currentDate <= rangeEnd) {
          const dateKey = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD
          const label = currentDate.toLocaleDateString("en-US", {
            weekday: "short",
          });
          periodScaffold.push({ key: dateKey, label });
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Initialize all periods with zeros - use unique key but display label
        const periodMap = new Map();
        periodScaffold.forEach(({ key, label }) => {
          periodMap.set(key, {
            month: label, // Display label for frontend
            bookings: 0,
            leads: 0,
            revenue: 0,
            expense: 0,
            profit: 0,
            loss: 0,
          });
        });

        // Merge actual data into scaffold - SQL also returns unique keys
        bookingsData.forEach((row: any) => {
          const existing = periodMap.get(row.month);
          if (existing) {
            existing.bookings = Number(row.bookings) || 0;
          }
        });

        revenueData.forEach((row: any) => {
          const existing = periodMap.get(row.month);
          if (existing) {
            existing.revenue = Number(row.revenue) || 0;
          }
        });

        leadsData.forEach((row: any) => {
          const existing = periodMap.get(row.month);
          if (existing) {
            existing.leads = Number(row.leads) || 0;
          }
        });

        expensesData.forEach((row: any) => {
          const existing = periodMap.get(row.month);
          if (existing) {
            existing.expense = Number(row.expense) || 0;
          }
        });

        // Calculate profit and loss with guaranteed semantics
        const chartData = Array.from(periodMap.values()).map((item) => {
          const revenue = Number(item.revenue) || 0;
          const expense = Number(item.expense) || 0;
          const profitLoss = revenue - expense;

          return {
            ...item,
            profit: profitLoss > 0 ? profitLoss : 0,
            loss: profitLoss < 0 ? Math.abs(profitLoss) : 0,
          };
        });

        console.log(`✅ STORAGE: Returning ${chartData.length} data points`);
        return chartData;
      } else {
        // Monthly data for month/year view - return YYYY-MM as unique key
        const [bookingsData, revenueData, leadsData, expensesData] =
          await Promise.all([
            sql`
            SELECT 
              TO_CHAR(DATE_TRUNC('month', bookings.created_at), 'YYYY-MM') as month,
              COUNT(*) as bookings
            FROM bookings 
            WHERE bookings.tenant_id = ${tenantId}
              AND bookings.created_at >= ${startDate}
              AND bookings.created_at <= ${endDate}
            GROUP BY DATE_TRUNC('month', bookings.created_at)
            ORDER BY DATE_TRUNC('month', bookings.created_at)
          `,
            sql`
            SELECT 
              TO_CHAR(DATE_TRUNC('month', invoices.created_at), 'YYYY-MM') as month,
              COALESCE(SUM(invoices.total_amount::numeric), 0) as revenue
            FROM invoices 
            WHERE invoices.tenant_id = ${tenantId}
              AND invoices.created_at >= ${startDate}
              AND invoices.created_at <= ${endDate}
            GROUP BY DATE_TRUNC('month', invoices.created_at)
            ORDER BY DATE_TRUNC('month', invoices.created_at)
          `,
            sql`
            SELECT 
              TO_CHAR(DATE_TRUNC('month', leads.created_at), 'YYYY-MM') as month,
              COUNT(*) as leads
            FROM leads 
            WHERE leads.tenant_id = ${tenantId}
              AND leads.created_at >= ${startDate}
              AND leads.created_at <= ${endDate}
            GROUP BY DATE_TRUNC('month', leads.created_at)
            ORDER BY DATE_TRUNC('month', leads.created_at)
          `,
            sql`
            SELECT 
              TO_CHAR(DATE_TRUNC('month', expenses.created_at), 'YYYY-MM') as month,
              COALESCE(SUM(expenses.amount::numeric), 0) as expense
            FROM expenses 
            WHERE expenses.tenant_id = ${tenantId}
              AND expenses.created_at >= ${startDate}
              AND expenses.created_at <= ${endDate}
            GROUP BY DATE_TRUNC('month', expenses.created_at)
            ORDER BY DATE_TRUNC('month', expenses.created_at)
          `,
          ]);

        // Create canonical time scaffold based on actual date range with unique keys
        const periodScaffold: Array<{ key: string; label: string }> = [];
        const rangeStart = new Date(startDate);
        const rangeEnd = new Date(endDate);

        // Generate months within the date range - use YYYY-MM as key
        const currentDate = new Date(rangeStart);
        currentDate.setDate(1); // Start at beginning of month
        while (currentDate <= rangeEnd) {
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, "0");
          const dateKey = `${year}-${month}`; // YYYY-MM
          const label = currentDate.toLocaleDateString("en-US", {
            month: "short",
          });
          periodScaffold.push({ key: dateKey, label });
          currentDate.setMonth(currentDate.getMonth() + 1);
        }

        // Initialize all periods with zeros - use unique key but display label
        const periodMap = new Map();
        periodScaffold.forEach(({ key, label }) => {
          periodMap.set(key, {
            month: label, // Display label for frontend
            bookings: 0,
            leads: 0,
            revenue: 0,
            expense: 0,
            profit: 0,
            loss: 0,
          });
        });

        // Merge actual data into scaffold - SQL also returns unique keys
        bookingsData.forEach((row: any) => {
          const existing = periodMap.get(row.month);
          if (existing) {
            existing.bookings = Number(row.bookings) || 0;
          }
        });

        revenueData.forEach((row: any) => {
          const existing = periodMap.get(row.month);
          if (existing) {
            existing.revenue = Number(row.revenue) || 0;
          }
        });

        leadsData.forEach((row: any) => {
          const existing = periodMap.get(row.month);
          if (existing) {
            existing.leads = Number(row.leads) || 0;
          }
        });

        expensesData.forEach((row: any) => {
          const existing = periodMap.get(row.month);
          if (existing) {
            existing.expense = Number(row.expense) || 0;
          }
        });

        // Calculate profit and loss with guaranteed semantics
        const chartData = Array.from(periodMap.values()).map((item) => {
          const revenue = Number(item.revenue) || 0;
          const expense = Number(item.expense) || 0;
          const profitLoss = revenue - expense;

          return {
            ...item,
            profit: profitLoss > 0 ? profitLoss : 0,
            loss: profitLoss < 0 ? Math.abs(profitLoss) : 0,
          };
        });

        console.log(`✅ STORAGE: Returning ${chartData.length} data points`);
        return chartData;
      }
    } catch (error) {
      console.error("❌ STORAGE: Error getting chart data:", error);
      throw error;
    }
  }

  async getLeadTypesReport(
    tenantId: number,
    startDate?: string,
    endDate?: string,
    period?: string,
  ) {
    console.log(
      `📊 STORAGE: Getting lead types report for tenant ${tenantId}`,
      { startDate, endDate, period },
    );

    try {
      // Calculate date range
      let dateFilter = sql`1=1`;
      if (startDate && endDate) {
        dateFilter = sql`l.created_at BETWEEN ${startDate} AND ${endDate}`;
      } else if (period) {
        const now = new Date();
        let filterDate = new Date();

        switch (period) {
          case "week":
            filterDate.setDate(now.getDate() - 7);
            break;
          case "month":
            filterDate.setMonth(now.getMonth() - 1);
            break;
          case "year":
            filterDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            filterDate.setMonth(now.getMonth() - 1);
        }

        dateFilter = sql`l.created_at >= ${filterDate.toISOString()}`;
      }

      const leadTypesData = await sql`
        SELECT 
          lt.name,
          COUNT(l.id) as value,
          COUNT(CASE WHEN l.converted_to_customer_id IS NOT NULL THEN 1 END) as bookings
        FROM lead_types lt
        LEFT JOIN leads l ON lt.id = l.lead_type_id AND l.tenant_id = ${tenantId} AND ${dateFilter}
        WHERE lt.tenant_id = ${tenantId}
        GROUP BY lt.id, lt.name
        ORDER BY COUNT(l.id) DESC
      `;

      console.log(
        `📊 STORAGE: Lead types report generated with ${leadTypesData.length} types`,
      );

      return leadTypesData.map((row) => ({
        name: row.name,
        value: parseInt(row.value),
        bookings: parseInt(row.bookings),
      }));
    } catch (error) {
      console.error("❌ STORAGE: Error getting lead types report:", error);
      throw error;
    }
  }

  async getBookingsWithFilters(
    tenantId: number,
    filters: {
      limit?: number;
      sort?: string;
      startDate?: string;
      endDate?: string;
      period?: string;
    },
  ) {
    console.log(`📋 STORAGE: Getting bookings for tenant ${tenantId}`, filters);
    console.log(
      `📋 DEBUG: Tenant ID type: ${typeof tenantId}, value: ${tenantId}`,
    );
    console.log(
      `📋 DEBUG: Filters received:`,
      JSON.stringify(filters, null, 2),
    );

    try {
      // Calculate date range
      let dateFilter = sql`1=1`;
      if (filters.startDate && filters.endDate) {
        dateFilter = sql`b.created_at BETWEEN ${filters.startDate} AND ${filters.endDate}`;
      } else if (filters.period) {
        const now = new Date();
        let filterDate = new Date();

        switch (filters.period) {
          case "week":
            filterDate.setDate(now.getDate() - 7);
            break;
          case "month":
            filterDate.setMonth(now.getMonth() - 1);
            break;
          case "year":
            filterDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            filterDate.setMonth(now.getMonth() - 1);
        }

        dateFilter = sql`b.created_at >= ${filterDate.toISOString()}`;
      }

      // Determine sort order
      let orderBy = sql`b.created_at DESC`;
      if (filters.sort === "totalAmount") {
        orderBy = sql`b.total_amount DESC`;
      } else if (filters.sort === "customerName") {
        orderBy = sql`c.name ASC`;
      }

      console.log(`📋 DEBUG: Date filter SQL:`, dateFilter);
      console.log(`📋 DEBUG: Order by SQL:`, orderBy);
      console.log(`📋 DEBUG: Executing SQL query for bookings...`);

      const bookings = await sql`
        SELECT 
          b.*,
          c.name as customer_name,
          c.email as customer_email
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.id
        WHERE b.tenant_id = ${tenantId} AND ${dateFilter}
        ORDER BY ${orderBy}
        ${filters.limit ? sql`LIMIT ${filters.limit}` : sql``}
      `;

      console.log(
        `📋 STORAGE: SQL query executed successfully, found ${bookings.length} bookings`,
      );

      return bookings.map((booking) => ({
        ...booking,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        totalAmount: parseFloat(booking.total_amount) || 0,
      }));
    } catch (error) {
      console.error("❌ STORAGE: Error getting bookings with filters:", error);
      throw error;
    }
  }

  async getCustomersWithFilters(
    tenantId: number,
    filters: {
      limit?: number;
      sort?: string;
      startDate?: string;
      endDate?: string;
      period?: string;
    },
  ) {
    console.log(
      `👥 STORAGE: Getting customers for tenant ${tenantId}`,
      filters,
    );

    try {
      // Calculate date range
      let dateFilter = sql`1=1`;
      if (filters.startDate && filters.endDate) {
        dateFilter = sql`c.created_at BETWEEN ${filters.startDate} AND ${filters.endDate}`;
      } else if (filters.period) {
        const now = new Date();
        let filterDate = new Date();

        switch (filters.period) {
          case "week":
            filterDate.setDate(now.getDate() - 7);
            break;
          case "month":
            filterDate.setMonth(now.getMonth() - 1);
            break;
          case "year":
            filterDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            filterDate.setMonth(now.getMonth() - 1);
        }

        dateFilter = sql`c.created_at >= ${filterDate.toISOString()}`;
      }

      // Determine sort order
      let orderBy = sql`c.created_at DESC`;
      if (filters.sort === "totalSpent") {
        orderBy = sql`COALESCE(total_spent, 0) DESC`;
      } else if (filters.sort === "firstName") {
        orderBy = sql`c.name ASC`;
      }

      const customers = await sql`
        SELECT 
          c.*,
          COALESCE(SUM(b.total_amount), 0) as total_spent,
          COUNT(b.id) as booking_count
        FROM customers c
        LEFT JOIN bookings b ON c.id = b.customer_id
        WHERE c.tenant_id = ${tenantId} AND ${dateFilter}
        GROUP BY c.id
        ORDER BY ${orderBy}
        ${filters.limit ? sql`LIMIT ${filters.limit}` : sql``}
      `;

      console.log(`👥 STORAGE: Found ${customers.length} customers`);

      return customers.map((customer) => ({
        ...customer,
        firstName: customer.name?.split(" ")[0] || "",
        lastName: customer.name?.split(" ").slice(1).join(" ") || "",
        totalSpent: parseFloat(customer.total_spent) || 0,
        bookingCount: parseInt(customer.booking_count) || 0,
      }));
    } catch (error) {
      console.error("❌ STORAGE: Error getting customers with filters:", error);
      throw error;
    }
  }

  // ====================================================
  // NEW ANALYTICS METHODS - REVENUE BY LEAD TYPE & BOOKING BY VENDOR
  // ====================================================

  async getRevenueByLeadType(
    tenantId: number,
    startDate?: string,
    endDate?: string,
    period?: string,
  ) {
    console.log(
      `📊 STORAGE: Getting revenue by lead type for tenant ${tenantId}`,
      { startDate, endDate, period },
    );

    try {
      // Validate tenant ID
      if (!tenantId || typeof tenantId !== "number") {
        throw new Error("Invalid tenantId provided");
      }

      // Simplified query without complex date filtering to avoid SQL template issues
      console.log(
        `📊 STORAGE: Executing simplified query for tenant ${tenantId}`,
      );

      const revenueByLeadType = await sql`
        SELECT 
          lt.name as name,
          COALESCE(SUM(b.total_amount), 0) as revenue,
          COUNT(b.id) as bookings,
          COALESCE(ROUND(AVG(b.total_amount), 2), 0) as avg_booking_value
        FROM lead_types lt
        LEFT JOIN leads l ON lt.id = l.lead_type_id AND l.tenant_id = ${tenantId}
        LEFT JOIN bookings b ON l.id = b.lead_id AND b.tenant_id = ${tenantId}
        WHERE lt.tenant_id = ${tenantId}
        GROUP BY lt.id, lt.name
        ORDER BY SUM(b.total_amount) DESC NULLS LAST
      `;

      console.log(
        `📊 STORAGE: Query executed successfully, ${revenueByLeadType.length} records found`,
      );

      const result = revenueByLeadType.map((row) => ({
        name: row.name || "Unknown",
        revenue: Number(row.revenue) || 0,
        bookings: Number(row.bookings) || 0,
        avgBookingValue: Number(row.avg_booking_value) || 0,
      }));

      console.log(
        `📊 STORAGE: Processed ${result.length} revenue records (including zero-value lead types)`,
      );
      return result;
    } catch (error) {
      console.error("❌ STORAGE: Error getting revenue by lead type:", error);
      console.error("❌ STORAGE: Error details:", error.message, error.stack);
      throw error;
    }
  }

  async getBookingsByVendor(
    tenantId: number,
    startDate?: string,
    endDate?: string,
    period?: string,
  ) {
    console.log(
      `📊 STORAGE: Getting bookings by vendor for tenant ${tenantId}`,
      { startDate, endDate, period },
    );

    try {
      // Validate tenant ID
      if (!tenantId || typeof tenantId !== "number") {
        throw new Error("Invalid tenantId provided");
      }

      // Simplified query without complex date filtering to avoid SQL template issues
      console.log(
        `📊 STORAGE: Executing simplified vendor query for tenant ${tenantId}`,
      );

      const bookingsByVendor = await sql`
        SELECT 
          v.name as vendor_name,
          COUNT(b.id) as total_bookings,
          COALESCE(SUM(b.total_amount), 0) as total_revenue,
          COALESCE(ROUND(AVG(b.total_amount), 2), 0) as avg_booking_value,
          COALESCE(v.rating, 0) as vendor_rating
        FROM vendors v
        LEFT JOIN bookings b ON v.id = b.vendor_id AND b.tenant_id = ${tenantId}
        WHERE v.tenant_id = ${tenantId}
        GROUP BY v.id, v.name, v.rating
        ORDER BY COUNT(b.id) DESC NULLS LAST
      `;

      console.log(
        `📊 STORAGE: Vendor query executed successfully, ${bookingsByVendor.length} records found`,
      );

      const result = bookingsByVendor.map((row) => ({
        vendorName: row.vendor_name || "Unknown",
        totalBookings: Number(row.total_bookings) || 0,
        totalRevenue: Number(row.total_revenue) || 0,
        avgBookingValue: Number(row.avg_booking_value) || 0,
        vendorRating: Number(row.vendor_rating) || 0,
      }));

      console.log(
        `📊 STORAGE: Processed ${result.length} vendor records (including zero-booking vendors)`,
      );
      return result;
    } catch (error) {
      console.error("❌ STORAGE: Error getting bookings by vendor:", error);
      console.error("❌ STORAGE: Error details:", error.message, error.stack);
      throw error;
    }
  }

  // Dashboard Preferences Implementation
  async getDashboardPreferences(
    tenantId: number,
    userId?: number,
  ): Promise<any[]> {
    try {
      const preferences = await sql`
        SELECT * FROM dashboard_preferences 
        WHERE tenant_id = ${tenantId} 
        AND (user_id = ${userId || null} OR user_id IS NULL)
        ORDER BY custom_order ASC, component_key ASC
      `;
      return preferences;
    } catch (error) {
      console.error("❌ Error getting dashboard preferences:", error);
      throw error;
    }
  }

  async getDashboardPreference(
    componentKey: string,
    tenantId: number,
    userId?: number,
  ): Promise<any | undefined> {
    try {
      const [preference] = await sql`
        SELECT * FROM dashboard_preferences 
        WHERE component_key = ${componentKey} 
        AND tenant_id = ${tenantId} 
        AND (user_id = ${userId || null} OR user_id IS NULL)
        LIMIT 1
      `;
      return preference;
    } catch (error) {
      console.error("❌ Error getting dashboard preference:", error);
      throw error;
    }
  }

  async upsertDashboardPreference(preference: any): Promise<any> {
    try {
      const existing = await this.getDashboardPreference(
        preference.componentKey,
        preference.tenantId,
        preference.userId,
      );

      if (existing) {
        const [updated] = await sql`
          UPDATE dashboard_preferences 
          SET is_visible = ${preference.isVisible},
              custom_order = ${preference.customOrder || 0},
              updated_at = NOW()
          WHERE component_key = ${preference.componentKey} 
          AND tenant_id = ${preference.tenantId} 
          AND (user_id = ${preference.userId || null} OR user_id IS NULL)
          RETURNING *
        `;
        return updated;
      } else {
        const [created] = await sql`
          INSERT INTO dashboard_preferences (component_key, tenant_id, user_id, is_visible, custom_order, created_at, updated_at)
          VALUES (${preference.componentKey}, ${preference.tenantId}, ${preference.userId || null}, ${preference.isVisible}, ${preference.customOrder || 0}, NOW(), NOW())
          RETURNING *
        `;
        return created;
      }
    } catch (error) {
      console.error("❌ Error upserting dashboard preference:", error);
      throw error;
    }
  }

  async deleteDashboardPreference(
    componentKey: string,
    tenantId: number,
    userId?: number,
  ): Promise<boolean> {
    try {
      const result = await sql`
        DELETE FROM dashboard_preferences 
        WHERE component_key = ${componentKey} 
        AND tenant_id = ${tenantId} 
        AND (user_id = ${userId || null} OR user_id IS NULL)
      `;
      return result.count > 0;
    } catch (error) {
      console.error("❌ Error deleting dashboard preference:", error);
      throw error;
    }
  }

  // Invoice Settings Methods
  async getInvoiceSettings(tenantId: number) {
    try {
      const [settings] =
        await sql`SELECT * FROM tenant_settings WHERE tenant_id = ${tenantId}`;
      if (!settings) {
        return {
          invoiceNumberStart: 1,
          invoiceNumberPrefix: "INV",
          defaultCurrency: "USD",
          defaultGstSettingId: null,
          showTax: true,
          showDiscount: true,
          showNotes: true,
          showVoucherInvoice: true,
          showProvider: true,
          showVendor: true,
          showUnitPrice: true,
          showAdditionalCommission: false,
          sendInvoiceViaEmail: true,
          sendInvoiceViaWhatsapp: false,
        };
      }
      return {
        id: settings.id,
        tenantId: settings.tenant_id,
        invoiceNumberStart: settings.invoice_number_start,
        invoiceNumberPrefix: settings.invoice_number_prefix || "INV",
        defaultCurrency: settings.default_currency,
        defaultGstSettingId: settings.default_gst_setting_id || null,
        showTax: settings.show_tax,
        showDiscount: settings.show_discount,
        showNotes: settings.show_notes,
        showVoucherInvoice: settings.show_voucher_invoice,
        showProvider: settings.show_provider,
        showVendor: settings.show_vendor,
        showUnitPrice: settings.show_unit_price,
        showAdditionalCommission: settings.show_additional_commission ?? false,
        sendInvoiceViaEmail: settings.send_invoice_via_email ?? true,
        sendInvoiceViaWhatsapp: settings.send_invoice_via_whatsapp ?? false,
      };
    } catch (error) {
      console.error("Error getting invoice settings:", error);
      return {
        invoiceNumberStart: 1,
        invoiceNumberPrefix: "INV",
        defaultCurrency: "USD",
        defaultGstSettingId: null,
        showTax: true,
        showDiscount: true,
        showNotes: true,
        showVoucherInvoice: true,
        showProvider: true,
        showVendor: true,
        showUnitPrice: true,
        showAdditionalCommission: false,
        sendInvoiceViaEmail: true,
        sendInvoiceViaWhatsapp: false,
      };
    }
  }

  async upsertInvoiceSettings(tenantId: number, settings: any) {
    try {
      const [result] =
        await sql`INSERT INTO tenant_settings (tenant_id, invoice_number_start, invoice_number_prefix, default_currency, default_gst_setting_id, show_tax, show_discount, show_notes, show_voucher_invoice, show_provider, show_vendor, show_unit_price, show_additional_commission, send_invoice_via_email, send_invoice_via_whatsapp, updated_at) VALUES (${tenantId}, ${settings.invoiceNumberStart !== undefined ? settings.invoiceNumberStart : 1}, ${settings.invoiceNumberPrefix || "INV"}, ${settings.defaultCurrency || "USD"}, ${settings.defaultGstSettingId || null}, ${settings.showTax !== undefined ? settings.showTax : true}, ${settings.showDiscount !== undefined ? settings.showDiscount : true}, ${settings.showNotes !== undefined ? settings.showNotes : true}, ${settings.showVoucherInvoice !== undefined ? settings.showVoucherInvoice : true}, ${settings.showProvider !== undefined ? settings.showProvider : true}, ${settings.showVendor !== undefined ? settings.showVendor : true}, ${settings.showUnitPrice !== undefined ? settings.showUnitPrice : true}, ${settings.showAdditionalCommission !== undefined ? settings.showAdditionalCommission : false}, ${settings.sendInvoiceViaEmail !== undefined ? settings.sendInvoiceViaEmail : true}, ${settings.sendInvoiceViaWhatsapp !== undefined ? settings.sendInvoiceViaWhatsapp : false}, NOW()) ON CONFLICT (tenant_id) DO UPDATE SET invoice_number_start = COALESCE(${settings.invoiceNumberStart}, tenant_settings.invoice_number_start), invoice_number_prefix = COALESCE(${settings.invoiceNumberPrefix}, tenant_settings.invoice_number_prefix), default_currency = COALESCE(${settings.defaultCurrency}, tenant_settings.default_currency), default_gst_setting_id = COALESCE(${settings.defaultGstSettingId}, tenant_settings.default_gst_setting_id), show_tax = COALESCE(${settings.showTax}, tenant_settings.show_tax), show_discount = COALESCE(${settings.showDiscount}, tenant_settings.show_discount), show_notes = COALESCE(${settings.showNotes}, tenant_settings.show_notes), show_voucher_invoice = COALESCE(${settings.showVoucherInvoice}, tenant_settings.show_voucher_invoice), show_provider = COALESCE(${settings.showProvider}, tenant_settings.show_provider), show_vendor = COALESCE(${settings.showVendor}, tenant_settings.show_vendor), show_unit_price = COALESCE(${settings.showUnitPrice}, tenant_settings.show_unit_price), show_additional_commission = COALESCE(${settings.showAdditionalCommission}, tenant_settings.show_additional_commission), send_invoice_via_email = COALESCE(${settings.sendInvoiceViaEmail}, tenant_settings.send_invoice_via_email), send_invoice_via_whatsapp = COALESCE(${settings.sendInvoiceViaWhatsapp}, tenant_settings.send_invoice_via_whatsapp), updated_at = NOW() RETURNING *`;
      return {
        id: result.id,
        tenantId: result.tenant_id,
        invoiceNumberStart: result.invoice_number_start,
        invoiceNumberPrefix: result.invoice_number_prefix || "INV",
        defaultCurrency: result.default_currency,
        defaultGstSettingId: result.default_gst_setting_id || null,
        showTax: result.show_tax,
        showDiscount: result.show_discount,
        showNotes: result.show_notes,
        showVoucherInvoice: result.show_voucher_invoice,
        showProvider: result.show_provider,
        showVendor: result.show_vendor,
        showUnitPrice: result.show_unit_price,
        showAdditionalCommission: result.show_additional_commission ?? false,
        sendInvoiceViaEmail: result.send_invoice_via_email ?? true,
        sendInvoiceViaWhatsapp: result.send_invoice_via_whatsapp ?? false,
      };
    } catch (error) {
      console.error("Error upserting invoice settings:", error);
      throw error;
    }
  }

  // Expense Settings Methods
  async getExpenseSettings(tenantId: number) {
    try {
      const [settings] =
        await sql`SELECT * FROM tenant_settings WHERE tenant_id = ${tenantId}`;
      if (!settings) {
        return {
          expenseNumberStart: 1,
          expenseNumberPrefix: "EXP",
          defaultCurrency: "USD",
          defaultGstSettingId: null,
          showTax: true,
          showVendor: true,
          showLeadType: true,
          showCategory: true,
          showSubcategory: true,
          showPaymentMethod: true,
          showPaymentStatus: true,
          showNotes: true,
        };
      }
      return {
        id: settings.id,
        tenantId: settings.tenant_id,
        expenseNumberStart: settings.expense_number_start ?? 1,
        expenseNumberPrefix: settings.expense_number_prefix ?? "EXP",
        defaultCurrency: settings.default_currency ?? "USD",
        defaultGstSettingId: settings.default_gst_setting_id || null,
        showTax: settings.show_expense_tax ?? true,
        showVendor: settings.show_expense_vendor ?? true,
        showLeadType: settings.show_expense_lead_type ?? true,
        showCategory: settings.show_expense_category ?? true,
        showSubcategory: settings.show_expense_subcategory ?? true,
        showPaymentMethod: settings.show_expense_payment_method ?? true,
        showPaymentStatus: settings.show_expense_payment_status ?? true,
        showNotes: settings.show_expense_notes ?? true,
      };
    } catch (error) {
      console.error("Error getting expense settings:", error);
      return {
        expenseNumberStart: 1,
        expenseNumberPrefix: "EXP",
        defaultCurrency: "USD",
        defaultGstSettingId: null,
        showTax: true,
        showVendor: true,
        showLeadType: true,
        showCategory: true,
        showSubcategory: true,
        showPaymentMethod: true,
        showPaymentStatus: true,
        showNotes: true,
      };
    }
  }

  async upsertExpenseSettings(tenantId: number, settings: any) {
    try {
      const [result] =
        await sql`INSERT INTO tenant_settings (tenant_id, expense_number_start, expense_number_prefix, default_currency, default_gst_setting_id, show_expense_tax, show_expense_vendor, show_expense_lead_type, show_expense_category, show_expense_subcategory, show_expense_payment_method, show_expense_payment_status, show_expense_notes, updated_at) VALUES (${tenantId}, ${settings.expenseNumberStart !== undefined ? settings.expenseNumberStart : 1}, ${settings.expenseNumberPrefix || "EXP"}, ${settings.defaultCurrency || "USD"}, ${settings.defaultGstSettingId || null}, ${settings.showTax !== undefined ? settings.showTax : true}, ${settings.showVendor !== undefined ? settings.showVendor : true}, ${settings.showLeadType !== undefined ? settings.showLeadType : true}, ${settings.showCategory !== undefined ? settings.showCategory : true}, ${settings.showSubcategory !== undefined ? settings.showSubcategory : true}, ${settings.showPaymentMethod !== undefined ? settings.showPaymentMethod : true}, ${settings.showPaymentStatus !== undefined ? settings.showPaymentStatus : true}, ${settings.showNotes !== undefined ? settings.showNotes : true}, NOW()) ON CONFLICT (tenant_id) DO UPDATE SET expense_number_start = COALESCE(${settings.expenseNumberStart}, tenant_settings.expense_number_start), expense_number_prefix = COALESCE(${settings.expenseNumberPrefix}, tenant_settings.expense_number_prefix), default_currency = COALESCE(${settings.defaultCurrency}, tenant_settings.default_currency), default_gst_setting_id = COALESCE(${settings.defaultGstSettingId}, tenant_settings.default_gst_setting_id), show_expense_tax = COALESCE(${settings.showTax}, tenant_settings.show_expense_tax), show_expense_vendor = COALESCE(${settings.showVendor}, tenant_settings.show_expense_vendor), show_expense_lead_type = COALESCE(${settings.showLeadType}, tenant_settings.show_expense_lead_type), show_expense_category = COALESCE(${settings.showCategory}, tenant_settings.show_expense_category), show_expense_subcategory = COALESCE(${settings.showSubcategory}, tenant_settings.show_expense_subcategory), show_expense_payment_method = COALESCE(${settings.showPaymentMethod}, tenant_settings.show_expense_payment_method), show_expense_payment_status = COALESCE(${settings.showPaymentStatus}, tenant_settings.show_expense_payment_status), show_expense_notes = COALESCE(${settings.showNotes}, tenant_settings.show_expense_notes), updated_at = NOW() RETURNING *`;
      return {
        id: result.id,
        tenantId: result.tenant_id,
        expenseNumberStart: result.expense_number_start ?? 1,
        expenseNumberPrefix: result.expense_number_prefix ?? "EXP",
        defaultCurrency: result.default_currency ?? "USD",
        defaultGstSettingId: result.default_gst_setting_id || null,
        showTax: result.show_expense_tax ?? true,
        showVendor: result.show_expense_vendor ?? true,
        showLeadType: result.show_expense_lead_type ?? true,
        showCategory: result.show_expense_category ?? true,
        showSubcategory: result.show_expense_subcategory ?? true,
        showPaymentMethod: result.show_expense_payment_method ?? true,
        showPaymentStatus: result.show_expense_payment_status ?? true,
        showNotes: result.show_expense_notes ?? true,
      };
    } catch (error) {
      console.error("Error upserting expense settings:", error);
      throw error;
    }
  }

  // Estimate Settings Methods
  async getEstimateSettings(tenantId: number) {
    try {
      const [settings] = await sql`
        SELECT * FROM tenant_settings WHERE tenant_id = ${tenantId}
      `;
      if (!settings) {
        return {
          estimateNumberStart: 1,
          estimateNumberPrefix: "EST",
          defaultCurrency: "USD",
          defaultGstSettingId: null,
          showTax: true,
          showDiscount: true,
          showNotes: true,
          showDeposit: true,
          showPaymentTerms: true,
          sendEstimateViaEmail: true,
          sendEstimateViaWhatsapp: false,
        };
      }
      return {
        id: settings.id,
        tenantId: settings.tenant_id,
        estimateNumberStart: settings.estimate_number_start ?? 1,
        estimateNumberPrefix: settings.estimate_number_prefix ?? "EST",
        defaultCurrency: settings.default_currency ?? "USD",
        defaultGstSettingId: settings.default_gst_setting_id || null,
        showTax: settings.show_estimate_tax ?? true,
        showDiscount: settings.show_estimate_discount ?? true,
        showNotes: settings.show_estimate_notes ?? true,
        showDeposit: settings.show_estimate_deposit ?? true,
        showPaymentTerms: settings.show_estimate_payment_terms ?? true,
        sendEstimateViaEmail: settings.send_estimate_via_email ?? true,
        sendEstimateViaWhatsapp: settings.send_estimate_via_whatsapp ?? false,
      };
    } catch (error) {
      console.error("Error getting estimate settings:", error);
      return {
        estimateNumberStart: 1,
        estimateNumberPrefix: "EST",
        defaultCurrency: "USD",
        defaultGstSettingId: null,
        showTax: true,
        showDiscount: true,
        showNotes: true,
        showDeposit: true,
        showPaymentTerms: true,
      };
    }
  }

  async upsertEstimateSettings(tenantId: number, settings: any) {
    try {
      const [result] =
        await sql`INSERT INTO tenant_settings (tenant_id, estimate_number_start, estimate_number_prefix, default_currency, default_gst_setting_id, show_estimate_tax, show_estimate_discount, show_estimate_notes, show_estimate_deposit, show_estimate_payment_terms, send_estimate_via_email, send_estimate_via_whatsapp, updated_at) VALUES (${tenantId}, ${settings.estimateNumberStart !== undefined ? settings.estimateNumberStart : 1}, ${settings.estimateNumberPrefix || "EST"}, ${settings.defaultCurrency || "USD"}, ${settings.defaultGstSettingId || null}, ${settings.showTax !== undefined ? settings.showTax : true}, ${settings.showDiscount !== undefined ? settings.showDiscount : true}, ${settings.showNotes !== undefined ? settings.showNotes : true}, ${settings.showDeposit !== undefined ? settings.showDeposit : true}, ${settings.showPaymentTerms !== undefined ? settings.showPaymentTerms : true}, ${settings.sendEstimateViaEmail !== undefined ? settings.sendEstimateViaEmail : true}, ${settings.sendEstimateViaWhatsapp !== undefined ? settings.sendEstimateViaWhatsapp : false}, NOW()) ON CONFLICT (tenant_id) DO UPDATE SET estimate_number_start = COALESCE(${settings.estimateNumberStart}, tenant_settings.estimate_number_start), estimate_number_prefix = COALESCE(${settings.estimateNumberPrefix}, tenant_settings.estimate_number_prefix), default_currency = COALESCE(${settings.defaultCurrency}, tenant_settings.default_currency), default_gst_setting_id = COALESCE(${settings.defaultGstSettingId}, tenant_settings.default_gst_setting_id), show_estimate_tax = COALESCE(${settings.showTax}, tenant_settings.show_estimate_tax), show_estimate_discount = COALESCE(${settings.showDiscount}, tenant_settings.show_estimate_discount), show_estimate_notes = COALESCE(${settings.showNotes}, tenant_settings.show_estimate_notes), show_estimate_deposit = COALESCE(${settings.showDeposit}, tenant_settings.show_estimate_deposit), show_estimate_payment_terms = COALESCE(${settings.showPaymentTerms}, tenant_settings.show_estimate_payment_terms), send_estimate_via_email = COALESCE(${settings.sendEstimateViaEmail}, tenant_settings.send_estimate_via_email), send_estimate_via_whatsapp = COALESCE(${settings.sendEstimateViaWhatsapp}, tenant_settings.send_estimate_via_whatsapp), updated_at = NOW() RETURNING *`;
      return {
        id: result.id,
        tenantId: result.tenant_id,
        estimateNumberStart: result.estimate_number_start ?? 1,
        estimateNumberPrefix: result.estimate_number_prefix ?? "EST",
        defaultCurrency: result.default_currency ?? "USD",
        defaultGstSettingId: result.default_gst_setting_id || null,
        showTax: result.show_estimate_tax ?? true,
        showDiscount: result.show_estimate_discount ?? true,
        showNotes: result.show_estimate_notes ?? true,
        showDeposit: result.show_estimate_deposit ?? true,
        showPaymentTerms: result.show_estimate_payment_terms ?? true,
        sendEstimateViaEmail: result.send_estimate_via_email ?? true,
        sendEstimateViaWhatsapp: result.send_estimate_via_whatsapp ?? false,
      };
    } catch (error) {
      console.error("Error upserting estimate settings:", error);
      throw error;
    }
  }

  // WhatsApp Configuration Methods
  async createWhatsAppConfig(config: any) {
    try {
      console.log("Creating WhatsApp config for tenant:", config.tenantId);
      // Convert Date to ISO string for database
      const subscriptionExpiredValue =
        config.subscriptionExpired instanceof Date
          ? config.subscriptionExpired.toISOString()
          : config.subscriptionExpired;

      const [newConfig] = await sql`
        INSERT INTO whatsapp_config (
          tenant_id, username, email, api_key, chunk_blast, 
          subscription_expired, active_subscription, limit_device, external_user_id
        )
        VALUES (
          ${config.tenantId}, ${config.username}, ${config.email}, ${config.apiKey}, 
          ${config.chunkBlast}, ${subscriptionExpiredValue}, ${config.activeSubscription}, 
          ${config.limitDevice}, ${config.externalUserId}
        )
        RETURNING *
      `;
      console.log(
        "WhatsApp config created successfully for tenant:",
        config.tenantId,
      );
      return {
        id: newConfig.id,
        tenantId: newConfig.tenant_id,
        username: newConfig.username,
        email: newConfig.email,
        apiKey: newConfig.api_key,
        chunkBlast: newConfig.chunk_blast,
        subscriptionExpired: newConfig.subscription_expired,
        activeSubscription: newConfig.active_subscription,
        limitDevice: newConfig.limit_device,
        externalUserId: newConfig.external_user_id,
        createdAt: newConfig.created_at,
        updatedAt: newConfig.updated_at,
      };
    } catch (error) {
      console.error("Error creating WhatsApp config:", error);
      throw error;
    }
  }

  async getWhatsAppConfigByTenant(tenantId: number) {
    try {
      const [config] = await sql`
        SELECT * FROM whatsapp_config WHERE tenant_id = ${tenantId}
      `;
      if (!config) return null;
      return {
        id: config.id,
        tenantId: config.tenant_id,
        username: config.username,
        email: config.email,
        apiKey: config.api_key,
        chunkBlast: config.chunk_blast,
        subscriptionExpired: config.subscription_expired,
        activeSubscription: config.active_subscription,
        limitDevice: config.limit_device,
        externalUserId: config.external_user_id,
        createdAt: config.created_at,
        updatedAt: config.updated_at,
      };
    } catch (error) {
      console.error("Error getting WhatsApp config:", error);
      throw error;
    }
  }

  async deleteWhatsAppConfig(id: number) {
    try {
      await sql`DELETE FROM whatsapp_config WHERE id = ${id}`;
      return true;
    } catch (error) {
      console.error("Error deleting WhatsApp config:", error);
      throw error;
    }
  }

  // WhatsApp Device Methods
  async createWhatsAppDevice(device: any) {
    try {
      const [newDevice] = await sql`
        INSERT INTO whatsapp_devices (
          tenant_id, number, device_id, webhook_url, status, 
          full_response, read_messages, reject_calls, show_available, 
          show_typing, message_delay, messages_sent
        )
        VALUES (
          ${device.tenantId}, ${device.number}, ${device.externalDeviceId}, 
          ${device.webhookUrl}, ${device.status}, ${device.fullResponse}, 
          ${device.readMessages}, ${device.rejectCalls}, ${device.showAvailable}, 
          ${device.showTyping}, ${device.messageDelay}, ${device.messagesSent}
        )
        RETURNING *
      `;
      return {
        id: newDevice.id,
        tenantId: newDevice.tenant_id,
        number: newDevice.number,
        externalDeviceId: newDevice.device_id,
        webhookUrl: newDevice.webhook_url,
        status: newDevice.status,
        qrCode: newDevice.qr_code,
        deviceName: newDevice.device_name,
        messagesSent: newDevice.messages_sent,
        lastConnectedAt: newDevice.last_connected,
        fullResponse: newDevice.full_response,
        readMessages: newDevice.read_messages,
        rejectCalls: newDevice.reject_calls,
        showAvailable: newDevice.show_available,
        showTyping: newDevice.show_typing,
        messageDelay: newDevice.message_delay,
        createdAt: newDevice.created_at,
        updatedAt: newDevice.updated_at,
      };
    } catch (error) {
      console.error("Error creating WhatsApp device:", error);
      throw error;
    }
  }

  async getWhatsAppDevicesByTenant(tenantId: number) {
    try {
      const devices = await sql`
        SELECT * FROM whatsapp_devices WHERE tenant_id = ${tenantId} ORDER BY created_at DESC
      `;
      return devices.map((device: any) => ({
        id: device.id,
        tenantId: device.tenant_id,
        number: device.number,
        externalDeviceId: device.device_id,
        webhookUrl: device.webhook_url,
        status: device.status,
        qrCode: device.qr_code,
        deviceName: device.device_name,
        messagesSent: device.messages_sent,
        lastConnectedAt: device.last_connected,
        isDefault: device.is_default,
        fullResponse: device.full_response,
        readMessages: device.read_messages,
        rejectCalls: device.reject_calls,
        showAvailable: device.show_available,
        showTyping: device.show_typing,
        messageDelay: device.message_delay,
        createdAt: device.created_at,
        updatedAt: device.updated_at,
      }));
    } catch (error) {
      console.error("Error getting WhatsApp devices:", error);
      throw error;
    }
  }

  async updateWhatsAppDeviceOptions(id: number, options: any) {
    try {
      const [updatedDevice] = await sql`
        UPDATE whatsapp_devices
        SET 
          full_response = ${options.fullResponse},
          read_messages = ${options.readMessages},
          reject_calls = ${options.rejectCalls},
          show_available = ${options.showAvailable},
          show_typing = ${options.showTyping},
          message_delay = ${options.messageDelay},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      return {
        id: updatedDevice.id,
        tenantId: updatedDevice.tenant_id,
        number: updatedDevice.number,
        externalDeviceId: updatedDevice.device_id,
        webhookUrl: updatedDevice.webhook_url,
        status: updatedDevice.status,
        qrCode: updatedDevice.qr_code,
        deviceName: updatedDevice.device_name,
        messagesSent: updatedDevice.messages_sent,
        lastConnectedAt: updatedDevice.last_connected,
        fullResponse: updatedDevice.full_response,
        readMessages: updatedDevice.read_messages,
        rejectCalls: updatedDevice.reject_calls,
        showAvailable: updatedDevice.show_available,
        showTyping: updatedDevice.show_typing,
        messageDelay: updatedDevice.message_delay,
        createdAt: updatedDevice.created_at,
        updatedAt: updatedDevice.updated_at,
      };
    } catch (error) {
      console.error("Error updating WhatsApp device options:", error);
      throw error;
    }
  }

  async updateWhatsAppDeviceStatus(
    id: number,
    status: string,
    qrCode: string | null,
  ) {
    try {
      const [updatedDevice] = await sql`
        UPDATE whatsapp_devices
        SET 
          status = ${status},
          qr_code = ${qrCode},
          last_connected = ${status === "connected" ? sql`NOW()` : sql`last_connected`},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      return {
        id: updatedDevice.id,
        tenantId: updatedDevice.tenant_id,
        number: updatedDevice.number,
        externalDeviceId: updatedDevice.device_id,
        webhookUrl: updatedDevice.webhook_url,
        status: updatedDevice.status,
        qrCode: updatedDevice.qr_code,
        deviceName: updatedDevice.device_name,
        messagesSent: updatedDevice.messages_sent,
        lastConnectedAt: updatedDevice.last_connected,
        fullResponse: updatedDevice.full_response,
        readMessages: updatedDevice.read_messages,
        rejectCalls: updatedDevice.reject_calls,
        showAvailable: updatedDevice.show_available,
        showTyping: updatedDevice.show_typing,
        messageDelay: updatedDevice.message_delay,
        createdAt: updatedDevice.created_at,
        updatedAt: updatedDevice.updated_at,
      };
    } catch (error) {
      console.error("Error updating WhatsApp device status:", error);
      throw error;
    }
  }

  async incrementDeviceMessageCount(id: number) {
    try {
      const [updatedDevice] = await sql`
        UPDATE whatsapp_devices
        SET 
          messages_sent = messages_sent + 1,
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      return {
        id: updatedDevice.id,
        messagesSent: updatedDevice.messages_sent,
      };
    } catch (error) {
      console.error("Error incrementing device message count:", error);
      throw error;
    }
  }

  async unsetAllDefaultDevices(tenantId: number) {
    try {
      await sql`
        UPDATE whatsapp_devices
        SET is_default = false, updated_at = NOW()
        WHERE tenant_id = ${tenantId}
      `;
    } catch (error) {
      console.error("Error unsetting default devices:", error);
      throw error;
    }
  }

  async setDefaultDevice(deviceId: number) {
    try {
      const [updatedDevice] = await sql`
        UPDATE whatsapp_devices
        SET is_default = true, updated_at = NOW()
        WHERE id = ${deviceId}
        RETURNING *
      `;
      return {
        id: updatedDevice.id,
        number: updatedDevice.number,
        isDefault: updatedDevice.is_default,
      };
    } catch (error) {
      console.error("Error setting default device:", error);
      throw error;
    }
  }

  async getCustomersWithPhone(tenantId: number) {
    try {
      const customers = await sql`
        SELECT id, name, email, phone
        FROM customers
        WHERE tenant_id = ${tenantId}
          AND phone IS NOT NULL
          AND phone != ''
        ORDER BY name ASC
      `;
      return customers.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      }));
    } catch (error) {
      console.error("Error fetching customers with phone:", error);
      throw error;
    }
  }

  async getLeadsWithPhone(tenantId: number) {
    try {
      const leads = await sql`
        SELECT l.id, l.first_name, l.last_name, l.email, l.phone, lt.name as lead_type_name
        FROM leads l
        LEFT JOIN lead_types lt ON l.lead_type_id = lt.id
        WHERE l.tenant_id = ${tenantId}
          AND l.phone IS NOT NULL
          AND l.phone != ''
        ORDER BY l.first_name ASC, l.last_name ASC
      `;
      return leads.map((lead: any) => ({
        id: lead.id,
        firstName: lead.first_name,
        lastName: lead.last_name,
        name: `${lead.first_name} ${lead.last_name}`,
        email: lead.email,
        phone: lead.phone,
        leadType: lead.lead_type_name,
      }));
    } catch (error) {
      console.error("Error fetching leads with phone:", error);
      throw error;
    }
  }

  async deleteWhatsAppDevice(id: number) {
    try {
      await sql`DELETE FROM whatsapp_devices WHERE id = ${id}`;
      return true;
    } catch (error) {
      console.error("Error deleting WhatsApp device:", error);
      throw error;
    }
  }

  // WhatsApp Messages Storage Functions
  async createWhatsAppMessage(data: {
    tenantId: number;
    deviceId: number;
    customerId?: number;
    leadId?: number;
    recipientNumber: string;
    recipientName?: string;
    messageType: "text" | "media";
    textContent?: string;
    mediaType?: string;
    mediaUrl?: string;
    mediaCaption?: string;
    status?: string;
    errorMessage?: string;
    externalMessageId?: string;
    sentBy?: number;
  }) {
    try {
      const [message] = await sql`
        INSERT INTO whatsapp_messages (
          tenant_id,
          device_id,
          customer_id,
          lead_id,
          recipient_number,
          recipient_name,
          message_type,
          text_content,
          media_type,
          media_url,
          media_caption,
          status,
          error_message,
          external_message_id,
          sent_by
        ) VALUES (
          ${data.tenantId},
          ${data.deviceId},
          ${data.customerId || null},
          ${data.leadId || null},
          ${data.recipientNumber},
          ${data.recipientName || null},
          ${data.messageType},
          ${data.textContent || null},
          ${data.mediaType || null},
          ${data.mediaUrl || null},
          ${data.mediaCaption || null},
          ${data.status || "sent"},
          ${data.errorMessage || null},
          ${data.externalMessageId || null},
          ${data.sentBy || null}
        )
        RETURNING *
      `;
      return {
        id: message.id,
        tenantId: message.tenant_id,
        deviceId: message.device_id,
        customerId: message.customer_id,
        leadId: message.lead_id,
        recipientNumber: message.recipient_number,
        recipientName: message.recipient_name,
        messageType: message.message_type,
        textContent: message.text_content,
        mediaType: message.media_type,
        mediaUrl: message.media_url,
        mediaCaption: message.media_caption,
        status: message.status,
        errorMessage: message.error_message,
        externalMessageId: message.external_message_id,
        sentBy: message.sent_by,
        sentAt: message.sent_at,
        createdAt: message.created_at,
      };
    } catch (error) {
      console.error("Error creating WhatsApp message:", error);
      throw error;
    }
  }

  async getWhatsAppMessagesByCustomer(customerId: number, tenantId: number) {
    try {
      const messages = await sql`
        SELECT 
          wm.*,
          wd.number as device_number,
          CONCAT(u.first_name, ' ', u.last_name) as sent_by_name
        FROM whatsapp_messages wm
        LEFT JOIN whatsapp_devices wd ON wm.device_id = wd.id
        LEFT JOIN users u ON wm.sent_by = u.id
        WHERE wm.customer_id = ${customerId}
          AND wm.tenant_id = ${tenantId}
        ORDER BY wm.sent_at DESC
      `;
      return messages.map((msg: any) => ({
        id: msg.id,
        tenantId: msg.tenant_id,
        deviceId: msg.device_id,
        deviceNumber: msg.device_number,
        customerId: msg.customer_id,
        recipientNumber: msg.recipient_number,
        recipientName: msg.recipient_name,
        messageType: msg.message_type,
        textContent: msg.text_content,
        mediaType: msg.media_type,
        mediaUrl: msg.media_url,
        mediaCaption: msg.media_caption,
        status: msg.status,
        errorMessage: msg.error_message,
        externalMessageId: msg.external_message_id,
        sentBy: msg.sent_by,
        sentByName: msg.sent_by_name,
        sentAt: msg.sent_at,
        deliveredAt: msg.delivered_at,
        readAt: msg.read_at,
        createdAt: msg.created_at,
      }));
    } catch (error) {
      console.error("Error fetching WhatsApp messages by customer:", error);
      throw error;
    }
  }

  async getWhatsAppMessagesByLead(leadId: number, tenantId: number) {
    try {
      const messages = await sql`
        SELECT 
          wm.*,
          wd.number as device_number,
          CONCAT(u.first_name, ' ', u.last_name) as sent_by_name
        FROM whatsapp_messages wm
        LEFT JOIN whatsapp_devices wd ON wm.device_id = wd.id
        LEFT JOIN users u ON wm.sent_by = u.id
        WHERE wm.lead_id = ${leadId}
          AND wm.tenant_id = ${tenantId}
        ORDER BY wm.sent_at DESC
      `;
      return messages.map((msg: any) => ({
        id: msg.id,
        tenantId: msg.tenant_id,
        deviceId: msg.device_id,
        deviceNumber: msg.device_number,
        leadId: msg.lead_id,
        recipientNumber: msg.recipient_number,
        recipientName: msg.recipient_name,
        messageType: msg.message_type,
        textContent: msg.text_content,
        mediaType: msg.media_type,
        mediaUrl: msg.media_url,
        mediaCaption: msg.media_caption,
        status: msg.status,
        errorMessage: msg.error_message,
        externalMessageId: msg.external_message_id,
        sentBy: msg.sent_by,
        sentByName: msg.sent_by_name,
        sentAt: msg.sent_at,
        deliveredAt: msg.delivered_at,
        readAt: msg.read_at,
        createdAt: msg.created_at,
      }));
    } catch (error) {
      console.error("Error fetching WhatsApp messages by lead:", error);
      throw error;
    }
  }

  // Migration function to add invoice_prefix column and split existing invoice numbers
  async migrateInvoicePrefixes() {
    try {
      console.log("🔄 Starting invoice prefix migration...");

      // First, add the column if it doesn't exist
      try {
        await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'INV'`;
        console.log("✅ Added invoice_prefix column");
      } catch (error: any) {
        if (error.code !== '42701') { // Column already exists
          throw error;
        }
        console.log("ℹ️ invoice_prefix column already exists");
      }

      // Get all invoices that need migration (where prefix is null or invoice_number contains prefix)
      const invoices = await sql`
        SELECT id, invoice_number, invoice_prefix, tenant_id
        FROM invoices
        WHERE invoice_prefix IS NULL OR invoice_prefix = 'INV'
      `;

      console.log(`📊 Found ${invoices.length} invoices to migrate`);

      let migrated = 0;
      for (const invoice of invoices) {
        const fullNumber = invoice.invoice_number || "";
        
        // Helper function to split invoice number
        const splitInvoiceNumber = (fullNumber: string, defaultPrefix: string = "INV"): { prefix: string; number: string } => {
          if (!fullNumber) {
            return { prefix: defaultPrefix, number: "" };
          }
          // Try to extract prefix and number (format: PREFIX-NUMBER, PREFIXNUMBER, or PREFIX NUMBER)
          // First try with separator (dash or space)
          const matchWithSeparator = fullNumber.match(/^([A-Za-z0-9]+)[\s-]+(.+)$/);
          if (matchWithSeparator) {
            return { prefix: matchWithSeparator[1].toUpperCase(), number: matchWithSeparator[2] };
          }
          // If no separator, try to find where numbers start (format: PREFIXNUMBER like INV001)
          const numberMatch = fullNumber.match(/^([A-Za-z]+)(\d+.*)$/);
          if (numberMatch) {
            return { prefix: numberMatch[1].toUpperCase(), number: numberMatch[2] };
          }
          // If it's all numbers, use default prefix
          if (/^\d+/.test(fullNumber)) {
            return { prefix: defaultPrefix, number: fullNumber };
          }
          // Default: use as number with default prefix
          return { prefix: defaultPrefix, number: fullNumber };
        };

        // Get tenant settings for default prefix
        let defaultPrefix = "INV";
        try {
          const settings = await this.getInvoiceSettings(invoice.tenant_id);
          defaultPrefix = settings?.invoiceNumberPrefix || "INV";
        } catch (error) {
          console.warn(`⚠️ Could not get settings for tenant ${invoice.tenant_id}, using default`);
        }

        const { prefix, number } = splitInvoiceNumber(fullNumber, defaultPrefix);

        // Update the invoice
        await sql`
          UPDATE invoices
          SET invoice_prefix = ${prefix},
              invoice_number = ${number}
          WHERE id = ${invoice.id}
        `;

        migrated++;
        if (migrated % 100 === 0) {
          console.log(`📊 Migrated ${migrated}/${invoices.length} invoices...`);
        }
      }

      console.log(`✅ Migration complete! Migrated ${migrated} invoices`);
      return { success: true, migrated };
    } catch (error) {
      console.error("❌ Migration error:", error);
      throw error;
    }
  }

  // Migration function to add estimate_prefix column and split existing estimate numbers
  async migrateEstimatePrefixes() {
    try {
      console.log("🔄 Starting estimate prefix migration...");

      // First, add the column if it doesn't exist
      try {
        await sql`ALTER TABLE estimates ADD COLUMN IF NOT EXISTS estimate_prefix TEXT DEFAULT 'EST'`;
        console.log("✅ Added estimate_prefix column");
      } catch (error: any) {
        if (error.code !== '42701') { // Column already exists
          throw error;
        }
        console.log("ℹ️ estimate_prefix column already exists");
      }

      // Get all estimates that need migration (where prefix is null or estimate_number contains prefix)
      const estimates = await sql`
        SELECT id, estimate_number, estimate_prefix, tenant_id
        FROM estimates
        WHERE estimate_prefix IS NULL OR estimate_prefix = 'EST'
      `;

      console.log(`📊 Found ${estimates.length} estimates to migrate`);

      let migrated = 0;
      for (const estimate of estimates) {
        const fullNumber = estimate.estimate_number || "";
        
        // Helper function to split estimate number
        const splitEstimateNumber = (fullNumber: string, defaultPrefix: string = "EST"): { prefix: string; number: string } => {
          if (!fullNumber) {
            return { prefix: defaultPrefix, number: "" };
          }
          // Try to extract prefix and number (format: PREFIX-NUMBER, PREFIXNUMBER, or PREFIX NUMBER)
          // First try with separator (dash or space)
          const matchWithSeparator = fullNumber.match(/^([A-Za-z0-9]+)[\s-]+(.+)$/);
          if (matchWithSeparator) {
            return { prefix: matchWithSeparator[1].toUpperCase(), number: matchWithSeparator[2] };
          }
          // If no separator, try to find where numbers start (format: PREFIXNUMBER like EST001)
          const numberMatch = fullNumber.match(/^([A-Za-z]+)(\d+.*)$/);
          if (numberMatch) {
            return { prefix: numberMatch[1].toUpperCase(), number: numberMatch[2] };
          }
          // If it's all numbers, use default prefix
          if (/^\d+/.test(fullNumber)) {
            return { prefix: defaultPrefix, number: fullNumber };
          }
          // Default: use as number with default prefix
          return { prefix: defaultPrefix, number: fullNumber };
        };

        // Get tenant settings for default prefix
        let defaultPrefix = "EST";
        try {
          const settings = await this.getEstimateSettings(estimate.tenant_id);
          defaultPrefix = settings?.estimateNumberPrefix || "EST";
        } catch (error) {
          console.warn(`⚠️ Could not get settings for tenant ${estimate.tenant_id}, using default`);
        }

        const { prefix, number } = splitEstimateNumber(fullNumber, defaultPrefix);

        // Update the estimate
        await sql`
          UPDATE estimates
          SET estimate_prefix = ${prefix},
              estimate_number = ${number}
          WHERE id = ${estimate.id}
        `;

        migrated++;
        if (migrated % 100 === 0) {
          console.log(`📊 Migrated ${migrated}/${estimates.length} estimates...`);
        }
      }

      console.log(`✅ Migration complete! Migrated ${migrated} estimates`);
      return { success: true, migrated };
    } catch (error) {
      console.error("❌ Migration error:", error);
      throw error;
    }
  }

  async migrateExpensePrefixes() {
    try {
      console.log("🔄 Starting expense prefix migration...");

      // Add expense_prefix column to expenses table if it doesn't exist
      try {
        await sql`
          ALTER TABLE expenses
          ADD COLUMN IF NOT EXISTS expense_prefix TEXT DEFAULT 'EXP'
        `;
        console.log("✅ Added expense_prefix column to expenses table");
      } catch (error: any) {
        if (error.code !== '42701') { // Column already exists
          throw error;
        }
        console.log("ℹ️ expense_prefix column already exists in expenses table");
      }

      // Add expense_number_prefix column to tenant_settings table if it doesn't exist
      try {
        await sql`
          ALTER TABLE tenant_settings
          ADD COLUMN IF NOT EXISTS expense_number_prefix TEXT DEFAULT 'EXP'
        `;
        console.log("✅ Added expense_number_prefix column to tenant_settings table");
        
        // Set default value for existing tenant_settings records
        await sql`
          UPDATE tenant_settings
          SET expense_number_prefix = 'EXP'
          WHERE expense_number_prefix IS NULL
        `;
        console.log("✅ Updated existing tenant_settings with default expense_number_prefix");
      } catch (error: any) {
        if (error.code !== '42701') { // Column already exists
          throw error;
        }
        console.log("ℹ️ expense_number_prefix column already exists in tenant_settings table");
      }

      // Fetch all expenses
      const expenses = await sql`
        SELECT id, expense_number, tenant_id
        FROM expenses
        WHERE expense_number IS NOT NULL
        ORDER BY id
      `;

      console.log(`📊 Found ${expenses.length} expenses to migrate`);

      let migrated = 0;

      for (const expense of expenses) {
        // Get tenant-specific prefix from settings
        const [settings] = await sql`
          SELECT expense_number_prefix
          FROM tenant_settings
          WHERE tenant_id = ${expense.tenant_id}
        `;
        const defaultPrefix = settings?.expense_number_prefix || "EXP";

        const splitExpenseNumber = (fullNumber: string, defaultPrefix: string = "EXP"): { prefix: string; number: string } => {
          if (!fullNumber) {
            return { prefix: defaultPrefix, number: "" };
          }
          // Try to extract prefix and number (format: PREFIX-NUMBER, PREFIXNUMBER, or PREFIX NUMBER)
          // First try with separator (dash or space)
          const matchWithSeparator = fullNumber.match(/^([A-Za-z0-9]+)[\s-]+(.+)$/);
          if (matchWithSeparator) {
            return { prefix: matchWithSeparator[1].toUpperCase(), number: matchWithSeparator[2] };
          }
          // If no separator, try to find where numbers start (format: PREFIXNUMBER like EXP001)
          const numberMatch = fullNumber.match(/^([A-Za-z]+)(\d+.*)$/);
          if (numberMatch) {
            return { prefix: numberMatch[1].toUpperCase(), number: numberMatch[2] };
          }
          // If it's all numbers, use default prefix
          if (/^\d+/.test(fullNumber)) {
            return { prefix: defaultPrefix, number: fullNumber };
          }
          // Default: use as number with default prefix
          return { prefix: defaultPrefix, number: fullNumber };
        };

        const fullNumber = expense.expense_number;
        const { prefix, number } = splitExpenseNumber(fullNumber, defaultPrefix);

        // Update the expense
        await sql`
          UPDATE expenses
          SET expense_prefix = ${prefix},
              expense_number = ${number}
          WHERE id = ${expense.id}
        `;

        migrated++;
        if (migrated % 100 === 0) {
          console.log(`📊 Migrated ${migrated}/${expenses.length} expenses...`);
        }
      }

      console.log(`✅ Migration complete! Migrated ${migrated} expenses`);
      return { success: true, migrated };
    } catch (error) {
      console.error("❌ Migration error:", error);
      throw error;
    }
  }
}

export const simpleStorage = new SimpleStorage();
