class ApiError extends Error {
    constructor(message, errorCode = 400) {
        super(message);
        this.errorCode = errorCode;
        this.name = "ApiError"
    }
    getFormattedResponse() {
        const errorsArray = this.message.split(",")
        return {
            success: false,
            msg: this.message,
            data: { errors: [...errorsArray] }
        }
    }
}
module.exports = { ApiError }