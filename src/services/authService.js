const users = [
  {
    email: "harshavoleti@linkbox.store",
    password: "cofounder2123",
  },
  {
    email: "mukeshvoleti@horizontal",
    password: "founder2123",
  },
];

export async function login(email, password) {
  return users.find(
    user =>
      user.email === email &&
      user.password === password
  );
}