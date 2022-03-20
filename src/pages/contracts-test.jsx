import React, {useRef, useState} from "react";
import {Button, Container, Row, Col, Table} from "react-bootstrap";
import * as nearAPI from "near-api-js";
import {getObjects, getGameContract} from "../utils/near";
import {nanoid} from "nanoid";
import {formatNearAmount} from "../utils/near";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCircle, faCheckCircle} from "@fortawesome/free-solid-svg-icons";

export default function ContractsTest() {
    let contract, wallet;

    const GAS_MAKE_AVAILABLE = 300_000_000_000_000;
    const GAS_MOVE = 50_000_000_000_000;

    const [isInList, setIsInList] = useState(false);
    const [bid, setBid] = useState(0.02);
    const [availablePlayers, setAvailablePlayers] = useState();
    const [availableGames, setAvailableGames] = useState();
    const [selectedOpponentID, setSelectedOpponentID] = useState('');
    const [myGameID, setMyGameID] = useState(null);
    const [autoGenerate, setAutoGenerate] = useState(false);
    const [eventsIntervalID, setEventsIntervalID] = useState(null);
    const [eventsQueue, setEventsQueue] = useState([]);
    const [autoReload, setAutoReload] = useState(false);
    const [tableIntervalID, setTableIntervalID] = useState(null);
    const [event, setEvent] = useState(null);


    const handleMakeAvailable = () => {
        contract.make_available({config: {},}, GAS_MAKE_AVAILABLE, nearAPI.utils.format.parseNearAmount(bid.toString()))
            .then(r => console.log(r))
            .catch(e => console.error(e));
    }
    const handleGetAvailablePlayers = () => {
        contract.get_available_players({from_index: 0, limit: 50}).then(r => {
            console.log(r);
            setAvailablePlayers(r);
        });
    }
    const handleMakeUnavailable = () => {
        contract.make_unavailable().then(r => {
            console.log(r);
        })
    }

    function updateInTheWaitingList() {
        contract.is_already_in_the_waiting_list({account_id: wallet.account().accountId}).then(r => {
            setIsInList(r);
            console.log('is already in the waiting list: ' + r);
        }).catch(e => console.error(e) )
    }

    const handleStartGame = () => {
        console.log(selectedOpponentID);
        if (selectedOpponentID) {
            setMyGameID(null);
            setLocalReceivedEvents(0);
            contract.start_game({opponent_id: selectedOpponentID}, GAS_MAKE_AVAILABLE, nearAPI.utils.format.parseNearAmount(bid.toString())).then(r => {
                // unreachable code due to redirect
                console.log(r);
            }).catch(e => console.error(e) )
        } else {
            alert('Select opponent');
        }
    }

    const getAvailableGames = () => {
        contract.get_available_games({from_index: 0, limit: 50}).then(r => {
            setAvailableGames(r);
            console.log(r);
        }).catch(e => console.error(e));
    }

    const stopGame = gameID => {
        console.log(gameID)
        contract.internal_stop_game({game_id: gameID}).then(r => {
            console.log(r);
        }).catch(e => console.error(e));
    }

    const handleGetGameConfig = () => {
        contract.get_game_config({account_id: wallet.account().accountId}).then(r => {
            console.log(r, `deposit: ${formatNearAmount(r.deposit)}`);
        }).catch(e => console.error(e));
    }

    const localReceivedEventsKey = 'receivedEvents';
    function getLocalReceivedEvents() {
        return parseInt(localStorage.getItem(localReceivedEventsKey) || 0);
    }
    function setLocalReceivedEvents(value) {
        localStorage.setItem(localReceivedEventsKey, value);
    }
    function incrementLocalReceivedEvents(incrementBy) {
        localStorage.setItem(localReceivedEventsKey, getLocalReceivedEvents() + incrementBy);
    }

    function endGame() {
        setLocalReceivedEvents(0);
        clearInterval(eventsIntervalID);
        setMyGameID(null);
        console.log('Game ended');
    }

    const shouldUpdate = useRef(true);
    const handleGenerateEvent = () => {
        if (shouldUpdate.current) {
            shouldUpdate.current = false;
            if (typeof myGameID === "number") {
                contract.generate_event({number_of_rendered_events: 0, game_id: myGameID }, GAS_MOVE)
                    .then(e =>  {
                        console.log('generate event: ', e)
                        shouldUpdate.current = true;
                        if (!e.length) {
                            contract.get_available_games({from_index: 0, limit: 50}).then(r => {
                                const _myGameID = r.filter(game => game[1][0] === wallet.account().accountId ||
                                    game[1][1] === wallet.account().accountId)[0][0];
                                if (!_myGameID) endGame();
                            })
                                .catch(e => console.error('get available games: ', e));
                        } else {
                            if(e[e.length - 1]?.action === 'GameFinished') {
                                endGame();
                            } else {
                                setEventsQueue(q => [...q, ...e]);
                                incrementLocalReceivedEvents(e.length);
                            }
                        }
                    })
                    .catch(e => console.error('generate event: ', e));
            } else {
                contract.get_available_games({from_index: 0, limit: 50}).then(r => {
                    const _myGameID = r.filter(game => game[1][0] === wallet.account().accountId || game[1][1] === wallet.account().accountId)[0][0];
                    setMyGameID(_myGameID);

                    contract.generate_event({number_of_rendered_events: 0, game_id: _myGameID }, GAS_MOVE)
                        .then(e => {
                            console.log('generate event: ', e)
                            shouldUpdate.current = true;
                            incrementLocalReceivedEvents(e.length);
                            if(e[e.length - 1]?.action === 'GameFinished') {
                                endGame();
                            } else {
                                setEventsQueue(e);
                            }
                        })
                        .catch(e => console.error('generate event: ', e));
                }).catch(e => console.error('get available games: ', e));
            }
        }
    }

    getObjects().then(r => {
        const {wallet: _wallet} = r;
        wallet = _wallet;
        contract = getGameContract(_wallet);
    });

    const handleAutoGenerate = () => {
        if (!autoGenerate) {
            setEventsIntervalID(setInterval(()=>{
                handleGenerateEvent();
            }, 1000))
        } else {
            clearInterval(eventsIntervalID);
        }
        setAutoGenerate(a => !a);
    }

    function handleAutoReload() {
        if (!autoReload) {
            setTableIntervalID(setInterval(()=>{
                setEventsQueue(q => {
                    console.log('items to render: ', q);
                    setEvent(q[0] || null);
                    return q.slice(1);
                });
            }, 1000));
        } else {
            clearInterval(tableIntervalID);
        }
        setAutoReload(a => !a);
    }

    return <Container>
        <h1>{isInList ? 'You are in list' : 'You are not in list'}</h1>
        <Row>
            <Col>
                <input type='number' step='0.01' value={bid} onChange={event => setBid(parseFloat(event.target.value))}/>
            </Col>
            <Col>
                <Button onClick={handleMakeAvailable}>make available</Button>
            </Col>
        </Row>
        <Button onClick={handleMakeUnavailable}>make unavailable</Button>
        <Row>
            <Col>
                <Button onClick={handleGetAvailablePlayers}>get available players</Button>
            </Col>
        </Row>
        { availablePlayers &&
            <Table striped bordered hover variant='warning'>
                <thead>
                <tr>
                    <th><code>select</code></th>
                    <th>username</th>
                    <th>bid</th>
                </tr>
                </thead>
                <tbody>
                {availablePlayers.map(player => <tr key={nanoid()}>
                    <td onClick={() => {
                        setBid(formatNearAmount(player[1].deposit));
                        setSelectedOpponentID(player[0]);
                    }}>
                        <FontAwesomeIcon icon={player[0] === selectedOpponentID ? faCheckCircle : faCircle} />
                    </td>
                    <td>{player[0]}</td>
                    <td>{formatNearAmount(player[1].deposit)} Ⓝ</td>
                </tr>)
                }
                </tbody>
            </Table>
        }
        <Button onClick={updateInTheWaitingList}>is in list</Button>
        <Button onClick={handleGetGameConfig}>Get game config</Button>
        <hr/>
        <Row className='justify-content-start'>
            <Col className='col-auto'>
                <h2>Available games</h2>
            </Col>
            <Col className='col-auto'>
                <Button onClick={getAvailableGames}>Update</Button>
            </Col>
        </Row>
        <Table striped bordered hover variant='warning'>
            <thead>
            <tr>
                <th><code>stop</code></th>
                <th>Game id</th>
                <th>Player 1</th>
                <th>Player 2</th>
            </tr>
            {availableGames?.map(game => <tr key={`game-${game[0]}`}>
                <td onClick={()=>stopGame(game[0])}>stop</td>
                <td>{game[0]}</td>
                <td>{game[1][0]}</td>
                <td>{game[1][1]}</td>
            </tr>)}
            </thead>
        </Table>
        <hr />
        <Button onClick={handleStartGame} variant='success'>Start game</Button>
        <Button onClick={handleGenerateEvent}>Generate event</Button>
        <Button onClick={handleAutoGenerate}>Turn {!autoGenerate ? 'on' : 'off'} auto generate event</Button>
        <Row>
            <Col>
                <Button onClick={handleAutoReload}>Turn {!autoReload ? 'on' : 'off'} auto reload table</Button>
            </Col>
        </Row>
        <Table striped bordered variant='secondary' className='my-4'>
            <thead>
            <tr>
                <th>Action</th>
                <th colSpan='7'>zone number</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td>{event?.action}</td>
                <td colSpan='7'>{event?.zone_number}</td>
            </tr>
            </tbody>
            <thead className='table-primary'>
            <tr>
                <th colSpan='8'>MY TEAM</th>
            </tr>
            </thead>
            <thead className='table-primary'>
            <tr>
                <th colSpan='8'>Field players</th>
            </tr>
            </thead>
            <thead className='table-primary'>
            <tr>
                <th>№</th>
                <th>position</th>
                <th>role</th>
                <th>Skating</th>
                <th>Shooting</th>
                <th>Strength</th>
                <th>iq</th>
                <th>morale</th>
            </tr>
            </thead>
            <tbody className='table-primary'>
            {event?.my_team?.five?.field_players && Object.keys(event?.my_team?.five?.field_players).map((k) => <tr key={nanoid()}>
                <td>{k}</td>
                <td>{event?.my_team?.five?.field_players[k].position}</td>
                <td>{event?.my_team?.five?.field_players[k].role}</td>
                <td>{event?.my_team?.five?.field_players[k].stats.skating}</td>
                <td>{event?.my_team?.five?.field_players[k].stats.shooting}</td>
                <td>{event?.my_team?.five?.field_players[k].stats.strength}</td>
                <td>{event?.my_team?.five?.field_players[k].stats.iq}</td>
                <td>{event?.my_team?.five?.field_players[k].stats.morale}</td>
            </tr>)}
            </tbody>
            <thead className='table-primary'>
            <tr>
                <th colSpan='8'>Goalie</th>
            </tr>
            </thead>
            <thead className='table-primary'>
            <tr>
                <th>role</th>
                <th>glove and blocker</th>
                <th>pads</th>
                <th>stand</th>
                <th>stretch</th>
                <th colSpan='3'>morale</th>
            </tr>
            </thead>
            <tbody className='table-primary'>
            <tr>
                <td>{event?.my_team?.goalie?.role}</td>
                <td>{event?.my_team?.goalie?.stats.glove_and_blocker}</td>
                <td>{event?.my_team?.goalie?.stats.pads}</td>
                <td>{event?.my_team?.goalie?.stats.stand}</td>
                <td>{event?.my_team?.goalie?.stats.stretch}</td>
                <td colSpan='3'>{event?.my_team?.goalie?.stats.morale}</td>
            </tr>
            </tbody>
            <thead className='table-warning'>
            <tr>
                <th colSpan='8'>Player with puck in team {event?.player_with_puck?.user_id}</th>
            </tr>
            </thead>
            <thead className='table-warning'>
            <tr>
                <th>Position</th>
                <th>role</th>
                <th>skating</th>
                <th>shooting</th>
                <th>strength</th>
                <th>iq</th>
                <th colSpan='2'>morale</th>
            </tr>
            </thead>
            <tbody className='table-warning'>
            <tr>
                <td>{event?.player_with_puck?.position}</td>
                <td>{event?.player_with_puck?.role}</td>
                <td>{event?.player_with_puck?.stats.skating}</td>
                <td>{event?.player_with_puck?.stats.shooting}</td>
                <td>{event?.player_with_puck?.stats.strength}</td>
                <td>{event?.player_with_puck?.stats.iq}</td>
                <td colSpan='2'>{event?.player_with_puck?.stats.morale}</td>
            </tr>
            </tbody>
            <thead className='table-danger'>
            <tr>
                <th colSpan='8'>OPPONENT TEAM</th>
            </tr>
            </thead>
            <thead className='table-danger'>
            <tr>
                <th colSpan='8'>Field players</th>
            </tr>
            </thead>
            <thead className='table-danger'>
            <tr>
                <th>№</th>
                <th>position</th>
                <th>role</th>
                <th>Skating</th>
                <th>Shooting</th>
                <th>Strength</th>
                <th>iq</th>
                <th>morale</th>
            </tr>
            </thead>
            <tbody className='table-danger'>
            {event?.opponent_team?.five?.field_players && Object.keys(event?.opponent_team?.five?.field_players).map((k) => <tr key={nanoid()}>
                <td>{k}</td>
                <td>{event?.opponent_team?.five?.field_players[k].position}</td>
                <td>{event?.opponent_team?.five?.field_players[k].role}</td>
                <td>{event?.opponent_team?.five?.field_players[k].stats.skating}</td>
                <td>{event?.opponent_team?.five?.field_players[k].stats.shooting}</td>
                <td>{event?.opponent_team?.five?.field_players[k].stats.strength}</td>
                <td>{event?.opponent_team?.five?.field_players[k].stats.iq}</td>
                <td>{event?.opponent_team?.five?.field_players[k].stats.morale}</td>
            </tr>)}
            </tbody>
            <thead className='table-danger'>
            <tr>
                <th colSpan='8'>Goalie</th>
            </tr>
            </thead>
            <thead className='table-danger'>
            <tr>
                <th>role</th>
                <th>glove and blocker</th>
                <th>pads</th>
                <th>stand</th>
                <th>stretch</th>
                <th colSpan='3'>morale</th>
            </tr>
            </thead>
            <tbody className='table-danger'>
            <tr>
                <td>{event?.opponent_team?.goalie?.role}</td>
                <td>{event?.opponent_team?.goalie?.stats.glove_and_blocker}</td>
                <td>{event?.opponent_team?.goalie?.stats.pads}</td>
                <td>{event?.opponent_team?.goalie?.stats.stand}</td>
                <td>{event?.opponent_team?.goalie?.stats.stretch}</td>
                <td colSpan='3'>{event?.opponent_team?.goalie?.stats.morale}</td>
            </tr>
            </tbody>
        </Table>
    </Container>
}
