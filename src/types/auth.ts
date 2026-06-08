// 认证领域类型。后端契约:POST /api/auth/login → {username};GET /api/auth/me → {username}。
export interface User {
  username: string;
}
