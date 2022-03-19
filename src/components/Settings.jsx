import { Row, Col, Modal, Form, Button } from 'react-bootstrap';
import styled from "styled-components";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSquare} from "@fortawesome/free-solid-svg-icons";

export const SModal = styled(Modal)`
  .modal-content {
    border: 4px solid white;
    border-radius: 35px;
  }
  
  .modal-header {
    border: none;
  }
`

export default function Settings({show, setShow}) {
    const handleClose = () => setShow(false);

    return <SModal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton />
        <Modal.Body>
            <Form>
                <Row>
                    <Col>Your name:</Col>
                    <Col>
                        <Form.Group>
                            <Form.Control type='text' />
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col>Team name:</Col>
                    <Col>
                        <Form.Group>
                            <Form.Control type='text' />
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col>Your logo:</Col>
                    <Col>
                        <FontAwesomeIcon icon={faSquare} size='6x' />
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Button>Cancel</Button>
                    </Col>
                    <Col>
                        <Button>Apply</Button>
                    </Col>
                </Row>
            </Form>
        </Modal.Body>
    </SModal>
}
