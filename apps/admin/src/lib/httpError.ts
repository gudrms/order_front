import axios from 'axios';

export function getHttpErrorMessage(error: unknown, fallbackMessage: string) {
  if (!axios.isAxiosError(error)) return fallbackMessage;

  const data = error.response?.data as { message?: unknown; error?: unknown } | undefined;
  if (typeof data?.message === 'string') return data.message;
  if (Array.isArray(data?.message)) return data.message.join(', ');
  if (typeof data?.error === 'string') return data.error;

  return error.message || fallbackMessage;
}
