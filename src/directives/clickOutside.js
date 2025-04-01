/**
 * Vue directive for detecting clicks outside an element
 * Usage: v-click-outside="handler"
 */

export const clickOutside = {
  beforeMount(el, binding) {
    el._clickOutsideHandler = (event) => {
      // Check if click is outside the element and its children
      if (!(el === event.target || el.contains(event.target))) {
        // Call the provided handler function
        binding.value(event);
      }
    };

    // Add click event listener to document
    document.addEventListener("click", el._clickOutsideHandler);
  },

  unmounted(el) {
    // Clean up event listener when directive is unmounted
    document.removeEventListener("click", el._clickOutsideHandler);
    delete el._clickOutsideHandler;
  },
};

export default clickOutside;
