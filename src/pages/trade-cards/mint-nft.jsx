import TradeCardsLayout from "../../components/Layout/TradeCardsLayout";
import {useState} from "react";
import {handleMint} from "../../utils/state/actions";
import {isAccountTaken, networkId} from "../../utils/near-utils";

export default function MintNft() {
    const [media, setMedia] = useState('');
    const [validMedia, setValidMedia] = useState('');
    const [royalties, setRoyalties] = useState({});
    const [royalty, setRoyalty] = useState([]);
    const [receiver, setReceiver] = useState([]);

    const [name, setName] = useState('');
    const [position, setPosition] = useState('');
    const [role, setRole] = useState('');
    const [type, setType] = useState('');
    const [hand, setHand] = useState('');
    const [stats, setStats] = useState('');
    const [number, setNumber] = useState('');

    return <TradeCardsLayout>
        <h3>Mint NFT player</h3>

        <input placeholder="Image Link" value={media} onChange={(e) => setMedia(e.target.value)} /> <br />
        <img src={media} onLoad={() => setValidMedia(true)} onError={() => setValidMedia(false)} />

        { !validMedia && <p>Image link is invalid.</p> }

        <h4>Royalties</h4>
        {
            Object.keys(royalties).length > 0 ?
                Object.entries(royalties).map(([receiver, royalty]) => <div key={receiver}>
                    {receiver} - {royalty} % <button onClick={() => {
                    delete royalties[receiver];
                    setRoyalties(Object.assign({}, royalties));
                }}>❌</button>
                </div>)
                :
                <p>No royalties added yet.</p>
        }
        <input placeholder="Account ID" value={receiver} onChange={(e) => setReceiver(e.target.value)} />
        <input type="number" placeholder="Percentage" value={royalty} onChange={(e) => setRoyalty(e.target.value)} />
        <button onClick={async () => {
            const exists = await isAccountTaken(receiver);
            if (!exists) return alert(`Account: ${receiver} does not exist on ${networkId ==='default' ? 'testnet' : 'mainnet'}.`);
            setRoyalties(Object.assign({}, royalties, {
                [receiver]: royalty
            }));
        }}>Add Royalty</button> <br /><br /> <br /><br />

        <h3>Metadata</h3>

        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} /><br /><br />
        <input placeholder="Position" value={position} onChange={(e) => setPosition(e.target.value)} /><br /><br />
        <input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} /><br /><br />
        <input placeholder="Type" value={type} onChange={(e) => setType(e.target.value)} /><br /><br />
        <input placeholder="Hand" value={hand} onChange={(e) => setHand(e.target.value)} /><br /><br />
        <input placeholder="Stats [67, 87, 66, 87, 92]" value={stats} onChange={(e) => setStats(e.target.value)} /><br /><br />
        <input type="number" placeholder="Number" value={number} onChange={(e) => setNumber(e.target.value)} /><br /><br />


        <button onClick={() => handleMint(royalties, media, validMedia, name, {position, role, type, hand, stats, number})}>Mint</button>

    </TradeCardsLayout>
}
