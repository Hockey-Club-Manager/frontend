import {useState} from "react";
import {Button, DropdownButton, Dropdown, Row, Col, Modal, Form} from "react-bootstrap";
import styled from "styled-components";

const SelectTacticInputsBar = styled.div`
     display: flex;
     justify-content: space-between;

`;

function SelectTactic() {
    const [rangeValue, setRangeValue] = useState(0)

    return (
        <div className="dropdown" style={{width: "1000px"}}>
            <ol className="d-grid gap-5">
                <li>
                    <SelectTacticInputsBar>
                        <DropdownButton id="dropdown-basic-button" size="lg" title="-SELECT-">
                            <Dropdown.Item href="#/action-1">Action</Dropdown.Item>
                            <Dropdown.Item href="#/action-2">Another action</Dropdown.Item>
                            <Dropdown.Item href="#/action-3">Something else</Dropdown.Item>
                        </DropdownButton>
                        <Form.Range style={{width: "500px"}}

                                    value={rangeValue}
                                    onChange={e => setRangeValue(e.target.value)}
                                    step={10}
                        />
                    </SelectTacticInputsBar>
                </li>
                <li>
                    <SelectTacticInputsBar>
                        <DropdownButton id="dropdown-basic-button" size="lg" title="-SELECT-">
                            <Dropdown.Item href="#/action-1">Action</Dropdown.Item>
                            <Dropdown.Item href="#/action-2">Another action</Dropdown.Item>
                            <Dropdown.Item href="#/action-3">Something else</Dropdown.Item>
                        </DropdownButton>
                        <Form.Range style={{width: "500px"}}
                                    value={rangeValue}
                                    onChange={e => setRangeValue(e.target.value)}
                                    step={10}
                        />
                    </SelectTacticInputsBar>
                </li>
                <li>
                    <SelectTacticInputsBar>
                        <DropdownButton id="dropdown-basic-button" size="lg" title="-SELECT-">
                            <Dropdown.Item href="#/action-1">Action</Dropdown.Item>
                            <Dropdown.Item href="#/action-2">Another action</Dropdown.Item>
                            <Dropdown.Item href="#/action-3">Something else</Dropdown.Item>
                        </DropdownButton>
                        <Form.Range style={{width: "500px"}}

                                    value={rangeValue}
                                    onChange={e => setRangeValue(e.target.value)}
                                    step={10}
                        />
                    </SelectTacticInputsBar>
                </li>
            </ol>
        </div>
    )
}

export default function SetTactics() {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);


    return (
        <>
            <Button variant="primary" onClick={handleShow}>
                Set tactics
            </Button>

            <Modal fullscreen={true} show={show} onHide={handleClose} animation={true}>
                <Modal.Body>
                    <Row className='justify-content-center mt-4'>
                        <SelectTactic/>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="justify-content-center align-items-center">
                    <Row>
                        <Col xs="auto">
                            <Button variant="secondary" onClick={handleClose}>
                                Cancel
                            </Button>
                        </Col>
                        <Col xs="auto">
                            <Button variant="primary" onClick={handleClose}>
                                Apply
                            </Button>
                        </Col>
                    </Row>
                </Modal.Footer>
            </Modal>
        </>
    )
}
