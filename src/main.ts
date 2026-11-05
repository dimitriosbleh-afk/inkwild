import './ui/styles.css';
import { askToKeepStorage } from './app/persist';
import { App } from './ui/app';
import { activityScreen } from './ui/screens/activity';
import { backupScreen, firstRunScreen, guideScreen, progressScreen, restoreScreen, settingsScreen } from './ui/screens/menus';
import { homeScreen, islandScreen, mapScreen } from './ui/screens/world';
import { storyScreen } from './ui/screens/story';
import { piecesScreen, writeScreen } from './ui/screens/write';
import { swapScreen } from './ui/screens/swap';

const app = new App(document.getElementById('app')!, {
  firstRun: firstRunScreen,
  restore: restoreScreen,
  home: homeScreen,
  map: mapScreen,
  island: islandScreen,
  activity: activityScreen,
  guide: guideScreen,
  settings: settingsScreen,
  backup: backupScreen,
  progress: progressScreen,
  story: storyScreen,
  write: writeScreen,
  pieces: piecesScreen,
  swap: swapScreen,
});
app.start();
void askToKeepStorage();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  void navigator.serviceWorker.register('./sw.js');
}

let width = innerWidth;
addEventListener('resize', () => {
  if (Math.abs(innerWidth - width) < 40) return;
  width = innerWidth;
  if (document.querySelector('canvas.world')) app.go({ name: 'home' });
});

if (import.meta.env.DEV) {
  void import('./app/content').then(({ content }) => Object.assign(window, { inkwild: { app, content } }));
}
