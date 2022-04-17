const { ApiError } = require("./apiError")
const errorWrapper = (err, isUnhandledType = false, code = 400) => {
    if (isUnhandledType) {
        // console.log(err)
        if (err.name && err.name !== "ApiError") {
            const codeToUse = code || err.errorCode
            err = new ApiError(err.message, codeToUse)
        }
        console.log(
            "💥💥💥💥.\n Unhandled type of error occured:\n",
            err.getFormattedResponse(),
            "\n💥💥💥💥\n ii5298666"
        )
    }
    if (err.name && err.name === "ApiError") {
        return err.getFormattedResponse();
    } else {
        return new ApiError(err.message, code)
    }
}
module.exports = {
    errorWrapper
}