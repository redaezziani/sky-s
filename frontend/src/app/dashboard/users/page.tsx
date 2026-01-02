'use client';

import { useEffect } from 'react';
import { useUsersStore } from '@/stores/users-store';
import { EnhancedUserTable } from '@/components/user/enhanced-user-table';
import { useLocale } from '@/components/local-lang-swither';
import { getMessages } from '@/lib/locale';

export default function UsersPage() {
  const { fetchUsers } = useUsersStore();
  const { locale } = useLocale();
  const lang = getMessages(locale);
  const t = lang.pages?.users || {};

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <section className="flex flex-col gap-4 w-full px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">
            {t.title || 'User Management'}
          </h1>
          <p className="text-muted-foreground">
            {t.description || 'Manage user accounts, roles, and permissions'}
          </p>
        </div>
      </div>

      <EnhancedUserTable />
    </section>
  );
}
