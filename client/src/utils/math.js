export default {
  /**
   * Return Integer number in range.
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  randomSign() {
    return Math.random() < 0.5 ? -1 : 1;
  }
};