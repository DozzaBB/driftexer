export function getToday() {
    const d = new Date().toISOString();
    // 2024-11-11T09:36:25.534Z
    const b = stripNonNumbers(d.substring(0, 10));
    return b
}

function stripNonNumbers(somestr) {
    return somestr.split("").filter(isAlphaNumeric).join("");
}

function isAlphaNumeric(letter) {

      const code = letter.charCodeAt(0);
      if (!(code > 47 && code < 58) && // numeric (0-9)
          !(code > 64 && code < 91) && // upper alpha (A-Z)
          !(code > 96 && code < 123)) { // lower alpha (a-z)
        return false;
      }
    return true;
  };