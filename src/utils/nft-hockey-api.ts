export interface PlayerStats {
    skating: number;
    shooting: number;
    strength: number;
    iq: number;
    morale: number;
}

export enum PlayerPosition {
    Center = "Center",
    LeftWing = "LeftWing",
    RightWing = "RightWing",
    LeftDefender = "LeftDefender",
    RightDefender = "RightDefender",
    GoaliePos = "GoaliePos",
}


export enum PlayerRole {
    // Forward
    Passer = "Passer",
    Shooter = "Shooter",
    TryHarder = "TryHarder",
    Dangler = "Dangler",

    // Defender
    Rock = "Rock",
    Goon = "Goon",
    Professor = "Professor",
    ToughGuy = "ToughGuy",

    // goalie
    Wall = "Wall",
    Post2Post = "Post2Post",
}

export type UserID = 1|2;
export class FieldPlayer {
    constructor(
        public nativePosition: PlayerPosition,
        public number: number,
        public position: PlayerPosition,
        public positionCoefficient: number,
        public role: PlayerRole,
        public userID: UserID,
        public stats: PlayerStats,
    ) {}

    getOpponentPosition(): PlayerPosition | undefined {
        switch (this.position) {
            case PlayerPosition.Center: return PlayerPosition.Center;
            case PlayerPosition.LeftWing: return PlayerPosition.RightDefender;
            case PlayerPosition.RightDefender: return PlayerPosition.LeftWing;
            case PlayerPosition.RightWing: return PlayerPosition.LeftDefender;
            case PlayerPosition.LeftDefender: return PlayerPosition.RightWing;
            default: console.error("getOpponentPosition: Wrong player position: " + this.position);
        }
    }

    static fromJSON(json: {
                        native_position: PlayerPosition; number: number; position: PlayerPosition;
                        position_coefficient: number; role: PlayerRole; user_id: UserID; stats: PlayerStats;
    }) {
            return new FieldPlayer(
            json.native_position,
            json.number,
            json.position,
            json.position_coefficient,
            json.role,
            json.user_id,
            {
                skating: json.stats.skating,
                shooting: json.stats.shooting,
                strength: json.stats.strength,
                iq: json.stats.iq,
                morale: json.stats.morale,
            }
        );
    }
}

export enum Fives {
    First = "First",
    Second = "Second",
    Third = "Third",
    Fourth = "Fourth",
}

export enum IceTimePriority {
    SuperLowPriority = "SuperLowPriority",
    LowPriority = "LowPriority",
    Normal = "Normal",
    HighPriority = "HighPriority",
    SuperHighPriority = "SuperHighPriority",
}

export class Five {
    constructor(
        public fieldPlayers: FieldPlayer[],
        public number: Fives,
        public iceTimePriority: IceTimePriority,
        public timeField: number,
    ) {}

    getPlayerByPosition(position: PlayerPosition): FieldPlayer | undefined {
        for (let player of this.fieldPlayers) {
            if (player.position === position) return player;
        }
    }

    static fromJSON(json: any) {
        const fieldPlayers: FieldPlayer[] = [];

        for (let playerNum in json.field_players) {
            fieldPlayers.push(FieldPlayer.fromJSON(json.field_players[playerNum]));
        }

        return new Five(
            fieldPlayers,
            json.number,
            json.ice_time_priority,
            json.time_field
        );
    }
}

export interface GoalieStats {
    gloveAndBlocker: number,
    pads: number,
    stand: number,
    stretch: number,
    morale: number,
}

export class Goalie {
    constructor(
        public number: number,
        public role: PlayerRole,
        public userID: UserID,
        public stats: GoalieStats,
    ) {}

    static fromJSON(json: any) {
        return new Goalie(
            json.number,
            json.role,
            json.user_id,
            {
                gloveAndBlocker: json.stats.glove_and_blocker,
                pads: json.stats.pads,
                stand: json.stats.stand,
                stretch: json.stats.stretch,
                morale: json.stats.morale,
            }
        )
    }
}

export class Team {
    constructor(
        public five: Five,
        public goalie: Goalie,
        public score: number,
    ) {}

    static fromJSON(json: any) {
        return new Team(
            Five.fromJSON(json.five),
            Goalie.fromJSON(json.goalie),
            json.score,
        )
    }
}

export enum ActionTypes {
    Pass = "Pass",
    Shot = "Shot",
    Move = "Move",
    Hit = "Hit",
    Dangle = "Dangle",
    PokeCheck = "PokeCheck",
    Battle = "Battle",
    Goal = "Goal",
    Save = "Save",
    Rebound = "Rebound",
    StartGame = "StartGame",
    EndOfPeriod = "EndOfPeriod",
    GameFinished = "GameFinished",
    FaceOff = "FaceOff",
    PassCatched = "PassCatched",
    PuckLose = "PuckLose",
    Overtime = "Overtime",

    TakeTO = "TakeTO",
    CoachSpeech = "CoachSpeech",
    GoalieOut = "GoalieOut",
    GoalieBack = "GoalieBack",

    FirstTeamChangeActiveFive = "FirstTeamChangeActiveFive",
    SecondTeamChangeActiveFive = "SecondTeamChangeActiveFive",
}
export const RegularActions: ActionTypes[] = [
    ActionTypes.Hit, ActionTypes.Dangle, ActionTypes.PokeCheck, ActionTypes.Battle, ActionTypes.Goal,
    ActionTypes.PassCatched,
];
export const ShotActions: ActionTypes[] = [
    ActionTypes.Shot,
];
export const GoalieActions: ActionTypes[] = [
    ActionTypes.Save, ActionTypes.Rebound,
];
export const OnePlayerActions: ActionTypes[] = [
    ActionTypes.Pass, ActionTypes.Move, ActionTypes.PuckLose,
];
export const UserActions: ActionTypes[] = [
    ActionTypes.TakeTO, ActionTypes.GoalieOut, ActionTypes.GoalieBack,
]
export const FromGameMessageActions: ActionTypes[] = [
    ActionTypes.StartGame, ActionTypes.EndOfPeriod, ActionTypes.GameFinished, ActionTypes.FaceOff,
];

export class Event {
    constructor(
        public playerWithPuck: FieldPlayer | null,
        public action: ActionTypes,
        public zoneNumber: number,
        public time: number,
        public myTeam: Team,
        public opponentTeam: Team,
    ) {}

    getOpponent(): FieldPlayer | Goalie | undefined {
        if(this.playerWithPuck?.userID === this.myTeam.goalie.userID) {
            if (ShotActions.includes(this.action)) return this.opponentTeam.goalie;
            // @ts-ignore
            return this.opponentTeam.five.getPlayerByPosition(this.playerWithPuck.getOpponentPosition());
        } else {
            if (ShotActions.includes(this.action)) return this.myTeam.goalie;
            // @ts-ignore
            return this.myTeam.five.getPlayerByPosition(this.playerWithPuck.getOpponentPosition());
        }
    }

    static fromJSON(json: any) {
        return new Event(
            json.player_with_puck ? FieldPlayer.fromJSON(json.player_with_puck) : null,
            json.action,
            json.zone_number,
            json.time,
            Team.fromJSON(json.my_team),
            Team.fromJSON(json.opponent_team)
        );
    }
}

export type PlayerSide = 'left'|'right';
