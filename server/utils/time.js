module.exports = {
  /**
   * Creates a simple timestamp string like "2019_5_10_16_52_26".
   * @returns {string}
   */
  now() {
    const date = new Date();

    return [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
    ].join("_");
  }
};