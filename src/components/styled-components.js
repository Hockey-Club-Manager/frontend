import styled from "styled-components";
import {Button} from "react-bootstrap";

export const CircleBtn = styled(Button)`
  height: 35px;
  width: 35px;
  border-radius: 35px;
  padding: 0;
  font-size: 24px;
  
  &.first {
    margin-top: 300px;
  }
`
export const PlayingCard = styled.div`
  background-color: wheat;
  height: 125px;
  width: 80px;
  
  &, & img {
    border-radius: 10px;
  }

  &.goalie {
    margin-top: 140px;
  }
  &.goalie-game {
    margin-top: 220px;
  }
  
  &.border {
    border: 1px solid black !important;
  }
  &.bench img {
    border: 3px solid white !important;
  }
  
  &.sm, &.sm img {
    height: 90px;
    width: 65px;
  }
  
  &.bottom-left {
    margin-left: 40px;
  }
  &.bottom-right {
    margin-right: 40px;
  }
`
