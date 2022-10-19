const { MainErrorHandler } = require("./MainErrorHandler")
const errorWrapper = (err, isUnhandledType = false, code = 400) => {
    if (isUnhandledType) {
        // console.log(err)
        if (err.name && err.name !== "MainErrorHandler") {
            const codeToUse = code || err.errorCode
            err = new MainErrorHandler(err.message, codeToUse)
        }
        console.log(
            "💥💥💥💥.\n Unhandled type of error occurred:\n",
            err.getFormattedResponse(),
            "\n💥💥💥💥\n ii5298666"
        )
    }
    if (err.name && err.name === "MainErrorHandler") {
        return err;
    } else {
        return new MainErrorHandler(err.message, code)
    }
}
module.exports = {
    errorWrapper
}