import { CypherSession } from './session';
import { injectStyles } from './ui/styles';

const POLL_INTERVAL_MILLISECONDS = 300;

void startWhenReady();

async function startWhenReady(): Promise<void> {
  while (!isSpicetifyReady()) {
    await wait(POLL_INTERVAL_MILLISECONDS);
  }
  injectStyles();
  new CypherSession().start();
}

function isSpicetifyReady(): boolean {
  return (
    typeof Spicetify !== 'undefined' &&
    Boolean(Spicetify.Player?.addEventListener) &&
    Boolean(Spicetify.Playbar?.Button) &&
    Boolean(Spicetify.PopupModal?.display)
  );
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
