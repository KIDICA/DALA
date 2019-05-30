export default {
  /**
   * @returns {boolean}
   */
  isEdge() {
    return window.navigator.userAgent.indexOf("Edge") === -1;
  },
};