import {Container, Row, Col, Button, Navbar, Form} from 'react-bootstrap';
import NFTCard from "../../../components/NFTCard";
import styled from "styled-components";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowLeft} from "@fortawesome/free-solid-svg-icons";
import {SModal} from "../../../components/Settings";
import {Modal} from "react-bootstrap";
import {useEffect, useState} from "react";
import InfoModal from "../../../components/InfoModal";
import {useParams} from "react-router-dom";
import {loadToken} from "../../../utils/state/views";
import {formatNearAmount, getObjects, getTokenOptions, handleOffer, token2symbol} from "../../../utils/near";
import {handleAcceptOffer} from "../../../utils/state/actions";

const CardInfo = styled.div`
  background-color: aquamarine;
  border-radius: 20px;
  padding: 30px;
`

function BidModal({show, onHide, inputValue, onInputChange, onBtnClick}) {
    return <SModal show={show} onHide={onHide} centered>
        <Modal.Header closeButton />
        <Modal.Body>
            <Col>
                <h3>Set your bid for buying a <code>Name</code></h3>
                <h3><code>Surname from CardHolder</code></h3>
            </Col>
            <Row className='mt-3 justify-content-center'>
                <Col className='col-auto'>
                    <Form.Group>
                        <div className="input-group input-group-lg" id="big-modal-input">
                            <input type="number" step='0.01' className='form-control' aria-labelledby="big-modal-input"
                                   value={inputValue} onChange={onInputChange} />
                            <span className="input-group-text">Ⓝ</span>
                        </div>
                    </Form.Group>
                </Col>
                <Col className='col-auto'>
                    <Button variant='success' onClick={onBtnClick}>Offer</Button>
                </Col>
            </Row>
        </Modal.Body>
    </SModal>
}

