import {Container, Row, Col } from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faStar, faStarOfDavid} from "@fortawesome/free-solid-svg-icons";
import {Link} from "react-router-dom";

export default  function Result() {
    return <Container>
        <Row className='mt-5 justify-content-center'>
            <Col className='col-3'>
                <FontAwesomeIcon icon={faStarOfDavid} />
            </Col>
            <Col className='col-auto align-self-center'>
                <h1 className='text-center'>2:0</h1>
            </Col>
            <Col className='col-3'>
                <FontAwesomeIcon icon={faStar} />
            </Col>
        </Row>
        <h1 className='my-4 text-center'>You won 2 N</h1>
        <Row className='justify-content-center'>
            <Col className='col-auto'>
                <Link to='/' className='btn btn-success'>OKAY</Link>
            </Col>
        </Row>
    </Container>
}
