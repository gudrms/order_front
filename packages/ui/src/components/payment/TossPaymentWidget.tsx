'use client';

import { useEffect, useRef } from 'react';
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';

interface TossPaymentWidgetProps {
    clientKey: string;
    customerKey: string;
    amount: number;
    onWidgetReady?: (widget: PaymentWidgetInstance) => void;
}

export function TossPaymentWidget({ clientKey, customerKey, amount, onWidgetReady }: TossPaymentWidgetProps) {
    const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
    const paymentMethodsWidgetRef = useRef<any>(null);

    useEffect(() => {
        (async () => {
            try {
                const paymentWidget = await loadPaymentWidget(clientKey, customerKey);

                const paymentMethodsWidget = paymentWidget.renderPaymentMethods(
                    '#payment-widget',
                    { value: amount },
                    { variantKey: 'DEFAULT' }
                );

                paymentWidget.renderAgreement('#agreement', { variantKey: 'AGREEMENT' });

                paymentWidgetRef.current = paymentWidget;
                paymentMethodsWidgetRef.current = paymentMethodsWidget;

                if (onWidgetReady) {
                    onWidgetReady(paymentWidget);
                }
            } catch (error) {
                console.error('Failed to load Toss Payment Widget:', error);
            }
        })();
    }, [clientKey, customerKey]);

    useEffect(() => {
        const paymentMethodsWidget = paymentMethodsWidgetRef.current;
        if (paymentMethodsWidget) {
            paymentMethodsWidget.updateAmount(amount);
        }
    }, [amount]);

    return (
        <div className="w-full">
            <div id="payment-widget" className="w-full" />
            <div id="agreement" className="w-full" />
        </div>
    );
}
