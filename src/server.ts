function welcome(name: string) {
  const user = {
    name: "Welcome",
  };
  const u1 = user.name;
  return { name, u1 };
}
welcome("John Doe");
