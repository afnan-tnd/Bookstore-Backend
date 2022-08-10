
const { errorWrapper } = require("./errorWrapper")
const { MainErrorHandler } = require("./MainErrorHandler")
const typeCheck = require('type-check');

const getAllNonNullAllowedFieldsHelper = (data, allowedFields = []) => {

    try {
        const newData = { ...data }

        for (let key of Object.keys(newData)) {
            if (newData[key] === null || newData[key] === undefined) {
                delete newData[key]
            }
            if (allowedFields.length !== 0) {
                const keyToString = key.toString();
                if (!(allowedFields.includes(keyToString))) {
                    if (newData[key]) {
                        delete newData[key]
                    }
                }
            }
        }
        return newData
    } catch (err) {
        throw errorWrapper(err)
    }
}

const verifyRequiredFieldsHelper = (passedObject) => {
    try {
        let msgToSayStart = ""
        for (const prop in passedObject) {
            if (
                passedObject[prop]['value'] === undefined ||
                passedObject[prop]['value'] === null ||
                passedObject[prop]['value'] === "" ||
                !typeCheck.typeCheck(passedObject[prop]['type'], passedObject[prop]['value'])
            ) {
                msgToSayStart = msgToSayStart + " " + passedObject[prop]['name']
            }
        }
        if (msgToSayStart !== "") {
            msgToSayStart += " are required fields or type mismatch"
            throw new MainErrorHandler(msgToSayStart, 412)
        }
        return true
    } catch (err) {
        console.log(`💥💥This error is created from verifyRequiredFields ${err.message}💥💥`)
        throw err
    }
}

const checkExtraFields = (data, allowedFields = []) => {
    try {
        let msgToSayStart = ""

        for (param in data) {
            if (
                !allowedFields.includes(param)) {
                msgToSayStart = msgToSayStart + " " + param
            }
        }

        if (msgToSayStart !== "") {
            msgToSayStart += " are extra fields"
            throw new MainErrorHandler(msgToSayStart, 412)
        }
        return true
    } catch (err) {
        console.log(`💥💥This error is created from checkExtraFields ${err.message}💥💥`)
        throw err
    }
}

module.exports = {
    getAllNonNullAllowedFieldsHelper,
    verifyRequiredFieldsHelper,
    checkExtraFields,
}