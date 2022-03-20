import React from 'react';
import {Link, useNavigate} from "react-router-dom";
import {Alert, Button, Col, Form, Modal, Row, Table} from "react-bootstrap";
// import Settings from "../components/settings";
import {useEffect, useState} from "react";
import Settings, {SModal} from "./components/Settings";
// import SetTactics from "../components/SetTactics";
import * as nearAPI from "near-api-js";
import {gameContractName, getGameContract, getObjects} from "./utils/near";
import {nanoid} from "nanoid";
import SetTactics from "./components/SetTactics";

function BidModal ({show, onHide}) {
  const GAS_MAKE_AVAILABLE = 300_000_000_000_000;

  const navigate = useNavigate();

  const [bid, setBid] = useState<number>(0.01);
  const [isInList, setIsInList] = useState(false);
  let wallet, contract;
  const [availablePlayers, setAvailablePlayers] = useState();

  const updateAvailablePlayers = () => {
    contract.get_available_players({from_index: 0, limit: 50}).then(r => {
      setAvailablePlayers(r);
    });
  }

  function updateInTheWaitingList() {
    contract.is_already_in_the_waiting_list({account_id: wallet.account().accountId}).then(r => {
      setIsInList(r);
    }).catch(e => console.error(e) )
  }

  const handleOffer = () => {
    makeAvailable();
  }

  const makeAvailable = () => {
    if (bid >= 0.01) {
      contract.make_available({config: {},}, GAS_MAKE_AVAILABLE, nearAPI?.utils.format.parseNearAmount(bid.toString()))
          .catch(e => console.error(e));
    } else {
      alert('Minimal bid is 0.01');
    }
  }


  getObjects().then(r => {
    const {wallet: _wallet} = r;
    wallet = _wallet;
    if (wallet.isSignedIn()) {
      contract = getGameContract(_wallet);
      updateInTheWaitingList();
    }
  });

  function handleAvailablePlayerClick(player) {
    if (!(player[0] === wallet.account().accountId)) {
      contract.start_game({opponent_id: player[0]}, GAS_MAKE_AVAILABLE, player[1].deposit)
          .then(r => {
            // unreachable code due to redirect
            console.log(r);
          }).catch(e => console.error(e) )
    } else {
      alert('You cannot battle against yourself');
    }
  }
  const handleCancel = () => contract.make_unavailable().then(r => {
    console.log(r);
    setIsInList(false);
  })

  function handleOpponentWaitingUpdate() {
    contract.get_available_games({from_index: 0, limit: 50}).then(r => {
      const gamesWithMyID = r.filter(game => game[1][0] === wallet.account().accountId
          || game[1][1] === wallet.account().accountId);
      if (gamesWithMyID.length) {
        const _myGameID = gamesWithMyID[0][0];
        const isInGame = typeof _myGameID === "number";

        if(isInGame) {
          navigate('/game');
        }
      } else console.log('No one have selected your bid yet');
    }).catch(e => console.error('get available games: ', e));
  }

  // @ts-ignore
  // @ts-ignore
  return <SModal show={show} onHide={onHide} centered>
    <Modal.Header closeButton />
    <Modal.Body>
      {!isInList ? <>
        <h3>Set your bid for a game</h3>
        <Row className='mt-3 justify-content-center'>
          <Col className='col-auto'>
            <Form.Group>
              <div className="input-group input-group-lg" id="big-modal-input">
                <input type="number" step='0.01' min='0.01' className='form-control' aria-labelledby="big-modal-input"
                       value={bid} onChange={(event)=>setBid(parseFloat(event.target.value))} />
                <span className="input-group-text">Ⓝ</span>
              </div>
            </Form.Group>
          </Col>
          <Col className='col-auto'>
            <Button variant='success' onClick={handleOffer}>Offer</Button>
          </Col>
        </Row>
      </> : <Row className='justify-content-start'>
        <Col className='col-auto'>
          <h3>Waiting for opponent</h3>
        </Col>
        <Col className="col-auto">
          <Button variant='outline-secondary' size='sm' onClick={handleOpponentWaitingUpdate}>update</Button>
        </Col>
        <Col className='col-auto'>
          <Button variant='outline-danger' size='sm' onClick={handleCancel}>Cancel</Button>
        </Col>
      </Row>
      }
      <Row className='justify-content-start my-3'>
        <Col className='col-auto'>
          <h4><b>or</b> choose opponent from the list</h4>
        </Col>
        <Col className='col-auto'>
          <Button variant='outline-secondary' size='sm' onClick={()=>updateAvailablePlayers()}>update</Button>
        </Col>
      </Row>
      {availablePlayers && <>
        {isInList && <Alert variant='danger'>Please click <b>Cancel</b> before choosing opponent to return your bid</Alert> }
        <Table striped hover bordered variant='warning'>
          <thead>
          <tr>
            <th>Opponent</th>
            <th>Bid</th>
          </tr>
          </thead>
          <tbody>
          {/* @ts-ignore */}
          {availablePlayers?.map(player => <tr key={nanoid()} onClick={()=> {
            handleAvailablePlayerClick(player);
          }}>
            <td>{player[0]}</td>
            <td>{nearAPI.utils.format.formatNearAmount(player[1].deposit)} Ⓝ</td>
          </tr>)
          }
          </tbody>
        </Table>
      </>
      }
    </Modal.Body>
  </SModal>
}

