import {Button, Col, Modal, Row} from "react-bootstrap";
import {SModal} from "./Settings";
import {nanoid} from "nanoid";

export default function InfoModal({show, onHide, onBtnClick, content}) {
    return <SModal show={show} onHide={onHide} centered>
        <Modal.Header closeButton />
        <Modal.Body>
            {content.map(c => <Row key={nanoid()}>
                <Col>{c}</Col>
            </Row>)}
            <Row>
                <Col>
                    <Button onClick={onBtnClick}>Confirm</Button>
                </Col>
            </Row>
        </Modal.Body>
    </SModal>
}
