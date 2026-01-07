export enum UserRole {
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR",
  USER = "USER",
}

export enum Permission {
  // Product permissions
  PRODUCT_CREATE = "product:create",
  PRODUCT_READ = "product:read",
  PRODUCT_UPDATE = "product:update",
  PRODUCT_DELETE = "product:delete",

  // Category permissions
  CATEGORY_CREATE = "category:create",
  CATEGORY_READ = "category:read",
  CATEGORY_UPDATE = "category:update",
  CATEGORY_DELETE = "category:delete",

  // Order permissions
  ORDER_CREATE = "order:create",
  ORDER_READ = "order:read",
  ORDER_READ_ALL = "order:read_all",
  ORDER_UPDATE = "order:update",
  ORDER_DELETE = "order:delete",
  ORDER_CANCEL = "order:cancel",
  ORDER_CONFIRM = "order:confirm",

  // User management permissions
  USER_CREATE = "user:create",
  USER_READ = "user:read",
  USER_READ_ALL = "user:read_all",
  USER_UPDATE = "user:update",
  USER_UPDATE_ROLE = "user:update_role",
  USER_DELETE = "user:delete",
  USER_TOGGLE_STATUS = "user:toggle_status",
  USER_MANAGE_FROM_USERS = "user:manage_from_users",

  // Payment permissions
  PAYMENT_CREATE = "payment:create",
  PAYMENT_READ = "payment:read",
  PAYMENT_PROCESS = "payment:process",

  // Inventory permissions
  INVENTORY_READ = "inventory:read",
  INVENTORY_UPDATE = "inventory:update",
  INVENTORY_ADJUST = "inventory:adjust",

  // Analytics permissions
  ANALYTICS_READ = "analytics:read",
  ANALYTICS_EXPORT = "analytics:export",

  // Settings permissions
  SETTINGS_READ = "settings:read",
  SETTINGS_UPDATE = "settings:update",

  // Review permissions
  REVIEW_CREATE = "review:create",
  REVIEW_READ = "review:read",
  REVIEW_APPROVE = "review:approve",
  REVIEW_DELETE = "review:delete",

  // Lot permissions
  LOT_CREATE = "lot:create",
  LOT_READ = "lot:read",
  LOT_UPDATE = "lot:update",
  LOT_DELETE = "lot:delete",

  // Lot Detail permissions
  LOT_DETAIL_CREATE = "lot_detail:create",
  LOT_DETAIL_READ = "lot_detail:read",
  LOT_DETAIL_UPDATE = "lot_detail:update",
  LOT_DETAIL_DELETE = "lot_detail:delete",

  // Lot Arrival permissions
  LOT_ARRIVAL_CREATE = "lot_arrival:create",
  LOT_ARRIVAL_READ = "lot_arrival:read",
  LOT_ARRIVAL_UPDATE = "lot_arrival:update",
  LOT_ARRIVAL_VERIFY = "lot_arrival:verify",
  LOT_ARRIVAL_DELETE = "lot_arrival:delete",
}

export type RolePermissions = Record<UserRole, string[]>;

export interface AvailablePermissionsResponse {
  permissions: string[];
}

export interface RolePermissionsResponse {
  role: UserRole;
  permissions: string[];
}

export interface SetRolePermissionsDto {
  permissions: string[];
}

export interface AddPermissionDto {
  role: UserRole;
  permission: string;
}

export interface RemovePermissionDto {
  role: UserRole;
  permission: string;
}

// Group permissions by category for better UI organization
export const PERMISSION_CATEGORIES = {
  Products: [
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_READ,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
  ],
  Categories: [
    Permission.CATEGORY_CREATE,
    Permission.CATEGORY_READ,
    Permission.CATEGORY_UPDATE,
    Permission.CATEGORY_DELETE,
  ],
  Orders: [
    Permission.ORDER_CREATE,
    Permission.ORDER_READ,
    Permission.ORDER_READ_ALL,
    Permission.ORDER_UPDATE,
    Permission.ORDER_DELETE,
    Permission.ORDER_CANCEL,
    Permission.ORDER_CONFIRM,
  ],
  Users: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_READ_ALL,
    Permission.USER_UPDATE,
    Permission.USER_UPDATE_ROLE,
    Permission.USER_DELETE,
    Permission.USER_TOGGLE_STATUS,
    Permission.USER_MANAGE_FROM_USERS,
  ],
  Payments: [
    Permission.PAYMENT_CREATE,
    Permission.PAYMENT_READ,
    Permission.PAYMENT_PROCESS,
  ],
  Inventory: [
    Permission.INVENTORY_READ,
    Permission.INVENTORY_UPDATE,
    Permission.INVENTORY_ADJUST,
  ],
  Analytics: [Permission.ANALYTICS_READ, Permission.ANALYTICS_EXPORT],
  Settings: [Permission.SETTINGS_READ, Permission.SETTINGS_UPDATE],
  Reviews: [
    Permission.REVIEW_CREATE,
    Permission.REVIEW_READ,
    Permission.REVIEW_APPROVE,
    Permission.REVIEW_DELETE,
  ],
  Lots: [
    Permission.LOT_CREATE,
    Permission.LOT_READ,
    Permission.LOT_UPDATE,
    Permission.LOT_DELETE,
    Permission.LOT_DETAIL_CREATE,
    Permission.LOT_DETAIL_READ,
    Permission.LOT_DETAIL_UPDATE,
    Permission.LOT_DETAIL_DELETE,
    Permission.LOT_ARRIVAL_CREATE,
    Permission.LOT_ARRIVAL_READ,
    Permission.LOT_ARRIVAL_UPDATE,
    Permission.LOT_ARRIVAL_VERIFY,
    Permission.LOT_ARRIVAL_DELETE,
  ],
};

// Labels are now in i18n translation files (permissions.labels)
