import { clickOutside } from "./clickOutside";

/**
 * Register all directives with Vue app
 * @param {Object} app - Vue app instance
 */
export function registerDirectives(app) {
  // Register v-click-outside directive
  app.directive("click-outside", clickOutside);

  // Add more directives here
}

export { clickOutside };

export default registerDirectives;
