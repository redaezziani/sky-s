'use client';

import { useEffect, useState } from 'react';
import { usePermissionsStore } from '@/stores/permissions-store';
import { UserRole, PERMISSION_CATEGORIES } from '@/types/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  ShieldCheck,
  User,
  RefreshCw,
  Save,
  AlertCircle,
  Undo2,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ROLE_CONFIG = {
  [UserRole.ADMIN]: {
    icon: ShieldCheck,
  },
  [UserRole.MODERATOR]: {
    icon: Shield,
  },
  [UserRole.USER]: {
    icon: User,
  },
};

// Sortable Card Component
function SortableRoleCard({
  role,
  locale,
  editedPermissions,
  togglePermission,
  loading,
  tRoles,
  tCategories,
  tLabels,
  collapsedState,
  onToggleCollapse,
}: {
  role: UserRole;
  locale: string;
  editedPermissions: Record<UserRole, Set<string>>;
  togglePermission: (role: UserRole, permission: string) => void;
  loading: boolean;
  tRoles: (key: string) => string;
  tCategories: (key: string) => string;
  tLabels: (key: string) => string;
  collapsedState: Record<UserRole, boolean>;
  onToggleCollapse: (role: UserRole) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: role });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const config = ROLE_CONFIG[role];
  const Icon = config.icon;
  const permissionCount = editedPermissions[role]?.size || 0;
  const isCollapsed = collapsedState[role];

  return (
    <div ref={setNodeRef} style={style}>
      <Card dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Drag Handle */}
              <button
                className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-muted rounded transition-colors"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg truncate">{tRoles(role)}</CardTitle>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="secondary">{permissionCount}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleCollapse(role)}
                className="h-8 w-8 p-0"
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isCollapsed && (
          <CardContent>
            <div className="space-y-4">
              {Object.entries(PERMISSION_CATEGORIES).map(
                ([category, permissions]) => {
                  const hasAnyPermission = permissions.some((p) =>
                    editedPermissions[role]?.has(p),
                  );

                  if (!hasAnyPermission && permissionCount > 10) {
                    return null;
                  }

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          {tCategories(category)}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {
                            permissions.filter((p) =>
                              editedPermissions[role]?.has(p),
                            ).length
                          }
                          /{permissions.length}
                        </Badge>
                      </div>
                      <div className="space-y-2 ps-2">
                        {permissions.map((permission) => {
                          // permission is a string like "product:create"
                          const label = tLabels(permission) || permission;

                          return (
                            <div
                              key={permission}
                              className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
                            >
                              <label
                                htmlFor={`${role}-${permission}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {label}
                              </label>
                              <Switch
                                id={`${role}-${permission}`}
                                checked={editedPermissions[role]?.has(permission)}
                                onCheckedChange={() =>
                                  togglePermission(role, permission)
                                }
                                disabled={loading}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export function PermissionsMatrix() {
  const locale = useLocale();
  const t = useTranslations('permissions');
  const tActions = useTranslations('permissions.actions');
  const tRoles = useTranslations('permissions.roles');
  const tCategories = useTranslations('permissions.categories');
  const tLabels = useTranslations('permissions.labels');

  const {
    rolePermissions,
    loading,
    fetchAllRolePermissions,
    updateRolePermissions,
    refreshCache,
  } = usePermissionsStore();

  const [editedPermissions, setEditedPermissions] = useState<
    Record<UserRole, Set<string>>
  >({
    [UserRole.ADMIN]: new Set(),
    [UserRole.MODERATOR]: new Set(),
    [UserRole.USER]: new Set(),
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [roleOrder, setRoleOrder] = useState<UserRole[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('permissions-role-order');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Fallback to default
        }
      }
    }
    return [UserRole.ADMIN, UserRole.MODERATOR, UserRole.USER];
  });

  const [collapsedState, setCollapsedState] = useState<
    Record<UserRole, boolean>
  >(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('permissions-collapsed-state');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Fallback to default
        }
      }
    }
    return {
      [UserRole.ADMIN]: false,
      [UserRole.MODERATOR]: false,
      [UserRole.USER]: false,
    };
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    fetchAllRolePermissions();
  }, [fetchAllRolePermissions]);

  // Persist role order to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('permissions-role-order', JSON.stringify(roleOrder));
    }
  }, [roleOrder]);

  // Persist collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'permissions-collapsed-state',
        JSON.stringify(collapsedState),
      );
    }
  }, [collapsedState]);

  useEffect(() => {
    if (rolePermissions) {
      setEditedPermissions({
        [UserRole.ADMIN]: new Set(rolePermissions[UserRole.ADMIN] || []),
        [UserRole.MODERATOR]: new Set(
          rolePermissions[UserRole.MODERATOR] || [],
        ),
        [UserRole.USER]: new Set(rolePermissions[UserRole.USER] || []),
      });
      setHasChanges(false);
    }
  }, [rolePermissions]);

  const togglePermission = (role: UserRole, permission: string) => {
    setEditedPermissions((prev) => {
      const newSet = new Set(prev[role]);
      if (newSet.has(permission)) {
        newSet.delete(permission);
      } else {
        newSet.add(permission);
      }
      return {
        ...prev,
        [role]: newSet,
      };
    });
    setHasChanges(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setRoleOrder((items) => {
        const oldIndex = items.indexOf(active.id as UserRole);
        const newIndex = items.indexOf(over.id as UserRole);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleToggleCollapse = (role: UserRole) => {
    setCollapsedState((prev) => ({
      ...prev,
      [role]: !prev[role],
    }));
  };

  const handleSave = async () => {
    for (const role of Object.values(UserRole)) {
      const permissions = Array.from(editedPermissions[role]);
      await updateRolePermissions(role, permissions);
    }
    setHasChanges(false);
  };

  const handleReset = () => {
    if (rolePermissions) {
      setEditedPermissions({
        [UserRole.ADMIN]: new Set(rolePermissions[UserRole.ADMIN] || []),
        [UserRole.MODERATOR]: new Set(
          rolePermissions[UserRole.MODERATOR] || [],
        ),
        [UserRole.USER]: new Set(rolePermissions[UserRole.USER] || []),
      });
      setHasChanges(false);
    }
  };

  if (loading && !rolePermissions) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center flex-wrap gap-y-2 justify-between">
        <div className="flex items-center  gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshCache}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 me-2" />
            {tActions('refreshCache')}
          </Button>
          {hasChanges && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                {tActions('unsavedChanges')}
              </span>
            </div>
          )}
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={loading}
            >
              <Undo2 className="h-4 w-4 me-2" />
              {tActions('reset')}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 me-2" />
              {tActions('saveChanges')}
            </Button>
          </div>
        )}
      </div>

      {/* Role Cards */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={roleOrder} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {roleOrder.map((role) => (
              <SortableRoleCard
                key={role}
                role={role}
                locale={locale}
                editedPermissions={editedPermissions}
                togglePermission={togglePermission}
                loading={loading}
                tRoles={tRoles}
                tCategories={tCategories}
                tLabels={tLabels}
                collapsedState={collapsedState}
                onToggleCollapse={handleToggleCollapse}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
