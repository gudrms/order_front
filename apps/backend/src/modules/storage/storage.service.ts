import { randomUUID } from 'crypto';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const ASSETS_BUCKET = 'assets';
const MENU_IMAGE_PREFIX = 'menu';

const EXTENSION_BY_MIME: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};

@Injectable()
export class StorageService {
    private client: SupabaseClient | null = null;

    constructor(private readonly config: ConfigService) {}

    private getClient(): SupabaseClient {
        if (this.client) {
            return this.client;
        }

        const url = this.config.get<string>('SUPABASE_URL');
        const serviceKey = this.config.get<string>('SUPABASE_SERVICE_KEY');

        if (!url || !serviceKey) {
            throw new InternalServerErrorException(
                'Storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_KEY missing)',
            );
        }

        this.client = createClient(url, serviceKey, {
            auth: { persistSession: false },
        });
        return this.client;
    }

    isSupportedImageType(mimetype: string): boolean {
        return mimetype in EXTENSION_BY_MIME;
    }

    async uploadMenuImage(storeId: string, file: { buffer: Buffer; mimetype: string }): Promise<string> {
        const ext = EXTENSION_BY_MIME[file.mimetype];
        const path = `${MENU_IMAGE_PREFIX}/${storeId}/${randomUUID()}.${ext}`;
        const client = this.getClient();

        const { error } = await client.storage
            .from(ASSETS_BUCKET)
            .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

        if (error) {
            throw new InternalServerErrorException(`Image upload failed: ${error.message}`);
        }

        const { data } = client.storage.from(ASSETS_BUCKET).getPublicUrl(path);
        return data.publicUrl;
    }
}
