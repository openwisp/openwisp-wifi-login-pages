const passthrough = (strings, ...values) => {
  let str = "";
  for (let i = 0; i < strings.length; i += 1) {
    str += strings[i];
    if (i < values.length) str += values[i];
  }
  return str;
};

module.exports = {
  useLocale: jest.fn(),
  addLocale: jest.fn(),
  t: passthrough,
  ngettext: (s, p, c) => (c === 1 ? s : p),
  msgid: passthrough,
  c: passthrough,
  gettext: (str) => (typeof str === "string" ? str : ""),
};
