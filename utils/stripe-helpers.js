const { STRIPE_SECRET_KEY } = process.env;
const stripe = require("stripe")(STRIPE_SECRET_KEY);
const { errorWrapper } = require("./errorWrapper")
/**
 * @param {Object} data
 * @param {string} data.first_name
 * @param {string} data.last_name
 * @param {string} data.ssn_last_4
 * @param {{year:Number,month:Number}} data.dob
 * @param {string} data.email
 * @param {string} data.phone_number
 * @param {string} data.account_number
 * @param {string} data.account_holder_name
 * @param {string} data.routing_number
*/
const createConnectAccount = async (
    data,
) => {
    try {
        const {
            account_holder_name,
            account_number,
            routing_number,
            first_name,
            last_name,
            ssn_last_4,
            dob,
            email,
            phone_number,
        } = data;

        //  business profile
        console.log("📝📝phone number was", phone_number)
        let product_description = "An individual worker providing services.";
        let business_profile = { product_description };
        //  individual profile
        let individual = { first_name };
        if (last_name) {
            individual = { ...individual, last_name };
        }
        individual.email = email;
        // individual.phone = phone_number;
        // individual.phone = "0000000000"; //disable this line if you want real mode
        individual.ssn_last_4 = ssn_last_4;
        individual.dob = dob;
        //  terms of service
        let tos_acceptance = {
            date: (Math.floor(new Date().getTime() / 1000)),
            ip: "3.133.25.118"
        };

        let account = await stripe.accounts.create({
            type: "custom",
            country: "US",
            business_type: "individual",
            individual,
            business_profile,
            tos_acceptance,
            external_account: {
                object: "bank_account",
                country: "US",
                currency: "usd",
                account_holder_type: "individual",
                account_holder_name,
                account_number,
                routing_number,
            },
            requested_capabilities: ["transfers"],
        });

        return { account_id: account.id, account };
    } catch (err) {
        throw errorWrapper(err);
    }
};
const retriveConnectAccount = async (data) => {
    try {
        const { connected_account_id, ssn } = data;
        const account = await stripe.accounts.retrieve(
            connected_account_id,
        );
        const result = {
            account_holder_name:
                account.external_accounts.data[0].account_holder_name,
            account_number: account.external_accounts.data[0].last4,
            routing_number: account.external_accounts.data[0].routing_number,
            dob: account.individual.dob["year"] + "-" + account.individual.dob["month"] + "-" + account.individual.dob["day"],
            ssn: ssn,
        };
        return {
            account: result,
            account_id: account.id
        };

    } catch (err) {
        throw errorWrapper(err)
    }
};
//updateCustomers default source
/**
 * @param {Object} data
 * @param {string} data.customer_id
 * @param {string} data.default_source - New card id
 * 
*/
const updateCustomerDefSource = async (data) => {
    try {
        const { customer_id, default_source } = data;
        const customer = await stripe.customers.update(
            customer_id,
            {
                default_source: default_source,
            },
        );
        return { customer };
    } catch (err) {
        return errorWrapper(err)
    }
};

/**
 * @param {Object} data
 * @param {String} data.customer_id - customers stripe account id
 * @param {Number} data.ammount - amount to be paid by customer
*/
const chargeCustomer = async (
    data,
) => {
    try {
        //customer_id is stripe_customer_id
        //amount is amount to be transfered
        let {
            customer_id,
            amount,
        } = data;

        //  convert amount to cents
        amount = Math.ceil(amount * 100);
        const serviceFeeCharge = 10;
        const serviceFee = Math.ceil(serviceFeeCharge * 100);
        const stripeFee = (((amount * 2.9) / 100) + 30);
        const totalChargeAmount = stripeFee + amount;

        const amountForProvider = totalChargeAmount - serviceFee;
        const charge = await stripe.charges.create({
            amount: totalChargeAmount,
            currency: "usd",
            customer: customer_id,
        });

        if (charge.id) {
            return {
                status: true,
                charge: charge,
                providerFee: (amountForProvider - stripeFee) / 100,
                serviceFee: serviceFee / 100,
                stripeFee: stripeFee / 100,
            }
        }
    } catch (err) {
        return {
            status: false,
            error: err,
        }
    }
};

/**
 * @param {Object} data
 * @param {String} data.accound_id - providers connected account id
 * @param {String} data.charge_id - providers connected account id
 * @param {Number} data.ammount - amount to be paid by customer
*/
const payProvider = async (
    data,
) => {
    try {
        //account_id is connected account id
        //amount is amount to be transfered
        // chargeid from which charge is created
        let {
            account_id,
            amount,
            charge_id,
        } = data;
        amount = Math.ceil(amount * 100);
        const transfer = await stripe.transfers.create({
            amount: amount,
            currency: "usd",
            destination: account_id,
            source_transaction: charge_id,
        });

        if (transfer.id) {
            return {
                status: true,
                transferId: transfer.id,
            };
        }

    } catch (err) {
        return {
            status: false,
            error: err,
        }
    }
};

