import React, {useEffect, useRef, useState} from "react";
import {Button, ButtonGroup, Col, Container, Dropdown, Form, Row} from "react-bootstrap";
import {PlayingCard} from "../components/styled-components";
import styled from "styled-components";
import {useNavigate} from "react-router-dom";
import {getGameContract, getObjects} from "../utils/near";
import {nanoid} from "nanoid";
import {
    ActionTypes,
    Event,
    FromGameMessageActions,
    GoalieActions,
    iceTimePriorities,
    IceTimePriority,
    OnePlayerActions,
    PlayerSide,
    RegularActions,
    ShotActions,
    Tactics,
    UserActions,
    UserID,
} from "../utils/nft-hockey-api";

const Field = styled.div`
  background-color: #ffffff;
  background-image: url("/field-background.png");
  border-radius: 30px;
  background-size: auto 500px;
  background-position: center;
  background-repeat: no-repeat;
  height: 500px;
  overflow-y: auto;
`

const LogoSquare = styled.div`
  height: 60px;
  width: 60px;
  border-radius: 10px;
  border: 3px solid white;

  &.u-1 {
    background-color: #5161ee;
  }

  &.u-2 {
    background-color: #ef615f;
  }
`

const SelectDropdownBtn = styled(Button)`
  width: 300px;
`

const BenchRow = styled(Row)`
  margin-top: 80px;
`

// const Timer = styled.div`
//   position: absolute;
//   top: 0;
//   right: 0;
//   background-color: dodgerblue;
//   padding: 5px 20px;
//   font-size: 30px;
//   border-radius: 0 0 0 15px;
//   border-left: 2px solid white;
//   border-bottom: 2px solid white;
// `
//
const MessageDiv = styled.div`
  background-color: #ededed;
  width: 200px;

  &.left {
    border: 2px solid #5161ee;
    border-radius: 20px 20px 20px 0;
    margin-left: 20px;
    & h5 {
      color: #5161ee;
    }
  }
  &.right {
    border: 2px solid #ef615f;
    border-radius: 20px 20px 0 20px;
    margin-right: 20px;
    & h5 {
      color: #ef615f;
    }
  }
`

const NonMessageDiv = styled.div`
  background-color: #322e2ebd;
  width: 200px;
  border-radius: 20px;
`

function Message({playerWithThePuck, action, opponent, username, side}) {
    return <div className={`d-flex justify-content-${side === 'left' ? 'start' : 'end'} my-2`}>
        <MessageDiv className={side}>
            <Row className='justify-content-start'>
                <Col className="col-auto ms-3">
                    <div className="username">{username}</div>
                </Col>
            </Row>
            <h5>{playerWithThePuck} {action} {opponent}</h5>
        </MessageDiv>
    </div>
}
function NonMessage({action}) {
    return <div className={`d-flex justify-content-center my-2`}>
        <NonMessageDiv>
            <h5 className='text-white'>{action}</h5>
        </NonMessageDiv>
    </div>
}

