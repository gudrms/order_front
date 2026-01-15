'use client';

export default function SentryTestPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-8 p-4">
            <h1 className="text-2xl font-bold">Sentry Error Test Page</h1>
            <p className="text-gray-600">Click the buttons below to test Sentry error reporting.</p>

            <div className="flex gap-4">
                <button
                    className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                    onClick={() => {
                        throw new Error('Sentry Test Error (Client-side) - Delivery Customer');
                    }}
                >
                    Throw Client Error
                </button>
            </div>
        </div>
    );
}
