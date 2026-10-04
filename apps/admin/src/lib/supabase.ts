// Share the same auth storage and client as shared API helpers; do not create a second GoTrue client.
export { supabase } from '@order/shared/lib/supabase';
import { supabase } from '@order/shared/lib/supabase';

export function createRealtimeChannel(channelName: string) {
  return supabase.channel(channelName);
}
