export const NoticeTypes = {
    SUCCESS: "success",
    ERROR: "error",
} as const;

export type NoticeType = (typeof NoticeTypes)[keyof typeof NoticeTypes];

export interface Notice {
    type: NoticeType;
    message: string;
}
