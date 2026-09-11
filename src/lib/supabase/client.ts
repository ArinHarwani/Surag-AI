import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key-here'
);

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl as string, supabaseAnonKey as string);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

export const supabase = client;

/**
 * Universal Realtime Channel:
 * Works with Supabase Realtime when credentials are configured,
 * and falls back to browser BroadcastChannel for instant cross-tab sync during local demos.
 */
export class RealtimeRelay {
  private broadcastChannel: BroadcastChannel | null = null;
  private channelName: string;
  private supabaseChannel: ReturnType<SupabaseClient['channel']> | null = null;

  constructor(channelName = 'investigation-intel-channel') {
    this.channelName = channelName;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel(this.channelName);
    }
    if (typeof window !== 'undefined' && supabase) {
      try {
        this.supabaseChannel = supabase.channel(this.channelName);
        this.supabaseChannel.subscribe();
      } catch (err) {
        console.warn('Supabase channel init warning:', err);
      }
    }
  }

  public publish(event: string, payload: unknown) {
    // 1. If Supabase client exists, send broadcast over subscribed channel
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event,
          payload,
        });
      } catch (err) {
        console.warn('Supabase broadcast failed:', err);
      }
    }

    // 2. BroadcastChannel across tabs/windows
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ event, payload, timestamp: Date.now() });
    }
  }

  public subscribe(callback: (event: string, payload: unknown) => void): () => void {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.event) {
        callback(e.data.event, e.data.payload);
      }
    };

    if (this.broadcastChannel) {
      this.broadcastChannel.addEventListener('message', handleMessage);
    }

    // Also listen to Supabase if connected
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.on('broadcast', { event: '*' }, (payload) => {
          callback(payload.event, payload.payload);
        });
      } catch (e) {
        console.warn('Supabase subscribe failed:', e);
      }
    }

    return () => {
      if (this.broadcastChannel) {
        this.broadcastChannel.removeEventListener('message', handleMessage);
      }
    };
  }
}

export const realtimeRelay = new RealtimeRelay();