export default function Game() {
    let contract, wallet;

    const navigate = useNavigate();
    const [eventsQueue, setEventsQueue] = useState([]);
    const [autoGenerate, setAutoGenerate] = useState(false);
    const [eventsIntervalID, setEventsIntervalID] = useState(null);
    const myGameID = useRef(null);
    const [players, setPlayers] = useState(null);
    const [myPlayerNumber, setMyPlayerNumber] = useState<UserID>(null);
    const [autoReload, setAutoReload] = useState(false);
    const [tableIntervalID, setTableIntervalID] = useState(null);
    const [event, setEvent] = useState<Event>(null);
    const [eventMessagesBuffer, setEventMessagesBuffer] = useState<DisplayableAction[]>([]);

    enum DisplayableActionType {MessageAction, FromGameMessageAction}
    interface MessageAction {
        actionType: DisplayableActionType.MessageAction,
        playerWithPuck: number,
        action: string,
        opponent: number,
        side: PlayerSide,
        username: string,
    }
    interface NonMessageAction {
        actionType: DisplayableActionType.FromGameMessageAction
        action: string,
    }
    type DisplayableAction = MessageAction | NonMessageAction;

    const GAS_MOVE = 50_000_000_000_000;

    function pushEventMessage(eventMessage: DisplayableAction): void {
        if (eventMessagesBuffer.length === 7) {
            setEventMessagesBuffer(b => [...b.slice(1), eventMessage]);
        } else setEventMessagesBuffer(b => [...b, eventMessage])
    }

    function getEventMessage(event: Event, username: string, side: PlayerSide): MessageAction {
        let playerWithPuck, opponent;
        if (RegularActions.includes(event.action) || ShotActions.includes(event.action)) {
            playerWithPuck = event.playerWithPuck.number;
            opponent = event.getOpponent().number;
        } else if (GoalieActions.includes(event.action)) {
            playerWithPuck = event.getOpponent().number;
            opponent = event.playerWithPuck.number;
        } else if (OnePlayerActions.includes(event.action)) {
            playerWithPuck = event.playerWithPuck.number;
            opponent = '';
        } else if (UserActions.includes(event.action)) {
            playerWithPuck = '';
            opponent = '';
        } else console.error('getEventMessage: Wrong action type: ', event.action);
        return {
            actionType: DisplayableActionType.MessageAction,
            playerWithPuck: playerWithPuck,
            action: event.action,
            opponent: opponent,
            side: side,
            username: username,
        }
    }

    useEffect(() => {
        if (!event) return;
        // console.log(event.myTeam.five.toRustString());
        // console.log(JSON.parse( event.myTeam.five.toRustString()));
        if (FromGameMessageActions.includes(event.action)) {
            const eventMessage: NonMessageAction = {
                actionType: DisplayableActionType.FromGameMessageAction,
                action: event.action,
            }

            pushEventMessage(eventMessage);
        } else {
            const side: PlayerSide = event.playerWithPuck.userID === 1 ? 'left' : 'right';

            let username;
            if (event.playerWithPuck.userID === myPlayerNumber) {
                username = players[myPlayerNumber - 1];
            } else {
                if (myPlayerNumber === 1) {
                    username = players[1];
                } else {
                    username = players[0];
                }
            }

            const eventMessage: MessageAction = getEventMessage(event, username, side);

            pushEventMessage(eventMessage);

            if (event.action === ActionTypes.Goal) {
                incrementLocalScore(event.playerWithPuck.userID - 1);
                setScore(getLocalScore());
            }
        }
    }, [event]);

    const localReceivedEventsKey = 'receivedEvents';
    function getLocalReceivedEvents() {
        return parseInt(localStorage.getItem(localReceivedEventsKey)) || 0;
    }
    function setLocalReceivedEvents(value) {
        localStorage.setItem(localReceivedEventsKey, value);
    }
    function incrementLocalReceivedEvents(incrementBy) {
        localStorage.setItem(localReceivedEventsKey, getLocalReceivedEvents() + incrementBy);
    }

    const localScoreKey = 'score';
    function getLocalScore(): number[] {
       return JSON.parse(localStorage.getItem(localScoreKey)) || [0, 0];
    }
    function incrementLocalScore(index: number): void {
        const currentScore: number[] = getLocalScore();
        currentScore[index] = currentScore[index] + 1;
        localStorage.setItem(localScoreKey, JSON.stringify(currentScore));
    }
    const [score, setScore] = useState<number[]>(getLocalScore());

    function endGame() {
        setLocalReceivedEvents(0);
        localStorage.removeItem(localScoreKey);
        clearInterval(eventsIntervalID);
        myGameID.current = null;
        setPlayers(null);
        setMyPlayerNumber(null);
        console.log('Game ended');
    }

    getObjects().then(r => {
        const {wallet: _wallet} = r;
        wallet = _wallet;
        contract = getGameContract(_wallet);
    });

    const shouldUpdate = useRef(true);
    const handleGenerateEvent = () => {
        if (shouldUpdate.current) {
            shouldUpdate.current = false;
            if (typeof myGameID.current === "number") {
                console.log('number of rendered events: ', getLocalReceivedEvents());
                contract.generate_event({number_of_rendered_events: getLocalReceivedEvents(), game_id: myGameID.current }, GAS_MOVE)
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
                                const eventObjects = e.map(_e => Event.fromJSON(_e));
                                setEventsQueue(q => [...q, ...eventObjects]);
                                incrementLocalReceivedEvents(e.length);
                            }
                        }
                    })
                    .catch(e => console.error('generate event: ', e));
            }
            // first page load
            else {
                contract.get_available_games({from_index: 0, limit: 50}).then(r => {
                    if (r.length) {
                        const accountId = wallet.account().accountId;
                        const gamesWithMyID = r.filter(game => game[1][0] === accountId || game[1][1] === accountId);
                        if (gamesWithMyID.length) {
                            const myGame = gamesWithMyID[0];
                            const _myGameID = myGame[0];
                            myGameID.current = _myGameID;
                            setPlayers(myGame[1]);
                            setMyPlayerNumber(myGame[1].indexOf(accountId) + 1);

                            contract.generate_event({number_of_rendered_events: getLocalReceivedEvents(), game_id: _myGameID }, GAS_MOVE)
                                .then(e => {
                                    console.log('generate event: ', e)
                                    shouldUpdate.current = true;
                                    incrementLocalReceivedEvents(e.length);
                                    if(e[e.length - 1]?.action === 'GameFinished') {
                                        endGame();
                                    } else {
                                        const eventObjects = e.map(_e => Event.fromJSON(_e));
                                        setEventsQueue(eventObjects);
                                    }
                                })
                                .catch(e => console.error('generate event: ', e));
                        }
                        // Some games are available but not mine
                        else {
                            alert('Game finished');
                            navigate('/');
                        }
                    }
                    // No games available
                    else {
                        alert('Game finished');
                        navigate('/');
                    }
                }).catch(e => console.error('get available games: ', e));
            }
        }
    }

    const switchAutoGenerate = () => {
        if (!autoGenerate) {
            setEventsIntervalID(setInterval(()=>{
                handleGenerateEvent();
            }, 1000))
        } else {
            clearInterval(eventsIntervalID);
        }
        setAutoGenerate(a => !a);
    }
    function switchAutoReload() {
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

    const takeTO = () => contract.take_to({game_id: myGameID.current}, GAS_MOVE);
    const takeSpeech = () => contract.coach_speech({game_id: myGameID.current}, GAS_MOVE);
    const goalieOut = () => contract.goalie_out({game_id: myGameID.current}, GAS_MOVE);
    const goalieBack = () => contract.goalie_back({game_id: myGameID.current}, GAS_MOVE);

    const [iceTimePriorityNum, setIceTimePriorityNum] = useState<number>(2);
    const [iceTimePriority, setIceTimePriority] = useState<IceTimePriority>(IceTimePriority.Normal);

    function changeIceTimePriority(e) {
        setIceTimePriorityNum(e.target.value);
        setIceTimePriority(iceTimePriorities[e.target.value]);
    }

    function contractChangeIceTimePriority(priority: IceTimePriority) {
        if (typeof myGameID.current === 'number' && event)
            contract.change_ice_priority({
                ice_time_priority: priority,
                five: event.myTeam.five.number,
                game_id: myGameID.current,
            }, GAS_MOVE);
    }

    function changeTactic(tactic: Tactics): void {
        if (typeof myGameID.current === 'number' && event)
            contract.change_tactic({
                tactic: tactic,
                game_id: myGameID.current,
            }, GAS_MOVE);
    }

    return <Container>
        <Row className='mt-4'>
            <Col className='text-center' xs={5}>
                <h1>Period 2</h1>
                <Field>
                    {eventMessagesBuffer?.map(e => {
                            if (e.actionType === DisplayableActionType.MessageAction)
                                return <Message
                                    key={nanoid()}
                                    playerWithThePuck={e.playerWithPuck}
                                    action={e.action}
                                    opponent={e.opponent}
                                    side={e.side}
                                    username={e.username}
                                />
                            else if (e.actionType === DisplayableActionType.FromGameMessageAction)
                                return <NonMessage action={e.action} />
                        }
                    )}
                </Field>
                <Row className='mt-4 justify-content-between'>
                    <Col className='col-auto'>
                        <Button onClick={takeTO}>Take TO</Button>
                    </Col>
                    <Col className='col-auto'>
                        <Button onClick={goalieOut}>Goalie out</Button>
                    </Col>
                    <Col className='col-auto'>
                        <Button onClick={takeSpeech}>Take speech</Button>
                    </Col>
                </Row>
                <Row className="mt-1 justify-content-center">
                    <Col className='col-auto'>
                        <Button onClick={goalieBack}>Goalie Back</Button>
                    </Col>
                </Row>
            </Col>
            <Col>
                <Row>
                    <Col xs={8}>
                        <Row className='justify-content-start'>
                            <Col className='col-auto'>
                                <LogoSquare className='u-1' onClick={switchAutoGenerate} />
                            </Col>
                            <Col className='col-auto'>
                                <h1>{score[0]} - {score[1]}</h1>
                            </Col>
                            <Col className='col-auto'>
                                <LogoSquare className='u-2' onClick={switchAutoReload} />
                            </Col>
                        </Row>
                        <Row className='mt-5 justify-content-around'>
                            <Col className='col-auto'>
                                <PlayingCard />
                            </Col>
                            <Col className='col-auto'>
                                <PlayingCard />
                            </Col>
                            <Col className='col-auto'>
                                <PlayingCard />
                            </Col>
                        </Row>
                        <Row className='mt-3 mb-5 justify-content-around'>
                            <Col className='col-auto'>
                                <PlayingCard className='bottom-left' />
                            </Col>
                            <Col className='col-auto'>
                                <PlayingCard className='bottom-right' />
                            </Col>
                        </Row>
                        <Dropdown as={ButtonGroup} className='mt-5 mb-3'>
                            <SelectDropdownBtn variant='outline-primary'>Tactics</SelectDropdownBtn>
                            <Dropdown.Toggle variant='outline-primary' />
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={()=>changeTactic(Tactics.SuperDefensive)}>Super defensive</Dropdown.Item>
                                <Dropdown.Item onClick={()=>changeTactic(Tactics.Defensive)}>Defensive</Dropdown.Item>
                                <Dropdown.Item onClick={()=>changeTactic(Tactics.Neutral)}>Neutral</Dropdown.Item>
                                <Dropdown.Item onClick={()=>changeTactic(Tactics.Offensive)}>Offensive</Dropdown.Item>
                                <Dropdown.Item onClick={()=>changeTactic(Tactics.SuperOffensive)}>Super offensive</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                        <Form.Range min={0} max={4} step={1} value={iceTimePriorityNum}
                        onChange={changeIceTimePriority}
                        onMouseUp={() => contractChangeIceTimePriority(iceTimePriorities[iceTimePriorityNum])} />
                        Ice time priority: {iceTimePriority}
                    </Col>
                    <Col>
                        <PlayingCard className='goalie-game' />
                        <BenchRow className='justify-content-center'>
                            <Col xs={1} className='m-0'>
                                <PlayingCard className='sm bench'>
                                    <img src='/card-back-yellow.png' />
                                </PlayingCard>
                            </Col>
                            <Col className='m-0'>
                                <PlayingCard className='sm bench'>
                                    <img src='/card-back-blue.png' />
                                </PlayingCard>
                            </Col>
                        </BenchRow>
                    </Col>
                </Row>
            </Col>
        </Row>
        {/*<Timer>2:32</Timer>*/}
    </Container>
}
