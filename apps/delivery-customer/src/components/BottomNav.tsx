import { Home, FileText, User } from 'lucide-react';

export default function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-2 px-6 flex justify-between items-center z-50 max-w-[600px] mx-auto">
            <button className="flex flex-col items-center gap-1 p-2 text-brand-black">
                <Home size={24} fill="currentColor" />
                <span className="text-[10px] font-bold">홈</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-2 text-gray-300 hover:text-brand-black transition-colors">
                <FileText size={24} />
                <span className="text-[10px] font-bold">주문내역</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-2 text-gray-300 hover:text-brand-black transition-colors">
                <User size={24} />
                <span className="text-[10px] font-bold">마이</span>
            </button>
        </nav>
    );
}
