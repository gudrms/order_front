import { redirect } from 'next/navigation';
import { getStoreUrl } from '@/lib/utils/store';

export default function LegacyCartPage() {
  redirect(getStoreUrl('/cart'));
}