export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
  const [isShowBidModal, setIsShowBidModal] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  const showBid = () => setIsShowBidModal(true);
  const hideBid = () => setIsShowBidModal(false);

  const navigate = useNavigate();

  let contract, wallet;
  getObjects().then(r => {
    const {wallet: _wallet} = r;
    wallet = _wallet;
    contract = getGameContract(_wallet);
  });

  function handlePlayGame() {
    contract.get_available_games({from_index: 0, limit: 50}).then(r => {
      if (r.length > 0) {
        const gamesWithMyID = r.filter(game => game[1][0] === wallet.account().accountId
            || game[1][1] === wallet.account().accountId);
        if (gamesWithMyID.length) {
          const _myGameID = gamesWithMyID[0][0];
          const isInGame = typeof _myGameID === "number";

          if (isInGame) navigate('/game');
          else showBid();
        } else showBid();
      } else showBid();
    }).catch(e => console.error('get available games: ', e));
  }

  // const [balance, setBalance] = useState('');

  useEffect(()=> {
    getObjects().then(r => {
      const {wallet} = r;

      setIsSigned(wallet.isSignedIn());
      // const walletAccountID = wallet.getAccountId();

      // wallet.isSignedIn() && near.account(walletAccountID).then(account => {
      // account.getAccountBalance().then(_balance => {
      // setBalance(nearAPI.utils.format.formatNearAmount(_balance.available).slice(0, -14));
      // });
      // })
    });
  }, []);

  const signIn = () => {
    getObjects().then(r => {
      const {wallet} = r;
      wallet.requestSignIn(gameContractName, "NFT Hockey");
    })
  };

  const signOut = () => {
    getObjects().then(r => {
      const {wallet} = r;
      wallet.signOut();
      setIsSigned(false);
    })
  };

  return (
      <main>
        <Settings show={showSettings} setShow={setShowSettings} />
        <Button onClick={()=>setShowSettings(true)}>Settings</Button>
        <Link to='/trade-cards/buy-cards'><Button>Trade cards</Button></Link>
        <SetTactics/>

        <Link to='/manage-team/set-lineups' className='btn btn-primary'>Set lineups</Link>
        <Link to='/image-menu-test' className='btn btn-primary'>Image menu</Link>
        {isSigned ? <>
              <BidModal show={isShowBidModal} onHide={hideBid} />
              <Button onClick={handlePlayGame}>Play game</Button>
              <Link to='/contracts-test' className='btn btn-warning'><code>contracts test</code></Link>
              <br/>
              <Button variant='dark' onClick={()=>signOut()}>Sign out</Button>
            </>
            :
            <Button variant='dark' onClick={()=>signIn()}>Sign in</Button>
        }
        {/*{isSigned && <>*/}
        {/*    <h3>{balance}</h3>*/}
        {/*</>}*/}
      </main>
  )
}