export default function BuyCardView() {
    const [showBuyCardOfferModal, setShowBuyCardOfferModal] = useState(false);
    const handleBuyCardOfferModalOpen = () => setShowBuyCardOfferModal(true);
    const handleBuyCardOfferModalClose = () => setShowBuyCardOfferModal(false);

    const [showBuyCardConfirmModal, setShowBuyCardConfirmModal] = useState(false);
    const handleBuyCardConfirmModalOpen = () => setShowBuyCardConfirmModal(true);
    const handleBuyCardConfirmModalClose = () => setShowBuyCardConfirmModal(false);

    /// market
    const [offerPrice, setOfferPrice] = useState('');
    const [offerToken, setOfferToken] = useState('near');

    const {tokenId: id} = useParams();

    const [isLoaded, setIsLoaded] = useState(false);
    const [nft, setNft] = useState();
    const [nftExtra, setNftExtra] = useState();
    const [accountID, setAccountID] = useState();

    function loadCard(id) {
        loadToken(id).then(r => {
            if (!r?.sale_conditions) {
                r.sale_conditions = {}
            }
            if (!r?.bids) {
                r.bids = {}
            }
            setNft(r);
            setIsLoaded(true);
        });

        getObjects().then(r => {
            const {wallet} = r;
            setAccountID(wallet.account().accountId);
        });
    }

    const getNumsInString = s => s.match(/^\d+|\d+\b|\d+(?=\w)/g);

    useEffect(() => {
        if (id) {
            loadCard(id);
        } else loadCard(getNumsInString(window.location.pathname)[0]);
    }, []);

    useEffect(() => {
        nft?.metadata?.extra && setNftExtra(JSON.parse(nft.metadata.extra));
    },[nft]);

    return <>
        <Navbar bg='dark' variant='dark'>
            <Container>
                <Navbar.Brand href='/trade-cards/buy-cards'>
                    <FontAwesomeIcon icon={faArrowLeft} width='25' />
                </Navbar.Brand>
                <Navbar.Brand href='/'>
                    <img alt='Logo' src='/logo.png' width='40' className='d-inline-block align-top' />
                </Navbar.Brand>
            </Container>
        </Navbar>
        {isLoaded ?
            <Container>
                <Row className='my-5'>
                    <Col className='col-12 col-xs-12 col-sm-12 col-md-5 mb-3'>
                        <NFTCard
                            imgURL={nft?.metadata?.media}
                            year={2022}
                            position={nftExtra?.position}
                            name={nft?.metadata?.title}
                            number={nftExtra?.number}
                            role={nftExtra?.role}
                            stats={nftExtra && JSON.parse(nftExtra?.stats)}
                        />
                    </Col>
                    <Col className='col-12 col-xs-12 col-sm-12 col-md-7'>
                        <CardInfo>
                            <h2>{nft?.metadata?.title}</h2>
                            <h2>Other card info</h2>
                            <h5>{accountID !== nft?.owner_id ? `Owner: ${nft?.owner_id}` : 'You are the owner' }</h5>
                        </CardInfo>
                        <Row className='justify-content-center mt-4'>
                            <Col className='col-auto'>
                                <Button variant='secondary' onClick={handleBuyCardOfferModalOpen}>Buy for 6 Ⓝ</Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <div>
                    { Object.keys(nft?.sale_conditions).length > 0 && <>
                        <h4>Royalties</h4>
                        {
                            Object.keys(nft?.royalty).length > 0 ?
                                Object.entries(nft?.royalty).map(([receiver, amount]) => <div key={receiver}>
                                    {receiver} - {amount / 100}%
                                </div>)
                                :
                                <p>This token has no royalties.</p>
                        }
                    </>
                    }
                    {
                        Object.keys(nft?.sale_conditions).length > 0 && <>
                            <h4>Sale Conditions</h4>
                            {
                                Object.entries(nft?.sale_conditions).map(([ft_token_id, price]) => <div className="margin-bottom" key={ft_token_id}>
                                    {price === '0' ? 'open' : formatNearAmount(price, 4)} - {token2symbol[ft_token_id]}
                                </div>)
                            }
                            {
                                accountID.length > 0 && accountID !== nft?.owner_id && <>
                                    <input type="number" placeholder="Price" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} />
                                    {
                                        getTokenOptions(offerToken, setOfferToken, Object.keys(nft?.sale_conditions))
                                    }
                                    <button onClick={() => handleOffer(nft?.token_id, offerToken, offerPrice)}>Offer</button>
                                </>
                            }
                        </>
                    }
                    {
                        Object.keys(nft?.bids).length > 0 && <>
                            <h4>Offers</h4>
                            {
                                Object.entries(nft?.bids).map(([ft_token_id, ft_token_bids]) => ft_token_bids.map(({ owner_id: bid_owner_id, price }) => <div className="offers" key={ft_token_id}>
                                    <div>
                                        {price === '0' ? 'open' : formatNearAmount(price, 4)} - {token2symbol[ft_token_id]} by {bid_owner_id}
                                    </div>
                                    {
                                        accountID === nft?.owner_id &&
                                        <button onClick={() => handleAcceptOffer(nft?.token_id, ft_token_id)}>Accept</button>
                                    }
                                </div>) )
                            }
                        </>
                    }
                </div>
                <BidModal
                    show={showBuyCardOfferModal}
                    onHide={handleBuyCardOfferModalClose}
                    onBtnClick={() => {
                        handleBuyCardOfferModalClose();
                        handleBuyCardConfirmModalOpen();
                    }}
                />
                <InfoModal
                    show={showBuyCardConfirmModal}
                    onHide={handleBuyCardConfirmModalClose}
                    onBtnClick={handleBuyCardConfirmModalClose}
                    content={[
                        <h3 key='buy-cards-confirm-0'>You are buying a <code>Name Surname</code></h3>,
                        <h3 key='buy-cards-confirm-1'>from <code>CardHolder</code> for <code>XXX</code> Ⓝ</h3>,
                    ]}
                />
            </Container>
            : <h4>Loading...</h4>
        }
    </>
}
