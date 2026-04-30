import { ForbiddenException } from '@nestjs/common';

type Role = 'ADMIN' | 'OWNER' | 'USER' | string;

interface PermissionUser {
    id: string;
    role: Role;
}

interface PermissionStore {
    ownerId?: string | null;
}

export function isPlatformAdmin(user?: PermissionUser | null) {
    return user?.role === 'ADMIN';
}

export function canCreateStore(user?: PermissionUser | null) {
    return isPlatformAdmin(user);
}

export function canManageStore(user?: PermissionUser | null, store?: PermissionStore | null) {
    if (!user || !store) return false;
    return isPlatformAdmin(user) || store.ownerId === user.id;
}

export function assertCanCreateStore(user?: PermissionUser | null) {
    if (!canCreateStore(user)) {
        throw new ForbiddenException('Only admins can create stores');
    }
}

export function assertCanManageStore(user?: PermissionUser | null, store?: PermissionStore | null) {
    if (!canManageStore(user, store)) {
        throw new ForbiddenException('You do not have permission to manage this store');
    }
}
