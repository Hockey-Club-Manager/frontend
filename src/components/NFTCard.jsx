import {Link} from "react-router-dom";
import {Button, Card, Col, Row} from "react-bootstrap";
import styled from "styled-components";
import {nanoid} from 'nanoid';
import {useState} from "react";

const SCard = styled(Card)`
 border: none;
  width: 300px;
  height: 450px;
 
 .card-img-top {
  border-radius: 20px;
 }
`

const DetailsOverlay = styled(Card.ImgOverlay)`
    background-color: rgba(0, 166, 255, 0.8);
    border-radius: 20px;
`

export default function NFTCard({imgURL, year, position, name, number, role, stats, detailsLink}) {
    const [showDetails, setShowDetails] = useState(false);
    return <SCard>
        <Card.Img variant='top' src={imgURL} />
        <Card.ImgOverlay
            className='d-flex flex-column'
            onMouseEnter={()=>setShowDetails(true)}
        >
            <Row className="justify-content-between">
                <Col className='col-auto'>
                    <Card.Title className='text-white'>{year}</Card.Title>
                </Col>
                <Col className='col-auto'>
                    <Card.Title className='text-white'>{position}</Card.Title>
                </Col>
            </Row>
            <div className='mt-auto'>
                <Row className='justify-content-between'>
                    <Col className='col-auto'>
                        <Card.Title className='text-white'>{name}</Card.Title>
                    </Col>
                    <Col className='col-auto'>
                        <h3 className='text-white'>{number}</h3>
                    </Col>
                </Row>
                <Card.Text className='text-white'>{role}</Card.Text>
                <Row className="justify-content-center">
                    {stats?.map(stat =>
                        <Col className="col-auto" key={nanoid()}>
                            <Card.Title className='text-white'>{stat}</Card.Title>
                        </Col>
                    )}
                </Row>
            </div>
        </Card.ImgOverlay>
        { detailsLink &&
            <Link to={detailsLink} passHref>
                <DetailsOverlay
                    className={`${showDetails ? 'd-flex' : 'd-none'} align-items-center justify-content-center`}
                    onMouseLeave={()=>setShowDetails(false)}
                >
                    <Button variant='warning' size='lg'>Details</Button>
                </DetailsOverlay>
            </Link>
        }
    </SCard>
}
