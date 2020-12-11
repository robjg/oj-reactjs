

/**
 * Basic interface for communicating with clipboard.
 */
export interface Clipboard {

    copy(text: string): Promise<void>;

    paste(): Promise<string>;
}

export class NavigatorClipboard implements Clipboard {

    paste: () => Promise<string> = async () => {

        const clipboard = navigator.clipboard;

        return clipboard.readText();
    }

    copy: (text: string) => Promise<void> = (text: string) => {
        return navigator.clipboard.writeText(text);
    }
}