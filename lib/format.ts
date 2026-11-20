export const formatCurrency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
}).format;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
});

export function formatDate(value: string) {
    return dateFormatter.format(new Date(value));
}

export function toCents(amount: string | number) {
    return Math.round(Number(amount) * 100);
}

export function localDateInputValue() {
    const today = new Date();
    return new Date(today.getTime() - today.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
