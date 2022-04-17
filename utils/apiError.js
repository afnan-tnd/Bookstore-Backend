class ApiError extends Error {
    constructor(message, errorCode = 400) {
        super(message);
        this.errorCode = errorCode;
    }
    getFormattedResponse() {
        return {
            success: false,
            msg: this.message,
        }
    }
}
module.exports = { ApiError }