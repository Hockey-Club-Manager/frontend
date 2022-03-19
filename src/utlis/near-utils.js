import {getConfig} from "./near";
import * as nearAPI from "near-api-js";
import {Near} from "near-api-js";

export const {
    networkId,
} = getConfig();

export const isAccountTaken = async (accountId) => {
    const config = await getConfig();
    const near = new Near(config);

    const account = new nearAPI.Account(near.connection, accountId);
    try {
        await account.state();
        return true;
    } catch (e) {
        if (!/does not exist/.test(e.toString())) {
            throw e;
        }
    }
    return false;
};
