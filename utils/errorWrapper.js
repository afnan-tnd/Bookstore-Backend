const { ApiError } = require("./apiError")
const errorWrapper = (err) => {
    if (err.name && err.name === "ApiError") {
        return err.getFormattedResponse();
    } else {
        return new ApiError(err.message, 400)
    }
}
module.exports = {
    errorWrapper
}