
export interface PollResume {
    (): void;
}

export interface PollController {

    stopRefresh(): PollResume;
}

export interface Pollable {

    poll(): void;
}