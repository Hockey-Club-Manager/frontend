import * as nearAPI from "near-api-js";
import {parseNearAmount} from "near-api-js/lib/utils/format";

export const gameContractName = "uriyyuriy.testnet";
export const marketContractName = "nft-marketplace.testnet";
export const nftContractName = "nft-0_0.testnet";

const GAS = "200000000000000";

export async function getConfig() {
    return {
        networkId: "testnet",
        keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
        nodeUrl: "https://rpc.testnet.near.org",
        walletUrl: "https://wallet.testnet.near.org",
        helperUrl: "https://helper.testnet.near.org",
        explorerUrl: "https://explorer.testnet.near.org",
    };
}

export async function getObjects() {
    const config = {
        networkId: "testnet",
        keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
        nodeUrl: "https://rpc.testnet.near.org",
        walletUrl: "https://wallet.testnet.near.org",
        helperUrl: "https://helper.testnet.near.org",
        explorerUrl: "https://explorer.testnet.near.org",
    };

    const near = await nearAPI.connect(config);
    const wallet = new nearAPI.WalletConnection(near);

    return {near, wallet};
}

export function getGameContract(wallet) {
    return new nearAPI.Contract(
        wallet.account(),
        gameContractName,
        {
            viewMethods: ['get_available_players', 'get_available_games', 'is_already_in_the_waiting_list', 'get_game_config',],
            changeMethods: ['make_available', 'start_game', 'generate_event', 'make_unavailable', 'internal_stop_game',
                'take_to', 'coach_speech', 'goalie_out', 'goalie_back', 'change_ice_priority', 'change_tactic',
            ],
        }
    );
}

export function getMarketContract(wallet) {
    return new nearAPI.Contract(
        wallet.account(),
        marketContractName,
        {
            viewMethods: ['get_sales_by_owner_id', 'get_sale', 'get_sales_by_nft_contract_id', 'storage_paid', 'storage_amount'],
            changeMethods: ['update_price', 'storage_deposit', 'accept_offer', 'offer'],
        }
    );
}

export function getNftContract(wallet) {
    return new nearAPI.Contract(
        wallet.account(),
        nftContractName,
        {
            viewMethods: ["nft_tokens_for_owner", "nft_tokens_batch", "nft_token", "nft_tokens", "nft_total_supply"],
            changeMethods: ["nft_mint", "nft_approve"],
        }
    );
}

export const token2symbol = {
    "near": "NEAR",
};

const allTokens = Object.keys(token2symbol);

export const getTokenOptions = (value, setter, accepted = allTokens) => (
    <select value={value} onChange={(e) => setter(e.target.value)}>
        {
            accepted.map((value) => <option key={value} value={value}>{token2symbol[value]}</option>)
        }
    </select>);

export const handleOffer = async (token_id, offerToken, offerPrice) => {
    if (offerToken !== 'near') {
        return alert('currently only accepting NEAR offers');
    }
    if (offerToken === 'near') {
        let marketContract, marketWallet;
        await getObjects().then(r => {
            const {wallet: _wallet} = r;
            marketWallet = _wallet;
            marketContract = getMarketContract(_wallet);
        });

        await marketContract.offer({
            nft_contract_id: nftContractName,
            token_id,
        }, GAS, parseNearAmount(offerPrice));
    } else {
        /// todo ft_transfer_call
    }
};

const NEAR_NOMINATION = 1_000_000_000_000_000_000_000_000;

// Converts yoctoNEAR to human-readable amount
// TODO remove it's usage
export const formatNearAmount = balance => balance / NEAR_NOMINATION;
