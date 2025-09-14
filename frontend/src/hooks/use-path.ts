import { usePathname } from 'next/navigation';

/**
 * Custom hook to check if the given path matches the current path
 * @param path - The path to compare against the current pathname
 * @param exact - Whether to match exactly or just check if current path starts with given path
 * @returns boolean - true if paths match, false otherwise
 */
export const usePath = (path: string, exact: boolean = true): boolean => {
  const pathname = usePathname();
  
  if (exact) {
    return pathname === path;
  }
  
  return pathname.startsWith(path);
};

export default usePath;