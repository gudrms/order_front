'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { KeyRound, Plus, Trash2 } from 'lucide-react';
import { useAdminStore } from '@/contexts/AdminStoreContext';

type AccountRole = 'ADMIN' | 'OWNER';

type AdminAccount = {
  id: string;
  email: string;
  name?: string | null;
  phoneNumber?: string | null;
  role: AccountRole;
  stores: Array<{ id: string; name: string; branchName?: string | null }>;
};

type StoreOption = {
  id: string;
  name: string;
  branchName?: string | null;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function AccountsPage() {
  const { authHeaders } = useAdminStore();
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<AccountRole>('OWNER');
  const [storeId, setStoreId] = useState('');
  const [resetPasswordById, setResetPasswordById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestConfig = useMemo(() => ({ headers: authHeaders }), [authHeaders]);

  const load = async () => {
    if (!apiUrl || !authHeaders) return;

    const [accountsRes, storesRes] = await Promise.all([
      axios.get(`${apiUrl}/admin/accounts`, requestConfig),
      axios.get(`${apiUrl}/stores`, requestConfig),
    ]);

    setAccounts(accountsRes.data.data || accountsRes.data);
    setStores(storesRes.data.data || storesRes.data);
  };

  useEffect(() => {
    load().catch((err) => {
      setError(err.response?.data?.message || '계정 정보를 불러오지 못했습니다.');
    });
  }, [authHeaders]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!apiUrl || !authHeaders) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await axios.post(
        `${apiUrl}/admin/accounts`,
        {
          email,
          password,
          name: name || undefined,
          phoneNumber: phoneNumber || undefined,
          role,
          storeId: role === 'OWNER' ? storeId : undefined,
        },
        requestConfig,
      );
      setEmail('');
      setPassword('');
      setName('');
      setPhoneNumber('');
      setStoreId('');
      setMessage('계정을 생성했습니다.');
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || '계정 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (accountId: string) => {
    if (!apiUrl || !authHeaders) return;
    const nextPassword = resetPasswordById[accountId]?.trim();
    if (!nextPassword) {
      setError('새 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await axios.patch(
        `${apiUrl}/admin/accounts/${accountId}/password`,
        { password: nextPassword },
        requestConfig,
      );
      setResetPasswordById((prev) => ({ ...prev, [accountId]: '' }));
      setMessage('비밀번호를 변경했습니다.');
    } catch (err: any) {
      setError(err.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!apiUrl || !authHeaders) return;
    if (!window.confirm('이 계정을 삭제할까요? 연결된 매장 ownerId도 해제됩니다.')) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await axios.delete(`${apiUrl}/admin/accounts/${accountId}`, requestConfig);
      setMessage('계정을 삭제했습니다.');
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || '계정 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">계정 생성</h2>
        <form onSubmit={handleCreate} className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-2">
          <input
            type="email"
            required
            placeholder="이메일"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="초기 비밀번호 (8자 이상)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="tel"
            placeholder="전화번호"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as AccountRole)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="OWNER">점주</option>
            <option value="ADMIN">마스터 관리자</option>
          </select>
          <select
            value={storeId}
            onChange={(event) => setStoreId(event.target.value)}
            required={role === 'OWNER'}
            disabled={role !== 'OWNER'}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
          >
            <option value="">매장 선택</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}{store.branchName ? ` (${store.branchName})` : ''}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 md:col-span-2"
          >
            <Plus className="h-4 w-4" />
            계정 생성
          </button>
        </form>
      </section>

      {(message || error) && (
        <div className={`rounded-md px-4 py-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {error || message}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">계정 목록</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">계정</th>
                <th className="px-4 py-3">역할</th>
                <th className="px-4 py-3">매장</th>
                <th className="px-4 py-3">비밀번호 초기화</th>
                <th className="px-4 py-3 text-right">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{account.email}</div>
                    <div className="text-xs text-gray-500">{account.name || '이름 없음'}</div>
                  </td>
                  <td className="px-4 py-3">{account.role}</td>
                  <td className="px-4 py-3">
                    {account.stores.length > 0
                      ? account.stores.map((store) => store.name).join(', ')
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-xs gap-2">
                      <input
                        type="password"
                        minLength={8}
                        placeholder="새 비밀번호"
                        value={resetPasswordById[account.id] || ''}
                        onChange={(event) => setResetPasswordById((prev) => ({
                          ...prev,
                          [account.id]: event.target.value,
                        }))}
                        className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleResetPassword(account.id)}
                        disabled={loading}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        title="비밀번호 초기화"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(account.id)}
                      disabled={loading}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      title="계정 삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    등록된 관리자 계정이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
