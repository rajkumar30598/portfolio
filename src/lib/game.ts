/** Opens Play mode from anywhere (nav, hero) without prop drilling. */
export const PLAY_EVENT = 'portfolio:play';
export const startGame = () => window.dispatchEvent(new Event(PLAY_EVENT));
