import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-2xl font-bold">페이지를 찾을 수 없습니다.</h2>
            <p className="text-gray-600">
                요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
            </p>
            <Link href="/">
                <Button variant="primary">홈으로 돌아가기</Button>
            </Link>
        </div>
    );
}
