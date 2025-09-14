export class UserService {
  static getUser() {
    if (typeof window === "undefined") {
      return null;
    }
    const name = localStorage.getItem("user_name");
    const email = localStorage.getItem("user_email");
    if (name && email) {
      return { name, email };
    }
    return null;
  }
}