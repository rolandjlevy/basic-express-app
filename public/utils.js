export const togglePassword = (selector) => {
  const pw = document.querySelector(selector);
  pw.type = pw.type === "password" ? "text" : "password";
};

console.log("...togglePassword");
