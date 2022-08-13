function listEqual(list1, list2) {
    if (list1.length === list2.length) {
      return list1.every(prvek => {
        if (list2.includes(prvek)) {
          return true;
        }
        return false;
      })
    }
    return false;
  }
  module.exports = { listEqual }