export function formatSuccessResponse(data, requestId) {
    return {
        success: true,
        data,
        requestId,
    };
}
export function formatErrorResponse(error, requestId) {
    return {
        success: false,
        error,
        requestId,
    };
}
