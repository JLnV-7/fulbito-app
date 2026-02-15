// src/types/api.ts

// Estructura genérica de respuesta API-Football
export interface ApiResponse<T> {
    get: string
    parameters: any
    errors: any[]
    results: number
    paging: {
        current: number
        total: number
    }
    response: T
}

export interface ApiLeagueResponse {
    league: {
        id: number
        name: string
        country: string
        logo: string
        flag: string | null
        season: number
        standings: ApiStanding[][]
    }
}

export interface ApiStanding {
    rank: number
    team: {
        id: number
        name: string
        logo: string
    }
    points: number
    goalsDiff: number
    group: string
    form: string
    status: string
    description: string | null
    all: {
        played: number
        win: number
        draw: number
        lose: number
        goals: {
            for: number
            against: number
        }
    }
    home: any
    away: any
    update: string
}

export interface ApiFixture {
    // ... misma definicion anterior
    fixture: {
        id: number
        referee: string | null
        timezone: string
        date: string
        timestamp: number
        periods: {
            first: number | null
            second: number | null
        }
        venue: {
            id: number | null
            name: string
            city: string
        }
        status: {
            long: string
            short: string
            elapsed: number | null
        }
    }
    league: {
        id: number
        name: string
        country: string
        logo: string
        flag: string | null
        season: number
        round: string
    }
    teams: {
        home: {
            id: number
            name: string
            logo: string
            winner: boolean | null
        }
        away: {
            id: number
            name: string
            logo: string
            winner: boolean | null
        }
    }
    goals: {
        home: number | null
        away: number | null
    }
    score: {
        halftime: {
            home: number | null
            away: number | null
        }
        fulltime: {
            home: number | null
            away: number | null
        }
        extratime: {
            home: number | null
            away: number | null
        }
        penalty: {
            home: number | null
            away: number | null
        }
    }
}

export interface ApiScorer {
    player: {
        id: number
        name: string
        firstname: string
        lastname: string
        age: number
        nationality: string
        photo: string
    }
    statistics: {
        team: {
            id: number
            name: string
            logo: string
        }
        league: {
            id: number
            name: string
            country: string
            logo: string
            season: number
        }
        games: {
            appearences: number
            lineups: number
            minutes: number
            number: number | null
            position: string
            rating: string
            captain: boolean
        }
        goals: {
            total: number
            conceded: number
            assists: number | null
            saves: number | null
        }
    }[]
}
