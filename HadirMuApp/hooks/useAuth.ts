import { useAuthContext } from '../context/AuthContext';

export type { UserRole, AuthUser } from '../context/AuthContext';

export function useAuth() {
  const context = useAuthContext();
  return context;
}