//DDD charge start
/**
 * @param {Object} data
 * @param {String} data.accound_id - providers connected account id
 * @param {String} data.customer_id - customers stripe account id
 * @param {Number} data.ammount - amount to be paid by customer
*/
const chargeCustomerAndPayProvider = async (
    data,
) => {
    try {
        //account_id is connected account id
        //customer_id is stripe_customer_id
        //amount is amount to be transfered
        let {
            account_id,
            customer_id,
            amount,
        } = data;
        const total_amount =
            //  convert amount to cents
            amount = Math.ceil(amount * 100);
        const serviceFeeCharge = 10;
        const serviceFee = Math.ceil(serviceFeeCharge * 100);
        // Math.ceil(
        //     Number(amount * (serviceFeeCharge / 100))
        // );
        const amountForProvider = amount - serviceFee;
        const charge = await stripe.charges.create({
            amount,
            currency: "usd",
            customer: customer_id,
        });

        if (charge.id) {
            //charge created sucessfully now paying from the chrge
            //on the behalf of customer
            const transfer = await stripe.transfers.create({
                amount: amountForProvider,
                currency: "usd",
                destination: account_id,
                source_transaction: charge.id,
            });

            //This is code is disabled due do a requirement
            if (transfer.id) {
                return {
                    data: {
                        chargeId: charge.id,
                        source: "Customer",
                        providerFee: amountForProvider,
                        //  transfer_id: transfer.id,
                        cardLast4: charge.source.last4,
                    },
                };
                //End disabled code due to requirement
            }
        }
    } catch (err) {
        throw errorWrapper(err);
    }
};
//DDD escrow start
const createUncapturedCharge = async (data) => {
    try {
        let { amount, customer_id } = data;
        amount = Math.ceil(amount * 100);

        const charge = await stripe.charges.create({
            amount,
            currency: "usd",
            customer: customer_id,
            capture: false,
        });
        if (charge.id) {
            return { status: true, data: { chargeId: charge.id } };
        }
    } catch (err) {
        return { status: false, errors: [err.message] };
    }
};
const chargeCustPayProviderEscrow = async (data) => {
    try {
        let {
            account_id, //connected account id of provider
            job_id,
            charge_id, //the id of job which is completed by provier
        } = data;

        let amount = 1
        amount = Math.ceil(amount * 100);
        const charge = await stripe.charges.capture(charge_id);
        let transfer = { id: undefined };
        const serviceFeeCharge = 1;

        const serviceFee = Math.ceil(
            Number(amount * (serviceFeeCharge / 100)),
        );
        const amountForProvider = amount - serviceFee;
        console.log("amount is ====>", amount);
        console.log("amountForProvider is =====>", amountForProvider);
        if (charge.id) {
            transfer = await stripe.transfers.create({
                amount: amountForProvider,
                currency: "usd",
                destination: account_id,
                source_transaction: charge.id,
            });
        }

        if (transfer.id) {
            console.log(
                "Everthing done from chargeCustomerAndPayProvider() , with source Customer",
            );
            console.log("card last 4 is====>", charge.source.last4);



            return {
                status: true,
                data: {
                    transfer_id: transfer.id,
                    cardLast4: charge.source.last4,
                },
            };
        }
    } catch (err) {
        return { status: false, errors: [err.message] };
    }
};
//DDD escrow end
/**
 * @param {Object} data
 * @param {string} data.account_id
 * @param {string} data.account_holder_name
 * @param {string} data.account_number
 * @param {string} data.routing_number
 * @param {string} data.ssn
 * @param {string} data.dob
 * 
*/
const editBankData = async (data) => {
    try {
        const {
            account_id,
            account_holder_name,
            account_number,
            routing_number,
            ssn,
            dob,
        } = data;
        const account = await stripe.accounts.update(
            account_id,
            {
                individual: {
                    ssn_last_4: ssn,
                    dob: dob,
                },
                external_account: {
                    object: "bank_account",
                    country: "US",
                    currency: "usd",
                    account_holder_type: "individual",
                    account_holder_name,
                    account_number,
                    routing_number,
                },
            },
        );
        return account
    } catch (err) {
        throw errorWrapper(err)
    }
};
/**
 * @param {Object} data
 * @param {string} data.customer_id
*/
const getAllCustomerCards = async (data) => {
    try {
        const { customer_id } = data;
        const stripeCustomer = await stripe.customers.retrieve(
            customer_id,
        );

        const cards = await stripe.customers.listSources(
            customer_id,
            { object: "card" },
        );

        return { cards: cards.data, defaultCard: stripeCustomer.default_source }
    } catch (err) {
        throw errorWrapper(err);

    }
};
/**
 * @param {Object} data
 * @param {string} data.customer_id
 * @param {string} data.stripe_token
*/
const addSourceToCustomer = async (data) => {
    try {
        const { customer_id, stripe_token } = data;
        const source = await stripe.customers.createSource(
            customer_id,
            {
                source: stripe_token,
            },
        );
        return { source };
    } catch (err) {
        throw errorWrapper(err)
    }
};
/**
 * @param {Object} data
 * @param {string} data.customer_id
 * @param {string} data.card_id
*/
const deleteCustomerCard = async (data) => {
    try {
        const { customer_id, card_id } = data;

        let allCards = await getAllCustomerCards({ customer_id });
        let allCardsLength = allCards.cards.length;
        if (allCardsLength > 1) {
            const deleted = await stripe.customers.deleteSource(
                customer_id,
                card_id,
            );
            return { deleted, card_id };
        } else {
            throw errorWrapper("You must have more than one card in order to delete")
        }
    } catch (err) {
        throw errorWrapper(err)
    }
};
//DDD charge end
/**
 * @param {Object} data
 * @param {string} data.stripe_token
 * @param {string} data.email
*/
const createStripeCustomer = async (data) => {
    try {
        const { stripe_token, email } = data;
        const customer = await stripe.customers.create({
            email: email,
            source: stripe_token,
        });
        return { customer };
    } catch (err) {
        throw errorWrapper(err)
    }
};

module.exports = {
    createConnectAccount,
    addSourceToCustomer,
    chargeCustomer,
    payProvider,
    chargeCustomerAndPayProvider,
    deleteCustomerCard,
    editBankData,
    chargeCustPayProviderEscrow,
    retriveConnectAccount,
    createUncapturedCharge,
    createStripeCustomer,
    updateCustomerDefSource,
    getAllCustomerCards,
};
