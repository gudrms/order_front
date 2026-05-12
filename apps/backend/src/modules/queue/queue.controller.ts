import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QueueConsumerService } from './queue-consumer.service';

@ApiTags('Queue')
@Controller('queue')
export class QueueController {
    constructor(
        private readonly queueConsumerService: QueueConsumerService,
        private readonly config: ConfigService,
    ) { }

    @Post('process-once')
    @ApiOperation({
        summary: '백엔드 큐 1회 처리',
        description: 'Vercel Cron 또는 운영 배치에서 호출하는 내부 큐 처리 endpoint입니다.',
    })
    @ApiHeader({
        name: 'x-internal-job-secret',
        description: '내부 배치 호출용 secret',
        required: true,
    })
    @ApiBody({
        required: false,
        schema: {
            type: 'object',
            properties: {
                queueName: { type: 'string', example: 'backend_events' },
                visibilityTimeoutSeconds: { type: 'number', example: 60 },
                quantity: { type: 'number', example: 10 },
            },
        },
    })
    @ApiResponse({ status: 201, description: '큐 처리 완료' })
    @ApiResponse({ status: 401, description: '내부 배치 secret 불일치' })
    async processOnce(
        @Headers('x-internal-job-secret') secret: string | undefined,
        @Body() body: {
            queueName?: string;
            visibilityTimeoutSeconds?: number;
            quantity?: number;
        } = {},
    ) {
        this.assertInternalSecret(secret);
        return this.queueConsumerService.processOnce(body);
    }

    private assertInternalSecret(secret: string | undefined) {
        const expected = this.config.get<string>('INTERNAL_JOB_SECRET');
        if (!expected || secret !== expected) {
            throw new UnauthorizedException('Invalid internal job secret');
        }
    }
}

