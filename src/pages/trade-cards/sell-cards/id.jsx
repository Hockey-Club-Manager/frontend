import styled from "styled-components";
import {useEffect, useState} from "react";
import {Button, Col, Container, Form, Modal, Navbar, Row} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowLeft, faInfoCircle} from "@fortawesome/free-solid-svg-icons";
import NFTCard from "../../../components/NFTCard";
import {SModal} from "../../../components/Settings";
import {useParams} from "react-router-dom";
import {getMarketStoragePaid, loadToken} from "../../../utils/state/views";
import {formatNearAmount, getObjects, getTokenOptions, token2symbol} from "../../../utils/near";
import {handleAcceptOffer, handleRegisterStorage, handleSaleUpdate} from "../../../utils/state/actions";
import {parseNearAmount} from "near-api-js/lib/utils/format";

const CardInfo = styled.div`
  background-color: aquamarine;
  border-radius: 20px;
  padding: 30px;
`

export default function SellCardView() {
    const [showBuyCardPriceModal, setShowBuyCardPriceModal] = useState(false);
    const handleBuyCardPriceModalOpen = () => setShowBuyCardPriceModal(true);
    const handleBuyCardPriceModalClose = () => setShowBuyCardPriceModal(false);

    const {tokenId: token_id} = useParams();

    const [isLoaded, setIsLoaded] = useState(false);
    const [nft, setNft] = useState();
    const [nftExtra, setNftExtra] = useState();
    const [accountID, setAccountID] = useState();
    const [marketStoragePaid, setMarketStoragePaid] = useState();

    /// updating user tokens
    const [price, setPrice] = useState('');
    const [ft, setFT] = useState('near');
    const [saleConditions, setSaleConditions] = useState({});

    function loadCard(token_id) {
        loadToken(token_id).then(r => {
            console.log(r)
            if (!r?.sale_conditions) {
                r.sale_conditions = {}
            }
            if (!r?.bids) {
                r.bids = {}
            }
            setNft(r);
            setIsLoaded(true);
        });

        getMarketStoragePaid().then(r => {
            setMarketStoragePaid(r);
        })

        getObjects().then(r => {
            const {wallet} = r;
            setAccountID(wallet.account().accountId);
        });

    }

    const getNumsInString = s => s.match(/^\d+|\d+\b|\d+(?=\w)/g);

    useEffect(() => {
        if (token_id) {
            loadCard(token_id);
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
                            <h1>Card info</h1>
                            <h2>Other card info</h2>
                            <h3>Even more info</h3>
                        </CardInfo>
                        <Row className='justify-content-center mt-4'>
                            <Col className='col-auto'>
                                <Button variant='secondary' onClick={handleBuyCardPriceModalOpen}>Buy for 6 Ⓝ</Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
                {
                    marketStoragePaid !== '0' ? <>
                            <h4>Royalties</h4>
                            {
                                Object.keys(nft?.royalty).length > 0 ?
                                    Object.entries(nft?.royalty).map(([receiver, amount]) => <div key={receiver}>
                                        {receiver} - {amount / 100}%
                                    </div>)
                                    :
                                    <p>This token has no royalties.</p>
                            }
                            {
                                Object.keys(nft?.sale_conditions).length > 0 && <>
                                    <h4>Current Sale Conditions</h4>
                                    {
                                        Object.entries(nft?.sale_conditions).map(([ft_token_id, price]) => <div className="margin-bottom" key={ft_token_id}>
                                            {price === '0' ? 'open' : formatNearAmount(price)} - {token2symbol[ft_token_id]}
                                        </div>)
                                    }
                                </>
                            }
                            {
                                accountID === nft?.owner_id && <>
                                    <div>
                                        <h4>Add Sale Conditions</h4>
                                        <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
                                        {
                                            getTokenOptions(ft, setFT)
                                        }
                                        <button onClick={() => {
                                            if (!price.length) {
                                                return alert('Enter a price');
                                            }
                                            const newSaleConditions = {
                                                ...saleConditions,
                                                [ft]: parseNearAmount(price)
                                            }
                                            setSaleConditions(newSaleConditions);
                                            setPrice('');
                                            setFT('near');
                                            handleSaleUpdate(nft?.token_id, newSaleConditions);
                                        }}>Add</button>
                                    </div>
                                    <div>
                                        <i style={{ fontSize: '0.75rem' }}>Note: price 0 means open offers</i>
                                    </div>
                                </>
                            }
                            {
                                Object.keys(nft?.bids).length > 0 && <>
                                    <h4>Offers</h4>
                                    {
                                        Object.entries(nft?.bids).map(([ft_token_id, { owner_id, price }]) => <div className="offers" key={ft_token_id}>
                                            <div>
                                                {price === '0' ? 'open' : formatNearAmount(price, 4)} - {token2symbol[ft_token_id]}
                                            </div>
                                            <button onClick={() => handleAcceptOffer(nft?.token_id, ft_token_id)}>Accept</button>
                                        </div>)
                                    }
                                </>
                            }
                        </>
                        :
                        <div className="center">
                            <button onClick={() => handleRegisterStorage(accountID)}>Register with Market to Sell</button>
                        </div>
                }
                <SModal show={showBuyCardPriceModal} onHide={handleBuyCardPriceModalClose} centered>
                    <Modal.Header closeButton />
                    <Modal.Body>
                        <Form>
                            <Row>
                                <Col><h3>Set your price for selling a <code>Name</code></h3></Col>
                            </Row>
                            <Row>
                                <Col><h3><code>Surname</code></h3></Col>
                            </Row>
                            <Row className='justify-content-start'>
                                <Col className='col-auto'>
                                    {/*<Col>*/}
                                    <Form.Group>
                                        <Form.Check />
                                    </Form.Group>
                                </Col>
                                <Col className='col-2'><FontAwesomeIcon icon={faInfoCircle} /></Col>
                            </Row>
                            <Row>
                                <Col className='text-center'>
                                    <Button onClick={handleBuyCardPriceModalClose}>Offer</Button>
                                </Col>
                            </Row>
                        </Form>
                    </Modal.Body>
                </SModal>
            </Container>

            : <h4>Loading...</h4>
        }
    </>
}
