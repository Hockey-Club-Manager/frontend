import {Row, Col} from "react-bootstrap";
import TradeCardsLayout from "../../../components/Layout/TradeCardsLayout";
import NFTCard from "../../../components/NFTCard";
import React, {useEffect, useState} from "react";
import {loadUserTokens} from "../../../utils/state/views";
import styled from "styled-components";

const CardCol = styled(Col)`
  width: 300px;
`

function NFTCardCol({imgURL, year, position, name, number, role, stats, detailsLink, cost}) {
    return <CardCol className='col-4 mx-3'>
        <NFTCard
            imgURL={imgURL}
            year={year}
            position={position}
            name={name}
            number={number}
            role={role}
            stats={stats}
            detailsLink={detailsLink}
        />
        <Row className='justify-content-end mt-2'>
            <Col className='col-auto'>
                <h4>COST {cost} Ⓝ</h4>
            </Col>
        </Row>
    </CardCol>
}

export default function SellCards() {
    const [tokens, setTokens] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);


    function loadCards () {
        loadUserTokens().then(r => {
            setTokens(r);
        })

        setIsLoaded(true);
    }

    useEffect(() => {
        loadCards();
    }, []);

    return <TradeCardsLayout>
        { isLoaded ?
            !tokens.length ? <p>Buy cards first</p> :
                tokens.map(({
                                metadata: {media, title, extra},
                                token_id,
                            }) => <div key={token_id} className="item">
                    <Row className='mx-4 my-4 gx-4 gy-4'>
                        <NFTCardCol
                            imgURL={media}
                            year={2022}
                            position={extra && JSON.parse(extra).position}
                            name={title}
                            number={extra && JSON.parse(extra).number}
                            role={extra && JSON.parse(extra).role}
                            stats={extra && JSON.parse(JSON.parse(extra).stats)}
                            detailsLink={`/trade-cards/sell-cards/${token_id}`}
                            cost={3}
                        />
                    </Row>
                </div>)
            : <h4>Loading...</h4>
        }

    </TradeCardsLayout>
}
