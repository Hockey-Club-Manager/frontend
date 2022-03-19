import {parseNearAmount} from "near-api-js/lib/utils/format";
import {getMarketContract, getNftContract, getObjects, marketContractName, nftContractName} from "../near";
import BN from 'bn.js';

const GAS = "200000000000000";

export const handleMint = async (royalties, media, validMedia, title, player) => {
    if (!media.length || !validMedia) {
        alert('Please enter a valid Image Link. You should see a preview below!');
        return;
    }

    // shape royalties data for minting and check max is < 20%
    let perpetual_royalties = Object.entries(royalties).map(([receiver, royalty]) => ({
        [receiver]: royalty * 100
    })).reduce((acc, cur) => Object.assign(acc, cur), {});
    if (Object.values(perpetual_royalties).reduce((a, c) => a + c, 0) > 2000) {
        return alert('Cannot add more than 20% in perpetual NFT royalties when minting');
    }

    const metadata = {
        title,
        media,
        issued_at: Date.now(),
        extra: JSON.stringify(player),
    };

    const deposit = parseNearAmount('0.1');

    let contract, wallet;
    await getObjects().then(r => {
        const {wallet: _wallet} = r;
        wallet = _wallet;
        contract = getNftContract(_wallet);
    });

    console.log(contract);

    await contract.nft_mint({
        token_id: 'token-' + Date.now(),
        metadata,
        perpetual_royalties
    }, GAS, deposit);
};

export const handleAcceptOffer = async (token_id, ft_token_id) => {
    let marketContract, marketWallet;
    await getObjects().then(r => {
        const {wallet: _wallet} = r;
        marketWallet = _wallet;
        marketContract = getMarketContract(_wallet);
    });

    if (ft_token_id !== 'near') {
        return alert('currently only accepting NEAR offers');
    }
    await marketContract.accept_offer({
        nft_contract_id: nftContractName,
        token_id,
        ft_token_id,
    }, GAS);
};

export const handleRegisterStorage = async () => {
    // WARNING this just pays for 10 "spots" to sell NFTs in marketplace vs. paying each time

    let marketContract, wallet;
    await getObjects().then(r => {
        const {wallet: _wallet} = r;
        wallet = _wallet;
        marketContract = getMarketContract(_wallet);
    });

    await marketContract.storage_deposit(
        {},
        GAS,
        new BN(await marketContract.storage_amount()).mul(new BN('10'))
    )
};

export const handleSaleUpdate = async (token_id, newSaleConditions) => {
    let marketContract, marketWallet;
    await getObjects().then(r => {
        const {wallet: _wallet} = r;
        marketWallet = _wallet;
        marketContract = getMarketContract(_wallet);
    });

    let nftContract, nftWallet;
    await getObjects().then(r => {
        const {wallet: _wallet} = r;
        nftWallet = _wallet;
        nftContract = getNftContract(_wallet);
    });

    const sale = await marketContract.get_sale({ nft_contract_token: nftContractName + ":" + token_id }).catch(() => { });
    if (sale) {
        await marketContract.update_price({
            nft_contract_id: nftContractName,
            token_id,
            ft_token_id: newSaleConditions[0].ft_token_id,
            price: newSaleConditions[0].price
        }, GAS);
    } else {
        await nftContract.nft_approve({
            token_id,
            account_id: marketContractName,
            msg: JSON.stringify({ sale_conditions: newSaleConditions })
        }, GAS, parseNearAmount('0.01'));
    }
};
