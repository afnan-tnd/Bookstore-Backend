class MainErrorHandler extends Error {
    constructor(message, errorCode = 400) {
        super(message);
        this.errorCode = errorCode;
        this.name = "MainErrorHandler"
    }
    getFormattedResponse() {
        const errorsArray = this.message.split(",")

        return {
            status: false,
            msg: errorsArray[0],
            errors: [...errorsArray]
        }
    }
    logUnhadled(err) { }
}
module.exports = { MainErrorHandler }