/**
 * Form utility functions
 */

/**
 * Create Element Plus form validation rules with i18n support
 * @param {Function} t - i18n translate function
 * @returns {Object} Form validation rules
 */
export const createFormRules = (t) => {
  return {
    // Username validation rules
    username: [
      {
        required: true,
        message: t("validation.username_required"),
        trigger: "blur",
      },
      {
        min: 3,
        max: 20,
        message: t("validation.username_length"),
        trigger: "blur",
      },
      {
        pattern: /^[a-zA-Z0-9_-]+$/,
        message: t("validation.username_format"),
        trigger: "blur",
      },
    ],

    // Email validation rules
    email: [
      {
        required: true,
        message: t("validation.email_required"),
        trigger: "blur",
      },
      { type: "email", message: t("validation.email_format"), trigger: "blur" },
    ],

    // Password validation rules
    password: [
      {
        required: true,
        message: t("validation.password_required"),
        trigger: "blur",
      },
      {
        min: 6,
        max: 20,
        message: t("validation.password_length"),
        trigger: "blur",
      },
    ],

    // Required field validation
    required: [
      {
        required: true,
        message: t("validation.field_required"),
        trigger: "blur",
      },
    ],
  };
};

/**
 * Reset multiple form references
 * @param {Array} formRefs - Array of form refs to reset
 */
export const resetForms = (formRefs) => {
  if (!Array.isArray(formRefs)) {
    formRefs = [formRefs];
  }

  formRefs.forEach((formRef) => {
    if (formRef && formRef.value) {
      formRef.value.resetFields();
    }
  });
};

/**
 * Validate multiple form references
 * @param {Array} formRefs - Array of form refs to validate
 * @returns {Promise<boolean>} - Promise resolving to whether all forms are valid
 */
export const validateForms = async (formRefs) => {
  if (!Array.isArray(formRefs)) {
    formRefs = [formRefs];
  }

  try {
    const results = await Promise.all(
      formRefs.map((formRef) => {
        if (formRef && formRef.value) {
          return formRef.value
            .validate()
            .then(() => true)
            .catch(() => false);
        }
        return true;
      })
    );

    return results.every((valid) => valid);
  } catch (error) {
    console.error("Form validation error:", error);
    return false;
  }
};

/**
 * Transform API error response to form field errors
 * @param {Object} error - API error response
 * @param {Object} form - Form reference
 * @param {Object} fieldMap - Mapping of API field names to form field names
 */
export const mapApiErrorsToForm = (error, form, fieldMap = {}) => {
  if (!error || !error.response || !error.response.data) {
    return;
  }

  const { data } = error.response;

  if (data.errors) {
    Object.entries(data.errors).forEach(([field, messages]) => {
      const formField = fieldMap[field] || field;
      form[formField].error = Array.isArray(messages) ? messages[0] : messages;
    });
  }
};

export default {
  createFormRules,
  resetForms,
  validateForms,
  mapApiErrorsToForm,
};
