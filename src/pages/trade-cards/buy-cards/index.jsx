import {Col, Row} from "react-bootstrap";
import TradeCardsLayout from "../../../components/Layout/TradeCardsLayout";
import NFTCard from "../../../components/NFTCard";
import styled from "styled-components";
import React, {useEffect, useState} from "react";
import {loadTokens, loadSales} from "../../../utils/state/views";
import {utils} from "near-api-js";

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

export default function BuyCards() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [market, setMarket] = useState();
    const fromIndex = 0;

    function loadCards() {
        loadSales().then(sales => {
            loadTokens(fromIndex).then(r => {
                setMarket(sales.concat(r.filter(({token_id}) => !sales.some(({token_id: t}) => t === token_id))));
                setIsLoaded(true);
            });
        });
    }

    useEffect(() => {
        loadCards();
    }, []);

    return <TradeCardsLayout>
        { isLoaded ?
            market?.map(({
                             metadata: {media, title, extra},
                             owner_id,
                             token_id,
                             sale_conditions,
                         }) =>
                <div key={token_id} className="item">
                    <Row className='mx-4 my-4 gx-4 gy-4'>
                        <NFTCardCol
                            imgURL={media}
                            year={2022}
                            position={extra && JSON.parse(extra).position}
                            name={title}
                            number={extra && JSON.parse(extra).number}
                            role={extra && JSON.parse(extra).role}
                            stats={extra && JSON.parse(JSON.parse(extra).stats)}
                            detailsLink={`/trade-cards/buy-cards/${token_id}`}
                            cost={utils.format.formatNearAmount(sale_conditions?.near)}
                        />
                    </Row>
                </div>)
            : <h4>Loading...</h4>
        }
    </TradeCardsLayout>
};
