import { redirect } from 'next/navigation';
import { getStoreUrl } from '@/lib/utils/store';

export default function LegacyMenuPage() {
  redirect(getStoreUrl('/menu'));
}
