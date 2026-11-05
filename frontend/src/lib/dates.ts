const pad = (value: number): string => String(value).padStart(2, "0");

export const formatIsoDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
