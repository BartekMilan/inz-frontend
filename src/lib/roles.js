export const Role = {
  ADMIN: 'admin',
  REGISTRAR: 'registrar',
};

export const RoleLabels = {
  [Role.ADMIN]: 'Administrator',
  [Role.REGISTRAR]: 'Rejestrator',
};

/**
 * Check if user has one of the required roles
 * @param {string} userRole - Current user's role
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {boolean}
 */
export function hasRole(userRole, allowedRoles) {
  if (!userRole || !allowedRoles || allowedRoles.length === 0) {
    return false;
  }
  return allowedRoles.includes(userRole);
}

/**
 * Check if user is admin
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export function isAdmin(userRole) {
  return userRole === Role.ADMIN;
}

/**
 * Check if user is registrar
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export function isRegistrar(userRole) {
  return userRole === Role.REGISTRAR;
}
