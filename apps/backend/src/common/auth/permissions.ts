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
        throw new ForbiddenException('매장은 마스터 관리자만 생성할 수 있습니다');
    }
}

export function assertPlatformAdmin(user?: PermissionUser | null) {
    if (!isPlatformAdmin(user)) {
        throw new ForbiddenException('브랜드 메뉴는 마스터 관리자만 관리할 수 있습니다');
    }
}

export function assertCanManageStore(user?: PermissionUser | null, store?: PermissionStore | null) {
    if (!canManageStore(user, store)) {
        throw new ForbiddenException('이 매장을 관리할 권한이 없습니다');
    }
}
