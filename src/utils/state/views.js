import {getGameContract, getMarketContract, getNftContract, getObjects, nftContractName} from "../near";

const GAS = "200000000000000";

const BAD_OWNER_ID = [];
// api-helper config
const domain = 'https://helper.nearapi.org';
const batchPath = domain + '/v1/batch/';
const headers = new Headers({
    'max-age': '300'
});

export async function getMarketStoragePaid() {
    const {wallet} = await getObjects();
    const marketContract = getMarketContract(wallet);
    return marketContract.storage_paid({account_id: wallet.account().accountId});
}

export async function loadToken(token_id) {
    const {wallet}  = await getObjects();
    const nftContract = getNftContract(wallet);
    const marketContract = getMarketContract(wallet);

    let sale = await marketContract.get_sale({ nft_contract_token: nftContractName + "||" + token_id }).catch(() => { });
    let token = await nftContract.nft_token({token_id});

    token = Object.assign(token, sale || {});

    console.log(token)
    console.log(sale)
    return token;
}

export async function loadUserTokens() {

    const {wallet}  = await getObjects();
    const account = wallet.account();
    const nftContract = getNftContract(wallet);
    const marketContract = getMarketContract(wallet);

    // user tokens
    let tokens = []

    if (account) {
        tokens = await nftContract.nft_tokens_for_owner({
            account_id: account.accountId,
            from_index: '0',
            limit: 50
        });

        const sales = await marketContract.get_sales_by_owner_id({
            account_id: account.accountId,
            from_index: '0',
            limit: 50
        });
        // merge tokens with sale data if it's on sale
        for (let i = 0; i < tokens.length; i++) {
            const { token_id } = tokens[i];
            let sale = sales.find(({ token_id: t }) => t === token_id);
            // don't have it in state, go find sale data
            if (!sale) {
                sale = await marketContract.get_sale({ nft_contract_token: nftContractName + "||" + token_id }).catch(() => { });
            }
            tokens[i] = Object.assign(tokens[i], sale || {});
        }
    }
    return tokens
}

export const loadTokens = async (fromIndex = 0, limit = 50) => {
    const {wallet} = await getObjects();
    const nftContract = getNftContract(wallet);

    // all tokens
    // need to use NFT helper for deployed
    const allTokens = await nftContract.nft_tokens({
        from_index: fromIndex.toString(),
        limit: limit
    });

    return allTokens.filter(({owner_id}) => !BAD_OWNER_ID.includes(owner_id));
}

export const loadSales = async (fromIndex = 0, limit = 50) => {
    let nftContract, nftWallet;

    await getObjects().then(r => {
        const {wallet: _wallet} = r;
        nftWallet = _wallet;
        nftContract = getNftContract(_wallet);
    });

    let marketContract, marketWallet;

    await getObjects().then(r => {
        const {wallet: _wallet} = r;
        marketWallet = _wallet;
        marketContract = getMarketContract(_wallet);
    });

    /// all sales
    // need to use NFT helper for deployed contract
    let sales;
    sales = await marketContract.get_sales_by_nft_contract_id({
        nft_contract_id: nftContractName,
        from_index: fromIndex.toString(),
        limit: limit
    });

    const saleTokens = await nftContract.nft_tokens_batch({
        token_ids: sales.filter(({ nft_contract_id }) => nft_contract_id === nftContractName).map(({ token_id }) => token_id)
    });
    // merge sale listing with nft token data
    for (let i = 0; i < sales.length; i++) {
        const { token_id } = sales[i];
        let token = saleTokens.find(({ token_id: t }) => t === token_id);
        // don't have it in batch, go find token data
        if (!token) {
            token = await nftContract.nft_token({ token_id });
        }
        sales[i] = Object.assign(sales[i], token);
    }
    sales = sales.filter(({ owner_id }) => !BAD_OWNER_ID.includes(owner_id));

    return sales
};

// may include nft and non-nft
export async function loadUserTeam() {
    const {wallet}  = await getObjects();
    const account = wallet.account();
    const contract = getGameContract(wallet);

    if (account) {
        return await contract.get_owner_team({account_id: account.accountId}, GAS);
    }
}

export async function loadUserNftTeam() {
    const {wallet}  = await getObjects();
    const account = wallet.account();
    const nftContract = getNftContract(wallet);

    if (account) {
        return await nftContract.get_owner_nft_team({account_id: account.accountId});
    }
}

export async function loadUserNFTPlayers() {
    const {wallet}  = await getObjects();
    const account = wallet.account();
    const nftContract = getNftContract(wallet);

    if (account) {
        return await nftContract.nft_tokens_for_owner({
            account_id: account.accountId,
            from_index: '0',
            limit: 50
        });
    }
}
