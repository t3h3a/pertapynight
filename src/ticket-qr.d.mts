type Copy = Record<'scan'|'photo'|'preview'|'demo'|'reading'|'done'|'invalid'|'unavailable', string>;
export function bookingCopy(language: string): Copy;
export const staticDemo: boolean;
export function sampleDates(): import('../api-client/generated/api.schemas').PetraSchedule[];
export function scanTicket(event: {currentTarget: HTMLInputElement}, copy: Copy, onReference: (value: string) => void, onStatus: (value: string) => void): Promise<void>;

