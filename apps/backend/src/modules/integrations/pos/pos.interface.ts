export interface PosProvider {
    sendOrder(order: any): Promise<boolean>;
    checkHealth(): Promise<boolean>;
}
